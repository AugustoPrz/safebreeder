"use client";

import { useParams } from "next/navigation";
import { WeightsTable } from "@/components/forms/WeightsTable";
import { useMonthKey } from "@/hooks/useMonthKey";

export default function WeightsPage() {
  const { lotId } = useParams<{ lotId: string }>();
  const [month] = useMonthKey();
  return <WeightsTable lotId={lotId} monthKey={month} />;
}
