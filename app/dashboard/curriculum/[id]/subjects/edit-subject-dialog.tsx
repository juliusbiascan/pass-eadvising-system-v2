"use client";

import * as z from "zod";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen } from "lucide-react";

import { UpdateSubjectSchema } from "@/schemas";
import { updateSubject } from "@/actions/curriculum";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";

type FormInput = z.input<typeof UpdateSubjectSchema>;
type FormValues = z.output<typeof UpdateSubjectSchema>;

type SubjectData = {
  subjectId: string;
  code: string;
  description: string;
  units: number;
};

interface EditSubjectDialogProps {
  subject: SubjectData;
  compact?: boolean;
}

const EditSubjectDialog = ({ subject, compact = false }: EditSubjectDialogProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(UpdateSubjectSchema),
    defaultValues: {
      id: subject.subjectId,
      code: subject.code,
      description: subject.description,
      units: subject.units,
    },
  });

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      reset({
        id: subject.subjectId,
        code: subject.code,
        description: subject.description,
        units: subject.units,
      });
      setError("");
      setSuccess("");
    }
  };

  const onSubmit = (values: FormValues) => {
    setError("");
    setSuccess("");

    startTransition(() => {
      updateSubject(values).then((data) => {
        if (data?.error) {
          setError(data.error);
          return;
        }
        if (data?.success) {
          setSuccess(data.success);
          router.refresh();
          setOpen(false);
        }
      });
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {compact ? (
          <Button variant="outline" size="sm">
            Edit
          </Button>
        ) : (
          <Button variant="ghost" className="w-full justify-start px-2 font-normal">
            <BookOpen className="mr-2 h-4 w-4" />
            Edit Subject Metadata
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Subject Metadata</DialogTitle>
          <DialogDescription>
            Update code, description, and units. Changes apply wherever this subject is used.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register("id")} />

          <Field>
            <FieldLabel>Subject Code</FieldLabel>
            <Input disabled={isPending} {...register("code")} />
            <FieldError errors={[errors.code]} />
          </Field>

          <Field>
            <FieldLabel>Description</FieldLabel>
            <Input disabled={isPending} {...register("description")} />
            <FieldError errors={[errors.description]} />
          </Field>

          <Field>
            <FieldLabel>Units</FieldLabel>
            <Input type="number" min={1} max={10} disabled={isPending} {...register("units")} />
            <FieldError errors={[errors.units]} />
          </Field>

          <FormError message={error} />
          <FormSuccess message={success} />

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Subject"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditSubjectDialog;
