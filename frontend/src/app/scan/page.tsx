"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACTS, LIGHTER_ABI, TIERS } from "@/lib/contracts";
import { toast } from "sonner";
import QRCode from "qrcode";
import { useSearchParams } from "next/navigation";

export default function Scan() {
  const { address } = useAccount();
  const searchParams = useSearchParams();
  const [tokenId, setTokenId] = useState(searchParams.get("tokenId") || "");
  const [showQR, setShowQR] = useState(false);
  const qrRef = useRef<HTMLCanvasElement>(null);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    onSuccess: () => {
      toast.success("Scan recorded! Revenue share increased! 📈");
      setTokenId("");
      setShowQR(false);
    },
    onError: () => toast.error("Failed to record scan"),
  });

  // Check if user owns the token
  const { data: owner } = useReadContract({
    address: CONTRACTS.lighter,
    abi: LIGHTER_ABI,
    functionName: "ownerOf",
    args: [BigInt(tokenId || "0")],
    query: { enabled: !!tokenId && tokenId !== "0" },
  });

  const { data: lighterData } = useReadContract({
    address: CONTRACTS.lighter,
    abi: LIGHTER_ABI,
    functionName: "lighters",
    args: [BigInt(tokenId || "0")],
    query: { enabled: !!tokenId && tokenId !== "0" },
  });

  const { data: isActive } = useReadContract({
    address: CONTRACTS.lighter,
    abi: LIGHTER_ABI,
    functionName: "isActive",
    args: [BigInt(tokenId || "0")],
    query: { enabled: !!tokenId && tokenId !== "0" },
  });

  const isOwner = owner?.toLowerCase() === address?.toLowerCase();
  const info = lighterData as [number, bigint, bigint, bigint, bigint] | undefined;
  const tier = info ? TIERS[info[0]] : null;

  // Generate QR code when tokenId changes
  useEffect(() => {
    if (tokenId && qrRef.current) {
      const scanUrl = `${window.location.origin}/scan?tokenId=${tokenId}&verify=true`;
      QRCode.toCanvas(qrRef.current, scanUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: "#ffffff",
          light: "#09090b"
        }
      }).catch(console.error);
    }
  }, [tokenId]);

  function handleScan() {
    if (!tokenId || !isOwner) return;
    
    writeContract({
      address: CONTRACTS.lighter,
      abi: LIGHTER_ABI,
      functionName: "recordScan",
      args: [BigInt(tokenId)],
    });
  }

  function generateQR() {
    if (!tokenId || !isOwner) return;
    setShowQR(true);
  }

  if (!address) {
    return (
      <div className="text-center text-zinc-400 py-20">
        Connect your wallet to scan your lighters.
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">📱 Proof of Possession</h1>
        <p className="text-zinc-400">
          Scan your lighter to prove you still have it and increase your revenue share.
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
        <label className="block text-sm text-zinc-400">Lighter Token ID</label>
        <input
          type="number"
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value)}
          placeholder="Enter your lighter ID"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
        />

        {/* Lighter Info */}
        {tokenId && info && (
          <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Lighter #{tokenId}</h3>
              <span className={`text-xs px-2 py-1 rounded ${isActive ? "bg-green-900 text-green-400" : "bg-red-900 text-red-400"}`}>
                {isActive ? "Active" : "Expired"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-zinc-500">Tier:</span> {tier?.name}
              </div>
              <div>
                <span className="text-zinc-500">Scans:</span> {info[2].toString()}
              </div>
              <div>
                <span className="text-zinc-500">Owner:</span> {isOwner ? "You" : "Not yours"}
              </div>
              <div>
                <span className="text-zinc-500">Status:</span> {isActive ? "Active" : "Expired"}
              </div>
            </div>
          </div>
        )}

        {/* Error Messages */}
        {tokenId && owner && !isOwner && (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-3 text-red-400 text-sm">
            ❌ You don't own this lighter
          </div>
        )}

        {tokenId && isOwner && !isActive && (
          <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3 text-yellow-400 text-sm">
            ⚠️ This lighter has expired and cannot earn more scans
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleScan}
            disabled={!tokenId || !isOwner || !isActive || isPending || isConfirming}
            className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-3 rounded-lg font-semibold transition"
          >
            {isPending ? "Confirm in wallet..." : isConfirming ? "Recording..." : "🔥 Record Scan"}
          </button>
          <button
            onClick={generateQR}
            disabled={!tokenId || !isOwner}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-3 rounded-lg font-semibold transition"
          >
            📱 QR
          </button>
        </div>

        {/* QR Code */}
        {showQR && tokenId && isOwner && (
          <div className="border-t border-zinc-700 pt-4 space-y-3">
            <h3 className="text-center font-semibold">QR Code for Lighter #{tokenId}</h3>
            <div className="flex justify-center">
              <canvas
                ref={qrRef}
                className="border border-zinc-700 rounded-lg"
              />
            </div>
            <p className="text-xs text-zinc-500 text-center">
              Future: Physical QR codes on lighters for instant verification
            </p>
            <button
              onClick={() => setShowQR(false)}
              className="w-full bg-zinc-700 hover:bg-zinc-600 text-white py-2 rounded-lg text-sm transition"
            >
              Hide QR Code
            </button>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-3">
        <h3 className="font-semibold text-orange-400">💡 How Scanning Works</h3>
        <ul className="text-sm text-zinc-400 space-y-1">
          <li>• Each scan increases your revenue share bonus</li>
          <li>• Scan frequency: {tier?.name === "Cypherpunk" ? "+0.5%" : tier?.name === "DeGen" ? "+1%" : "+1.5%"} per scan</li>
          <li>• Active lighters only (within tier duration)</li>
          <li>• Future: Physical NFC/QR verification required</li>
        </ul>
      </div>

      {/* Quick access to My Lighters */}
      <div className="text-center">
        <a
          href="/my-lighters"
          className="text-orange-400 hover:underline text-sm"
        >
          ← Back to My Lighters
        </a>
      </div>
    </div>
  );
}
