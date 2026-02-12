"use client";

import { useAccount, useReadContract } from "wagmi";
import { CONTRACTS, TOKEN_ABI } from "@/lib/contracts";
import { formatEther } from "viem";

export default function Token() {
  const { address } = useAccount();

  const { data: balance } = useReadContract({
    address: CONTRACTS.token,
    abi: TOKEN_ABI,
    functionName: "balanceOf",
    args: [address!],
    query: { enabled: !!address },
  });

  const { data: totalProfit } = useReadContract({
    address: CONTRACTS.token,
    abi: TOKEN_ABI,
    functionName: "totalProfitDeposited",
  });

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-4xl font-bold text-center">🪙 $CFLAME Token</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-2">
          <h3 className="text-sm text-zinc-400">Total Supply</h3>
          <p className="text-2xl font-bold">100,000,000 CFLAME</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-2">
          <h3 className="text-sm text-zinc-400">Total Profit Deposited</h3>
          <p className="text-2xl font-bold text-orange-400">{totalProfit ? formatEther(totalProfit as bigint) : "0"} ETH</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-2">
          <h3 className="text-sm text-zinc-400">Your Balance</h3>
          <p className="text-2xl font-bold">{balance ? Number(formatEther(balance as bigint)).toLocaleString() : "—"} CFLAME</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-2">
          <h3 className="text-sm text-zinc-400">Profit Share</h3>
          <p className="text-2xl font-bold text-purple-400">50% to holders</p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
        <h2 className="text-2xl font-bold">Tokenomics</h2>
        <ul className="space-y-2 text-zinc-400">
          <li>• <span className="text-white">100M total supply</span> — fixed, no inflation</li>
          <li>• <span className="text-white">50% of all lighter sales</span> deposited as profit for token holders</li>
          <li>• <span className="text-white">Pro-rata distribution</span> — earn based on your % of supply held</li>
          <li>• <span className="text-white">Governance rights</span> — propose and vote on design, manufacturing, shipping</li>
          <li>• <span className="text-white">Revenue on transfer</span> — rewards auto-update when tokens move</li>
        </ul>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
        <h2 className="text-2xl font-bold">Contract</h2>
        <p className="text-zinc-400 break-all font-mono text-sm">{CONTRACTS.token}</p>
        <a
          href={`https://sepolia.etherscan.io/address/${CONTRACTS.token}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-orange-400 hover:underline text-sm"
        >
          View on Etherscan ↗
        </a>
      </div>
    </div>
  );
}
