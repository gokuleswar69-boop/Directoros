import type { Metadata } from "next";
import { Inter, Courier_Prime } from "next/font/google"; // Fixed import
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import AppShell from "@/components/layout/AppShell";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const courier = Courier_Prime({ weight: "400", subsets: ["latin"], variable: "--font-courier" });

export const metadata: Metadata = {
  title: "Director's Cut",
  description: "Script management for modern filmmakers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${inter.variable} ${courier.variable} font-sans bg-black text-white antialiased`}>
        <AuthProvider>
          <AppShell>
            {children}
          </AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
