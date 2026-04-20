import { NextResponse } from 'next/server';
import { createPublicClient, http, parseAbi } from 'viem';
import { defineChain } from 'viem';

const FEE_VAULT_ABI = parseAbi([
  'function totalFeesCollected() view returns (uint256)',
  'function totalDistributed() view returns (uint256)',
  'function pendingFees() view returns (uint256)',
]);

const feeVaultAddress = process.env.NEXT_PUBLIC_FEE_VAULT_ADDRESS as `0x${string}` | undefined;
const rpcUrl          = process.env.NEXT_PUBLIC_RPC_URL ?? 'http://localhost:8545';
const chainId         = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 0);

export async function GET() {
  if (!feeVaultAddress || feeVaultAddress === '0x0000000000000000000000000000000000000000') {
    return NextResponse.json({
      data: { totalFeesCollected: '0', totalDistributed: '0', pendingFees: '0' },
    });
  }

  try {
    const chain = defineChain({
      id: chainId,
      name: 'NEURALIS',
      nativeCurrency: { name: 'NEURAL', symbol: 'NEURAL', decimals: 18 },
      rpcUrls: { default: { http: [rpcUrl] } },
    });

    const client = createPublicClient({ chain, transport: http(rpcUrl) });

    const [totalCollected, totalDist, pending] = await Promise.all([
      client.readContract({ address: feeVaultAddress, abi: FEE_VAULT_ABI, functionName: 'totalFeesCollected' }),
      client.readContract({ address: feeVaultAddress, abi: FEE_VAULT_ABI, functionName: 'totalDistributed' }),
      client.readContract({ address: feeVaultAddress, abi: FEE_VAULT_ABI, functionName: 'pendingFees' }),
    ]);

    const fmt = (v: bigint) => (Number(v) / 1e6).toFixed(2);

    return NextResponse.json({
      data: {
        totalFeesCollected: fmt(totalCollected),
        totalDistributed  : fmt(totalDist),
        pendingFees       : fmt(pending),
      },
    });
  } catch (err) {
    console.error('[api/sequencer-fees]', err);
    return NextResponse.json({
      data: { totalFeesCollected: '—', totalDistributed: '—', pendingFees: '—' },
    });
  }
}
