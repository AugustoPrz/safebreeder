"use client";

import { useParams } from "next/navigation";
import { HpgTable } from "@/components/forms/HpgTable";
import { useMonthKey } from "@/hooks/useMonthKey";

export default function HpgPage() {
  const { lotId } = useParams<{ lotId: string }>();
  const [month] = useMonthKey();
  return <HpgTable lotId={lotId} monthKey={month} />;
}
