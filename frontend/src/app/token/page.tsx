"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACTS, TOKEN_ABI } from "@/lib/contracts";
import { formatEther, parseEther, isAddress } from "viem";
import { toast } from "sonner";

export default function Token() {
  const { address } = useAccount();
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [showTransfer, setShowTransfer] = useState(false);

  const { data: balance } = useReadContract({
    address: CONTRACTS.token,
    abi: TOKEN_ABI,
    functionName: "balanceOf",
    args: [address!],
    query: { enabled: !!address },
  });

  const { data: earned } = useReadContract({
    address: CONTRACTS.token,
    abi: TOKEN_ABI,
    functionName: "earned",
    args: [address!],
    query: { enabled: !!address },
  });

  const { data: totalSupply } = useReadContract({
    address: CONTRACTS.token,
    abi: TOKEN_ABI,
    functionName: "totalSupply",
  });

  const { data: totalProfit } = useReadContract({
    address: CONTRACTS.token,
    abi: TOKEN_ABI,
    functionName: "totalProfitDeposited",
  });

  const { writeContract: claimReward, data: claimHash, isPending: claimPending } = useWriteContract();
  const { isSuccess: claimSuccess, error: claimError } = useWaitForTransactionReceipt({ hash: claimHash });

  const { writeContract: transferTokens, data: transferHash, isPending: transferPending } = useWriteContract();
  const { isSuccess: transferSuccess, error: transferError } = useWaitForTransactionReceipt({ hash: transferHash });

  // Handle claim success/error
  useEffect(() => {
    if (claimSuccess) toast.success("Rewards claimed successfully! 💰");
  }, [claimSuccess]);

  useEffect(() => {
    if (claimError) toast.error("Failed to claim rewards");
  }, [claimError]);

  // Handle transfer success/error
  useEffect(() => {
    if (transferSuccess) {
      toast.success("Tokens transferred successfully! 🎁");
      setTransferTo("");
      setTransferAmount("");
      setShowTransfer(false);
    }
  }, [transferSuccess]);

  useEffect(() => {
    if (transferError) toast.error("Failed to transfer tokens");
  }, [transferError]);

  const balanceNum = balance ? Number(formatEther(balance)) : 0;
  const earnedNum = earned ? Number(formatEther(earned)) : 0;
  const totalSupplyNum = totalSupply ? Number(formatEther(totalSupply)) : 100_000_000;
  const ownershipPercent = balanceNum > 0 ? (balanceNum / totalSupplyNum) * 100 : 0;

  function handleClaim() {
    claimReward({
      address: CONTRACTS.token,
      abi: TOKEN_ABI,
      functionName: "claimReward",
    });
  }

  function handleTransfer() {
    if (!transferTo || !transferAmount || !isAddress(transferTo)) {
      toast.error("Invalid address or amount");
      return;
    }
    const amount = parseEther(transferAmount);
    if (!balance || amount > balance) {
      toast.error("Insufficient balance");
      return;
    }
    transferTokens({
      address: CONTRACTS.token,
      abi: TOKEN_ABI,
      functionName: "transfer",
      args: [transferTo, amount],
    });
  }

  if (!address) {
    return (
      <div className="text-center text-zinc-400 py-20">
        Connect your wallet to view token information.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">🪙 $CFLAME Token</h1>
        <p className="text-zinc-400">Governance and revenue-sharing token</p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-2">
          <h3 className="text-sm text-zinc-400">Your Balance</h3>
          <p className="text-2xl font-bold">{balanceNum.toLocaleString()} CFLAME</p>
          <p className="text-xs text-zinc-500">
            {ownershipPercent > 0 && `${ownershipPercent.toFixed(4)}% of total supply`}
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-2">
          <h3 className="text-sm text-zinc-400">Earned Rewards</h3>
          <p className="text-2xl font-bold text-orange-400">{earnedNum.toFixed(6)} ETH</p>
          {earnedNum > 0 && (
            <button
              onClick={handleClaim}
              disabled={claimPending}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-2 px-4 rounded-lg text-sm font-semibold transition mt-2"
            >
              {claimPending ? "Claiming..." : "Claim Rewards"}
            </button>
          )}
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-2">
          <h3 className="text-sm text-zinc-400">Total Supply</h3>
          <p className="text-2xl font-bold">{totalSupplyNum.toLocaleString()} CFLAME</p>
          <p className="text-xs text-zinc-500">Fixed supply, no inflation</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-2">
          <h3 className="text-sm text-zinc-400">Total Profit Pool</h3>
          <p className="text-2xl font-bold text-purple-400">{totalProfit ? formatEther(totalProfit) : "0"} ETH</p>
          <p className="text-xs text-zinc-500">50% of lighter sales</p>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
        <h2 className="text-xl font-bold">Token Actions</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setShowTransfer(!showTransfer)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-semibold transition"
          >
            🎁 Transfer Tokens
          </button>
          <a
            href="/governance"
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-semibold transition text-center"
          >
            🗳️ Governance
          </a>
        </div>

        {/* Transfer Form */}
        {showTransfer && (
          <div className="border-t border-zinc-700 pt-4 space-y-3">
            <h3 className="font-semibold">Transfer CFLAME Tokens</h3>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Recipient address (0x...)"
                value={transferTo}
                onChange={(e) => setTransferTo(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white focus:outline-none focus:border-orange-500"
              />
              <input
                type="number"
                placeholder="Amount (CFLAME)"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white focus:outline-none focus:border-orange-500"
              />
              <p className="text-xs text-zinc-500">
                Available: {balanceNum.toLocaleString()} CFLAME
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleTransfer}
                disabled={!transferTo || !transferAmount || transferPending || !isAddress(transferTo)}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 px-3 rounded font-medium transition"
              >
                {transferPending ? "Transferring..." : "Transfer"}
              </button>
              <button
                onClick={() => setShowTransfer(false)}
                className="flex-1 bg-zinc-600 hover:bg-zinc-500 text-white py-2 px-3 rounded font-medium transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tokenomics */}
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

      {/* Contract Info */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
        <h2 className="text-xl font-bold">Contract Information</h2>
        <div className="space-y-2">
          <p className="text-zinc-400 text-sm">Contract Address:</p>
          <p className="font-mono text-sm break-all">{CONTRACTS.token}</p>
          <div className="flex gap-4">
            <a
              href={`https://sepolia.etherscan.io/address/${CONTRACTS.token}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-400 hover:underline text-sm"
            >
              View on Etherscan ↗
            </a>
            <a
              href={`https://sepolia.etherscan.io/token/${CONTRACTS.token}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-400 hover:underline text-sm"
            >
              Token Info ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
