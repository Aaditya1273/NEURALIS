// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

import {VaultManager} from "./VaultManager.sol";
import {SequencerFeeVault} from "./SequencerFeeVault.sol";

/// @title KeeperExecutor
/// @notice Trustless relay between the offchain AI agent and VaultManager.
///
/// The agent signs (strategies, newBps, chainId, nonce) with its private key.
/// This contract verifies the signature, increments the nonce to prevent replay,
/// calls VaultManager.rebalance(), and captures a 0.1% sequencer fee from the
/// vault TVL into the SequencerFeeVault.
contract KeeperExecutor is Ownable {
    using ECDSA for bytes32;
    using SafeERC20 for IERC20;

    VaultManager       public vaultManager;
    SequencerFeeVault  public feeVault;      // address(0) = fee capture disabled
    address            public authorizedSigner;
    uint256            public nonce;

    // ─── Events & Errors ─────────────────────────────────────────────────────

    event Executed(uint256 indexed nonce, address[] strategies, uint256[] newBps, bytes32 msgHash);
    event FeeCaptured(uint256 feeAmount, uint256 vaultTVL);
    event AuthorizedSignerSet(address indexed oldSigner, address indexed newSigner);
    event VaultManagerSet(address indexed newVaultManager);
    event FeeVaultSet(address indexed newFeeVault);

    error InvalidSignature();

    // ─── Constructor ─────────────────────────────────────────────────────────

    constructor(
        address _vaultManager,
        address _authorizedSigner,
        address _feeVault,       // pass address(0) to disable fee capture initially
        address initialOwner
    ) Ownable(initialOwner) {
        vaultManager     = VaultManager(_vaultManager);
        authorizedSigner = _authorizedSigner;
        feeVault         = SequencerFeeVault(_feeVault);
    }

    // ─── Keeper entry point ──────────────────────────────────────────────────

    /// @notice Execute a rebalance signed by the authorised agent.
    /// @param strategies  Strategy addresses in the new allocation.
    /// @param newBps      Basis points per strategy (must sum to 10 000).
    /// @param signature   ECDSA signature over keccak256(abi.encode(strategies, newBps, chainid, nonce)).
    function execute(
        address[] calldata strategies,
        uint256[] calldata newBps,
        bytes calldata signature
    ) external {
        bytes32 messageHash   = keccak256(abi.encode(strategies, newBps, block.chainid, nonce));
        bytes32 ethSignedHash = MessageHashUtils.toEthSignedMessageHash(messageHash);

        address recovered = ECDSA.recover(ethSignedHash, signature);
        if (recovered != authorizedSigner) revert InvalidSignature();

        uint256 usedNonce = nonce;
        nonce++;

        // ── Capture sequencer fee before rebalance ────────────────────────────
        // Fee = 0.1% of current vault TVL, pulled from the vault's idle USDC.
        // Non-fatal: if fee capture fails (e.g. insufficient allowance), rebalance
        // still proceeds — fee capture is best-effort.
        if (address(feeVault) != address(0)) {
            _captureSequencerFee();
        }

        vaultManager.rebalance(strategies, newBps);

        emit Executed(usedNonce, strategies, newBps, ethSignedHash);
    }

    // ─── Internal: fee capture ────────────────────────────────────────────────

    function _captureSequencerFee() internal {
        try vaultManager.totalAssets() returns (uint256 tvl) {
            if (tvl == 0) return;

            uint256 feeAmount = feeVault.computeFee(tvl);
            if (feeAmount == 0) return;

            address usdcAddr = vaultManager.asset();
            IERC20 usdc      = IERC20(usdcAddr);

            // Check vault has enough idle balance (don't pull from strategies)
            uint256 idleBalance = usdc.balanceOf(address(vaultManager));
            if (idleBalance < feeAmount) return;

            // Pull fee from vault → this contract → fee vault
            // Requires VaultManager to have approved KeeperExecutor for USDC.
            // In production, VaultManager grants a fee allowance via setFeeAllowance().
            uint256 allowance = usdc.allowance(address(vaultManager), address(this));
            if (allowance < feeAmount) return;

            usdc.safeTransferFrom(address(vaultManager), address(this), feeAmount);
            usdc.forceApprove(address(feeVault), feeAmount);
            feeVault.recordFeeAmount(feeAmount);

            emit FeeCaptured(feeAmount, tvl);
        } catch {
            // VaultManager call failed — skip fee capture silently
        }
    }

    // ─── Owner actions ───────────────────────────────────────────────────────

    function setAuthorizedSigner(address signer) external onlyOwner {
        require(signer != address(0), "Zero address");
        emit AuthorizedSignerSet(authorizedSigner, signer);
        authorizedSigner = signer;
    }

    function setVaultManager(address _vaultManager) external onlyOwner {
        require(_vaultManager != address(0), "Zero address");
        vaultManager = VaultManager(_vaultManager);
        emit VaultManagerSet(_vaultManager);
    }

    function setFeeVault(address _feeVault) external onlyOwner {
        feeVault = SequencerFeeVault(_feeVault);
        emit FeeVaultSet(_feeVault);
    }

    // ─── View helpers ────────────────────────────────────────────────────────

    function nextMessageHash(address[] calldata strategies, uint256[] calldata newBps)
        external
        view
        returns (bytes32 messageHash, bytes32 ethSignedHash)
    {
        messageHash   = keccak256(abi.encode(strategies, newBps, block.chainid, nonce));
        ethSignedHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
    }
}
