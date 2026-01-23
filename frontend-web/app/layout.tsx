import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/contexts/session-context";

export const metadata: Metadata = {
  title: "Diabetes Risk Assessment Kiosk",
  description: "AI-powered diabetes risk prediction using fingerprint analysis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased overflow-hidden">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
