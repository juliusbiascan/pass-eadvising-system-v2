"use client";

import { useState, useTransition } from "react";

import { setSystemSetting } from "@/actions/terms";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GRADE_SETTING_KEYS, type GradeScale } from "@/lib/grade-evaluation";

type Props = {
  currentThreshold: number;
  currentScale: GradeScale;
};

export default function ManageGradeSettings({ currentThreshold, currentScale }: Props) {
  const [threshold, setThreshold] = useState(String(currentThreshold));
  const [scale, setScale] = useState<GradeScale>(currentScale);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSave = () => {
    setError(null);
    setSuccess(null);

    const parsed = Number(threshold);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Enter a valid passing threshold greater than 0.");
      return;
    }

    if (scale === "percentage" && (parsed > 100 || parsed < 0)) {
      setError("Percentage threshold must be between 0 and 100.");
      return;
    }

    if (scale === "gwa" && (parsed < 1 || parsed > 5)) {
      setError("GWA passing threshold is usually between 1.0 and 5.0 (e.g. 3.0).");
      return;
    }

    startTransition(async () => {
      const thresholdResult = await setSystemSetting(
        GRADE_SETTING_KEYS.passingThreshold,
        String(parsed)
      );
      if (thresholdResult?.error) {
        setError(thresholdResult.error);
        return;
      }

      const scaleResult = await setSystemSetting(GRADE_SETTING_KEYS.gradeScale, scale);
      if (scaleResult?.error) {
        setError(scaleResult.error);
        return;
      }

      setSuccess("Grade pass/fail rules updated.");
    });
  };

  return (
    <div className="space-y-4">
      <Field>
        <FieldLabel>Grade scale</FieldLabel>
        <Select value={scale} onValueChange={(v) => setScale(v as GradeScale)} disabled={isPending}>
          <SelectTrigger className="w-full max-w-xs h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="percentage">Percentage (0–100)</SelectItem>
            <SelectItem value="gwa">GWA (1.0–5.0, lower is better)</SelectItem>
          </SelectContent>
        </Select>
        <p className="mt-1 text-xs text-muted-foreground">
          {scale === "percentage"
            ? "Example: 85 with threshold 75 → PASSED"
            : "Example: 2.5 with threshold 3.0 → PASSED"}
        </p>
      </Field>

      <Field>
        <FieldLabel>{scale === "percentage" ? "Passing threshold (%)" : "Maximum passing GWA"}</FieldLabel>
        <Input
          type="number"
          min={scale === "percentage" ? 0 : 1}
          max={scale === "percentage" ? 100 : 5}
          step={scale === "percentage" ? 1 : 0.25}
          value={threshold}
          onChange={(e) => setThreshold(e.target.value)}
          disabled={isPending}
          className="max-w-xs"
        />
      </Field>

      <Button onClick={onSave} disabled={isPending}>
        {isPending ? "Saving..." : "Save grade rules"}
      </Button>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-600">{success}</p>}
    </div>
  );
}
