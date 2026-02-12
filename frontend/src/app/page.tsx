import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="text-center py-20 space-y-6">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-orange-400 via-red-500 to-purple-600 bg-clip-text text-transparent">
          🔥 Co-Flame
        </h1>
        <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
          The world&apos;s first cooperatively owned smart lighter brand. Buy a lighter, get an NFT,
          prove you still have it, and earn revenue share.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/shop" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold transition">
            Shop Lighters
          </Link>
          <Link href="/token" className="border border-zinc-700 hover:border-zinc-500 px-8 py-3 rounded-lg font-semibold transition">
            $CFLAME Token
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="space-y-8">
        <h2 className="text-3xl font-bold text-center">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { emoji: "🛒", title: "Buy a Lighter", desc: "Choose from 3 tiers — Cypherpunk, DeGen, or Oracle" },
            { emoji: "🎫", title: "Get Your NFT", desc: "Each lighter comes with an on-chain NFT proving ownership" },
            { emoji: "📱", title: "Prove Possession", desc: "Periodic NFC/QR scans to prove you still have your lighter" },
            { emoji: "💰", title: "Earn Revenue", desc: "Each scan increases your revenue share — keep it, don't waste it" },
          ].map((step) => (
            <div key={step.title} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center space-y-3">
              <div className="text-4xl">{step.emoji}</div>
              <h3 className="font-semibold text-lg">{step.title}</h3>
              <p className="text-sm text-zinc-400">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Anti-waste mission */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center space-y-4">
        <h2 className="text-3xl font-bold">♻️ Anti-Waste Mission</h2>
        <p className="text-zinc-400 max-w-2xl mx-auto">
          Billions of disposable lighters end up in landfills every year. Co-Flame incentivizes keeping your lighter
          through proof-of-possession rewards. The longer you hold it, the more you earn.
        </p>
      </section>

      {/* Tier preview */}
      <section className="space-y-8">
        <h2 className="text-3xl font-bold text-center">Lighter Tiers</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: "Cypherpunk", price: "0.0005 ETH", base: "3%", bonus: "+0.5%/scan", days: "90", gradient: "from-green-500 to-emerald-700" },
            { name: "DeGen", price: "0.0015 ETH", base: "8%", bonus: "+1%/scan", days: "120", gradient: "from-purple-500 to-indigo-700" },
            { name: "Oracle", price: "0.005 ETH", base: "15%", bonus: "+1.5%/scan", days: "180", gradient: "from-orange-500 to-red-700" },
          ].map((tier) => (
            <div key={tier.name} className={`bg-gradient-to-br ${tier.gradient} rounded-2xl p-[1px]`}>
              <div className="bg-zinc-950 rounded-2xl p-6 space-y-4 h-full">
                <h3 className="text-xl font-bold">{tier.name}</h3>
                <p className="text-3xl font-bold">{tier.price}</p>
                <ul className="text-sm text-zinc-400 space-y-1">
                  <li>Base revenue share: {tier.base}</li>
                  <li>Scan bonus: {tier.bonus}</li>
                  <li>Active for {tier.days} days</li>
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
