"use client";

import { useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { CONTRACTS, FACTORY_ABI, TIERS } from "@/lib/contracts";
import { toast } from "sonner";

export default function Shop() {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, error } = useWaitForTransactionReceipt({ hash });

  // Handle purchase success/error
  useEffect(() => {
    if (isSuccess) {
      toast.success("Lighter purchased successfully! 🔥", {
        description: "Check 'My Lighters' to view your new NFT",
        action: {
          label: "View My Lighters",
          onClick: () => window.location.href = "/my-lighters",
        },
      });
    }
  }, [isSuccess]);

  useEffect(() => {
    if (error) toast.error("Failed to purchase lighter");
  }, [error]);

  const { data: balance } = useReadContract({
    address: "0x0000000000000000000000000000000000000000", // Native ETH
    abi: [],
    functionName: "balanceOf",
    args: [address!],
    query: { enabled: false }, // We'll use a different approach for ETH balance
  });

  function buy(tierId: number, price: string) {
    writeContract({
      address: CONTRACTS.factory,
      abi: FACTORY_ABI,
      functionName: "buyLighter",
      args: [tierId],
      value: parseEther(price),
    });
  }

  if (!address) {
    return (
      <div className="text-center py-20 space-y-4">
        <h1 className="text-4xl font-bold">🛒 Shop Lighters</h1>
        <p className="text-zinc-400">Connect your wallet to purchase lighters.</p>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md mx-auto">
          <p className="text-sm text-zinc-500">
            Connect your wallet to start earning revenue share through cooperative ownership!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">🛒 Shop Lighters</h1>
        <p className="text-zinc-400">Choose a tier and start earning revenue share!</p>
      </div>

      {/* How it works banner */}
      <div className="bg-gradient-to-r from-orange-900/20 to-red-900/20 border border-orange-700/30 rounded-xl p-6 max-w-4xl mx-auto">
        <h3 className="font-semibold text-orange-400 mb-2">🔄 How It Works</h3>
        <div className="grid md:grid-cols-4 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span>1️⃣</span>
            <span className="text-zinc-400">Buy a lighter NFT</span>
          </div>
          <div className="flex items-center gap-2">
            <span>2️⃣</span>
            <span className="text-zinc-400">Scan to prove possession</span>
          </div>
          <div className="flex items-center gap-2">
            <span>3️⃣</span>
            <span className="text-zinc-400">Earn revenue share</span>
          </div>
          <div className="flex items-center gap-2">
            <span>4️⃣</span>
            <span className="text-zinc-400">More scans = more revenue</span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {TIERS.map((tier) => (
          <div key={tier.id} className={`bg-gradient-to-br ${tier.color} rounded-2xl p-[1px] transform hover:scale-[1.02] transition-transform`}>
            <div className="bg-zinc-950 rounded-2xl p-6 space-y-4 h-full flex flex-col">
              <div className="text-center">
                <h3 className="text-xl font-bold mb-1">{tier.name}</h3>
                <p className="text-3xl font-bold text-orange-400">{tier.price} ETH</p>
                <p className="text-xs text-zinc-500 mt-1">≈ $1-5 USD</p>
              </div>
              
              <div className="space-y-3 flex-1">
                <div className="bg-zinc-900 rounded-lg p-3 space-y-2">
                  <h4 className="text-sm font-semibold text-zinc-300">Revenue Share</h4>
                  <div className="text-sm text-zinc-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Base rate:</span>
                      <span className="text-blue-400 font-semibold">{tier.base}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Per scan:</span>
                      <span className="text-green-400 font-semibold">{tier.bonus}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span className="text-purple-400 font-semibold">{tier.duration}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-xs text-zinc-500 space-y-1">
                  <p>• 50% of purchase goes to lighter holders</p>
                  <p>• 50% goes to $CFLAME token holders</p>
                  <p>• More scans = higher revenue multiplier</p>
                </div>
              </div>
              
              <button
                onClick={() => buy(tier.id, tier.price)}
                disabled={isPending || isConfirming}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                {isPending 
                  ? "Confirm in wallet..." 
                  : isConfirming 
                  ? "Minting..." 
                  : `Buy ${tier.name} 🔥`
                }
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Calculator */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-4xl mx-auto">
        <h3 className="font-semibold text-blue-400 mb-4">💰 Revenue Example</h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="space-y-2">
            <h4 className="font-medium">Cypherpunk ($1)</h4>
            <p className="text-zinc-400">Base: 3% share</p>
            <p className="text-zinc-400">After 10 scans: 8% share</p>
            <p className="text-green-400">Potential: $0.08/ETH profit pool</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">DeGen ($3)</h4>
            <p className="text-zinc-400">Base: 8% share</p>
            <p className="text-zinc-400">After 10 scans: 18% share</p>
            <p className="text-green-400">Potential: $0.18/ETH profit pool</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">Oracle ($5)</h4>
            <p className="text-zinc-400">Base: 15% share</p>
            <p className="text-zinc-400">After 10 scans: 30% share</p>
            <p className="text-green-400">Potential: $0.30/ETH profit pool</p>
          </div>
        </div>
        <p className="text-xs text-zinc-600 mt-3 text-center">
          * Example assumes 1 ETH in the profit pool. Actual returns depend on total sales and your scan frequency.
        </p>
      </div>

      {/* CTA */}
      <div className="text-center space-y-4">
        <p className="text-zinc-500 text-sm">
          Need $CFLAME tokens? They're earned through lighter sales or available on secondary markets.
        </p>
        <div className="flex justify-center gap-4">
          <a
            href="/token"
            className="text-orange-400 hover:underline text-sm"
          >
            Learn about $CFLAME →
          </a>
          <a
            href="/governance"
            className="text-purple-400 hover:underline text-sm"
          >
            Participate in Governance →
          </a>
        </div>
      </div>
    </div>
  );
}
