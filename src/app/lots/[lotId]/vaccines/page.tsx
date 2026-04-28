"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function VaccinesPage() {
  const { lotId } = useParams<{ lotId: string }>();
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    const m = sp.get("m");
    router.replace(`/lots/${lotId}/treatment${m ? `?m=${m}` : ""}`);
  }, [lotId, router, sp]);

  return null;
}
