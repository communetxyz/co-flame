"use client";

import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { CONTRACTS, LIGHTER_ABI, TIERS } from "@/lib/contracts";

export default function MyLighters() {
  const { address } = useAccount();
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
    ]),
  });

  if (!address) {
    return <div className="text-center text-zinc-400 py-20">Connect your wallet to view your lighters.</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-center">🔥 My Lighters</h1>

      {myTokenIds.length === 0 ? (
        <p className="text-center text-zinc-400">No lighters yet. Visit the shop!</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myTokenIds.map((tokenId, i) => {
            const base = i * 4;
            const info = lighterData?.[base]?.status === "success" ? (lighterData[base].result as [number, bigint, bigint, bigint, bigint]) : null;
            const bps = lighterData?.[base + 1]?.status === "success" ? (lighterData[base + 1].result as bigint) : 0n;
            const pending = lighterData?.[base + 2]?.status === "success" ? (lighterData[base + 2].result as bigint) : 0n;
            const active = lighterData?.[base + 3]?.status === "success" ? (lighterData[base + 3].result as boolean) : false;

            const tier = info ? TIERS[info[0]] : null;

            return (
              <div key={tokenId.toString()} className={`bg-gradient-to-br ${tier?.color || "from-zinc-600 to-zinc-800"} rounded-2xl p-[1px]`}>
                <div className="bg-zinc-950 rounded-2xl p-6 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg">#{tokenId.toString()}</h3>
                    <span className={`text-xs px-2 py-1 rounded ${active ? "bg-green-900 text-green-400" : "bg-red-900 text-red-400"}`}>
                      {active ? "Active" : "Expired"}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400">Tier: <span className="text-white font-semibold">{tier?.name || "Unknown"}</span></p>
                  {info && (
                    <>
                      <p className="text-sm text-zinc-400">Scans: <span className="text-white">{info[2].toString()}</span></p>
                      <p className="text-sm text-zinc-400">Revenue Share: <span className="text-white">{Number(bps) / 100}%</span></p>
                      <p className="text-sm text-zinc-400">Pending: <span className="text-orange-400 font-semibold">{(Number(pending) / 1e18).toFixed(6)} ETH</span></p>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
