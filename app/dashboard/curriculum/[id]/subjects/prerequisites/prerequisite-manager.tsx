"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  addSubjectPrerequisite,
  removeSubjectPrerequisite,
} from "@/actions/curriculum";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";

type SubjectOption = {
  id: string;
  code: string;
};

type PrerequisiteItem = {
  id: string;
  subjectId: string;
  prerequisiteId: string;
  subjectCode: string;
  prerequisiteCode: string;
};

interface PrerequisiteManagerProps {
  subjects: SubjectOption[];
  prerequisites: PrerequisiteItem[];
}

const PrerequisiteManager = ({ subjects, prerequisites }: PrerequisiteManagerProps) => {
  const router = useRouter();
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();

  const [values, setValues] = useState({
    subjectId: subjects[0]?.id || "",
    prerequisiteId: subjects[1]?.id || subjects[0]?.id || "",
  });

  const handleAdd = () => {
    setError("");
    setSuccess("");

    startTransition(() => {
      addSubjectPrerequisite({
        subjectId: values.subjectId,
        prerequisiteId: values.prerequisiteId,
      }).then((result) => {
        if (result?.error) {
          setError(result.error);
          return;
        }

        setSuccess(result?.success || "Prerequisite added");
        router.refresh();
      });
    });
  };

  const handleRemove = (id: string) => {
    setError("");
    setSuccess("");

    startTransition(() => {
      removeSubjectPrerequisite(id).then((result) => {
        if (result?.error) {
          setError(result.error);
          return;
        }

        setSuccess(result?.success || "Prerequisite removed");
        router.refresh();
      });
    });
  };

  return (
    <div className="space-y-6">
      <FormError message={error} />
      <FormSuccess message={success} />

      <section className="rounded-lg border p-5 space-y-4">
        <h3 className="text-lg font-semibold">Add Subject Prerequisite</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel>Subject</FieldLabel>
            <Select
              value={values.subjectId}
              onValueChange={(value) => setValues((prev) => ({ ...prev, subjectId: value }))}
            >
              <SelectTrigger className="w-full h-10">
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>Prerequisite Subject</FieldLabel>
            <Select
              value={values.prerequisiteId}
              onValueChange={(value) =>
                setValues((prev) => ({ ...prev, prerequisiteId: value }))
              }
            >
              <SelectTrigger className="w-full h-10">
                <SelectValue placeholder="Select prerequisite" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={`prereq-${subject.id}`} value={subject.id}>
                    {subject.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Button
          disabled={isPending || subjects.length < 2 || !values.subjectId || !values.prerequisiteId}
          onClick={handleAdd}
        >
          {isPending ? "Saving..." : "Add Prerequisite"}
        </Button>
      </section>

      <section className="rounded-lg border p-5 space-y-4">
        <h3 className="text-lg font-semibold">Existing Prerequisites</h3>
        <div className="space-y-2 text-sm">
          {prerequisites.length === 0 && <p>No prerequisite mappings yet.</p>}
          {prerequisites.map((item) => (
            <div key={item.id} className="rounded-md border p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">
                  {item.subjectCode} requires {item.prerequisiteCode}
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleRemove(item.id)}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default PrerequisiteManager;
