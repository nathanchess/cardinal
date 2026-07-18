import type { Metadata } from "next";
import { Source_Sans_3 } from "next/font/google";
import "./globals.css";

const cardinalSans = Source_Sans_3({
  variable: "--font-cardinal",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cardinal",
  description: "Find the credit card that fits your real spending.",
  icons: {
    icon: [{ url: "/brand/cardinal-logo.jpg", type: "image/jpeg" }],
    apple: [{ url: "/brand/cardinal-logo.jpg", type: "image/jpeg" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cardinalSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans text-[var(--ink)]">
        {children}
      </body>
    </html>
  );
}
