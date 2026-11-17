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
import type { CourseOption } from "@/lib/courses";

interface HeadReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "register" | "edit";
  fullName: string;
  email: string;
  departments: CourseOption[];
  emailChanged?: boolean;
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

export function HeadReviewDialog({
  open,
  onOpenChange,
  mode,
  fullName,
  email,
  departments,
  emailChanged = false,
  isPending,
  error,
  onConfirm,
}: HeadReviewDialogProps) {
  const isRegister = mode === "register";
  const departmentLabel = departments.length
    ? departments.map((course) => `${course.code} — ${course.title}`).join(", ")
    : "None selected";
  const confirmLabel = isPending
    ? isRegister
      ? "Registering..."
      : "Saving..."
    : isRegister
      ? "Confirm and register"
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
            {isRegister ? "Review head registration" : "Review head changes"}
          </DialogTitle>
          <DialogDescription>
            {isRegister
              ? "Confirm these details before the department head record and dashboard account are created."
              : "Confirm these details before the department head record is updated."}
          </DialogDescription>
        </DialogHeader>

        <dl className="space-y-3 rounded-lg border bg-muted/40 p-3">
          <ReviewRow label="Full name" value={fullName} />
          <ReviewRow label="Email" value={email} />
          <ReviewRow label="Departments" value={departmentLabel} />
        </dl>

        {isRegister && (
          <p className="text-sm text-muted-foreground">
            A temporary password will be emailed to this address. The head must
            change it before using the dashboard.
          </p>
        )}

        {!isRegister && emailChanged && (
          <p className="text-sm text-muted-foreground">
            This email change replaces the dashboard password and emails a new
            temporary password to the updated address.
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
