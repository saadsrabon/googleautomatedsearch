import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lead Search",
  description: "Search social leads via Google and extract contacts",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
