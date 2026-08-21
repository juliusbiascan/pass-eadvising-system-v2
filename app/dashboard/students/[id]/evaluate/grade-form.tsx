"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { approveStudentEvaluation, saveStudentGrades, submitStudentEvaluation } from "@/actions/curriculum";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";
import {
  GRADE_STATUS_DOT_CLASS,
  GRADE_STATUS_LABEL,
  GRADE_STATUS_TRIGGER_CLASS,
} from "@/components/status-badge";
import { cn } from "@/lib/utils";
import type { EvaluationStatus, GradeStatus } from "@/app/generated/prisma/enums";
import {
  deriveStatusFromGrade,
  formatPassingRule,
  type GradePassSettings,
} from "@/lib/grade-evaluation";
import type { SemesterTermValue } from "@/lib/semester-terms";
import {
  isEvaluationApproved,
  isEvaluationEvaluated,
} from "@/lib/evaluation";
import {
  CompleteEvaluationDialog,
  type CompleteEvaluationPayload,
  type EvaluationReview,
} from "./complete-evaluation-dialog";

type Offering = {
  id: string;
  subjectId: string;
  code: string;
  description: string;
  units?: number;
};

const isGradeStatus = (value: string | undefined): value is GradeStatus =>
  value === "PASSED" || value === "FAILED" || value === "INCOMPLETE" || value === "PENDING";

const GRADE_STATUSES: GradeStatus[] = ["PASSED", "FAILED", "INCOMPLETE", "PENDING"];

function GradeStatusSelect({
  value,
  onChange,
  disabled,
  className,
}: {
  value: GradeStatus;
  onChange: (status: GradeStatus) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Select
      value={value}
      onValueChange={(next) => {
        if (disabled) return;
        if (!isGradeStatus(next)) return;
        onChange(next);
      }}
    >
      <SelectTrigger
        className={cn(GRADE_STATUS_TRIGGER_CLASS[value], className)}
        disabled={disabled}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {GRADE_STATUSES.map((status) => (
          <SelectItem key={status} value={status}>
            <span className="flex items-center gap-2">
              <span
                className={cn("size-2 rounded-full", GRADE_STATUS_DOT_CLASS[status])}
              />
              {GRADE_STATUS_LABEL[status]}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function buildInitialValues(
  offerings: Offering[],
  existingGrades: { [curriculumSubjectId: string]: { grade?: string; status?: string } } = {}
) {
  const init: Record<string, { grade: string; status: GradeStatus }> = {};
  for (const o of offerings) {
    const existingStatus = existingGrades?.[o.id]?.status;
    init[o.id] = {
      grade: existingGrades?.[o.id]?.grade || "",
      status: isGradeStatus(existingStatus) ? existingStatus : "PENDING",
    };
  }
  return init;
}

interface GradeFormProps {
  studentId: string;
  curriculumId?: string;
  semester?: SemesterTermValue;
  /** Term the grades belong to (defaults to student's current term when omitted). */
  termYearLevel?: number;
  termSemester?: SemesterTermValue;
  offerings: Offering[];
  existingGrades?: { [curriculumSubjectId: string]: { grade?: string; status?: string } };
  isAdmin?: boolean;
  staffRole?: 'ADMIN' | 'HEAD';
  gradePassSettings: GradePassSettings;
  evaluationStatus?: EvaluationStatus;
  evaluatedByName?: string | null;
  evaluatedByPosition?: string | null;
  evaluatedAt?: Date | string | null;
  /** When false, hides evaluate/approve actions (e.g. past terms in Record Management). */
  showTermActions?: boolean;
  /** Table layout matches curriculum subject grouping; cards for compact evaluate view. */
  layout?: "cards" | "table";
  showHelpText?: boolean;
  studentName?: string;
  studentCourse?: string;
  termLabel?: string;
  nextEnrollmentLabel?: string | null;
  evaluationReview?: EvaluationReview;
  defaultCompleterName?: string;
}

export default function GradeForm({
  studentId,
  curriculumId,
  semester,
  termYearLevel,
  termSemester,
  offerings,
  existingGrades = {},
  isAdmin = false,
  staffRole,
  gradePassSettings,
  evaluationStatus = 'PENDING',
  evaluatedByName,
  evaluatedByPosition,
  evaluatedAt,
  showTermActions = true,
  layout = "cards",
  showHelpText = true,
  studentName,
  studentCourse,
  termLabel,
  nextEnrollmentLabel,
  evaluationReview,
  defaultCompleterName = "",
}: GradeFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [dialogError, setDialogError] = useState<string | undefined>("");
  const [completeOpen, setCompleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const initialValues = useMemo(
    () => buildInitialValues(offerings, existingGrades),
    [offerings, existingGrades]
  );

  const [values, setValues] = useState(initialValues);

  useEffect(() => {
    setValues(buildInitialValues(offerings, existingGrades));
  }, [offerings, existingGrades]);

  const handleSave = () => {
    setError("");
    setSuccess("");

    const grades = offerings.map((o) => ({
      curriculumSubjectId: o.id,
      grade: values[o.id]?.grade || undefined,
      status: values[o.id]?.status ?? "PENDING",
    }));

    startTransition(() => {
      saveStudentGrades({
        studentId,
        grades,
        yearLevel: termYearLevel,
        semester: termSemester,
      }).then((res) => {
        if (res?.error) {
          setError(res.error);
          return;
        }
        setSuccess(res?.success || "Saved");
        router.refresh();
      });
    });
  };

  const gradeCounts = useMemo(() => {
    const counts = { passed: 0, failed: 0, incomplete: 0, pending: 0 };
    for (const offering of offerings) {
      const status = values[offering.id]?.status ?? "PENDING";
      if (status === "PASSED") counts.passed += 1;
      else if (status === "FAILED") counts.failed += 1;
      else if (status === "INCOMPLETE") counts.incomplete += 1;
      else counts.pending += 1;
    }
    return counts;
  }, [offerings, values]);

  const canEvaluate =
    showTermActions && staffRole === 'HEAD' && !isEvaluationApproved(evaluationStatus);
  const canApprove =
    showTermActions && staffRole === 'ADMIN' && evaluationStatus === 'EVALUATED';
  const dialogMode = canApprove ? 'approve' : 'evaluate';

  const handleSubmitEvaluation = (payload: CompleteEvaluationPayload) => {
    setError("");
    setDialogError("");
    setSuccess("");

    startTransition(() => {
      const request = canApprove
        ? approveStudentEvaluation({
            studentId,
            curriculumId,
            semester,
            approvedByName: payload.completedByName,
            actionDate: payload.actionDate,
            remarks: payload.remarks,
            confirmed: payload.confirmed,
          })
        : submitStudentEvaluation({
            studentId,
            curriculumId,
            semester,
            completedByName: payload.completedByName,
            actionDate: payload.actionDate,
            remarks: payload.remarks,
            confirmed: payload.confirmed,
          });

      request.then((res) => {
        if (res?.error) {
          setDialogError(res.error);
          return;
        }
        setCompleteOpen(false);
        setSuccess(
          "success" in res
            ? res.success
            : canApprove
              ? "Evaluation checked and approved"
              : "Evaluation recorded"
        );
        router.refresh();
      });
    });
  };

  return (
    <div className="space-y-4">
      <FormError message={error} />
      <FormSuccess message={success} />
      {showHelpText && (
        <p className="text-sm text-muted-foreground">
          Numeric grades auto-set status on save ({formatPassingRule(gradePassSettings)}).
          {isEvaluationApproved(evaluationStatus)
            ? ' Saving grades will mark this term as pending again until the head evaluates and the registrar approves.'
            : isEvaluationEvaluated(evaluationStatus)
              ? ' The department head has evaluated this term. The registrar or admin can now check and approve it.'
              : ' Department heads evaluate by date. The registrar or admin then checks and approves by date.'}
        </p>
      )}

      {layout === "table" ? (
        <div className="space-y-2">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4">Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-16 text-right">Units</TableHead>
                  <TableHead className="w-28">Grade</TableHead>
                  <TableHead className="w-36 pr-4">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offerings.map((o) => {
                  const entry = values[o.id] ?? { grade: "", status: "PENDING" as GradeStatus };

                  return (
                    <TableRow key={o.id}>
                      <TableCell className="p-2 pl-4 font-medium">{o.code}</TableCell>
                      <TableCell className="p-2 text-muted-foreground">
                        {o.description}
                      </TableCell>
                      <TableCell className="p-2 text-right">
                        {o.units ?? "—"}
                      </TableCell>
                      <TableCell className="p-2">
                        <Input
                          type="text"
                          value={entry.grade}
                          onChange={(e) => {
                            const grade = e.target.value;
                            const derived = deriveStatusFromGrade(grade, gradePassSettings);
                            setValues((prev) => ({
                              ...prev,
                              [o.id]: {
                                ...prev[o.id],
                                grade,
                                status: derived ?? prev[o.id]?.status ?? "PENDING",
                              },
                            }));
                          }}
                          placeholder="e.g. 85.00"
                          className="h-9 w-full"
                        />
                      </TableCell>
                      <TableCell className="p-2 pr-4">
                        <GradeStatusSelect
                          value={entry.status}
                          disabled={!isAdmin}
                          className="h-9 w-full"
                          onChange={(status) => {
                            setValues((prev) => ({
                              ...prev,
                              [o.id]: { grade: prev[o.id]?.grade ?? "", status },
                            }));
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {offerings.length > 0 && (
            <p className="text-right text-xs text-muted-foreground">
              {offerings.length} subject{offerings.length === 1 ? "" : "s"}
              {offerings.some((o) => o.units != null) &&
                ` · ${offerings.reduce((sum, o) => sum + (o.units ?? 0), 0)} total units`}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {offerings.map((o) => {
            const entry = values[o.id] ?? { grade: "", status: "PENDING" as GradeStatus };

            return (
              <div key={o.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{o.code}</div>
                    <div className="text-sm text-muted-foreground">{o.description}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      value={entry.grade}
                      onChange={(e) => {
                        const grade = e.target.value;
                        const derived = deriveStatusFromGrade(grade, gradePassSettings);
                        setValues((prev) => ({
                          ...prev,
                          [o.id]: {
                            ...prev[o.id],
                            grade,
                            status: derived ?? prev[o.id]?.status ?? "PENDING",
                          },
                        }));
                      }}
                      placeholder="e.g. 85.00"
                      className="w-28"
                    />
                    <GradeStatusSelect
                      value={entry.status}
                      disabled={!isAdmin}
                      className="h-10 w-36"
                      onChange={(status) => {
                        setValues((prev) => ({
                          ...prev,
                          [o.id]: { grade: prev[o.id]?.grade ?? "", status },
                        }));
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving..." : "Save Grades"}
        </Button>
        {canEvaluate && (
          <Button
            variant="secondary"
            onClick={() => {
              setDialogError("");
              setCompleteOpen(true);
            }}
            disabled={isPending}
          >
            Evaluate by date
          </Button>
        )}
        {canApprove && (
          <Button
            variant="secondary"
            onClick={() => {
              setDialogError("");
              setCompleteOpen(true);
            }}
            disabled={isPending}
          >
            Check and approve
          </Button>
        )}
      </div>

      {(canEvaluate || canApprove) && (
        <CompleteEvaluationDialog
          open={completeOpen}
          onOpenChange={setCompleteOpen}
          mode={dialogMode}
          studentName={studentName}
          studentCourse={studentCourse}
          termLabel={
            termLabel ??
            `Year ${termYearLevel ?? ""} • ${termSemester ?? semester ?? ""}`.trim()
          }
          nextEnrollmentLabel={nextEnrollmentLabel}
          review={evaluationReview}
          gradeCounts={gradeCounts}
          defaultCompleterName={defaultCompleterName}
          lockEvaluatorPosition={
            staffRole === 'HEAD'
              ? { type: 'HEAD', courseCode: studentCourse }
              : { type: 'ADMIN' }
          }
          evaluatedByName={evaluatedByName}
          evaluatedByPosition={evaluatedByPosition}
          evaluatedAt={evaluatedAt}
          isPending={isPending}
          error={dialogError}
          onConfirm={handleSubmitEvaluation}
        />
      )}
    </div>
  );
}
