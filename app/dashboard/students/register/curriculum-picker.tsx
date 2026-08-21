"use client";

import { useMemo, useState } from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export type CurriculumOption = {
  id: string;
  programCode: string;
  title: string;
  batchLabel: string;
  batchYear: number;
  versionTag: "OLD" | "NEW";
  isActive: boolean;
};

interface CurriculumPickerProps {
  curriculums: CurriculumOption[];
  value: string;
  onChange: (curriculumId: string) => void;
  disabled?: boolean;
  error?: { message?: string };
  currentCurriculumId?: string;
  selectedHeading?: string;
}

type ProgramGroup = {
  programCode: string;
  title: string;
  batches: CurriculumOption[];
};

function groupCurriculums(curriculums: CurriculumOption[]): ProgramGroup[] {
  const groups = new Map<string, ProgramGroup>();

  for (const curriculum of curriculums) {
    const existing = groups.get(curriculum.programCode);

    if (existing) {
      existing.batches.push(curriculum);
      continue;
    }

    groups.set(curriculum.programCode, {
      programCode: curriculum.programCode,
      title: curriculum.title,
      batches: [curriculum],
    });
  }

  return Array.from(groups.values()).map((group) => ({
    ...group,
    batches: [...group.batches].sort((a, b) => {
      if (a.isActive !== b.isActive) {
        return a.isActive ? -1 : 1;
      }

      return b.batchYear - a.batchYear;
    }),
  }));
}

const CurriculumPicker = ({
  curriculums,
  value,
  onChange,
  disabled,
  error,
  currentCurriculumId,
  selectedHeading = "Selected curriculum",
}: CurriculumPickerProps) => {
  const programs = useMemo(
    () => groupCurriculums(curriculums),
    [curriculums]
  );

  const selectedCurriculum = curriculums.find((item) => item.id === value);

  const [programCode, setProgramCode] = useState(
    selectedCurriculum?.programCode ||
      (programs.length === 1 ? programs[0].programCode : "")
  );

  const selectedProgram = programs.find(
    (program) => program.programCode === programCode
  );
  const batches = selectedProgram?.batches ?? [];

  const handleProgramChange = (nextProgramCode: string) => {
    if (disabled) {
      return;
    }

    setProgramCode(nextProgramCode);

    const nextBatches =
      programs.find((program) => program.programCode === nextProgramCode)
        ?.batches ?? [];

    if (nextBatches.length === 1) {
      onChange(nextBatches[0].id);
      return;
    }

    const stillValid = nextBatches.some((batch) => batch.id === value);
    if (!stillValid) {
      onChange("");
    }
  };

  if (curriculums.length === 0) {
    return null;
  }

  return (
    <div className="space-y-5">
      <Field>
        <FieldLabel>1. Program</FieldLabel>
        <FieldDescription>
          Choose the degree program this student belongs to.
        </FieldDescription>
        <div className="grid gap-3 sm:grid-cols-2">
          {programs.map((program) => {
            const isSelected = program.programCode === programCode;

            return (
              <button
                key={program.programCode}
                type="button"
                disabled={disabled}
                onClick={() => handleProgramChange(program.programCode)}
                className={cn(
                  "rounded-xl border p-4 text-left transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "hover:bg-muted/40"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold tracking-wide">
                      {program.programCode}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {program.title}
                    </p>
                  </div>
                  {isSelected && (
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3" />
                    </span>
                  )}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {program.batches.length}{" "}
                  {program.batches.length === 1 ? "batch" : "batches"}
                </p>
              </button>
            );
          })}
        </div>
      </Field>

      <Field>
        <FieldLabel>2. Curriculum batch</FieldLabel>
        <FieldDescription>
          {programCode
            ? `Select the academic year and curriculum version for ${programCode}.`
            : "Select a program first to see available batches."}
        </FieldDescription>

        {!programCode ? (
          <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            Choose a program above to continue.
          </div>
        ) : (
          <RadioGroup
            value={value || undefined}
            onValueChange={onChange}
            disabled={disabled}
            className="grid gap-3"
          >
            {batches.map((batch) => {
              const isSelected = batch.id === value;

              return (
                <label
                  key={batch.id}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "hover:bg-muted/40",
                    disabled && "cursor-not-allowed opacity-50"
                  )}
                >
                  <RadioGroupItem
                    value={batch.id}
                    className="mt-0.5"
                    disabled={disabled}
                  />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">{batch.batchLabel}</p>
                      <p className="text-xs text-muted-foreground">
                        Batch year {batch.batchYear}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant={batch.versionTag === "NEW" ? "default" : "outline"}>
                        {batch.versionTag === "NEW"
                          ? "New curriculum"
                          : "Old curriculum"}
                      </Badge>
                      <Badge variant={batch.isActive ? "secondary" : "outline"}>
                        {batch.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {batch.id === currentCurriculumId && (
                        <Badge variant="secondary">Current</Badge>
                      )}
                    </div>
                  </div>
                </label>
              );
            })}
          </RadioGroup>
        )}
        <FieldError errors={[error]} />
      </Field>

      {selectedCurriculum && (
        <div className="rounded-xl border bg-muted/30 p-4 text-sm">
          <p className="font-medium">{selectedHeading}</p>
          <p className="mt-1 text-muted-foreground">
            {selectedCurriculum.programCode} · {selectedCurriculum.title}
          </p>
          <p className="mt-1 text-muted-foreground">
            {selectedCurriculum.batchLabel} ·{" "}
            {selectedCurriculum.versionTag === "NEW" ? "New" : "Old"} curriculum
            {selectedCurriculum.isActive ? " · Active" : " · Inactive"}
            {selectedCurriculum.id === currentCurriculumId ? " · Current" : ""}
          </p>
        </div>
      )}
    </div>
  );
};

export default CurriculumPicker;
