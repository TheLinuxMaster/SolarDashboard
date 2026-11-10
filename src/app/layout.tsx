import type { Metadata, Viewport } from "next";
import { Sora } from "next/font/google";

import { AuroraBackground } from "@/components/aurora-background";

import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Onyx solar console",
    template: "%s · Onyx",
  },
  description:
    "Live solar, battery and grid telemetry from a SolarMax Onyx inverter.",
  applicationName: "Onyx",
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#070b12",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={sora.variable}>
      <body className="font-sans">
        <AuroraBackground />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
