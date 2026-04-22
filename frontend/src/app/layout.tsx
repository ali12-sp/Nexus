import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";

import { AuthProvider } from "@/components/providers/auth-provider";

import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "Nexus | Investor & Entrepreneur Collaboration",
  description:
    "Secure collaboration platform for investors and entrepreneurs to manage meetings, documents, calls, and transactions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${spaceGrotesk.variable}`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
