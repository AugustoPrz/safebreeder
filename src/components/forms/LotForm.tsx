"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Input";
import { useStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import { LOT_CATEGORIES } from "@/lib/constants";
import type { Lot, LotCategory } from "@/lib/types";

interface Props {
  establishmentId: string;
  onDone: () => void;
  onCancel: () => void;
  lot?: Lot;
}

export function LotForm({ establishmentId, onDone, onCancel, lot }: Props) {
  const addLot = useStore((s) => s.addLot);
  const updateLot = useStore((s) => s.updateLot);
  const [name, setName] = useState(lot?.name ?? "");
  const [category, setCategory] = useState<LotCategory>(
    lot?.category ?? "recriaMachos",
  );

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    // headCount is now driven exclusively by the Stock tab — when the user
    // adds or removes animals there, setStock syncs the lot's headCount.
    // We preserve any existing value on edit and leave it undefined for new
    // lots so the Stock tab seeds with one empty row by default.
    const payload = {
      establishmentId,
      name: name.trim(),
      category,
      headCount: lot?.headCount,
    };
    if (lot) {
      updateLot(lot.id, payload);
    } else {
      addLot(payload);
    }
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
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t.common.cancel}
        </Button>
        <Button type="submit">{t.common.save}</Button>
      </div>
    </form>
  );
}
