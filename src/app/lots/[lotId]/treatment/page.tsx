"use client";

import { useParams } from "next/navigation";
import { TreatmentForm } from "@/components/forms/TreatmentForm";
import { useMonthKey } from "@/hooks/useMonthKey";

export default function TreatmentPage() {
  const { lotId } = useParams<{ lotId: string }>();
  const [month] = useMonthKey();
  return <TreatmentForm lotId={lotId} monthKey={month} />;
}
