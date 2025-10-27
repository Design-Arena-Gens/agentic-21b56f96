import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { HydrationGate } from "@/components/providers/hydration-gate";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aurora Finance",
  description:
    "Cross-platform personal finance companion for tracking income, expenses, and budgets with premium automation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-[color:var(--background)] antialiased`}
      >
        <ThemeProvider>
          <HydrationGate>{children}</HydrationGate>
        </ThemeProvider>
      </body>
    </html>
  );
}
