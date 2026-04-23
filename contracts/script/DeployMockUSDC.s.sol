// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {MockUSDC} from "../src/mocks/MockUSDC.sol";

contract DeployMockUSDC is Script {
    function run() external {
        vm.startBroadcast();
        MockUSDC usdc = new MockUSDC("USD Coin", "USDC", 6);
        console2.log("MockUSDC deployed at:", address(usdc));
        vm.stopBroadcast();
    }
}
