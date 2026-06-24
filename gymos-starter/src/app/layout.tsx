import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Iron Gym OS V2",
  description: "Gym management system built with Next.js and Supabase"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
