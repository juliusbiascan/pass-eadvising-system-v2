"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormError } from "@/components/form-error";
import type { CurriculumOption } from "./register/curriculum-picker";

const YEAR_LABELS: Record<number, string> = {
  1: "1st Year",
  2: "2nd Year",
  3: "3rd Year",
  4: "4th Year",
  5: "5th Year",
  6: "6th Year",
};

export function curriculumReviewLabel(curriculum: CurriculumOption | null) {
  if (!curriculum) return "Not selected";

  return `${curriculum.programCode} — ${curriculum.title} · ${curriculum.batchLabel} (${curriculum.versionTag})`;
}

interface StudentReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "register" | "edit";
  studentId: string;
  fullName: string;
  email: string;
  yearLevel: number;
  curriculum: CurriculumOption | null;
  emailChanged?: boolean;
  isShift?: boolean;
  isPending: boolean;
  error?: string;
  onConfirm: () => void;
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium break-words">{value}</dd>
    </div>
  );
}

export function StudentReviewDialog({
  open,
  onOpenChange,
  mode,
  studentId,
  fullName,
  email,
  yearLevel,
  curriculum,
  emailChanged = false,
  isShift = false,
  isPending,
  error,
  onConfirm,
}: StudentReviewDialogProps) {
  const isRegister = mode === "register";
  const confirmLabel = isPending
    ? isRegister
      ? "Registering..."
      : "Saving..."
    : isRegister
      ? "Confirm and register"
      : isShift
        ? "Confirm and shift"
        : "Confirm and save";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (isPending) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isRegister ? "Review student registration" : "Review student changes"}
          </DialogTitle>
          <DialogDescription>
            {isRegister
              ? "Confirm these details before the student record and portal account are created."
              : "Confirm these details before the student record is updated."}
          </DialogDescription>
        </DialogHeader>

        <dl className="space-y-3 rounded-lg border bg-muted/40 p-3">
          <ReviewRow label="Student ID" value={studentId} />
          <ReviewRow label="Full name" value={fullName} />
          <ReviewRow label="Email" value={email} />
          <ReviewRow
            label="Year level"
            value={YEAR_LABELS[yearLevel] ?? String(yearLevel)}
          />
          <ReviewRow
            label="Curriculum"
            value={curriculumReviewLabel(curriculum)}
          />
        </dl>

        {isRegister && (
          <p className="text-sm text-muted-foreground">
            A temporary password will be emailed to this address. The student
            must change it before using the portal.
          </p>
        )}

        {!isRegister && emailChanged && (
          <p className="text-sm text-muted-foreground">
            This email change replaces the portal password and emails a new
            temporary password to the updated address.
          </p>
        )}

        {!isRegister && isShift && (
          <p className="text-sm text-muted-foreground">
            The curriculum change shifts this student to another program or
            batch. The previous course record stays in Records.
          </p>
        )}

        <FormError message={error} />

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            Back
          </Button>
          <Button type="button" disabled={isPending} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
