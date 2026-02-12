"use client";

import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACTS, LIGHTER_ABI } from "@/lib/contracts";

export default function Scan() {
  const [tokenId, setTokenId] = useState("");
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function handleScan() {
    if (!tokenId) return;
    writeContract({
      address: CONTRACTS.lighter,
      abi: LIGHTER_ABI,
      functionName: "recordScan",
      args: [BigInt(tokenId)],
    });
  }

  return (
    <div className="max-w-md mx-auto space-y-8">
      <h1 className="text-4xl font-bold text-center">📱 Proof of Possession</h1>
      <p className="text-zinc-400 text-center">
        Scan your lighter to prove you still have it and increase your revenue share.
      </p>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
        <label className="block text-sm text-zinc-400">Lighter Token ID</label>
        <input
          type="number"
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value)}
          placeholder="Enter your lighter ID"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
        />
        <button
          onClick={handleScan}
          disabled={!tokenId || isPending || isConfirming}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-3 rounded-lg font-semibold transition"
        >
          {isPending ? "Confirm in wallet..." : isConfirming ? "Recording..." : "🔥 Record Scan"}
        </button>
        {isSuccess && <p className="text-green-400 text-center">✅ Scan recorded! Your revenue share increased.</p>}
      </div>

      <div className="text-center text-sm text-zinc-500">
        <p>MVP: Click to scan. Future: NFC/QR physical verification.</p>
      </div>
    </div>
  );
}
