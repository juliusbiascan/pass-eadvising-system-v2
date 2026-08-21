"use client";

import * as z from "zod";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { createCurriculum } from "@/actions/curriculum";
import { CreateCurriculumSchema } from "@/schemas";
import type { CourseOption } from "@/lib/courses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";

type FormInput = z.input<typeof CreateCurriculumSchema>;
type FormValues = z.output<typeof CreateCurriculumSchema>;

interface CreateCurriculumFormProps {
  courses: CourseOption[];
}

const CreateCurriculumForm = ({ courses }: CreateCurriculumFormProps) => {
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const defaultCourse = courses[0];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(CreateCurriculumSchema),
    defaultValues: {
      programCode: defaultCourse?.code ?? "",
      title: defaultCourse?.title ?? "",
      batchLabel: "A.Y. 2026-2027",
      batchYear: 2026,
      versionTag: "NEW",
      isActive: true,
      notes: "",
    },
  });

  const programCode = watch("programCode");
  const hasCourses = courses.length > 0;

  const onSubmit = (values: FormValues) => {
    setError("");
    setSuccess("");

    startTransition(() => {
      createCurriculum(values).then((data) => {
        if (data?.error) {
          setError(data.error);
          return;
        }

        if (data?.success) {
          setSuccess(data.success);
          reset({
            programCode: defaultCourse?.code ?? "",
            title: defaultCourse?.title ?? "",
            batchLabel: "A.Y. 2026-2027",
            batchYear: 2026,
            versionTag: "NEW",
            isActive: true,
            notes: "",
          });
        }
      });
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel>Course</FieldLabel>
          <input type="hidden" {...register("programCode")} />
          <Select
            value={programCode}
            onValueChange={(value) => {
              const matched = courses.find((course) => course.code === value);
              setValue("programCode", value, { shouldValidate: true });
              if (matched) {
                setValue("title", matched.title, { shouldValidate: true });
              }
            }}
            disabled={isPending || !hasCourses}
          >
            <SelectTrigger className="w-full h-10">
              <SelectValue placeholder="Select course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course) => (
                <SelectItem key={course.code} value={course.code}>
                  {course.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError errors={[errors.programCode]} />
          {!hasCourses && (
            <p className="text-xs text-muted-foreground">
              No courses yet.{" "}
              <Link href="/dashboard/courses" className="underline">
                Add a course
              </Link>{" "}
              first.
            </p>
          )}
        </Field>

        <Field>
          <FieldLabel>Title</FieldLabel>
          <Input
            disabled={isPending}
            {...register("title")}
            placeholder="Bachelor of Elementary Education"
          />
          <FieldError errors={[errors.title]} />
        </Field>

        <Field>
          <FieldLabel>Batch Label</FieldLabel>
          <Input
            disabled={isPending}
            {...register("batchLabel")}
            placeholder="A.Y. 2024-2025"
          />
          <FieldError errors={[errors.batchLabel]} />
        </Field>

        <Field>
          <FieldLabel>Batch Year</FieldLabel>
          <Input type="number" disabled={isPending} {...register("batchYear")} />
          <FieldError errors={[errors.batchYear]} />
        </Field>

        <Field>
          <FieldLabel>Version</FieldLabel>
          <input type="hidden" {...register("versionTag")} />
          <Select
            value={watch("versionTag")}
            onValueChange={(value: "OLD" | "NEW") =>
              setValue("versionTag", value, { shouldValidate: true })
            }
          >
            <SelectTrigger className="w-full h-10">
              <SelectValue placeholder="Select version" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OLD">Old Curriculum</SelectItem>
              <SelectItem value="NEW">New Curriculum</SelectItem>
            </SelectContent>
          </Select>
          <FieldError errors={[errors.versionTag]} />
        </Field>

        <Field>
          <FieldLabel>Notes</FieldLabel>
          <Input
            disabled={isPending}
            {...register("notes")}
            placeholder="CHED revision reference"
          />
          <FieldError errors={[errors.notes]} />
        </Field>
      </div>

      <FormError message={error} />
      <FormSuccess message={success} />

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending || !hasCourses}>
          {isPending ? "Saving..." : "Create Curriculum"}
        </Button>
        <Button asChild variant="outline" type="button" disabled={isPending}>
          <Link href="/dashboard/curriculum">Back to List</Link>
        </Button>
      </div>
    </form>
  );
};

export default CreateCurriculumForm;
