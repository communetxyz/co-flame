"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACTS, LIGHTER_ABI, TOKEN_ABI, TIERS } from "@/lib/contracts";
import { toast } from "sonner";
import { formatEther } from "viem";

export default function Claim() {
  const { address } = useAccount();
  const [tokenId, setTokenId] = useState("");
  const [showAllLighters, setShowAllLighters] = useState(false);

  // Get user's lighters
  const { data: nextTokenId } = useReadContract({
    address: CONTRACTS.lighter,
    abi: LIGHTER_ABI,
    functionName: "nextTokenId",
  });

  const tokenIds = nextTokenId ? Array.from({ length: Number(nextTokenId) - 1 }, (_, i) => BigInt(i + 1)) : [];

  const { data: owners } = useReadContracts({
    contracts: tokenIds.map((id) => ({
      address: CONTRACTS.lighter,
      abi: LIGHTER_ABI,
      functionName: "ownerOf" as const,
      args: [id],
    })),
  });

  const myTokenIds = tokenIds.filter((_, i) => {
    const result = owners?.[i];
    return result?.status === "success" && (result.result as string)?.toLowerCase() === address?.toLowerCase();
  });

  // Get detailed info for user's lighters
  const { data: lighterData } = useReadContracts({
    contracts: myTokenIds.flatMap((id) => [
      { address: CONTRACTS.lighter, abi: LIGHTER_ABI, functionName: "lighters" as const, args: [id] },
      { address: CONTRACTS.lighter, abi: LIGHTER_ABI, functionName: "pendingRevenue" as const, args: [id] },
      { address: CONTRACTS.lighter, abi: LIGHTER_ABI, functionName: "isActive" as const, args: [id] },
    ]),
    query: { enabled: myTokenIds.length > 0 },
  });

  // Single lighter query for manual input
  const { data: singlePending } = useReadContract({
    address: CONTRACTS.lighter,
    abi: LIGHTER_ABI,
    functionName: "pendingRevenue",
    args: [BigInt(tokenId || "0")],
    query: { enabled: !!tokenId },
  });

  const { data: singleOwner } = useReadContract({
    address: CONTRACTS.lighter,
    abi: LIGHTER_ABI,
    functionName: "ownerOf",
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

  const { data: tokenBalance } = useReadContract({
    address: CONTRACTS.token,
    abi: TOKEN_ABI,
    functionName: "balanceOf",
    args: [address!],
    query: { enabled: !!address },
  });

  const { writeContract: claimLighter, data: lHash, isPending: lPending } = useWriteContract();
  const { isSuccess: lSuccess } = useWaitForTransactionReceipt({
    hash: lHash,
    onSuccess: () => {
      toast.success("Lighter revenue claimed! 💰");
      setTokenId("");
    },
    onError: () => toast.error("Failed to claim lighter revenue"),
  });

  const { writeContract: claimToken, data: tHash, isPending: tPending } = useWriteContract();
  const { isSuccess: tSuccess } = useWaitForTransactionReceipt({
    hash: tHash,
    onSuccess: () => toast.success("Token rewards claimed! 🎉"),
    onError: () => toast.error("Failed to claim token rewards"),
  });

  const isOwnerOfToken = singleOwner?.toLowerCase() === address?.toLowerCase();
  const tokenEarnedNum = tokenEarned ? Number(formatEther(tokenEarned)) : 0;
  const tokenBalanceNum = tokenBalance ? Number(formatEther(tokenBalance)) : 0;
  const singlePendingNum = singlePending ? Number(formatEther(singlePending)) : 0;

  // Calculate total claimable across all lighters
  let totalClaimable = 0;
  const claimableLighters: Array<{ id: bigint; pending: number; tier: string }> = [];
  
  myTokenIds.forEach((id, i) => {
    const base = i * 3;
    const info = lighterData?.[base]?.status === "success" ? (lighterData[base].result as [number, bigint, bigint, bigint, bigint]) : null;
    const pending = lighterData?.[base + 1]?.status === "success" ? (lighterData[base + 1].result as bigint) : 0n;
    const pendingNum = Number(formatEther(pending));
    
    if (pendingNum > 0) {
      totalClaimable += pendingNum;
      claimableLighters.push({
        id,
        pending: pendingNum,
        tier: info ? TIERS[info[0]].name : "Unknown",
      });
    }
  });

  function claimLighterRevenue(lighterTokenId: bigint) {
    claimLighter({
      address: CONTRACTS.lighter,
      abi: LIGHTER_ABI,
      functionName: "claimRevenue",
      args: [lighterTokenId],
    });
  }

  function claimTokenRewards() {
    claimToken({
      address: CONTRACTS.token,
      abi: TOKEN_ABI,
      functionName: "claimReward",
    });
  }

  if (!address) {
    return (
      <div className="text-center text-zinc-400 py-20">
        Connect your wallet to claim revenue.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">💰 Claim Revenue</h1>
        <p className="text-zinc-400">Claim your earnings from lighters and tokens</p>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <h3 className="text-sm text-zinc-400">Total Lighter Revenue</h3>
          <p className="text-2xl font-bold text-orange-400">{totalClaimable.toFixed(6)} ETH</p>
          <p className="text-xs text-zinc-500">{claimableLighters.length} lighters with rewards</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <h3 className="text-sm text-zinc-400">Token Rewards</h3>
          <p className="text-2xl font-bold text-purple-400">{tokenEarnedNum.toFixed(6)} ETH</p>
          <p className="text-xs text-zinc-500">{tokenBalanceNum.toLocaleString()} CFLAME held</p>
        </div>
      </div>

      {/* Token Rewards */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">🪙 $CFLAME Token Rewards</h2>
          <span className="text-sm text-zinc-500">{tokenBalanceNum.toLocaleString()} tokens</span>
        </div>
        <div className="bg-zinc-800 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-zinc-400">Available to claim:</p>
              <p className="text-xl font-bold text-purple-400">{tokenEarnedNum.toFixed(6)} ETH</p>
            </div>
            {tokenEarnedNum > 0 && (
              <button
                onClick={claimTokenRewards}
                disabled={tPending}
                className="bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-semibold transition"
              >
                {tPending ? "Claiming..." : "Claim"}
              </button>
            )}
          </div>
        </div>
        {tokenEarnedNum === 0 && (
          <p className="text-sm text-zinc-500">
            💡 Token rewards accumulate based on your CFLAME holdings and lighter sales revenue.
          </p>
        )}
      </div>

      {/* Lighter Revenue - Quick Claim */}
      {claimableLighters.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold">🔥 Lighter Revenue (Quick Claim)</h2>
          <div className="space-y-3">
            {claimableLighters.slice(0, showAllLighters ? undefined : 3).map((lighter) => (
              <div key={lighter.id.toString()} className="bg-zinc-800 rounded-lg p-3 flex justify-between items-center">
                <div>
                  <p className="font-medium">Lighter #{lighter.id.toString()}</p>
                  <p className="text-sm text-zinc-400">
                    {lighter.tier} • <span className="text-orange-400 font-semibold">{lighter.pending.toFixed(6)} ETH</span>
                  </p>
                </div>
                <button
                  onClick={() => claimLighterRevenue(lighter.id)}
                  disabled={lPending}
                  className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                >
                  {lPending ? "Claiming..." : "Claim"}
                </button>
              </div>
            ))}
          </div>
          {claimableLighters.length > 3 && (
            <button
              onClick={() => setShowAllLighters(!showAllLighters)}
              className="w-full text-zinc-400 hover:text-white text-sm py-2 transition"
            >
              {showAllLighters ? "Show Less" : `Show All (${claimableLighters.length})`}
            </button>
          )}
        </div>
      )}

      {/* Manual Lighter Claim */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
        <h2 className="text-xl font-semibold">🔍 Claim by Token ID</h2>
        <p className="text-sm text-zinc-500">Manually enter a lighter token ID to claim revenue</p>
        <div className="space-y-3">
          <input
            type="number"
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
            placeholder="Enter lighter token ID"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
          />
          
          {tokenId && singleOwner && (
            <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3">
              {isOwnerOfToken ? (
                <div className="space-y-2">
                  <p className="text-sm text-green-400">✅ You own this lighter</p>
                  <p className="text-zinc-400">
                    Pending revenue: <span className="text-orange-400 font-bold">{singlePendingNum.toFixed(6)} ETH</span>
                  </p>
                </div>
              ) : (
                <p className="text-sm text-red-400">❌ You don't own this lighter</p>
              )}
            </div>
          )}
          
          <button
            onClick={() => claimLighterRevenue(BigInt(tokenId))}
            disabled={!tokenId || !isOwnerOfToken || singlePendingNum === 0 || lPending}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-3 rounded-lg font-semibold transition"
          >
            {lPending ? "Claiming..." : `Claim ${singlePendingNum.toFixed(6)} ETH`}
          </button>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-3">
        <h3 className="font-semibold text-blue-400">💡 How Revenue Works</h3>
        <ul className="text-sm text-zinc-400 space-y-1">
          <li>• <strong>Lighter Revenue:</strong> Earned based on your NFT tier and scan count</li>
          <li>• <strong>Token Rewards:</strong> Pro-rata share of 50% of all lighter sales</li>
          <li>• <strong>Scan Bonus:</strong> More scans = higher revenue multiplier</li>
          <li>• <strong>Active Period:</strong> Lighters earn revenue only during their tier duration</li>
        </ul>
        <div className="pt-2 text-center">
          <a
            href="/my-lighters"
            className="text-orange-400 hover:underline text-sm"
          >
            View My Lighters →
          </a>
        </div>
      </div>
    </div>
  );
}
