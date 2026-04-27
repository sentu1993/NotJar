import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Layers } from "lucide-react";
import { AuthProvider } from "@/context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NotJar - Self-Hosted Analytics",
  description: "Open-source hotjar alternative",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-black`}
      >
        <AuthProvider>
          <header className="bg-white border-b sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
              <Link href="/dashboard" className="text-xl font-bold text-indigo-600 flex items-center">
                <Layers className="w-6 h-6 mr-2" />
                NotJar
              </Link>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">Self-Hosted Analytics</span>
              </div>
            </div>
          </header>
          <main>
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
