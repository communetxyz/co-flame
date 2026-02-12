"use client";

import { useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACTS, LIGHTER_ABI, TOKEN_ABI } from "@/lib/contracts";

export default function Claim() {
  const { address } = useAccount();
  const [tokenId, setTokenId] = useState("");

  // Lighter revenue claim
  const { data: pending } = useReadContract({
    address: CONTRACTS.lighter,
    abi: LIGHTER_ABI,
    functionName: "pendingRevenue",
    args: [BigInt(tokenId || "0")],
    query: { enabled: !!tokenId },
  });

  // Token reward
  const { data: tokenEarned } = useReadContract({
    address: CONTRACTS.token,
    abi: TOKEN_ABI,
    functionName: "earned",
    args: [address!],
    query: { enabled: !!address },
  });

  const { writeContract: claimLighter, data: lHash, isPending: lPending } = useWriteContract();
  const { isSuccess: lSuccess } = useWaitForTransactionReceipt({ hash: lHash });

  const { writeContract: claimToken, data: tHash, isPending: tPending } = useWriteContract();
  const { isSuccess: tSuccess } = useWaitForTransactionReceipt({ hash: tHash });

  if (!address) return <div className="text-center text-zinc-400 py-20">Connect your wallet to claim revenue.</div>;

  return (
    <div className="max-w-lg mx-auto space-y-8">
      <h1 className="text-4xl font-bold text-center">💰 Claim Revenue</h1>

      {/* Lighter revenue */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
        <h2 className="text-xl font-semibold">Lighter Revenue</h2>
        <input
          type="number"
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value)}
          placeholder="Lighter Token ID"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
        />
        {pending !== undefined && (
          <p className="text-zinc-400">Pending: <span className="text-orange-400 font-bold">{(Number(pending) / 1e18).toFixed(6)} ETH</span></p>
        )}
        <button
          onClick={() => claimLighter({ address: CONTRACTS.lighter, abi: LIGHTER_ABI, functionName: "claimRevenue", args: [BigInt(tokenId)] })}
          disabled={!tokenId || lPending}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-3 rounded-lg font-semibold transition"
        >
          {lPending ? "Claiming..." : "Claim Lighter Revenue"}
        </button>
        {lSuccess && <p className="text-green-400">✅ Lighter revenue claimed!</p>}
      </div>

      {/* Token rewards */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
        <h2 className="text-xl font-semibold">$CFLAME Token Rewards</h2>
        <p className="text-zinc-400">
          Earned: <span className="text-orange-400 font-bold">{tokenEarned ? (Number(tokenEarned) / 1e18).toFixed(6) : "0"} ETH</span>
        </p>
        <button
          onClick={() => claimToken({ address: CONTRACTS.token, abi: TOKEN_ABI, functionName: "claimReward" })}
          disabled={tPending}
          className="w-full bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white py-3 rounded-lg font-semibold transition"
        >
          {tPending ? "Claiming..." : "Claim Token Rewards"}
        </button>
        {tSuccess && <p className="text-green-400">✅ Token rewards claimed!</p>}
      </div>
    </div>
  );
}
