"use client";

import { FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Input";
import { useStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import arGeo from "@/lib/ar-geo.json";

const DEFAULT_PROVINCE_ID = "06";

interface Props {
  onDone: () => void;
  onCancel: () => void;
}

export function EstablishmentForm({ onDone, onCancel }: Props) {
  const addEstablishment = useStore((s) => s.addEstablishment);
  const [name, setName] = useState("");
  const [owner, setOwner] = useState("");
  const [provinceId, setProvinceId] = useState(DEFAULT_PROVINCE_ID);
  const [districtId, setDistrictId] = useState("");

  const partidos = useMemo(
    () => arGeo.departamentos.filter((d) => d.provinciaId === provinceId),
    [provinceId],
  );

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const province = arGeo.provincias.find((p) => p.id === provinceId);
    const district = arGeo.departamentos.find((d) => d.id === districtId);
    addEstablishment({
      name: name.trim(),
      owner: owner.trim() || undefined,
      provinceId: province?.id,
      province: province?.nombre,
      districtId: district?.id,
      district: district?.nombre,
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
        <Field label={t.establishments.province}>
          <Select
            value={provinceId}
            onChange={(e) => {
              setProvinceId(e.target.value);
              setDistrictId("");
            }}
          >
            {arGeo.provincias.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t.establishments.district}>
          <Select
            value={districtId}
            onChange={(e) => setDistrictId(e.target.value)}
          >
            <option value="">—</option>
            {partidos.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre}
              </option>
            ))}
          </Select>
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
