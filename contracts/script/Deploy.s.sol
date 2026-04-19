// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {StrategyRegistry}    from "../src/StrategyRegistry.sol";
import {RiskEngine}          from "../src/RiskEngine.sol";
import {VaultManager}        from "../src/VaultManager.sol";
import {KeeperExecutor}      from "../src/KeeperExecutor.sol";
import {SequencerFeeVault}   from "../src/SequencerFeeVault.sol";
import {MockYieldStrategy}   from "../src/strategies/MockYieldStrategy.sol";
import {MockUSDC}            from "../src/mocks/MockUSDC.sol";

/// @notice NEURALIS testnet deployment using MockYieldStrategy for all 3 slots.
/// Real DEX/Lending/Staking strategies will replace these once those protocols
/// are deployed on neuralis-1.
///
/// Required env vars (contracts/.env):
///   PRIVATE_KEY, DEPLOYER_ADDRESS, USDC_ADDRESS, AGENT_SIGNER_ADDRESS, TREASURY_ADDRESS
contract Deploy is Script {
    function run() external {
        address deployer    = vm.envAddress("DEPLOYER_ADDRESS");
        address usdc        = vm.envAddress("USDC_ADDRESS");
        address agentSigner = vm.envAddress("AGENT_SIGNER_ADDRESS");
        address treasury    = vm.envAddress("TREASURY_ADDRESS");

        vm.startBroadcast();

        // ── 1. StrategyRegistry ──────────────────────────────────────────────
        StrategyRegistry registry = new StrategyRegistry(deployer);
        console2.log("StrategyRegistry    :", address(registry));

        // ── 2. RiskEngine ────────────────────────────────────────────────────
        RiskEngine riskEngine = new RiskEngine(address(registry), deployer);
        console2.log("RiskEngine          :", address(riskEngine));

        // ── 3. VaultManager ──────────────────────────────────────────────────
        VaultManager vaultManager = new VaultManager(
            IERC20(usdc), address(registry), address(riskEngine), deployer
        );
        console2.log("VaultManager        :", address(vaultManager));

        // ── 4. SequencerFeeVault ─────────────────────────────────────────────
        SequencerFeeVault feeVault = new SequencerFeeVault(
            usdc, address(vaultManager), treasury, deployer
        );
        console2.log("SequencerFeeVault   :", address(feeVault));

        // ── 5. KeeperExecutor ────────────────────────────────────────────────
        KeeperExecutor keeperExecutor = new KeeperExecutor(
            address(vaultManager), agentSigner, address(feeVault), deployer
        );
        console2.log("KeeperExecutor      :", address(keeperExecutor));

        // ── 6. Grant KEEPER_ROLE ─────────────────────────────────────────────
        vaultManager.grantRole(vaultManager.KEEPER_ROLE(), address(keeperExecutor));
        console2.log("KEEPER_ROLE granted");

        // ── 7. Fee allowance ─────────────────────────────────────────────────
        vaultManager.setKeeperFeeAllowance(address(keeperExecutor), 10_000e6);

        // ── 8. Three MockYieldStrategies (varied APY/risk for agent scoring) ─
        // Strategy A: 6.20% APY, risk 22 — highest yield
        MockYieldStrategy strategyA = new MockYieldStrategy(
            usdc, address(vaultManager), 620, 22, deployer
        );
        // Strategy B: 4.80% APY, risk 15 — safest
        MockYieldStrategy strategyB = new MockYieldStrategy(
            usdc, address(vaultManager), 480, 15, deployer
        );
        // Strategy C: 3.10% APY, risk 35 — lowest yield
        MockYieldStrategy strategyC = new MockYieldStrategy(
            usdc, address(vaultManager), 310, 35, deployer
        );
        console2.log("StrategyA (6.20%)   :", address(strategyA));
        console2.log("StrategyB (4.80%)   :", address(strategyB));
        console2.log("StrategyC (3.10%)   :", address(strategyC));

        // ── 9. Register strategies ───────────────────────────────────────────
        registry.addStrategy(address(strategyA), 3500);
        registry.addStrategy(address(strategyB), 3500);
        registry.addStrategy(address(strategyC), 3500);
        console2.log("All 3 strategies registered");

        vm.stopBroadcast();

        // ── 10. Write deployments.json ───────────────────────────────────────
        string memory json = "deployments";
        vm.serializeAddress(json, "strategyRegistry",  address(registry));
        vm.serializeAddress(json, "riskEngine",        address(riskEngine));
        vm.serializeAddress(json, "vaultManager",      address(vaultManager));
        vm.serializeAddress(json, "sequencerFeeVault", address(feeVault));
        vm.serializeAddress(json, "keeperExecutor",    address(keeperExecutor));
        vm.serializeAddress(json, "strategyA",         address(strategyA));
        vm.serializeAddress(json, "strategyB",         address(strategyB));
        vm.serializeAddress(json, "strategyC",         address(strategyC));
        vm.serializeAddress(json, "usdc",              usdc);
        vm.serializeAddress(json, "treasury",          treasury);
        string memory output = vm.serializeUint(json, "chainId", block.chainid);
        vm.writeJson(output, "./deployments.json");
        console2.log("deployments.json written");
    }
}
