import type { ReactNode } from "react";
import { PropertyShell } from "@/components/property-shell";

export const metadata = {
  title: "ND Property",
  description:
    "Deal appraisal for residential property development and buy-to-let held in a limited company.",
};

export default function PropertyLayout({ children }: { children: ReactNode }) {
  return <PropertyShell>{children}</PropertyShell>;
}
