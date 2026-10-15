import type { Metadata } from "next";
import { Rajdhani, Share_Tech_Mono } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

const cyberDisplay = Rajdhani({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-cyber-display",
});

const cyberMono = Share_Tech_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-cyber-mono",
});

export const metadata: Metadata = {
  title: "Lead Search",
  description: "Search social leads via Google and extract contacts",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${cyberDisplay.variable} ${cyberMono.variable}`}>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
