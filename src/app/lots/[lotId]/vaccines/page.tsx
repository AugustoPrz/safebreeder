"use client";

import { useParams } from "next/navigation";
import { VaccineForm } from "@/components/forms/VaccineForm";
import { useMonthKey } from "@/hooks/useMonthKey";

export default function VaccinesPage() {
  const { lotId } = useParams<{ lotId: string }>();
  const [month] = useMonthKey();
  return <VaccineForm lotId={lotId} monthKey={month} />;
}
