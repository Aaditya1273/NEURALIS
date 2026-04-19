// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {IStrategy} from "../interfaces/IStrategy.sol";

/// @dev Minimal staking pool interface — compatible with Synthetix-style
///      single-sided staking pools common on EVM chains.
interface IStakingPool {
    /// @notice Stake `amount` of stakeToken on behalf of `account`.
    function stake(uint256 amount) external;

    /// @notice Withdraw `amount` of stakeToken.
    function withdraw(uint256 amount) external;

    /// @notice Claim accumulated rewards to msg.sender.
    function getReward() external;

    /// @notice Pending reward amount for `account`.
    function earned(address account) external view returns (uint256);

    /// @notice Total staked by `account`.
    function balanceOf(address account) external view returns (uint256);
}

/// @dev Reward token swap interface — swap reward token back to USDC.
interface ISwapRouter {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);
}

/// @title InitiaStakingStrategy
/// @notice Yield strategy that stakes USDC (or a USDC-equivalent) in a
///         Synthetix-style single-sided staking pool on the NEURALIS EVM chain.
///
/// Flow on deposit:
///   1. Receive USDC from VaultManager.
///   2. Stake USDC in the staking pool.
///
/// Flow on withdraw:
///   1. Unstake proportional amount.
///   2. Claim any pending rewards.
///   3. Swap rewards → USDC via router.
///   4. Transfer total USDC to VaultManager.
///
/// TVL = staked balance + pending rewards valued in USDC (approximated via
///       the reward/USDC exchange rate from the router).
contract InitiaStakingStrategy is IStrategy, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IStakingPool public immutable stakingPool;
    ISwapRouter  public immutable router;
    address      public immutable usdcToken;
    address      public immutable rewardToken;  // token emitted by the staking pool
    address      public           vaultManager;

    uint256 public configuredAPY;
    uint8   public configuredRiskScore;

    uint256 private constant DEADLINE_BUFFER = 5 minutes;

    // ─── Events & errors ─────────────────────────────────────────────────────

    event Staked(uint256 amount);
    event Unstaked(uint256 amount, uint256 rewardsClaimed, uint256 totalReturned);
    event APYUpdated(uint256 newAPY);
    event RiskScoreUpdated(uint8 newScore);
    event VaultManagerUpdated(address indexed newVaultManager);

    error OnlyVaultManager();

    // ─── Constructor ─────────────────────────────────────────────────────────

    /// @param _stakingPool     Synthetix-style staking pool address.
    /// @param _router          Uniswap V2-compatible router for reward → USDC swaps.
    /// @param _usdcToken       USDC address (stake token).
    /// @param _rewardToken     Reward token emitted by the pool.
    /// @param _vaultManager    VaultManager.
    /// @param _initialAPY      Initial APY in bps.
    /// @param _initialRisk     Initial risk score.
    /// @param initialOwner     Contract owner.
    constructor(
        address _stakingPool,
        address _router,
        address _usdcToken,
        address _rewardToken,
        address _vaultManager,
        uint256 _initialAPY,
        uint8   _initialRisk,
        address initialOwner
    ) Ownable(initialOwner) {
        stakingPool         = IStakingPool(_stakingPool);
        router              = ISwapRouter(_router);
        usdcToken           = _usdcToken;
        rewardToken         = _rewardToken;
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
        IERC20(usdcToken).forceApprove(address(stakingPool), amount);
        stakingPool.stake(amount);
        emit Staked(amount);
    }

    function withdraw(uint256 amount) external override onlyVaultManager nonReentrant returns (uint256 received) {
        uint256 staked = stakingPool.balanceOf(address(this));
        if (staked == 0) return 0;

        uint256 toUnstake = amount > staked ? staked : amount;

        // Unstake principal
        stakingPool.withdraw(toUnstake);

        // Claim rewards
        uint256 rewardsBefore = IERC20(rewardToken).balanceOf(address(this));
        stakingPool.getReward();
        uint256 rewardsEarned = IERC20(rewardToken).balanceOf(address(this)) - rewardsBefore;

        // Swap rewards → USDC
        uint256 rewardsInUSDC = 0;
        if (rewardsEarned > 0 && rewardToken != usdcToken) {
            address[] memory path = new address[](2);
            path[0] = rewardToken;
            path[1] = usdcToken;
            IERC20(rewardToken).forceApprove(address(router), rewardsEarned);
            try router.swapExactTokensForTokens(
                rewardsEarned, 0, path, address(this), block.timestamp + DEADLINE_BUFFER
            ) returns (uint256[] memory amounts) {
                rewardsInUSDC = amounts[1];
            } catch {
                // Swap failed — keep reward tokens on contract, non-fatal
            }
        } else if (rewardToken == usdcToken) {
            rewardsInUSDC = rewardsEarned;
        }

        received = toUnstake + rewardsInUSDC;
        IERC20(usdcToken).safeTransfer(vaultManager, received);

        emit Unstaked(toUnstake, rewardsEarned, received);
    }

    function getAPY() external view override returns (uint256) {
        return configuredAPY;
    }

    /// @dev TVL = staked principal (USDC) + pending rewards (not yet valued in USDC
    ///      to avoid oracle dependency; owner updates APY to reflect reward value).
    function getTVL() external view override returns (uint256) {
        return stakingPool.balanceOf(address(this));
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
