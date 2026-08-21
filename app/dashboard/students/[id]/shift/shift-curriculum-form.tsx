"use client";

import * as z from "zod";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRightLeft, GraduationCap } from "lucide-react";

import { ShiftStudentCurriculumSchema } from "@/schemas";
import { shiftStudentCurriculum } from "@/actions/shift-student";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";
import { formatYearLevelLabel } from "@/lib/group-curriculum-offerings";
import CurriculumPicker, {
  type CurriculumOption,
} from "../../register/curriculum-picker";

type FormInput = z.input<typeof ShiftStudentCurriculumSchema>;
type FormValues = z.output<typeof ShiftStudentCurriculumSchema>;

type StudentData = {
  id: string;
  studentId: string;
  fullName: string;
  course: string;
  yearLevel: number;
  curriculum: string;
  curriculumId: string | null;
};

interface ShiftCurriculumFormProps {
  student: StudentData;
  curriculums: CurriculumOption[];
}

const ShiftCurriculumForm = ({
  student,
  curriculums,
}: ShiftCurriculumFormProps) => {
  const router = useRouter();
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(ShiftStudentCurriculumSchema),
    defaultValues: {
      id: student.id,
      curriculumId: student.curriculumId || "",
    },
  });

  const selectedCurriculumId = watch("curriculumId");
  const hasChanged = Boolean(
    selectedCurriculumId && selectedCurriculumId !== student.curriculumId
  );
  const hasCurriculums = curriculums.length > 0;
  const currentCurriculum = curriculums.find(
    (curriculum) => curriculum.id === student.curriculumId
  );

  const onSubmit = (values: FormValues) => {
    setError("");
    setSuccess("");

    startTransition(() => {
      shiftStudentCurriculum(values).then((data) => {
        if (data?.error) {
          setError(data.error);
          return;
        }

        if (data?.success) {
          setSuccess(data.success);
          router.push("/dashboard/students");
          router.refresh();
        }
      });
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-6">
      <input type="hidden" {...register("id")} />

      {!hasCurriculums && (
        <Alert>
          <GraduationCap />
          <AlertTitle>No curriculum available</AlertTitle>
          <AlertDescription>
            Create a curriculum first so this student can be shifted.{" "}
            <Link href="/dashboard/curriculum/create">Create curriculum</Link>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Current placement</CardTitle>
          <CardDescription>
            {student.fullName} stays in this year level. Only the program and
            curriculum batch will change.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-medium tabular-nums">
              {student.studentId}
            </span>
            <Badge variant="secondary">{student.course}</Badge>
            <Badge variant="outline">
              {formatYearLevelLabel(student.yearLevel)}
            </Badge>
          </div>
          <p>
            <span className="font-medium">Current curriculum: </span>
            {currentCurriculum ? (
              <>
                {currentCurriculum.programCode} · {currentCurriculum.title} ·{" "}
                {currentCurriculum.batchLabel}
              </>
            ) : (
              <span className="text-muted-foreground">
                {student.curriculumId ? student.curriculum : "Unassigned"}
              </span>
            )}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>New curriculum</CardTitle>
          <CardDescription>
            Choose the program and batch this student should shift into.
            The previous course record stays in Record Management. Matching
            subject grades are copied to the new curriculum.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <input type="hidden" {...register("curriculumId")} />
            <CurriculumPicker
              curriculums={curriculums}
              value={selectedCurriculumId}
              currentCurriculumId={student.curriculumId ?? undefined}
              selectedHeading={
                hasChanged ? "Shift to this curriculum" : "Selected curriculum"
              }
              onChange={(curriculumId) => {
                setValue("curriculumId", curriculumId, {
                  shouldValidate: true,
                });
              }}
              disabled={isPending}
              error={errors.curriculumId}
            />
          </FieldGroup>
        </CardContent>
      </Card>

      {hasChanged && (
        <Alert>
          <ArrowRightLeft />
          <AlertTitle>Ready to shift</AlertTitle>
          <AlertDescription>
            The student will move to the selected curriculum. The previous
            course record stays in Records. Subject grades that exist in both
            curricula are copied to the new program. Confirmed retakes for
            subjects that are not in the new curriculum are cleared.
          </AlertDescription>
        </Alert>
      )}

      <FormError message={error} />
      <FormSuccess message={success} />

      <div className="flex items-center justify-end gap-3">
        <Button asChild variant="outline" type="button" disabled={isPending}>
          <Link href="/dashboard/students">Cancel</Link>
        </Button>
        <Button type="submit" disabled={isPending || !hasCurriculums || !hasChanged}>
          {isPending ? "Shifting..." : "Shift Student"}
        </Button>
      </div>
    </form>
  );
};

export default ShiftCurriculumForm;
