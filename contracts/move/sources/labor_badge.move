/// LaborBadge — Soulbound proof-of-work token for NEURALIS agents.
///
/// Architecture
/// ────────────
/// All badge data lives inside a single Registry object stored at a
/// deterministic address derived from the deployer + seed.  This avoids
/// the "need a &signer for every recipient" problem that exists in Aptos/
/// Initia MoveVM when you want to move_to an arbitrary address.
///
/// The Registry holds two tables:
///   • entries    : vector<u8> → BadgeEntry   (keyed by owner_addr ++ badge_type)
///   • mint_counts: u8         → u64          (global mint counter per type)
///
/// Soulbound guarantee
/// ───────────────────
/// BadgeEntry has `store` (required to live inside a Table) but the module
/// exposes NO transfer or copy entry function.  The only way to create or
/// modify a BadgeEntry is through `mint_badge` / `level_up_badge`, both of
/// which are admin-gated.  There is no way for a user to move or copy a badge.
///
/// Badge types (u8)
/// ────────────────
///   0 = YIELD_HARVESTER  — first successful rebalance
///   1 = REBALANCE_MASTER — 10 triggered rebalances
///   2 = ARENA_CHAMPION   — first Arena win
///   3 = PROTOCOL_VETERAN — 100 total agent cycles
///
/// Integration with the EVM keeper
/// ────────────────────────────────
/// After KeeperExecutor.execute() confirms on the EVM side, the Node.js
/// agent calls the Cosmos `cosmos::move_execute` precompile (or the REST
/// endpoint) to invoke `mint_badge` / `level_up_badge` on this module.
/// See agent/src/labor_badge_client.js for the integration code.
module neuralis::labor_badge {
    use std::signer;
    use std::error;
    use std::string::String;
    use std::bcs;
    use std::vector;
    use initia_std::event;
    use initia_std::table::{Self, Table};
    use initia_std::object::{Self, ExtendRef};
    use initia_std::block;

    // ── Badge type constants ──────────────────────────────────────────────────

    const BADGE_YIELD_HARVESTER  : u8 = 0;
    const BADGE_REBALANCE_MASTER : u8 = 1;
    const BADGE_ARENA_CHAMPION   : u8 = 2;
    const BADGE_PROTOCOL_VETERAN : u8 = 3;
    const MAX_BADGE_TYPE         : u8 = 3;

    // ── Error codes ───────────────────────────────────────────────────────────

    const ENOT_ADMIN          : u64 = 1;
    const EINVALID_BADGE_TYPE : u64 = 2;
    const EALREADY_MINTED     : u64 = 3;
    const EBADGE_NOT_FOUND    : u64 = 4;
    const EALREADY_INITIALIZED: u64 = 5;

    // ── On-chain resources ────────────────────────────────────────────────────

    /// Stored at the deterministic registry object address.
    struct Registry has key {
        /// Address that is allowed to mint / level-up badges.
        admin      : address,
        /// Needed to derive a signer for the registry object later.
        extend_ref : ExtendRef,
        /// (bcs(owner) ++ badge_type) → BadgeEntry
        entries    : Table<vector<u8>, BadgeEntry>,
        /// badge_type → total minted
        mint_counts: Table<u8, u64>,
    }

    /// The badge data.  `store` is required so it can live inside a Table.
    /// No `copy` — cannot be duplicated.
    /// No transfer entry function is exposed — effectively soulbound.
    struct BadgeEntry has store {
        badge_type  : u8,
        level       : u64,
        minted_at   : u64,   // block timestamp (seconds since epoch)
        minted_block: u64,   // block height
        metadata    : String,
    }

    // ── Events ────────────────────────────────────────────────────────────────

    struct BadgeMintedEvent has drop, store {
        owner       : address,
        badge_type  : u8,
        level       : u64,
        metadata    : String,
        block_height: u64,
        timestamp   : u64,
    }

    struct BadgeLeveledUpEvent has drop, store {
        owner       : address,
        badge_type  : u8,
        old_level   : u64,
        new_level   : u64,
        block_height: u64,
        timestamp   : u64,
    }

    // ── Initialization ────────────────────────────────────────────────────────

    /// Must be called once by the deployer right after `minitiad move deploy`.
    ///
    ///   minitiad tx move execute <MODULE_ADDR> labor_badge initialize \
    ///     --args '[]' --from <DEPLOYER_KEY> ...
    public entry fun initialize(admin: &signer) {
        let admin_addr = signer::address_of(admin);

        // Guard: cannot initialize twice
        let reg_addr = registry_object_address(admin_addr);
        assert!(!exists<Registry>(reg_addr), error::already_exists(EALREADY_INITIALIZED));

        // Create a named object — gives us a stable, deterministic address
        let constructor = object::create_named_object(admin, b"neuralis_labor_badge_v1");
        let extend_ref  = object::generate_extend_ref(&constructor);
        let obj_signer  = object::generate_signer(&constructor);

        // Pre-populate mint counters
        let mint_counts = table::new<u8, u64>();
        table::add(&mut mint_counts, BADGE_YIELD_HARVESTER,  0u64);
        table::add(&mut mint_counts, BADGE_REBALANCE_MASTER, 0u64);
        table::add(&mut mint_counts, BADGE_ARENA_CHAMPION,   0u64);
        table::add(&mut mint_counts, BADGE_PROTOCOL_VETERAN, 0u64);

        move_to(&obj_signer, Registry {
            admin      : admin_addr,
            extend_ref,
            entries    : table::new<vector<u8>, BadgeEntry>(),
            mint_counts,
        });
    }

    // ── Admin: mint ───────────────────────────────────────────────────────────

    /// Mint a soulbound badge for `recipient`.
    ///
    /// Called by the NEURALIS agent after a successful rebalance cycle:
    ///   cosmos::move_execute(module_addr, "labor_badge", "mint_badge",
    ///     [recipient_addr, badge_type, metadata_string])
    ///
    /// Reverts if:
    ///   • caller is not admin
    ///   • badge_type is out of range
    ///   • recipient already holds this badge type
    public entry fun mint_badge(
        admin     : &signer,
        recipient : address,
        badge_type: u8,
        metadata  : String,
    ) acquires Registry {
        let admin_addr = signer::address_of(admin);
        let reg_addr   = registry_object_address(admin_addr);
        let registry   = borrow_global_mut<Registry>(reg_addr);

        assert!(admin_addr == registry.admin,  error::permission_denied(ENOT_ADMIN));
        assert!(badge_type <= MAX_BADGE_TYPE,   error::invalid_argument(EINVALID_BADGE_TYPE));

        let key = make_key(recipient, badge_type);
        assert!(
            !table::contains(&registry.entries, key),
            error::already_exists(EALREADY_MINTED)
        );

        let (block_height, timestamp) = block::get_block_info();

        table::add(&mut registry.entries, key, BadgeEntry {
            badge_type,
            level       : 1,
            minted_at   : timestamp,
            minted_block: block_height,
            metadata,
        });

        let count = table::borrow_mut(&mut registry.mint_counts, badge_type);
        *count = *count + 1;

        event::emit(BadgeMintedEvent {
            owner: recipient,
            badge_type,
            level: 1,
            metadata,
            block_height,
            timestamp,
        });
    }

    // ── Admin: level up ───────────────────────────────────────────────────────

    /// Increment the level of an existing badge.
    /// Emitted when the agent crosses a milestone (e.g. 10 rebalances → level 2).
    public entry fun level_up_badge(
        admin     : &signer,
        owner     : address,
        badge_type: u8,
    ) acquires Registry {
        let admin_addr = signer::address_of(admin);
        let reg_addr   = registry_object_address(admin_addr);
        let registry   = borrow_global_mut<Registry>(reg_addr);

        assert!(admin_addr == registry.admin, error::permission_denied(ENOT_ADMIN));
        assert!(badge_type <= MAX_BADGE_TYPE,  error::invalid_argument(EINVALID_BADGE_TYPE));

        let key = make_key(owner, badge_type);
        assert!(table::contains(&registry.entries, key), error::not_found(EBADGE_NOT_FOUND));

        let entry     = table::borrow_mut(&mut registry.entries, key);
        let old_level = entry.level;
        entry.level   = old_level + 1;

        let (block_height, timestamp) = block::get_block_info();
        event::emit(BadgeLeveledUpEvent {
            owner,
            badge_type,
            old_level,
            new_level: entry.level,
            block_height,
            timestamp,
        });
    }

    // ── Admin: transfer admin ─────────────────────────────────────────────────

    /// Transfer admin rights to a new address (e.g. a multisig after launch).
    public entry fun transfer_admin(admin: &signer, new_admin: address) acquires Registry {
        let admin_addr = signer::address_of(admin);
        let reg_addr   = registry_object_address(admin_addr);
        let registry   = borrow_global_mut<Registry>(reg_addr);
        assert!(admin_addr == registry.admin, error::permission_denied(ENOT_ADMIN));
        registry.admin = new_admin;
    }

    // ── View functions ────────────────────────────────────────────────────────

    #[view]
    /// Returns true if `owner` holds a badge of `badge_type`.
    public fun has_badge(
        module_deployer: address,
        owner          : address,
        badge_type     : u8,
    ): bool acquires Registry {
        let reg_addr = registry_object_address(module_deployer);
        if (!exists<Registry>(reg_addr)) return false;
        let registry = borrow_global<Registry>(reg_addr);
        table::contains(&registry.entries, make_key(owner, badge_type))
    }

    #[view]
    /// Returns the current level of a badge.  Aborts if not found.
    public fun get_badge_level(
        module_deployer: address,
        owner          : address,
        badge_type     : u8,
    ): u64 acquires Registry {
        let registry = borrow_global<Registry>(registry_object_address(module_deployer));
        let key      = make_key(owner, badge_type);
        assert!(table::contains(&registry.entries, key), error::not_found(EBADGE_NOT_FOUND));
        table::borrow(&registry.entries, key).level
    }

    #[view]
    /// Returns the metadata string of a badge.
    public fun get_badge_metadata(
        module_deployer: address,
        owner          : address,
        badge_type     : u8,
    ): String acquires Registry {
        let registry = borrow_global<Registry>(registry_object_address(module_deployer));
        let key      = make_key(owner, badge_type);
        assert!(table::contains(&registry.entries, key), error::not_found(EBADGE_NOT_FOUND));
        table::borrow(&registry.entries, key).metadata
    }

    #[view]
    /// Returns the block height at which a badge was minted.
    public fun get_badge_minted_block(
        module_deployer: address,
        owner          : address,
        badge_type     : u8,
    ): u64 acquires Registry {
        let registry = borrow_global<Registry>(registry_object_address(module_deployer));
        let key      = make_key(owner, badge_type);
        assert!(table::contains(&registry.entries, key), error::not_found(EBADGE_NOT_FOUND));
        table::borrow(&registry.entries, key).minted_block
    }

    #[view]
    /// Returns the global mint count for a badge type.
    public fun total_minted(module_deployer: address, badge_type: u8): u64 acquires Registry {
        let registry = borrow_global<Registry>(registry_object_address(module_deployer));
        *table::borrow(&registry.mint_counts, badge_type)
    }

    #[view]
    /// Returns the deterministic registry object address for a given deployer.
    public fun registry_object_address(deployer: address): address {
        object::create_object_address(&deployer, b"neuralis_labor_badge_v1")
    }

    // ── Internal helpers ──────────────────────────────────────────────────────

    /// Composite key: BCS-encoded owner address concatenated with badge_type byte.
    /// Guaranteed unique per (owner, badge_type) pair.
    fun make_key(owner: address, badge_type: u8): vector<u8> {
        let key = bcs::to_bytes(&owner);
        vector::push_back(&mut key, badge_type);
        key
    }
}
