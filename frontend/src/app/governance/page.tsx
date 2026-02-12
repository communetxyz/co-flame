"use client";

import { useState } from "react";
import { useAccount, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACTS, TOKEN_ABI } from "@/lib/contracts";
import { formatEther } from "viem";
import { toast } from "sonner";

export default function Governance() {
  const { address } = useAccount();
  const [desc, setDesc] = useState("");

  const { data: balance } = useReadContract({
    address: CONTRACTS.token,
    abi: TOKEN_ABI,
    functionName: "balanceOf",
    args: [address!],
    query: { enabled: !!address },
  });

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
  const { isSuccess: pSuccess } = useWaitForTransactionReceipt({
    hash: pHash,
    onSuccess: () => {
      toast.success("Proposal created successfully! 🗳️");
      setDesc("");
    },
    onError: () => toast.error("Failed to create proposal"),
  });

  const { writeContract: castVote, data: vHash, isPending: vPending } = useWriteContract();
  const { isSuccess: vSuccess } = useWaitForTransactionReceipt({
    hash: vHash,
    onSuccess: () => toast.success("Vote cast successfully! ✅"),
    onError: () => toast.error("Failed to cast vote"),
  });

  const { writeContract: executeProposal, data: eHash, isPending: ePending } = useWriteContract();
  const { isSuccess: eSuccess } = useWaitForTransactionReceipt({
    hash: eHash,
    onSuccess: () => toast.success("Proposal executed successfully! ⚡"),
    onError: () => toast.error("Failed to execute proposal"),
  });

  const balanceNum = balance ? Number(formatEther(balance)) : 0;
  const canPropose = balanceNum >= 1000;

  if (!address) {
    return (
      <div className="text-center text-zinc-400 py-20">
        Connect your wallet to participate in governance.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">🗳️ Governance</h1>
        <p className="text-zinc-400">Participate in Co-Flame decision making</p>
        <div className="text-sm text-zinc-500">
          Your voting power: <span className="text-white font-semibold">{balanceNum.toLocaleString()} CFLAME</span>
        </div>
      </div>

      {/* Create Proposal */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
        <h2 className="text-xl font-semibold">Create Proposal</h2>
        <div className="flex items-center gap-2 text-sm">
          <span className={`px-2 py-1 rounded text-xs ${canPropose ? "bg-green-900 text-green-400" : "bg-red-900 text-red-400"}`}>
            {canPropose ? "Eligible" : "Need 1,000+ CFLAME"}
          </span>
          {!canPropose && (
            <span className="text-zinc-500">
              You have {balanceNum.toLocaleString()} / 1,000 required
            </span>
          )}
        </div>
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Describe your proposal: design contest, manufacturing plan, partnerships, tokenomics changes, etc."
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 h-32 resize-none"
          disabled={!canPropose}
        />
        <button
          onClick={() => propose({ address: CONTRACTS.token, abi: TOKEN_ABI, functionName: "propose", args: [desc] })}
          disabled={!desc || pPending || !canPropose}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-3 rounded-lg font-semibold transition"
        >
          {pPending ? "Submitting..." : "Submit Proposal"}
        </button>
      </div>

      {/* Governance Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{count}</div>
          <div className="text-sm text-zinc-400">Total Proposals</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-orange-400">{balanceNum.toLocaleString()}</div>
          <div className="text-sm text-zinc-400">Your Voting Power</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">3</div>
          <div className="text-sm text-zinc-400">Voting Period (days)</div>
        </div>
      </div>

      {/* Proposals List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          Proposals {count > 0 && <span className="text-zinc-500 text-base font-normal">({count})</span>}
        </h2>
        {count === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center space-y-3">
            <p className="text-zinc-500">No proposals yet.</p>
            <p className="text-sm text-zinc-600">Be the first to create a proposal for Co-Flame!</p>
          </div>
        ) : (
          ids.reverse().map((id, i) => {
            const d = proposalData?.[count - 1 - i];
            if (d?.status !== "success") return null;
            const [pId, proposer, description, forVotes, againstVotes, deadline, executed] = d.result as [bigint, string, string, bigint, bigint, bigint, boolean];
            
            const now = BigInt(Math.floor(Date.now() / 1000));
            const isActive = now < deadline;
            const canExecute = !executed && now >= deadline && forVotes > againstVotes;
            const timeLeft = isActive ? Number(deadline - now) : 0;
            const totalVotes = Number(forVotes) + Number(againstVotes);
            const forPercent = totalVotes > 0 ? (Number(forVotes) / totalVotes) * 100 : 0;

            return (
              <div key={pId.toString()} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">Proposal #{pId.toString()}</h3>
                    <p className="text-sm text-zinc-400">
                      by {proposer.slice(0, 6)}...{proposer.slice(-4)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs px-2 py-1 rounded ${
                      executed ? "bg-blue-900 text-blue-400" : 
                      isActive ? "bg-green-900 text-green-400" : 
                      canExecute ? "bg-yellow-900 text-yellow-400" :
                      "bg-zinc-800 text-zinc-400"
                    }`}>
                      {executed ? "Executed" : isActive ? "Active" : canExecute ? "Passed" : "Ended"}
                    </span>
                    {isActive && (
                      <span className="text-xs text-zinc-500">
                        {timeLeft > 86400 ? `${Math.floor(timeLeft / 86400)}d` : `${Math.floor(timeLeft / 3600)}h`} left
                      </span>
                    )}
                  </div>
                </div>
                
                <p className="text-zinc-300 bg-zinc-800 rounded-lg p-3 text-sm">{description}</p>
                
                {/* Vote Statistics */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-400">For: {(Number(forVotes) / 1e18).toLocaleString()} CFLAME</span>
                    <span className="text-red-400">Against: {(Number(againstVotes) / 1e18).toLocaleString()} CFLAME</span>
                  </div>
                  {totalVotes > 0 && (
                    <div className="w-full bg-zinc-800 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${forPercent}%` }}
                      />
                    </div>
                  )}
                  <div className="text-xs text-zinc-500 text-center">
                    {totalVotes > 0 ? `${forPercent.toFixed(1)}% approval` : "No votes yet"}
                  </div>
                </div>

                {/* Actions */}
                {isActive && !executed && balanceNum > 0 && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => castVote({ address: CONTRACTS.token, abi: TOKEN_ABI, functionName: "vote", args: [pId, true] })}
                      disabled={vPending}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-semibold transition"
                    >
                      👍 Vote For
                    </button>
                    <button
                      onClick={() => castVote({ address: CONTRACTS.token, abi: TOKEN_ABI, functionName: "vote", args: [pId, false] })}
                      disabled={vPending}
                      className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-semibold transition"
                    >
                      👎 Vote Against
                    </button>
                  </div>
                )}

                {canExecute && (
                  <button
                    onClick={() => executeProposal({ address: CONTRACTS.token, abi: TOKEN_ABI, functionName: "executeProposal", args: [pId] })}
                    disabled={ePending}
                    className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-semibold transition"
                  >
                    {ePending ? "Executing..." : "⚡ Execute Proposal"}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Governance Info */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-3">
        <h3 className="font-semibold text-orange-400">💡 How Governance Works</h3>
        <ul className="text-sm text-zinc-400 space-y-1">
          <li>• <strong>Proposal Threshold:</strong> 1,000 CFLAME minimum to create proposals</li>
          <li>• <strong>Voting Period:</strong> 3 days from proposal creation</li>
          <li>• <strong>Voting Power:</strong> 1 CFLAME = 1 vote</li>
          <li>• <strong>Execution:</strong> Anyone can execute passed proposals after voting ends</li>
          <li>• <strong>Proposal Types:</strong> Design contests, manufacturing plans, partnerships, etc.</li>
        </ul>
      </div>
    </div>
  );
}
