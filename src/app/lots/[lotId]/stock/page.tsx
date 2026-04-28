"use client";

import { useParams } from "next/navigation";
import { StockForm } from "@/components/forms/StockForm";

export default function StockPage() {
  const { lotId } = useParams<{ lotId: string }>();
  return <StockForm lotId={lotId} />;
}
