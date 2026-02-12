"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { CONTRACTS, FACTORY_ABI, TIERS } from "@/lib/contracts";

export default function Shop() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function buy(tierId: number, price: string) {
    writeContract({
      address: CONTRACTS.factory,
      abi: FACTORY_ABI,
      functionName: "buyLighter",
      args: [tierId],
      value: parseEther(price),
    });
  }

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-center">🛒 Shop Lighters</h1>
      <p className="text-zinc-400 text-center">Connect your wallet and choose a tier.</p>

      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {TIERS.map((tier) => (
          <div key={tier.id} className={`bg-gradient-to-br ${tier.color} rounded-2xl p-[1px]`}>
            <div className="bg-zinc-950 rounded-2xl p-6 space-y-4 h-full flex flex-col">
              <h3 className="text-xl font-bold">{tier.name}</h3>
              <p className="text-3xl font-bold">{tier.price} ETH</p>
              <ul className="text-sm text-zinc-400 space-y-1 flex-1">
                <li>Base share: {tier.base}</li>
                <li>Scan bonus: {tier.bonus}</li>
                <li>Duration: {tier.duration}</li>
              </ul>
              <button
                onClick={() => buy(tier.id, tier.price)}
                disabled={isPending || isConfirming}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-3 rounded-lg font-semibold transition"
              >
                {isPending ? "Confirm in wallet..." : isConfirming ? "Confirming..." : `Buy ${tier.name}`}
              </button>
            </div>
          </div>
        ))}
      </div>

      {isSuccess && (
        <div className="text-center text-green-400 font-semibold">
          ✅ Lighter purchased! Check &quot;My Lighters&quot; to view it.
        </div>
      )}
    </div>
  );
}
