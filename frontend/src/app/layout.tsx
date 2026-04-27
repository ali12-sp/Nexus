import type { Metadata } from "next";

import { AuthProvider } from "@/components/providers/auth-provider";

import "./globals.css";

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
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
