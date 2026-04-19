// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title SequencerFeeVault
/// @notice Captures 0.1% of every cross-chain agent action on NEURALIS and
///         distributes accumulated fees to the VaultManager (compounding yield)
///         and a protocol treasury.
///
/// How fees flow:
///   1. Any contract (KeeperExecutor, bridge adapters) calls `recordFee(amount)`
///      after a cross-chain action completes.
///   2. Fees accumulate in this contract.
///   3. Anyone can call `distribute()` once the threshold is reached.
///   4. 80% goes to VaultManager (boosts depositor yield).
///   5. 20% goes to the treasury (protocol sustainability).
///
/// Fee rate: FEE_BPS / 10_000 = 0.1%
contract SequencerFeeVault is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant FEE_BPS            = 10;    // 0.10%
    uint256 public constant VAULT_SHARE_BPS    = 8_000; // 80% to vault
    uint256 public constant TREASURY_SHARE_BPS = 2_000; // 20% to treasury

    IERC20  public immutable usdc;
    address public           vaultManager;
    address public           treasury;

    /// @notice Minimum USDC accumulated before distribute() can be called.
    uint256 public distributeThreshold = 100e6; // 100 USDC

    uint256 public totalFeesCollected;
    uint256 public totalDistributed;

    // ─── Events ───────────────────────────────────────────────────────────────

    event FeeRecorded(address indexed payer, uint256 actionAmount, uint256 feeAmount);
    event FeesDistributed(uint256 toVault, uint256 toTreasury, uint256 timestamp);
    event ThresholdUpdated(uint256 newThreshold);
    event VaultManagerUpdated(address indexed newVaultManager);
    event TreasuryUpdated(address indexed newTreasury);

    // ─── Errors ───────────────────────────────────────────────────────────────

    error BelowThreshold(uint256 balance, uint256 threshold);
    error ZeroAddress();

    // ─── Constructor ─────────────────────────────────────────────────────────

    constructor(
        address _usdc,
        address _vaultManager,
        address _treasury,
        address initialOwner
    ) Ownable(initialOwner) {
        if (_usdc == address(0) || _vaultManager == address(0) || _treasury == address(0))
            revert ZeroAddress();
        usdc         = IERC20(_usdc);
        vaultManager = _vaultManager;
        treasury     = _treasury;
    }

    // ─── Fee recording ────────────────────────────────────────────────────────

    /// @notice Record a fee for a cross-chain agent action.
    ///         Caller must have approved this contract for `feeAmount` USDC.
    ///
    /// @param actionAmount  The gross USDC value of the cross-chain action.
    ///
    /// The fee is computed as FEE_BPS / 10_000 of actionAmount.
    /// Caller is responsible for deducting the fee from the action amount
    /// before forwarding to the destination.
    function recordFee(uint256 actionAmount) external nonReentrant {
        uint256 feeAmount = (actionAmount * FEE_BPS) / 10_000;
        if (feeAmount == 0) return;

        usdc.safeTransferFrom(msg.sender, address(this), feeAmount);
        totalFeesCollected += feeAmount;

        emit FeeRecorded(msg.sender, actionAmount, feeAmount);
    }

    /// @notice Convenience: record a pre-computed fee amount directly.
    ///         Used by KeeperExecutor after a rebalance to capture the fee.
    function recordFeeAmount(uint256 feeAmount) external nonReentrant {
        if (feeAmount == 0) return;
        usdc.safeTransferFrom(msg.sender, address(this), feeAmount);
        totalFeesCollected += feeAmount;
        emit FeeRecorded(msg.sender, 0, feeAmount);
    }

    // ─── Distribution ─────────────────────────────────────────────────────────

    /// @notice Distribute accumulated fees to vault and treasury.
    ///         Callable by anyone once balance >= distributeThreshold.
    function distribute() external nonReentrant {
        uint256 balance = usdc.balanceOf(address(this));
        if (balance < distributeThreshold) revert BelowThreshold(balance, distributeThreshold);

        uint256 toVault    = (balance * VAULT_SHARE_BPS)    / 10_000;
        uint256 toTreasury = (balance * TREASURY_SHARE_BPS) / 10_000;

        // Dust stays in contract for next round
        totalDistributed += toVault + toTreasury;

        if (toVault > 0)    usdc.safeTransfer(vaultManager, toVault);
        if (toTreasury > 0) usdc.safeTransfer(treasury,     toTreasury);

        emit FeesDistributed(toVault, toTreasury, block.timestamp);
    }

    // ─── View helpers ─────────────────────────────────────────────────────────

    /// @notice Compute the fee for a given action amount.
    function computeFee(uint256 actionAmount) external pure returns (uint256) {
        return (actionAmount * FEE_BPS) / 10_000;
    }

    /// @notice Current undistributed balance.
    function pendingFees() external view returns (uint256) {
        return usdc.balanceOf(address(this));
    }

    // ─── Owner admin ──────────────────────────────────────────────────────────

    function setDistributeThreshold(uint256 threshold) external onlyOwner {
        distributeThreshold = threshold;
        emit ThresholdUpdated(threshold);
    }

    function setVaultManager(address _vaultManager) external onlyOwner {
        if (_vaultManager == address(0)) revert ZeroAddress();
        vaultManager = _vaultManager;
        emit VaultManagerUpdated(_vaultManager);
    }

    function setTreasury(address _treasury) external onlyOwner {
        if (_treasury == address(0)) revert ZeroAddress();
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }
}
