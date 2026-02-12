"use client";

import { useState } from "react";
import { useAccount, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACTS, TOKEN_ABI } from "@/lib/contracts";

export default function Governance() {
  const { address } = useAccount();
  const [desc, setDesc] = useState("");

  const { data: proposalCount } = useReadContract({
    address: CONTRACTS.token,
    abi: TOKEN_ABI,
    functionName: "proposalCount",
  });

  const count = Number(proposalCount || 0);
  const ids = Array.from({ length: count }, (_, i) => BigInt(i + 1));

  const { data: proposalData } = useReadContracts({
    contracts: ids.map((id) => ({
      address: CONTRACTS.token,
      abi: TOKEN_ABI,
      functionName: "proposals" as const,
      args: [id],
    })),
  });

  const { writeContract: propose, data: pHash, isPending: pPending } = useWriteContract();
  const { isSuccess: pSuccess } = useWaitForTransactionReceipt({ hash: pHash });

  const { writeContract: castVote, isPending: vPending } = useWriteContract();

  if (!address) return <div className="text-center text-zinc-400 py-20">Connect your wallet to participate in governance.</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-4xl font-bold text-center">🗳️ Governance</h1>

      {/* Create Proposal */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
        <h2 className="text-xl font-semibold">Create Proposal</h2>
        <p className="text-sm text-zinc-500">Requires 1,000+ CFLAME tokens</p>
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Describe your proposal (design contest, shipping plan, etc.)"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 h-24 resize-none"
        />
        <button
          onClick={() => { propose({ address: CONTRACTS.token, abi: TOKEN_ABI, functionName: "propose", args: [desc] }); setDesc(""); }}
          disabled={!desc || pPending}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-3 rounded-lg font-semibold transition"
        >
          {pPending ? "Submitting..." : "Submit Proposal"}
        </button>
        {pSuccess && <p className="text-green-400">✅ Proposal created!</p>}
      </div>

      {/* Proposals List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Active Proposals</h2>
        {count === 0 ? (
          <p className="text-zinc-500">No proposals yet.</p>
        ) : (
          ids.map((id, i) => {
            const d = proposalData?.[i];
            if (d?.status !== "success") return null;
            const [pId, proposer, description, forVotes, againstVotes, deadline, executed] = d.result as [bigint, string, string, bigint, bigint, bigint, boolean];
            const isActive = BigInt(Math.floor(Date.now() / 1000)) < deadline;

            return (
              <div key={pId.toString()} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">Proposal #{pId.toString()}</h3>
                    <p className="text-sm text-zinc-500 break-all">by {proposer}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${executed ? "bg-blue-900 text-blue-400" : isActive ? "bg-green-900 text-green-400" : "bg-zinc-800 text-zinc-400"}`}>
                    {executed ? "Executed" : isActive ? "Active" : "Ended"}
                  </span>
                </div>
                <p className="text-zinc-300">{description}</p>
                <div className="flex gap-4 text-sm">
                  <span className="text-green-400">For: {(Number(forVotes) / 1e18).toLocaleString()}</span>
                  <span className="text-red-400">Against: {(Number(againstVotes) / 1e18).toLocaleString()}</span>
                </div>
                {isActive && !executed && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => castVote({ address: CONTRACTS.token, abi: TOKEN_ABI, functionName: "vote", args: [id, true] })}
                      disabled={vPending}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-semibold transition"
                    >
                      Vote For
                    </button>
                    <button
                      onClick={() => castVote({ address: CONTRACTS.token, abi: TOKEN_ABI, functionName: "vote", args: [id, false] })}
                      disabled={vPending}
                      className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-semibold transition"
                    >
                      Vote Against
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
