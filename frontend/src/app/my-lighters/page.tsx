"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACTS, LIGHTER_ABI, TIERS } from "@/lib/contracts";
import { isAddress } from "viem";
import { toast } from "sonner";

export default function MyLighters() {
  const { address } = useAccount();
  const [transferTo, setTransferTo] = useState<{ [key: string]: string }>({});
  const [showTransfer, setShowTransfer] = useState<{ [key: string]: boolean }>({});

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

  const { data: lighterData } = useReadContracts({
    contracts: myTokenIds.flatMap((id) => [
      { address: CONTRACTS.lighter, abi: LIGHTER_ABI, functionName: "lighters" as const, args: [id] },
      { address: CONTRACTS.lighter, abi: LIGHTER_ABI, functionName: "revenueShareBps" as const, args: [id] },
      { address: CONTRACTS.lighter, abi: LIGHTER_ABI, functionName: "pendingRevenue" as const, args: [id] },
      { address: CONTRACTS.lighter, abi: LIGHTER_ABI, functionName: "isActive" as const, args: [id] },
      { address: CONTRACTS.lighter, abi: LIGHTER_ABI, functionName: "tokenURI" as const, args: [id] },
    ]),
  });

  const { writeContract: claimRevenue, data: claimHash, isPending: claimPending } = useWriteContract();
  const { isSuccess: claimSuccess, error: claimError } = useWaitForTransactionReceipt({ hash: claimHash });

  const { writeContract: transferNFT, data: transferHash, isPending: transferPending } = useWriteContract();
  const { isSuccess: transferSuccess, error: transferError } = useWaitForTransactionReceipt({ hash: transferHash });

  // Handle claim success/error
  useEffect(() => {
    if (claimSuccess) toast.success("Revenue claimed successfully! 💰");
  }, [claimSuccess]);

  useEffect(() => {
    if (claimError) toast.error("Failed to claim revenue");
  }, [claimError]);

  // Handle transfer success/error
  useEffect(() => {
    if (transferSuccess) {
      toast.success("NFT transferred successfully! 🎁");
      setShowTransfer({});
      setTransferTo({});
    }
  }, [transferSuccess]);

  useEffect(() => {
    if (transferError) toast.error("Failed to transfer NFT");
  }, [transferError]);

  function handleClaim(tokenId: bigint) {
    claimRevenue({
      address: CONTRACTS.lighter,
      abi: LIGHTER_ABI,
      functionName: "claimRevenue",
      args: [tokenId],
    });
  }

  function handleTransfer(tokenId: bigint, to: string) {
    if (!isAddress(to)) {
      toast.error("Invalid address");
      return;
    }
    transferNFT({
      address: CONTRACTS.lighter,
      abi: LIGHTER_ABI,
      functionName: "safeTransferFrom",
      args: [address!, to, tokenId],
    });
  }

  if (!address) {
    return <div className="text-center text-zinc-400 py-20">Connect your wallet to view your lighters.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">🔥 My Lighters</h1>
        <p className="text-zinc-400">Manage your lighter NFTs and claim revenue</p>
      </div>

      {myTokenIds.length === 0 ? (
        <div className="text-center space-y-4">
          <p className="text-zinc-400">No lighters yet. Visit the shop!</p>
          <a
            href="/shop"
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold transition"
          >
            Buy Your First Lighter 🛒
          </a>
        </div>
      ) : (
        <>
          <div className="text-center text-sm text-zinc-400">
            You own {myTokenIds.length} lighter{myTokenIds.length !== 1 ? "s" : ""}
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myTokenIds.map((tokenId, i) => {
              const base = i * 5;
              const info = lighterData?.[base]?.status === "success" ? (lighterData[base].result as [number, bigint, bigint, bigint, bigint]) : null;
              const bps = lighterData?.[base + 1]?.status === "success" ? (lighterData[base + 1].result as bigint) : 0n;
              const pending = lighterData?.[base + 2]?.status === "success" ? (lighterData[base + 2].result as bigint) : 0n;
              const active = lighterData?.[base + 3]?.status === "success" ? (lighterData[base + 3].result as boolean) : false;
              const tokenURI = lighterData?.[base + 4]?.status === "success" ? (lighterData[base + 4].result as string) : null;

              const tier = info ? TIERS[info[0]] : null;
              const tokenIdStr = tokenId.toString();
              const hasPendingReward = Number(pending) > 0;

              return (
                <div key={tokenIdStr} className={`bg-gradient-to-br ${tier?.color || "from-zinc-600 to-zinc-800"} rounded-2xl p-[1px]`}>
                  <div className="bg-zinc-950 rounded-2xl p-6 space-y-4">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg">Lighter #{tokenIdStr}</h3>
                        <p className="text-sm text-zinc-400">{tier?.name || "Unknown"} Tier</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${active ? "bg-green-900 text-green-400" : "bg-red-900 text-red-400"}`}>
                        {active ? "Active" : "Expired"}
                      </span>
                    </div>

                    {/* Stats */}
                    {info && (
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-zinc-500">Scans:</span>
                          <div className="font-semibold">{info[2].toString()}</div>
                        </div>
                        <div>
                          <span className="text-zinc-500">Rev Share:</span>
                          <div className="font-semibold text-blue-400">{Number(bps) / 100}%</div>
                        </div>
                        <div className="col-span-2">
                          <span className="text-zinc-500">Pending Revenue:</span>
                          <div className={`font-semibold ${hasPendingReward ? "text-orange-400" : "text-zinc-600"}`}>
                            {(Number(pending) / 1e18).toFixed(6)} ETH
                          </div>
                        </div>
                        <div className="col-span-2 text-xs text-zinc-500">
                          Minted: {new Date(Number(info[1]) * 1000).toLocaleDateString()}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="space-y-2">
                      {hasPendingReward && (
                        <button
                          onClick={() => handleClaim(tokenId)}
                          disabled={claimPending}
                          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-2 px-4 rounded-lg text-sm font-semibold transition"
                        >
                          {claimPending ? "Claiming..." : `Claim ${(Number(pending) / 1e18).toFixed(4)} ETH`}
                        </button>
                      )}

                      <div className="flex gap-2">
                        <a
                          href={`/scan?tokenId=${tokenIdStr}`}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-xs font-medium text-center transition"
                        >
                          📱 Scan
                        </a>
                        <button
                          onClick={() => setShowTransfer(prev => ({ ...prev, [tokenIdStr]: !prev[tokenIdStr] }))}
                          className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white py-2 px-3 rounded text-xs font-medium transition"
                        >
                          🎁 Gift
                        </button>
                      </div>
                    </div>

                    {/* Transfer Form */}
                    {showTransfer[tokenIdStr] && (
                      <div className="border-t border-zinc-800 pt-4 space-y-2">
                        <input
                          type="text"
                          placeholder="Recipient address (0x...)"
                          value={transferTo[tokenIdStr] || ""}
                          onChange={(e) => setTransferTo(prev => ({ ...prev, [tokenIdStr]: e.target.value }))}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleTransfer(tokenId, transferTo[tokenIdStr] || "")}
                            disabled={!transferTo[tokenIdStr] || transferPending || !isAddress(transferTo[tokenIdStr] || "")}
                            className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-1.5 px-3 rounded text-xs font-medium transition"
                          >
                            {transferPending ? "Sending..." : "Transfer"}
                          </button>
                          <button
                            onClick={() => setShowTransfer(prev => ({ ...prev, [tokenIdStr]: false }))}
                            className="flex-1 bg-zinc-600 hover:bg-zinc-500 text-white py-1.5 px-3 rounded text-xs font-medium transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
