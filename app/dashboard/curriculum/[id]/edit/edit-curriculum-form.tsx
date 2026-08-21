"use client";

import * as z from "zod";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { updateCurriculum } from "@/actions/curriculum";
import { UpdateCurriculumSchema } from "@/schemas";
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

type FormInput = z.input<typeof UpdateCurriculumSchema>;
type FormValues = z.output<typeof UpdateCurriculumSchema>;

type CurriculumData = {
  id: string;
  programCode: string;
  title: string;
  batchLabel: string;
  batchYear: number;
  versionTag: "OLD" | "NEW";
  isActive: boolean;
  notes: string | null;
};

interface EditCurriculumFormProps {
  curriculum: CurriculumData;
  courses: CourseOption[];
}

const EditCurriculumForm = ({ curriculum, courses }: EditCurriculumFormProps) => {
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
    resolver: zodResolver(UpdateCurriculumSchema),
    defaultValues: {
      id: curriculum.id,
      programCode: curriculum.programCode,
      title: curriculum.title,
      batchLabel: curriculum.batchLabel,
      batchYear: curriculum.batchYear,
      versionTag: curriculum.versionTag,
      isActive: curriculum.isActive,
      notes: curriculum.notes || "",
    },
  });

  const onSubmit = (values: FormValues) => {
    setError("");
    setSuccess("");

    startTransition(() => {
      updateCurriculum(values).then((data) => {
        if (data?.error) {
          setError(data.error);
          return;
        }

        if (data?.success) {
          setSuccess(data.success);
          router.refresh();
        }
      });
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
      <input type="hidden" {...register("id")} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel>Course</FieldLabel>
          <input type="hidden" {...register("programCode")} />
          <Select
            value={watch("programCode")}
            onValueChange={(value) => {
              const matched = courses.find((course) => course.code === value);
              setValue("programCode", value, { shouldValidate: true });
              if (matched) {
                setValue("title", matched.title, { shouldValidate: true });
              }
            }}
            disabled={isPending || courses.length === 0}
          >
            <SelectTrigger className="w-full h-10">
              <SelectValue placeholder="Select course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course) => (
                <SelectItem key={course.code} value={course.code}>
                  {course.code} — {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError errors={[errors.programCode]} />
        </Field>

        <Field>
          <FieldLabel>Title</FieldLabel>
          <Input disabled={isPending} {...register("title")} />
          <FieldError errors={[errors.title]} />
        </Field>

        <Field>
          <FieldLabel>Batch Label</FieldLabel>
          <Input disabled={isPending} {...register("batchLabel")} />
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
          <FieldLabel>Status</FieldLabel>
          <Select
            value={watch("isActive") ? "active" : "inactive"}
            onValueChange={(value) =>
              setValue("isActive", value === "active", { shouldValidate: true })
            }
          >
            <SelectTrigger className="w-full h-10">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field className="sm:col-span-2">
          <FieldLabel>Notes</FieldLabel>
          <Input disabled={isPending} {...register("notes")} />
          <FieldError errors={[errors.notes]} />
        </Field>
      </div>

      <FormError message={error} />
      <FormSuccess message={success} />

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
        <Button asChild variant="outline" type="button" disabled={isPending}>
          <Link href="/dashboard/curriculum">Back to List</Link>
        </Button>
      </div>
    </form>
  );
};

export default EditCurriculumForm;
