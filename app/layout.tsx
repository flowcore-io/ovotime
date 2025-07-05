import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ovotime",
  description: "Ovotime is a tool for predicting the hatching time of skua eggs based on their mass, length, breadth, and density.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body>{children}</body>
    </html>
  );
}
