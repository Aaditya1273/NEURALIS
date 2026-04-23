/// AgentArena - 1v1 turn-based battle game for NEURALIS agents.
///
/// How it works
/// ------------------------------------
/// 1. Players stake Neural Credits (u64, earned from yield harvesting) to enter.
/// 2. Two players are matched into a Battle.
/// 3. Each turn, a player submits a move (0=ATTACK, 1=DEFEND, 2=SPECIAL).
/// 4. The outcome is resolved deterministically using block hash entropy.
/// 5. The winner receives both stakes minus a 5% protocol fee.
/// 6. A LaborBadge ARENA_CHAMPION is minted for the winner (via event - the
///    keeper agent listens and calls labor_badge::mint_badge).
///
/// Credit system
/// ---------------------------------------
/// Neural Credits are tracked in this module as a simple u64 balance per address.
/// The admin (keeper) mints credits after each successful vault rebalance cycle.
/// Credits are non-transferable except through battle stakes.
///
/// Move types (u8)
/// ---------------------------------------------
///   0 = ATTACK  - deals 20 damage
///   1 = DEFEND  - blocks 15 damage, deals 5
///   2 = SPECIAL - deals 30 damage, costs 10 extra HP
///
/// Battle states (u8)
/// ------------------------------------------------------
///   0 = WAITING   - created, waiting for opponent
///   1 = ACTIVE    - both players joined, turns in progress
///   2 = FINISHED  - winner decided
module neuralis::agent_arena_v2 {
    use std::signer;
    use std::error;
    use std::string::String;
    use std::bcs;
    use initia_std::event;
    use initia_std::table::{Self, Table};
    use initia_std::object::{Self, ExtendRef};
    use initia_std::block;

    // ------ Constants ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

    const MOVE_ATTACK  : u8 = 0;
    const MOVE_DEFEND  : u8 = 1;
    const MOVE_SPECIAL : u8 = 2;

    const STATE_WAITING  : u8 = 0;
    const STATE_ACTIVE   : u8 = 1;
    const STATE_FINISHED : u8 = 2;

    const STARTING_HP    : u64 = 100;
    const PROTOCOL_FEE_BPS: u64 = 500; // 5%

    // ------ Error codes ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

    const ENOT_ADMIN           : u64 = 1;
    const EALREADY_INITIALIZED : u64 = 2;
    const EINSUFFICIENT_CREDITS: u64 = 3;
    const EBATTLE_NOT_FOUND    : u64 = 4;
    const EBATTLE_NOT_WAITING  : u64 = 5;
    const EBATTLE_NOT_ACTIVE   : u64 = 6;
    const EBATTLE_ALREADY_DONE : u64 = 7;
    const ENOT_YOUR_TURN       : u64 = 8;
    const EINVALID_MOVE        : u64 = 9;
    const ECANNOT_FIGHT_SELF   : u64 = 10;

    // ------ On-chain resources ------------------------------------------------------------------------------------------------------------------------------------------------------------

    struct Registry has key {
        admin          : address,
        extend_ref     : ExtendRef,
        /// address_bytes --- Neural Credit balance
        credits        : Table<vector<u8>, u64>,
        /// battle_id --- Battle
        battles        : Table<u64, Battle>,
        next_battle_id : u64,
        total_fees_collected: u64,
    }

    struct Battle has store {
        battle_id   : u64,
        player1     : address,
        player2     : address,   // zero address until joined
        stake       : u64,       // credits staked by each player
        state       : u8,
        hp1         : u64,
        hp2         : u64,
        turn        : u8,        // 0 = player1's turn, 1 = player2's turn
        turn_count  : u64,
        winner      : address,   // zero until finished
        created_at  : u64,
    }

    // ------ Events ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

    #[event]
    struct CreditsGrantedEvent has drop, store {
        recipient   : address,
        amount      : u64,
        reason      : String,
        block_height: u64,
    }

    #[event]
    struct BattleCreatedEvent has drop, store {
        battle_id   : u64,
        player1     : address,
        stake       : u64,
        block_height: u64,
    }

    #[event]
    struct BattleJoinedEvent has drop, store {
        battle_id   : u64,
        player2     : address,
        block_height: u64,
    }

    #[event]
    struct TurnPlayedEvent has drop, store {
        battle_id   : u64,
        player      : address,
        move_type   : u8,
        damage_dealt: u64,
        block_height: u64,
    }

    #[event]
    struct BattleFinishedEvent has drop, store {
        battle_id   : u64,
        winner      : address,
        loser       : address,
        prize       : u64,
        block_height: u64,
    }

    // ------ Initialization ------------------------------------------------------------------------------------------------------------------------------------------------------------------------

    public entry fun initialize(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        let reg_addr   = registry_object_address(admin_addr);
        assert!(!exists<Registry>(reg_addr), error::already_exists(EALREADY_INITIALIZED));

        let constructor = object::create_named_object(admin, b"neuralis_agent_arena_v2");
        let extend_ref  = object::generate_extend_ref(&constructor);
        let obj_signer  = object::generate_signer(&constructor);

        move_to(&obj_signer, Registry {
            admin               : admin_addr,
            extend_ref,
            credits             : table::new<vector<u8>, u64>(),
            battles             : table::new<u64, Battle>(),
            next_battle_id      : 0,
            total_fees_collected: 0,
        });
    }

    // ------ Admin: grant credits ------------------------------------------------------------------------------------------------------------------------------------------------------

    /// Mint Neural Credits for a player after a successful vault rebalance.
    /// Called by the keeper agent after each triggered rebalance.
    public entry fun grant_credits(
        admin    : &signer,
        recipient: address,
        amount   : u64,
        reason   : String,
    ) acquires Registry {
        let admin_addr = signer::address_of(admin);
        let reg_addr   = registry_object_address(admin_addr);
        let registry   = borrow_global_mut<Registry>(reg_addr);
        assert!(admin_addr == registry.admin, error::permission_denied(ENOT_ADMIN));

        let key = addr_key(recipient);
        if (table::contains(&registry.credits, key)) {
            let bal = table::borrow_mut(&mut registry.credits, key);
            *bal = *bal + amount;
        } else {
            table::add(&mut registry.credits, key, amount);
        };

        let (block_height, _) = block::get_block_info();
        event::emit(CreditsGrantedEvent { recipient, amount, reason, block_height });
    }

    // ------ Create battle ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------

    /// Player1 creates a battle by staking Neural Credits.
    /// Returns the battle_id via event.
    public entry fun create_battle(player1: &signer, stake: u64) acquires Registry {
        let p1_addr  = signer::address_of(player1);

        // Find registry - we need the admin address to locate it.
        // Since the registry is stored at object::create_object_address(&admin, seed),
        // and we don't know admin here, we require the player to pass the module address.
        // Workaround: store registry at a well-known address derived from @neuralis.
        let registry = borrow_global_mut<Registry>(registry_object_address(@neuralis));

        let key = addr_key(p1_addr);
        let bal = if (table::contains(&registry.credits, key)) {
            *table::borrow(&registry.credits, key)
        } else { 0u64 };
        assert!(bal >= stake, error::invalid_argument(EINSUFFICIENT_CREDITS));

        // Deduct stake
        let b = table::borrow_mut(&mut registry.credits, key);
        *b = *b - stake;

        let battle_id = registry.next_battle_id;
        registry.next_battle_id = battle_id + 1;

        let (block_height, timestamp) = block::get_block_info();

        table::add(&mut registry.battles, battle_id, Battle {
            battle_id,
            player1  : p1_addr,
            player2  : @0x0,
            stake,
            state    : STATE_WAITING,
            hp1      : STARTING_HP,
            hp2      : STARTING_HP,
            turn     : 0,
            turn_count: 0,
            winner   : @0x0,
            created_at: timestamp,
        });

        event::emit(BattleCreatedEvent { battle_id, player1: p1_addr, stake, block_height });
    }

    // ------ Join battle ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

    public entry fun join_battle(player2: &signer, battle_id: u64) acquires Registry {
        let p2_addr  = signer::address_of(player2);
        let registry = borrow_global_mut<Registry>(registry_object_address(@neuralis));

        assert!(table::contains(&registry.battles, battle_id), error::not_found(EBATTLE_NOT_FOUND));
        let battle = table::borrow_mut(&mut registry.battles, battle_id);

        assert!(battle.state == STATE_WAITING, error::invalid_state(EBATTLE_NOT_WAITING));
        assert!(battle.player1 != p2_addr,     error::invalid_argument(ECANNOT_FIGHT_SELF));

        let key = addr_key(p2_addr);
        let bal = if (table::contains(&registry.credits, key)) {
            *table::borrow(&registry.credits, key)
        } else { 0u64 };
        assert!(bal >= battle.stake, error::invalid_argument(EINSUFFICIENT_CREDITS));

        let b = table::borrow_mut(&mut registry.credits, key);
        *b = *b - battle.stake;

        battle.player2 = p2_addr;
        battle.state   = STATE_ACTIVE;

        let (block_height, _) = block::get_block_info();
        event::emit(BattleJoinedEvent { battle_id, player2: p2_addr, block_height });
    }

    // ------ Play turn ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

    /// Submit a move for the current turn.
    /// Damage is resolved deterministically using block height as entropy source.
    public entry fun play_turn(player: &signer, battle_id: u64, move_type: u8) acquires Registry {
        assert!(move_type <= MOVE_SPECIAL, error::invalid_argument(EINVALID_MOVE));

        let player_addr = signer::address_of(player);
        let registry    = borrow_global_mut<Registry>(registry_object_address(@neuralis));

        assert!(table::contains(&registry.battles, battle_id), error::not_found(EBATTLE_NOT_FOUND));
        let battle = table::borrow_mut(&mut registry.battles, battle_id);

        assert!(battle.state == STATE_ACTIVE, error::invalid_state(EBATTLE_NOT_ACTIVE));

        // Verify it's this player's turn
        let expected_player = if (battle.turn == 0) battle.player1 else battle.player2;
        assert!(player_addr == expected_player, error::permission_denied(ENOT_YOUR_TURN));

        let (block_height, _) = block::get_block_info();

        // Deterministic damage using block_height + turn_count as entropy
        let entropy    = block_height ^ (battle.turn_count + 1);
        let base_dmg   = compute_damage(move_type, entropy);
        let damage     = base_dmg;

        // Apply damage to opponent
        let (attacker_hp, defender_hp) = if (battle.turn == 0) {
            (battle.hp1, battle.hp2)
        } else {
            (battle.hp2, battle.hp1)
        };

        // SPECIAL costs attacker 10 HP
        let attacker_cost = if (move_type == MOVE_SPECIAL) { 10u64 } else { 0u64 };
        let new_attacker_hp = if (attacker_hp > attacker_cost) attacker_hp - attacker_cost else 0u64;
        let new_defender_hp = if (defender_hp > damage) defender_hp - damage else 0u64;

        if (battle.turn == 0) {
            battle.hp1 = new_attacker_hp;
            battle.hp2 = new_defender_hp;
        } else {
            battle.hp2 = new_attacker_hp;
            battle.hp1 = new_defender_hp;
        };

        battle.turn_count = battle.turn_count + 1;
        battle.turn       = if (battle.turn == 0) 1 else 0;

        event::emit(TurnPlayedEvent {
            battle_id,
            player: player_addr,
            move_type,
            damage_dealt: damage,
            block_height,
        });

        // Check win condition
        if (battle.hp1 == 0 || battle.hp2 == 0) {
            finish_battle(battle, &mut registry.credits, &mut registry.total_fees_collected, block_height);
        };
    }

    // ------ Internal: finish battle ---------------------------------------------------------------------------------------------------------------------------------------------

    fun finish_battle(
        battle          : &mut Battle,
        credits         : &mut Table<vector<u8>, u64>,
        total_fees      : &mut u64,
        block_height    : u64,
    ) {
        battle.state = STATE_FINISHED;

        let (winner, loser) = if (battle.hp1 > 0) {
            (battle.player1, battle.player2)
        } else {
            (battle.player2, battle.player1)
        };
        battle.winner = winner;

        let total_pot  = battle.stake * 2;
        let fee        = (total_pot * PROTOCOL_FEE_BPS) / 10_000;
        let prize      = total_pot - fee;

        *total_fees = *total_fees + fee;

        let winner_key = addr_key(winner);
        if (table::contains(credits, winner_key)) {
            let b = table::borrow_mut(credits, winner_key);
            *b = *b + prize;
        } else {
            table::add(credits, winner_key, prize);
        };

        event::emit(BattleFinishedEvent {
            battle_id: battle.battle_id,
            winner,
            loser,
            prize,
            block_height,
        });
    }

    // ------ View functions ------------------------------------------------------------------------------------------------------------------------------------------------------------------------

    #[view]
    public fun get_credits(module_deployer: address, player: address): u64 acquires Registry {
        let registry = borrow_global<Registry>(registry_object_address(module_deployer));
        let key      = addr_key(player);
        if (table::contains(&registry.credits, key)) {
            *table::borrow(&registry.credits, key)
        } else { 0u64 }
    }

    #[view]
    public fun get_battle_state(module_deployer: address, battle_id: u64): u8 acquires Registry {
        let registry = borrow_global<Registry>(registry_object_address(module_deployer));
        assert!(table::contains(&registry.battles, battle_id), error::not_found(EBATTLE_NOT_FOUND));
        table::borrow(&registry.battles, battle_id).state
    }

    #[view]
    public fun get_battle_hp(module_deployer: address, battle_id: u64): (u64, u64) acquires Registry {
        let registry = borrow_global<Registry>(registry_object_address(module_deployer));
        assert!(table::contains(&registry.battles, battle_id), error::not_found(EBATTLE_NOT_FOUND));
        let b = table::borrow(&registry.battles, battle_id);
        (b.hp1, b.hp2)
    }

    #[view]
    public fun get_battle_winner(module_deployer: address, battle_id: u64): address acquires Registry {
        let registry = borrow_global<Registry>(registry_object_address(module_deployer));
        assert!(table::contains(&registry.battles, battle_id), error::not_found(EBATTLE_NOT_FOUND));
        table::borrow(&registry.battles, battle_id).winner
    }

    #[view]
    public fun get_next_battle_id(module_deployer: address): u64 acquires Registry {
        borrow_global<Registry>(registry_object_address(module_deployer)).next_battle_id
    }

    #[view]
    public fun registry_object_address(deployer: address): address {
        object::create_object_address(&deployer, b"neuralis_agent_arena_v2")
    }

    // ------ Internal helpers ------------------------------------------------------------------------------------------------------------------------------------------------------------------

    fun addr_key(addr: address): vector<u8> {
        bcs::to_bytes(&addr)
    }

    /// Deterministic damage calculation.
    /// Uses entropy (block_height XOR turn_count) to add variance.
    fun compute_damage(move_type: u8, entropy: u64): u64 {
        let variance = (entropy % 10); // 0-9 variance
        if (move_type == MOVE_ATTACK) {
            15 + variance          // 15-24 damage
        } else if (move_type == MOVE_DEFEND) {
            3 + (variance / 3)     // 3-6 damage (mostly defensive)
        } else {
            // SPECIAL
            25 + variance          // 25-34 damage
        }
    }
}
