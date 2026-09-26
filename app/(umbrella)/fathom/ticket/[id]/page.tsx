"use client";

import { useParams } from "next/navigation";
import { TicketForm } from "@/components/fathom/ticket-form";

export default function AmendTicketPage() {
  const params = useParams<{ id: string }>();
  return <TicketForm tradeId={Number(params.id)} />;
}
