import type { Metadata } from "next";
import { Barlow } from "next/font/google";
import "./globals.css";

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-barlow",
});

export const metadata: Metadata = {
  title: "Car House Admin",
  description: "Management system for Car House Imports Ltd.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${barlow.variable} antialiased bg-black text-white`}>
        {children}
      </body>
    </html>
  );
}
