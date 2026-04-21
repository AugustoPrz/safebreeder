"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { useStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import { DEFAULT_PROVINCE } from "@/lib/constants";

interface Props {
  onDone: () => void;
  onCancel: () => void;
}

export function EstablishmentForm({ onDone, onCancel }: Props) {
  const addEstablishment = useStore((s) => s.addEstablishment);
  const [name, setName] = useState("");
  const [owner, setOwner] = useState("");
  const [district, setDistrict] = useState("");
  const [province, setProvince] = useState(DEFAULT_PROVINCE);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addEstablishment({
      name: name.trim(),
      owner: owner.trim() || undefined,
      district: district.trim() || undefined,
      province: province.trim() || undefined,
    });
    onDone();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label={t.establishments.name} required>
        <Input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: La Esperanza"
          required
        />
      </Field>
      <Field label={t.establishments.owner}>
        <Input value={owner} onChange={(e) => setOwner(e.target.value)} />
      </Field>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label={t.establishments.district}>
          <Input
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
          />
        </Field>
        <Field label={t.establishments.province}>
          <Input
            value={province}
            onChange={(e) => setProvince(e.target.value)}
          />
        </Field>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t.common.cancel}
        </Button>
        <Button type="submit">{t.common.save}</Button>
      </div>
    </form>
  );
}
