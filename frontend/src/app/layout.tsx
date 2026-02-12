import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Co-Flame — Cooperatively Owned Smart Lighters",
  description: "Buy a lighter, get an NFT, earn revenue share through proof of possession.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-zinc-950 text-white min-h-screen`}>
        <Providers>
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
          <Toaster theme="dark" position="bottom-right" />
        </Providers>
      </body>
    </html>
  );
}
