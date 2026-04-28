"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { ToggleGroup } from "@/components/ui/ToggleGroup";
import {
  BCS_OPTIONS,
  DOSING_CRITERIA,
  DRUGS,
  ECTO_ROUTES,
  ROUTES,
  VACCINE_DOSE_NUMBERS,
  VACCINE_TYPES,
} from "@/lib/constants";
import { useStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import type {
  DiarrheaLevel,
  EctoLevel,
  Treatment,
  VaccineRow,
} from "@/lib/types";

interface Props {
  lotId: string;
  monthKey: string;
}

const emptyVaccineRow: VaccineRow = {
  date: "",
  type: "",
  doseNumber: "",
  brand: "",
  dose: "",
};

const emptyTreatment: Treatment = {
  date: "",
  drug: "",
  brand: "",
  route: "",
  dose: "",
  weight: "",
  criterion: "",
  bcs: "",
  ectoparasites: "none",
  ectoType: "",
  ectoDrug: "",
  ectoRoute: "",
  diarrhea: "none",
  notes: "",
};

const ectoOptions: {
  value: EctoLevel;
  label: string;
  tone: "muted" | "primary" | "sun" | "clay";
}[] = [
  { value: "none", label: t.treatment.ectoLevels.none, tone: "muted" },
  { value: "mild", label: t.treatment.ectoLevels.mild, tone: "primary" },
  { value: "moderate", label: t.treatment.ectoLevels.moderate, tone: "sun" },
  { value: "severe", label: t.treatment.ectoLevels.severe, tone: "clay" },
];

const diarrheaOptions: {
  value: DiarrheaLevel;
  label: string;
  tone: "primary" | "sun" | "clay";
}[] = [
  { value: "none", label: t.treatment.diarrheaLevels.none, tone: "primary" },
  { value: "mild", label: t.treatment.diarrheaLevels.mild, tone: "sun" },
  { value: "severe", label: t.treatment.diarrheaLevels.severe, tone: "clay" },
];

export function TreatmentForm({ lotId, monthKey }: Props) {
  const treatment =
    useStore((s) => s.db.treatments[lotId]?.[monthKey]) ?? emptyTreatment;
  const update = useStore((s) => s.updateTreatment);
  const vaccineRecord =
    useStore((s) => s.db.vaccines[lotId]?.[monthKey]) ?? { rows: [] };
  const setVaccineMonth = useStore((s) => s.setVaccineMonth);

  const patch = (p: Partial<Treatment>) => update(lotId, monthKey, p);

  const vaccineDisplayRows =
    vaccineRecord.rows.length > 0 ? vaccineRecord.rows : [emptyVaccineRow];

  const updateVaccineRow = (idx: number, p: Partial<VaccineRow>) => {
    const next = vaccineDisplayRows.map((r, i) =>
      i === idx ? { ...r, ...p } : r
    );
    setVaccineMonth(lotId, monthKey, { rows: next });
  };

  const addVaccineRow = () => {
    setVaccineMonth(lotId, monthKey, {
      rows: [...vaccineDisplayRows, { ...emptyVaccineRow }],
    });
  };

  const deleteVaccineRow = (idx: number) => {
    const next = vaccineDisplayRows.filter((_, i) => i !== idx);
    setVaccineMonth(lotId, monthKey, { rows: next });
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="px-5 pt-4 pb-3 border-b border-border">
          <h2 className="font-semibold">{t.treatment.title}</h2>
          <p className="text-xs text-text-muted">{t.treatment.subtitle}</p>
        </div>
        <CardBody className="space-y-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Field label={t.treatment.date}>
              <Input
                type="date"
                value={treatment.date}
                onChange={(e) => patch({ date: e.target.value })}
              />
            </Field>
            <Field label={t.treatment.drug}>
              <Select
                value={treatment.drug}
                onChange={(e) => patch({ drug: e.target.value })}
              >
                <option value="">—</option>
                {DRUGS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t.treatment.brand}>
              <Input
                value={treatment.brand}
                onChange={(e) => patch({ brand: e.target.value })}
              />
            </Field>
            <Field label={t.treatment.route}>
              <Select
                value={treatment.route}
                onChange={(e) => patch({ route: e.target.value })}
              >
                <option value="">—</option>
                {ROUTES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t.treatment.dose}>
              <Input
                value={treatment.dose}
                onChange={(e) => patch({ dose: e.target.value })}
                placeholder="Ej: 1 ml / 50 kg"
              />
            </Field>
            <Field label={t.treatment.weight}>
              <Input
                value={treatment.weight}
                onChange={(e) => patch({ weight: e.target.value })}
                placeholder="kg"
              />
            </Field>
            <Field label={t.treatment.criterion}>
              <Select
                value={treatment.criterion}
                onChange={(e) => patch({ criterion: e.target.value })}
              >
                <option value="">—</option>
                {DOSING_CRITERIA.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t.treatment.bcs}>
              <Select
                value={treatment.bcs}
                onChange={(e) => patch({ bcs: e.target.value })}
              >
                <option value="">—</option>
                {BCS_OPTIONS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label={t.treatment.diarrhea}>
            <ToggleGroup<DiarrheaLevel>
              value={treatment.diarrhea}
              options={diarrheaOptions}
              onChange={(v) => patch({ diarrhea: v })}
            />
          </Field>

          <Field label={t.common.observations}>
            <Textarea
              value={treatment.notes}
              onChange={(e) => patch({ notes: e.target.value })}
            />
          </Field>
        </CardBody>
      </Card>

      {/* ── Ectoparásitos card ──────────────────────────────────────────── */}
      <Card>
        <div className="px-5 pt-4 pb-3 border-b border-border">
          <h2 className="font-semibold">{t.treatment.ectoTitle}</h2>
          <p className="text-xs text-text-muted">
            {t.treatment.ectoSubtitle}
          </p>
        </div>
        <CardBody className="space-y-4">
          <Field label={t.treatment.ectoparasites}>
            <ToggleGroup<EctoLevel>
              value={treatment.ectoparasites}
              options={ectoOptions}
              onChange={(v) => patch({ ectoparasites: v })}
            />
          </Field>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Field label={t.treatment.ectoType}>
              <Input
                value={treatment.ectoType}
                onChange={(e) => patch({ ectoType: e.target.value })}
                placeholder="Ej: Garrapatas"
              />
            </Field>
            <Field label={t.treatment.ectoDrug}>
              <Input
                value={treatment.ectoDrug ?? ""}
                onChange={(e) => patch({ ectoDrug: e.target.value })}
                placeholder="Ej: Cipermetrina"
              />
            </Field>
            <Field label={t.treatment.ectoRoute}>
              <Select
                value={treatment.ectoRoute ?? ""}
                onChange={(e) => patch({ ectoRoute: e.target.value })}
              >
                <option value="">—</option>
                {ECTO_ROUTES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </CardBody>
      </Card>

      {/* ── Vacunas card ────────────────────────────────────────────────── */}
      <Card>
        <div className="px-5 pt-4 pb-3 border-b border-border">
          <h2 className="font-semibold">{t.vaccines.title}</h2>
          <p className="text-xs text-text-muted">{t.vaccines.subtitle}</p>
        </div>
        <CardBody className="space-y-4">
          {vaccineDisplayRows.map((row, idx) => {
            const canDelete =
              vaccineDisplayRows.length > 1 || vaccineRecord.rows.length > 0;
            return (
              <div
                key={idx}
                className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1.4fr_auto_1fr_1fr_auto] gap-3 items-end ${
                  idx > 0 ? "pt-4 border-t border-border" : ""
                }`}
              >
                <Field label={t.vaccines.date}>
                  <Input
                    type="date"
                    value={row.date}
                    onChange={(e) =>
                      updateVaccineRow(idx, { date: e.target.value })
                    }
                  />
                </Field>
                <Field label={t.vaccines.type}>
                  <Select
                    value={row.type}
                    onChange={(e) =>
                      updateVaccineRow(idx, {
                        type: e.target.value as VaccineRow["type"],
                      })
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
                <Field label={t.vaccines.doseNumber}>
                  <Select
                    value={row.doseNumber ?? ""}
                    onChange={(e) =>
                      updateVaccineRow(idx, {
                        doseNumber: e.target.value as VaccineRow["doseNumber"],
                      })
                    }
                    className="lg:w-32"
                  >
                    <option value="">—</option>
                    {VACCINE_DOSE_NUMBERS.map((d) => (
                      <option key={d} value={d}>
                        {t.vaccines.doseNumbers[d]}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label={t.vaccines.brand}>
                  <Input
                    value={row.brand}
                    onChange={(e) =>
                      updateVaccineRow(idx, { brand: e.target.value })
                    }
                    placeholder="Ej: Bovishield"
                  />
                </Field>
                <Field label={t.vaccines.dose}>
                  <Input
                    value={row.dose}
                    onChange={(e) =>
                      updateVaccineRow(idx, { dose: e.target.value })
                    }
                    placeholder="Ej: 5 ml"
                  />
                </Field>
                <button
                  type="button"
                  onClick={() => deleteVaccineRow(idx)}
                  disabled={!canDelete}
                  aria-label="Eliminar vacuna"
                  className="h-11 w-11 rounded-lg bg-surface-2 hover:bg-clay-soft hover:text-clay text-text-muted inline-flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed shrink-0 transition-colors"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            );
          })}

          <div className="pt-2 flex justify-end">
            <Button variant="secondary" onClick={addVaccineRow} type="button">
              + {t.vaccines.addAnother}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
