"use client";

import * as z from "zod";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarRange } from "lucide-react";

import { SEMESTER_TERMS, type SemesterTermValue } from "@/lib/semester-terms";
import { UpdateCurriculumSubjectOfferingSchema } from "@/schemas";
import { updateCurriculumSubjectOffering } from "@/actions/curriculum";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";

type FormInput = z.input<typeof UpdateCurriculumSubjectOfferingSchema>;
type FormValues = z.output<typeof UpdateCurriculumSubjectOfferingSchema>;

type OfferingData = {
  id: string;
  subjectCode: string;
  yearLevel: number;
  semester: SemesterTermValue;
  displayOrder: number;
};

interface EditOfferingDialogProps {
  offering: OfferingData;
}

const EditOfferingDialog = ({ offering }: EditOfferingDialogProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(UpdateCurriculumSubjectOfferingSchema),
    defaultValues: {
      id: offering.id,
      yearLevel: offering.yearLevel,
      semester: offering.semester,
      displayOrder: offering.displayOrder,
    },
  });

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      reset({
        id: offering.id,
        yearLevel: offering.yearLevel,
        semester: offering.semester,
        displayOrder: offering.displayOrder,
      });
      setError("");
      setSuccess("");
    }
  };

  const onSubmit = (values: FormValues) => {
    setError("");
    setSuccess("");

    startTransition(() => {
      updateCurriculumSubjectOffering(values).then((data) => {
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
        <Button variant="ghost" className="w-full justify-start px-2 font-normal">
          <CalendarRange className="mr-2 h-4 w-4" />
          Edit Offering
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Curriculum Offering</DialogTitle>
          <DialogDescription>
            Update year level, semester, and display order for {offering.subjectCode} in this
            curriculum.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register("id")} />

          <Field>
            <FieldLabel>Year Level</FieldLabel>
            <Input type="number" min={1} max={6} disabled={isPending} {...register("yearLevel")} />
            <FieldError errors={[errors.yearLevel]} />
          </Field>

          <Field>
            <FieldLabel>Semester</FieldLabel>
            <input type="hidden" {...register("semester")} />
            <Select
              value={watch("semester")}
              onValueChange={(value: SemesterTermValue) =>
                setValue("semester", value, { shouldValidate: true })
              }
              disabled={isPending}
            >
              <SelectTrigger className="w-full h-10">
                <SelectValue placeholder="Select semester" />
              </SelectTrigger>
              <SelectContent>
                {SEMESTER_TERMS.map((term) => (
                  <SelectItem key={term} value={term}>
                    {term}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError errors={[errors.semester]} />
          </Field>

          <Field>
            <FieldLabel>Display Order</FieldLabel>
            <Input type="number" min={0} disabled={isPending} {...register("displayOrder")} />
            <FieldError errors={[errors.displayOrder]} />
          </Field>

          <FormError message={error} />
          <FormSuccess message={success} />

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Offering"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditOfferingDialog;
