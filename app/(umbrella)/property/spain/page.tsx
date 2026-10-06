import type { Metadata } from "next";
import { SpainVillaWorkspace } from "@/components/spain-villa";

export const metadata: Metadata = {
  title: "Spain villa",
  description:
    "Andalucía villa purchase, renovation, finance, an off-season rental, or a digital nomad visa. Figures are estimates, not advice.",
};

export default function SpainVillaPage() {
  return <SpainVillaWorkspace />;
}
