"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  addSubjectPrerequisite,
  assignSubjectToCurriculum,
  createSubject,
} from "@/actions/curriculum";
import { SEMESTER_TERMS, type SemesterTermValue } from "@/lib/semester-terms";
import EditOfferingDialog from "./edit-offering-dialog";
import EditSubjectDialog from "./edit-subject-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  description: string;
  units: number;
};

type OfferingItem = {
  id: string;
  subjectId: string;
  subjectCode: string;
  description: string;
  units: number;
  yearLevel: number;
  semester: SemesterTermValue;
  displayOrder: number;
};

type PrerequisiteItem = {
  id: string;
  subjectId: string;
  prerequisiteId: string;
  subjectCode: string;
  prerequisiteCode: string;
};

interface SubjectsManagerProps {
  curriculumId: string;
  subjects: SubjectOption[];
  offerings: OfferingItem[];
  prerequisites: PrerequisiteItem[];
}

const SubjectsManager = ({
  curriculumId,
  subjects,
  offerings,
  prerequisites,
}: SubjectsManagerProps) => {
  const router = useRouter();
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();

  const [subjectForm, setSubjectForm] = useState({
    code: "",
    description: "",
    units: "3",
  });

  const [offeringForm, setOfferingForm] = useState({
    subjectId: subjects[0]?.id || "",
    yearLevel: "1",
    semester: "FIRST" as SemesterTermValue,
    displayOrder: "0",
  });

  const [prerequisiteForm, setPrerequisiteForm] = useState({
    subjectId: offerings[0]?.subjectId || "",
    prerequisiteId: offerings[1]?.subjectId || offerings[0]?.subjectId || "",
  });

  const handleCreateSubject = () => {
    setError("");
    setSuccess("");

    startTransition(() => {
      createSubject({
        code: subjectForm.code,
        description: subjectForm.description,
        units: Number(subjectForm.units),
      }).then((result) => {
        if (result?.error) {
          setError(result.error);
          return;
        }

        setSuccess(result?.success || "Subject created");
        setSubjectForm({ code: "", description: "", units: "3" });
        router.refresh();
      });
    });
  };

  const handleAssignSubject = () => {
    setError("");
    setSuccess("");

    startTransition(() => {
      assignSubjectToCurriculum({
        curriculumId,
        subjectId: offeringForm.subjectId,
        yearLevel: Number(offeringForm.yearLevel),
        semester: offeringForm.semester,
        displayOrder: Number(offeringForm.displayOrder),
      }).then((result) => {
        if (result?.error) {
          setError(result.error);
          return;
        }

        setSuccess(result?.success || "Subject assigned");
        router.refresh();
      });
    });
  };

  const handleAddPrerequisite = () => {
    setError("");
    setSuccess("");

    startTransition(() => {
      addSubjectPrerequisite({
        subjectId: prerequisiteForm.subjectId,
        prerequisiteId: prerequisiteForm.prerequisiteId,
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

  return (
    <div className="space-y-6">
      <FormError message={error} />
      <FormSuccess message={success} />

      <section className="rounded-lg border p-5 space-y-4">
        <h3 className="text-lg font-semibold">Create Subject</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <Field>
            <FieldLabel>Code</FieldLabel>
            <Input
              value={subjectForm.code}
              onChange={(e) => setSubjectForm((prev) => ({ ...prev, code: e.target.value }))}
              disabled={isPending}
              placeholder="CS101"
            />
          </Field>
          <Field>
            <FieldLabel>Description</FieldLabel>
            <Input
              value={subjectForm.description}
              onChange={(e) =>
                setSubjectForm((prev) => ({ ...prev, description: e.target.value }))
              }
              disabled={isPending}
              placeholder="Introduction to Computing"
            />
          </Field>
          <Field>
            <FieldLabel>Units</FieldLabel>
            <Input
              type="number"
              value={subjectForm.units}
              onChange={(e) => setSubjectForm((prev) => ({ ...prev, units: e.target.value }))}
              disabled={isPending}
            />
          </Field>
        </div>
        <Button disabled={isPending} onClick={handleCreateSubject}>
          {isPending ? "Saving..." : "Create Subject"}
        </Button>
      </section>

      <section className="rounded-lg border p-5 space-y-4">
        <h3 className="text-lg font-semibold">Assign Subject to This Curriculum</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel>Subject</FieldLabel>
            <Select
              value={offeringForm.subjectId}
              onValueChange={(value) =>
                setOfferingForm((prev) => ({ ...prev, subjectId: value }))
              }
            >
              <SelectTrigger className="w-full h-10">
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.code} ({subject.units}u)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>Year Level</FieldLabel>
            <Input
              type="number"
              value={offeringForm.yearLevel}
              onChange={(e) =>
                setOfferingForm((prev) => ({ ...prev, yearLevel: e.target.value }))
              }
              disabled={isPending}
            />
          </Field>

          <Field>
            <FieldLabel>Semester</FieldLabel>
            <Select
              value={offeringForm.semester}
              onValueChange={(value: SemesterTermValue) =>
                setOfferingForm((prev) => ({ ...prev, semester: value }))
              }
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
          </Field>

          <Field>
            <FieldLabel>Display Order</FieldLabel>
            <Input
              type="number"
              value={offeringForm.displayOrder}
              onChange={(e) =>
                setOfferingForm((prev) => ({ ...prev, displayOrder: e.target.value }))
              }
              disabled={isPending}
            />
          </Field>
        </div>
        <Button disabled={isPending || subjects.length === 0} onClick={handleAssignSubject}>
          {isPending ? "Saving..." : "Assign Subject"}
        </Button>
      </section>

      <section className="rounded-lg border p-5 space-y-4">
        <h3 className="text-lg font-semibold">Current Subjects in Curriculum</h3>
        <div className="space-y-2 text-sm">
          {offerings.length === 0 && <p>No subjects assigned yet.</p>}
          {offerings.map((offering) => (
            <div key={offering.id} className="rounded-md border p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-medium">{offering.subjectCode} - {offering.description}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <EditOfferingDialog
                    offering={{
                      id: offering.id,
                      subjectCode: offering.subjectCode,
                      yearLevel: offering.yearLevel,
                      semester: offering.semester,
                      displayOrder: offering.displayOrder,
                    }}
                  />
                  <EditSubjectDialog
                    subject={{
                      subjectId: offering.subjectId,
                      code: offering.subjectCode,
                      description: offering.description,
                      units: offering.units,
                    }}
                  />
                </div>
              </div>
              <p className="text-muted-foreground">
                {offering.units} units | Year {offering.yearLevel} - {offering.semester}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border p-5 space-y-4">
        <h3 className="text-lg font-semibold">Manage Prerequisites</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel>Subject</FieldLabel>
            <Select
              value={prerequisiteForm.subjectId}
              onValueChange={(value) =>
                setPrerequisiteForm((prev) => ({ ...prev, subjectId: value }))
              }
            >
              <SelectTrigger className="w-full h-10">
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {offerings.map((offering) => (
                  <SelectItem key={`subject-${offering.id}`} value={offering.subjectId}>
                    {offering.subjectCode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>Prerequisite Subject</FieldLabel>
            <Select
              value={prerequisiteForm.prerequisiteId}
              onValueChange={(value) =>
                setPrerequisiteForm((prev) => ({ ...prev, prerequisiteId: value }))
              }
            >
              <SelectTrigger className="w-full h-10">
                <SelectValue placeholder="Select prerequisite" />
              </SelectTrigger>
              <SelectContent>
                {offerings.map((offering) => (
                  <SelectItem key={`prereq-${offering.id}`} value={offering.subjectId}>
                    {offering.subjectCode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Button
          disabled={
            isPending ||
            offerings.length < 2 ||
            !prerequisiteForm.subjectId ||
            !prerequisiteForm.prerequisiteId
          }
          onClick={handleAddPrerequisite}
        >
          {isPending ? "Saving..." : "Add Prerequisite"}
        </Button>

        <div className="space-y-2 text-sm">
          {prerequisites.length === 0 && <p>No prerequisite mappings yet.</p>}
          {prerequisites.map((item) => (
            <div key={item.id} className="rounded-md border p-3">
              <p className="font-medium">
                {item.subjectCode} requires {item.prerequisiteCode}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default SubjectsManager;
