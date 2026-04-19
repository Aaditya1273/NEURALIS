// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

import {IStrategy} from "../interfaces/IStrategy.sol";

/// @dev Minimal Aave v3 / Compound v3-compatible lending pool interface.
///      Any EVM lending protocol that exposes supply/withdraw and an aToken
///      (interest-bearing receipt token) works here.
interface ILendingPool {
    /// @notice Supply `amount` of `asset` to the pool on behalf of `onBehalfOf`.
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;

    /// @notice Withdraw `amount` of `asset` from the pool to `to`.
    /// @return withdrawn The actual amount withdrawn.
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
}

/// @dev aToken (interest-bearing receipt) — balanceOf grows over time.
interface IAToken {
    function balanceOf(address account) external view returns (uint256);
    function scaledBalanceOf(address account) external view returns (uint256);
}

/// @title InitiaLendingStrategy
/// @notice Yield strategy that supplies USDC to an Aave v3-compatible lending
///         pool on the NEURALIS EVM chain and earns variable supply APY.
///
/// TVL is read directly from the aToken balance (which accrues interest in real time).
/// APY is set by the owner from off-chain oracle data (e.g. the pool's liquidityRate).
contract InitiaLendingStrategy is IStrategy, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using Math for uint256;

    ILendingPool public immutable lendingPool;
    IAToken      public immutable aToken;
    address      public immutable usdcToken;
    address      public           vaultManager;

    uint256 public configuredAPY;       // bps, updated by owner from oracle
    uint8   public configuredRiskScore; // 0-100

    // ─── Events & errors ─────────────────────────────────────────────────────

    event Supplied(uint256 amount);
    event Withdrawn(uint256 requested, uint256 received);
    event APYUpdated(uint256 newAPY);
    event RiskScoreUpdated(uint8 newScore);
    event VaultManagerUpdated(address indexed newVaultManager);

    error OnlyVaultManager();

    // ─── Constructor ─────────────────────────────────────────────────────────

    /// @param _lendingPool     Aave v3-compatible pool address.
    /// @param _aToken          Corresponding aUSDC (interest-bearing) token.
    /// @param _usdcToken       USDC address.
    /// @param _vaultManager    VaultManager that calls deposit/withdraw.
    /// @param _initialAPY      Initial APY in bps (e.g. 450 = 4.50%).
    /// @param _initialRisk     Initial risk score (lending is lower risk than LP).
    /// @param initialOwner     Contract owner.
    constructor(
        address _lendingPool,
        address _aToken,
        address _usdcToken,
        address _vaultManager,
        uint256 _initialAPY,
        uint8   _initialRisk,
        address initialOwner
    ) Ownable(initialOwner) {
        lendingPool         = ILendingPool(_lendingPool);
        aToken              = IAToken(_aToken);
        usdcToken           = _usdcToken;
        vaultManager        = _vaultManager;
        configuredAPY       = _initialAPY;
        configuredRiskScore = _initialRisk;
    }

    modifier onlyVaultManager() {
        if (msg.sender != vaultManager) revert OnlyVaultManager();
        _;
    }

    // ─── IStrategy ───────────────────────────────────────────────────────────

    function deposit(uint256 amount) external override onlyVaultManager nonReentrant {
        IERC20(usdcToken).safeTransferFrom(vaultManager, address(this), amount);
        IERC20(usdcToken).forceApprove(address(lendingPool), amount);
        lendingPool.supply(usdcToken, amount, address(this), 0);
        emit Supplied(amount);
    }

    function withdraw(uint256 amount) external override onlyVaultManager nonReentrant returns (uint256 received) {
        uint256 aBalance = aToken.balanceOf(address(this));
        if (aBalance == 0) return 0;

        // Cap at actual aToken balance to avoid revert
        uint256 toWithdraw = amount > aBalance ? aBalance : amount;

        received = lendingPool.withdraw(usdcToken, toWithdraw, vaultManager);
        emit Withdrawn(amount, received);
    }

    function getAPY() external view override returns (uint256) {
        return configuredAPY;
    }

    /// @dev aToken balance grows in real time — this is the true TVL.
    function getTVL() external view override returns (uint256) {
        return aToken.balanceOf(address(this));
    }

    function getRiskScore() external view override returns (uint8) {
        return configuredRiskScore;
    }

    function asset() external view override returns (address) {
        return usdcToken;
    }

    // ─── Owner setters ────────────────────────────────────────────────────────

    function setConfiguredAPY(uint256 apy) external onlyOwner {
        configuredAPY = apy;
        emit APYUpdated(apy);
    }

    function setConfiguredRiskScore(uint8 score) external onlyOwner {
        configuredRiskScore = score;
        emit RiskScoreUpdated(score);
    }

    function setVaultManager(address _vaultManager) external onlyOwner {
        require(_vaultManager != address(0), "Zero address");
        vaultManager = _vaultManager;
        emit VaultManagerUpdated(_vaultManager);
    }

    function rescueTokens(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }
}
