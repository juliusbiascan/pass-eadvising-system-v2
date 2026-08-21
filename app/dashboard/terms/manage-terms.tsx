"use client";

import { useState, useTransition } from "react";
import { removeSystemSetting, setSystemSetting } from "@/actions/terms";
import { SEMESTER_TERMS } from "@/lib/semester-terms";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Props = {
  currentSemester?: string | null;
};

export default function ManageTerms({ currentSemester }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const semesters = [...SEMESTER_TERMS];

  const onSetSemester = (semester: string) => {
    setError(null);
    setSuccess(null);
    startTransition(() => {
      setSystemSetting('activeSemester', semester).then((res) => {
        if (res?.error) setError(res.error);
        else setSuccess(res?.success || 'Updated');
      });
    });
  };

  const onClearSemester = () => {
    setError(null);
    setSuccess(null);
    startTransition(() => {
      removeSystemSetting('activeSemester').then((res) => {
        if (res?.error) setError(res.error);
        else setSuccess(res?.success || 'Cleared');
      });
    });
  };

  return (
    <div className="space-y-4">
      <Field>
        <FieldLabel>Active Semester</FieldLabel>
        <div className="flex items-center gap-3">
          <Select value={currentSemester ?? undefined} onValueChange={(v) => onSetSemester(String(v))}>
            <SelectTrigger className="w-48 h-10">
              <SelectValue placeholder="Select semester" />
            </SelectTrigger>
            <SelectContent>
              {semesters.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => onClearSemester()} variant="outline" disabled={isPending}>
            Clear
          </Button>
        </div>
      </Field>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">{success}</p>}
    </div>
  );
}
