import type { ReactNode } from "react";
import { IBM_Plex_Mono, IBM_Plex_Sans, Newsreader } from "next/font/google";
import { Shell } from "@/components/fathom/shell";
import "./fathom.css";

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-fathom-sans",
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-fathom-mono",
});
const display = Newsreader({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-fathom-display",
});

export const metadata = {
  title: "Fathom Desk",
  description: "Educational cross-asset trading desk. Fictional books and market data.",
};

export default function FathomLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`fathom-desk ${sans.variable} ${mono.variable} ${display.variable}`}>
      <Shell>{children}</Shell>
    </div>
  );
}
