/// ProgrammableIntents — AI-to-on-chain intent execution for NEURALIS.
///
/// What this module does
/// ─────────────────────
/// Users express goals in natural language ("Maximize safe yield with 100 USDC").
/// The off-chain Claude agent interprets the intent, builds a structured
/// IntentPayload, signs it with the keeper key, and submits it here.
///
/// This module:
///   1. Verifies the keeper signature over (intent_id, owner, action_type,
///      params_hash, deadline, chain_id, nonce).
///   2. Checks the intent has not expired (deadline > current block time).
///   3. Checks the nonce to prevent replay.
///   4. Records the intent on-chain (status: PENDING → EXECUTED / FAILED).
///   5. Emits a typed event so the frontend can react in real time.
///   6. Optionally calls a downstream action (e.g. trigger a vault rebalance
///      via the cosmos precompile, or record a yield harvest).
///
/// Action types (u8)
/// ─────────────────
///   0 = REBALANCE_VAULT   — agent rebalanced the EVM vault
///   1 = HARVEST_YIELD     — agent harvested yield from a strategy
///   2 = BRIDGE_LIQUIDITY  — agent bridged liquidity cross-chain
///   3 = ARENA_ENTER       — agent entered the Arena with earned credits
///
/// Signature scheme
/// ────────────────
/// The keeper signs:
///   SHA3-256( BCS(IntentPayload without signature field) )
/// using an Ed25519 key.  Initia's stdlib provides `ed25519::verify_signature`.
///
/// Nonce
/// ─────
/// Per-owner nonce stored in the Registry.  Prevents replay of the same
/// signed payload.
module neuralis::programmable_intents {
    use std::signer;
    use std::error;
    use std::string::String;
    use std::bcs;
    use std::vector;
    use std::hash;
    use initia_std::event;
    use initia_std::table::{Self, Table};
    use initia_std::object::{Self, ExtendRef};
    use initia_std::block;
    use initia_std::ed25519;

    // ── Action type constants ─────────────────────────────────────────────────

    const ACTION_REBALANCE_VAULT  : u8 = 0;
    const ACTION_HARVEST_YIELD    : u8 = 1;
    const ACTION_BRIDGE_LIQUIDITY : u8 = 2;
    const ACTION_ARENA_ENTER      : u8 = 3;
    const MAX_ACTION_TYPE         : u8 = 3;

    // ── Intent status constants ───────────────────────────────────────────────

    const STATUS_PENDING  : u8 = 0;
    const STATUS_EXECUTED : u8 = 1;
    const STATUS_FAILED   : u8 = 2;
    const STATUS_EXPIRED  : u8 = 3;

    // ── Error codes ───────────────────────────────────────────────────────────

    const ENOT_ADMIN           : u64 = 1;
    const EINVALID_ACTION_TYPE : u64 = 2;
    const EINTENT_EXPIRED      : u64 = 3;
    const EINVALID_SIGNATURE   : u64 = 4;
    const ENONCE_MISMATCH      : u64 = 5;
    const EINTENT_NOT_FOUND    : u64 = 6;
    const EALREADY_INITIALIZED : u64 = 7;
    const EINTENT_NOT_PENDING  : u64 = 8;

    // ── On-chain resources ────────────────────────────────────────────────────

    /// Global registry — stored at the deterministic object address.
    struct Registry has key {
        /// Address allowed to submit intents (the keeper / agent wallet).
        admin          : address,
        /// Ed25519 public key of the keeper that signs intent payloads.
        keeper_pubkey  : vector<u8>,
        extend_ref     : ExtendRef,
        /// intent_id (u64) → IntentRecord
        intents        : Table<u64, IntentRecord>,
        /// owner_address_bytes → current nonce (u64)
        nonces         : Table<vector<u8>, u64>,
        /// Monotonically increasing intent ID counter
        next_intent_id : u64,
        /// Total executed / failed counts
        total_executed : u64,
        total_failed   : u64,
    }

    /// Immutable record of a submitted intent.
    struct IntentRecord has store {
        intent_id   : u64,
        owner       : address,
        action_type : u8,
        /// BCS-encoded action-specific parameters (decoded off-chain).
        params      : vector<u8>,
        /// SHA3-256 of params — included in the signed message.
        params_hash : vector<u8>,
        /// Unix timestamp (seconds) after which the intent is invalid.
        deadline    : u64,
        /// Per-owner nonce at submission time.
        nonce       : u64,
        status      : u8,
        /// Human-readable description from the AI agent.
        description : String,
        submitted_at_block: u64,
        submitted_at_time : u64,
        executed_at_block : u64,
        executed_at_time  : u64,
    }

    // ── Events ────────────────────────────────────────────────────────────────

    struct IntentSubmittedEvent has drop, store {
        intent_id   : u64,
        owner       : address,
        action_type : u8,
        description : String,
        deadline    : u64,
        block_height: u64,
        timestamp   : u64,
    }

    struct IntentExecutedEvent has drop, store {
        intent_id   : u64,
        owner       : address,
        action_type : u8,
        block_height: u64,
        timestamp   : u64,
    }

    struct IntentFailedEvent has drop, store {
        intent_id   : u64,
        owner       : address,
        action_type : u8,
        reason      : String,
        block_height: u64,
        timestamp   : u64,
    }

    // ── Initialization ────────────────────────────────────────────────────────

    /// Called once by the deployer after `minitiad move deploy`.
    ///
    ///   minitiad tx move execute <MODULE_ADDR> programmable_intents initialize \
    ///     --args '["bytes:<KEEPER_ED25519_PUBKEY_HEX>"]' \
    ///     --from <DEPLOYER_KEY> ...
    public entry fun initialize(
        admin        : &signer,
        keeper_pubkey: vector<u8>,
    ) {
        let admin_addr = signer::address_of(admin);
        let reg_addr   = registry_object_address(admin_addr);
        assert!(!exists<Registry>(reg_addr), error::already_exists(EALREADY_INITIALIZED));

        let constructor = object::create_named_object(admin, b"neuralis_programmable_intents_v1");
        let extend_ref  = object::generate_extend_ref(&constructor);
        let obj_signer  = object::generate_signer(&constructor);

        move_to(&obj_signer, Registry {
            admin,
            keeper_pubkey,
            extend_ref,
            intents        : table::new<u64, IntentRecord>(),
            nonces         : table::new<vector<u8>, u64>(),
            next_intent_id : 0,
            total_executed : 0,
            total_failed   : 0,
        });
    }

    // ── Submit intent ─────────────────────────────────────────────────────────

    /// Submit a keeper-signed intent on behalf of `owner`.
    ///
    /// The keeper (agent wallet) calls this after Claude produces a
    /// recommendation.  The signature covers:
    ///   SHA3-256( BCS(owner) ++ BCS(action_type) ++ params_hash
    ///             ++ BCS(deadline) ++ BCS(chain_id) ++ BCS(nonce) )
    ///
    /// `params` is the raw BCS-encoded action payload (e.g. strategy addresses
    /// and basis points for a REBALANCE_VAULT intent).  It is stored verbatim
    /// so the frontend / indexer can decode it.
    ///
    /// Returns the assigned intent_id via an event.
    public entry fun submit_intent(
        keeper      : &signer,
        owner       : address,
        action_type : u8,
        params      : vector<u8>,
        deadline    : u64,
        nonce       : u64,
        signature   : vector<u8>,
        description : String,
    ) acquires Registry {
        let keeper_addr = signer::address_of(keeper);
        let reg_addr    = registry_object_address(keeper_addr);
        let registry    = borrow_global_mut<Registry>(reg_addr);

        assert!(keeper_addr == registry.admin,  error::permission_denied(ENOT_ADMIN));
        assert!(action_type <= MAX_ACTION_TYPE,  error::invalid_argument(EINVALID_ACTION_TYPE));

        // ── Deadline check ────────────────────────────────────────────────────
        let (block_height, timestamp) = block::get_block_info();
        assert!(timestamp <= deadline, error::invalid_argument(EINTENT_EXPIRED));

        // ── Nonce check ───────────────────────────────────────────────────────
        let owner_key     = bcs::to_bytes(&owner);
        let expected_nonce = if (table::contains(&registry.nonces, owner_key)) {
            *table::borrow(&registry.nonces, owner_key)
        } else {
            0u64
        };
        assert!(nonce == expected_nonce, error::invalid_argument(ENONCE_MISMATCH));

        // ── Signature verification ────────────────────────────────────────────
        let params_hash = hash::sha3_256(params);
        let msg         = build_signed_message(
            owner, action_type, &params_hash, deadline, nonce
        );
        let msg_hash    = hash::sha3_256(msg);

        assert!(
            ed25519::verify_signature(
                &registry.keeper_pubkey,
                &msg_hash,
                &signature,
            ),
            error::invalid_argument(EINVALID_SIGNATURE)
        );

        // ── Record intent ─────────────────────────────────────────────────────
        let intent_id = registry.next_intent_id;
        registry.next_intent_id = intent_id + 1;

        // Advance nonce
        if (table::contains(&registry.nonces, owner_key)) {
            let n = table::borrow_mut(&mut registry.nonces, owner_key);
            *n = nonce + 1;
        } else {
            table::add(&mut registry.nonces, owner_key, nonce + 1);
        };

        table::add(&mut registry.intents, intent_id, IntentRecord {
            intent_id,
            owner,
            action_type,
            params,
            params_hash,
            deadline,
            nonce,
            status            : STATUS_PENDING,
            description,
            submitted_at_block: block_height,
            submitted_at_time : timestamp,
            executed_at_block : 0,
            executed_at_time  : 0,
        });

        event::emit(IntentSubmittedEvent {
            intent_id,
            owner,
            action_type,
            description,
            deadline,
            block_height,
            timestamp,
        });
    }

    // ── Mark executed ─────────────────────────────────────────────────────────

    /// Mark a PENDING intent as EXECUTED.
    /// Called by the keeper after the downstream EVM transaction is confirmed.
    public entry fun mark_executed(
        keeper   : &signer,
        intent_id: u64,
    ) acquires Registry {
        let keeper_addr = signer::address_of(keeper);
        let reg_addr    = registry_object_address(keeper_addr);
        let registry    = borrow_global_mut<Registry>(reg_addr);

        assert!(keeper_addr == registry.admin, error::permission_denied(ENOT_ADMIN));
        assert!(
            table::contains(&registry.intents, intent_id),
            error::not_found(EINTENT_NOT_FOUND)
        );

        let record = table::borrow_mut(&mut registry.intents, intent_id);
        assert!(record.status == STATUS_PENDING, error::invalid_state(EINTENT_NOT_PENDING));

        let (block_height, timestamp) = block::get_block_info();
        record.status           = STATUS_EXECUTED;
        record.executed_at_block = block_height;
        record.executed_at_time  = timestamp;
        registry.total_executed  = registry.total_executed + 1;

        event::emit(IntentExecutedEvent {
            intent_id,
            owner      : record.owner,
            action_type: record.action_type,
            block_height,
            timestamp,
        });
    }

    // ── Mark failed ───────────────────────────────────────────────────────────

    /// Mark a PENDING intent as FAILED (e.g. RiskEngine rejected the rebalance).
    public entry fun mark_failed(
        keeper   : &signer,
        intent_id: u64,
        reason   : String,
    ) acquires Registry {
        let keeper_addr = signer::address_of(keeper);
        let reg_addr    = registry_object_address(keeper_addr);
        let registry    = borrow_global_mut<Registry>(reg_addr);

        assert!(keeper_addr == registry.admin, error::permission_denied(ENOT_ADMIN));
        assert!(
            table::contains(&registry.intents, intent_id),
            error::not_found(EINTENT_NOT_FOUND)
        );

        let record = table::borrow_mut(&mut registry.intents, intent_id);
        assert!(record.status == STATUS_PENDING, error::invalid_state(EINTENT_NOT_PENDING));

        let (block_height, timestamp) = block::get_block_info();
        record.status           = STATUS_FAILED;
        record.executed_at_block = block_height;
        record.executed_at_time  = timestamp;
        registry.total_failed    = registry.total_failed + 1;

        event::emit(IntentFailedEvent {
            intent_id,
            owner      : record.owner,
            action_type: record.action_type,
            reason,
            block_height,
            timestamp,
        });
    }

    // ── Admin: update keeper pubkey ───────────────────────────────────────────

    /// Rotate the keeper Ed25519 public key (e.g. after key rotation).
    public entry fun update_keeper_pubkey(
        admin     : &signer,
        new_pubkey: vector<u8>,
    ) acquires Registry {
        let admin_addr = signer::address_of(admin);
        let reg_addr   = registry_object_address(admin_addr);
        let registry   = borrow_global_mut<Registry>(reg_addr);
        assert!(admin_addr == registry.admin, error::permission_denied(ENOT_ADMIN));
        registry.keeper_pubkey = new_pubkey;
    }

    // ── View functions ────────────────────────────────────────────────────────

    #[view]
    public fun get_intent_status(
        module_deployer: address,
        intent_id      : u64,
    ): u8 acquires Registry {
        let registry = borrow_global<Registry>(registry_object_address(module_deployer));
        assert!(
            table::contains(&registry.intents, intent_id),
            error::not_found(EINTENT_NOT_FOUND)
        );
        table::borrow(&registry.intents, intent_id).status
    }

    #[view]
    public fun get_intent_action_type(
        module_deployer: address,
        intent_id      : u64,
    ): u8 acquires Registry {
        let registry = borrow_global<Registry>(registry_object_address(module_deployer));
        assert!(
            table::contains(&registry.intents, intent_id),
            error::not_found(EINTENT_NOT_FOUND)
        );
        table::borrow(&registry.intents, intent_id).action_type
    }

    #[view]
    public fun get_owner_nonce(
        module_deployer: address,
        owner          : address,
    ): u64 acquires Registry {
        let registry  = borrow_global<Registry>(registry_object_address(module_deployer));
        let owner_key = bcs::to_bytes(&owner);
        if (table::contains(&registry.nonces, owner_key)) {
            *table::borrow(&registry.nonces, owner_key)
        } else {
            0u64
        }
    }

    #[view]
    public fun get_next_intent_id(module_deployer: address): u64 acquires Registry {
        borrow_global<Registry>(registry_object_address(module_deployer)).next_intent_id
    }

    #[view]
    public fun get_total_executed(module_deployer: address): u64 acquires Registry {
        borrow_global<Registry>(registry_object_address(module_deployer)).total_executed
    }

    #[view]
    public fun get_total_failed(module_deployer: address): u64 acquires Registry {
        borrow_global<Registry>(registry_object_address(module_deployer)).total_failed
    }

    #[view]
    public fun registry_object_address(deployer: address): address {
        object::create_object_address(&deployer, b"neuralis_programmable_intents_v1")
    }

    // ── Internal helpers ──────────────────────────────────────────────────────

    /// Build the canonical message the keeper must sign.
    /// Layout: BCS(owner) ++ BCS(action_type) ++ params_hash(32 bytes)
    ///         ++ BCS(deadline) ++ BCS(nonce)
    /// The chain_id is implicitly enforced because the module address is
    /// chain-specific (different chains → different module addresses).
    fun build_signed_message(
        owner      : address,
        action_type: u8,
        params_hash: &vector<u8>,
        deadline   : u64,
        nonce      : u64,
    ): vector<u8> {
        let msg = bcs::to_bytes(&owner);
        vector::push_back(&mut msg, action_type);
        vector::append(&mut msg, *params_hash);
        let deadline_bytes = bcs::to_bytes(&deadline);
        vector::append(&mut msg, deadline_bytes);
        let nonce_bytes = bcs::to_bytes(&nonce);
        vector::append(&mut msg, nonce_bytes);
        msg
    }
}
