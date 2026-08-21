'use client';

import { AlertTriangle, CheckCircle2 } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

import { GradeStatusBadge } from './grade-status-badge';
import type { CurriculumItem, GradeStatus } from '../lib/types';

type GradeEntry = {
  grade: string;
  status: GradeStatus;
};

interface GradeReviewDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offerings: CurriculumItem[];
  values: Record<string, GradeEntry>;
  isPending: boolean;
  onConfirm: () => void;
}

export function GradeReviewDrawer({
  open,
  onOpenChange,
  offerings,
  values,
  isPending,
  onConfirm,
}: GradeReviewDrawerProps) {
  const missingCount = offerings.filter((offering) => !values[offering.id]?.grade?.trim()).length;
  const enteredCount = offerings.length - missingCount;

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (isPending) return;
        onOpenChange(next);
      }}
    >
      <DrawerContent className="overflow-hidden data-[vaul-drawer-direction=bottom]:max-h-[92dvh]">
        <DrawerHeader className="text-left">
          <DrawerTitle>Review your grades</DrawerTitle>
          <DrawerDescription>
            Check each grade before you submit. After submitting, you cannot change them until an
            administrator reviews your request.
          </DrawerDescription>
        </DrawerHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4">
          <p className="mb-3 text-sm text-muted-foreground">
            {enteredCount} of {offerings.length} subjects entered
            {missingCount > 0 ? ` · ${missingCount} missing` : ''}
          </p>

          {missingCount > 0 ? (
            <Alert className="mb-3 border-amber-500/40 bg-amber-500/10">
              <AlertTriangle />
              <AlertDescription>
                {missingCount} {missingCount === 1 ? 'subject has' : 'subjects have'} no grade.
                Go back to edit if that is a mistake.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="mb-3 border-emerald-500/40 bg-emerald-500/10">
              <CheckCircle2 />
              <AlertDescription>All subjects have a grade. Confirm if these are correct.</AlertDescription>
            </Alert>
          )}

          <ul className="divide-y divide-border overflow-hidden rounded-lg border">
            {offerings.map((offering) => {
              const entry = values[offering.id];
              const grade = entry?.grade?.trim();

              return (
                <li key={offering.id} className="flex items-start justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="font-medium">{offering.code}</p>
                    <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
                      {offering.description}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                      {offering.units} units
                      {offering.isRetake
                        ? offering.scheduleKind === 'FAILED'
                          ? ' · Retake'
                          : ' · Makeup'
                        : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <p className="text-lg font-semibold tabular-nums">
                      {grade || <span className="text-sm font-medium text-muted-foreground">—</span>}
                    </p>
                    {grade ? <GradeStatusBadge status={entry.status} /> : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <DrawerFooter className="gap-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isPending || enteredCount === 0}
            className="h-11 w-full touch-manipulation"
          >
            {isPending ? 'Submitting...' : 'Confirm and submit'}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            className="h-11 w-full touch-manipulation"
            onClick={() => onOpenChange(false)}
          >
            Go back and edit
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
