"use client";

import { Card, CardBody } from "@/components/ui/Card";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { VACCINE_TYPES } from "@/lib/constants";
import { useStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import type { Vaccine } from "@/lib/types";

interface Props {
  lotId: string;
  monthKey: string;
}

const emptyVaccine: Vaccine = {
  date: "",
  type: "",
  brand: "",
  notes: "",
};

export function VaccineForm({ lotId, monthKey }: Props) {
  const vaccine =
    useStore((s) => s.db.vaccines[lotId]?.[monthKey]) ?? emptyVaccine;
  const update = useStore((s) => s.updateVaccine);

  const patch = (p: Partial<Vaccine>) => update(lotId, monthKey, p);

  return (
    <Card>
      <div className="px-5 pt-4 pb-3 border-b border-border">
        <h2 className="font-semibold">{t.vaccines.title}</h2>
        <p className="text-xs text-text-muted">{t.vaccines.subtitle}</p>
      </div>
      <CardBody className="space-y-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Field label={t.vaccines.date}>
            <Input
              type="date"
              value={vaccine.date}
              onChange={(e) => patch({ date: e.target.value })}
            />
          </Field>
          <Field label={t.vaccines.type}>
            <Select
              value={vaccine.type}
              onChange={(e) =>
                patch({ type: e.target.value as Vaccine["type"] })
              }
            >
              <option value="">—</option>
              {VACCINE_TYPES.map((v) => (
                <option key={v} value={v}>
                  {t.vaccines.types[v]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.vaccines.brand}>
            <Input
              value={vaccine.brand}
              onChange={(e) => patch({ brand: e.target.value })}
              placeholder="Ej: Bovishield, Bioabortogen…"
            />
          </Field>
        </div>

        <Field label={t.common.observations}>
          <Textarea
            value={vaccine.notes}
            onChange={(e) => patch({ notes: e.target.value })}
          />
        </Field>
      </CardBody>
    </Card>
  );
}
