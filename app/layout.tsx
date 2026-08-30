import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Job Mailer AI",
  description: "AI powered job application email generator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}