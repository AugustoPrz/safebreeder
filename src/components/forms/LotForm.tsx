"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Input";
import { useStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import { LOT_CATEGORIES } from "@/lib/constants";
import type { LotCategory } from "@/lib/types";

interface Props {
  establishmentId: string;
  onDone: () => void;
  onCancel: () => void;
}

export function LotForm({ establishmentId, onDone, onCancel }: Props) {
  const addLot = useStore((s) => s.addLot);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<LotCategory>("recriaMachos");
  const [headCount, setHeadCount] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const count = Number(headCount);
    addLot({
      establishmentId,
      name: name.trim(),
      category,
      headCount: headCount && !Number.isNaN(count) ? count : undefined,
    });
    onDone();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label={t.lot.name} required>
        <Input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Recría 2024"
          required
        />
      </Field>
      <Field label={t.lot.category}>
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value as LotCategory)}
        >
          {LOT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {t.lot.categories[c]}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t.lot.headCount}>
        <Input
          type="number"
          inputMode="numeric"
          min={0}
          value={headCount}
          onChange={(e) => setHeadCount(e.target.value)}
        />
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t.common.cancel}
        </Button>
        <Button type="submit">{t.common.save}</Button>
      </div>
    </form>
  );
}
