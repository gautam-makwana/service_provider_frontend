import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ServicePro Provider – My Assignments",
  description: "Provider portal to manage and complete service assignments.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
