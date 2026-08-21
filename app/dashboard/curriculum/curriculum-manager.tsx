"use client";

import { useMemo, useState, useTransition } from "react";

import {
  addSubjectPrerequisite,
  assignCurriculumToStudent,
  assignSubjectToCurriculum,
  createCurriculum,
  createSubject,
} from "@/actions/curriculum";
import { SEMESTER_TERMS, type SemesterTermValue } from "@/lib/semester-terms";
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
import type { CourseOption } from "@/lib/courses";

type CurriculumItem = {
  id: string;
  programCode: string;
  title: string;
  batchLabel: string;
  batchYear: number;
  versionTag: "OLD" | "NEW";
  isActive: boolean;
  subjectsCount: number;
  studentsCount: number;
};

type SubjectItem = {
  id: string;
  code: string;
  description: string;
  units: number;
};

type AssignmentItem = {
  id: string;
  curriculumLabel: string;
  subjectCode: string;
  yearLevel: number;
  semester: SemesterTermValue;
};

type PrerequisiteItem = {
  id: string;
  subjectCode: string;
  prerequisiteCode: string;
};

type StudentItem = {
  id: string;
  studentId: string;
  fullName: string;
  curriculumId: string | null;
  curriculum: string;
};

interface CurriculumManagerProps {
  curriculums: CurriculumItem[];
  subjects: SubjectItem[];
  assignments: AssignmentItem[];
  prerequisites: PrerequisiteItem[];
  students: StudentItem[];
  courses: CourseOption[];
}

const CurriculumManager = ({
  curriculums,
  subjects,
  assignments,
  prerequisites,
  students,
  courses,
}: CurriculumManagerProps) => {
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const [activeProgram, setActiveProgram] = useState<string>("ALL");

  const [curriculumForm, setCurriculumForm] = useState({
    programCode: courses[0]?.code ?? "",
    title: courses[0]?.title ?? "",
    batchLabel: "A.Y. 2026-2027",
    batchYear: "2026",
    versionTag: "NEW" as "OLD" | "NEW",
    isActive: true,
    notes: "",
  });

  const [subjectForm, setSubjectForm] = useState({
    code: "",
    description: "",
    units: "3",
  });

  const [offeringForm, setOfferingForm] = useState({
    curriculumId: curriculums[0]?.id || "",
    subjectId: subjects[0]?.id || "",
    yearLevel: "1",
    semester: "FIRST" as SemesterTermValue,
    displayOrder: "0",
  });

  const [prerequisiteForm, setPrerequisiteForm] = useState({
    subjectId: subjects[0]?.id || "",
    prerequisiteId: subjects[1]?.id || subjects[0]?.id || "",
  });

  const [studentAssignmentForm, setStudentAssignmentForm] = useState({
    studentId: students[0]?.id || "",
    curriculumId: curriculums[0]?.id || "",
  });

  const curriculumSelectItems = useMemo(
    () =>
      curriculums
        .filter((curriculum) =>
          activeProgram === "ALL" ? true : curriculum.programCode === activeProgram
        )
        .map((curriculum) => ({
          label: `${curriculum.programCode} - ${curriculum.batchLabel} (${curriculum.versionTag})`,
          value: curriculum.id,
        })),
    [curriculums, activeProgram]
  );

  const visibleCurriculums = useMemo(
    () =>
      curriculums.filter((curriculum) =>
        activeProgram === "ALL" ? true : curriculum.programCode === activeProgram
      ),
    [curriculums, activeProgram]
  );

  const subjectSelectItems = useMemo(
    () =>
      subjects.map((subject) => ({
        label: `${subject.code} (${subject.units}u)`,
        value: subject.id,
      })),
    [subjects]
  );

  const studentSelectItems = useMemo(
    () =>
      students.map((student) => ({
        value: student.id,
        label: `${student.studentId} - ${student.fullName}`,
      })),
    [students]
  );

  const sortedCurriculums = useMemo(
    () =>
      [...curriculums].sort((a, b) => {
        const byProgram = a.programCode.localeCompare(b.programCode);
        if (byProgram !== 0) return byProgram;
        return b.batchYear - a.batchYear;
      }),
    [curriculums]
  );

  const handleCreateCurriculum = () => {
    setError("");
    setSuccess("");

    startTransition(() => {
      createCurriculum({
        programCode: curriculumForm.programCode,
        title: curriculumForm.title,
        batchLabel: curriculumForm.batchLabel,
        batchYear: Number(curriculumForm.batchYear),
        versionTag: curriculumForm.versionTag,
        isActive: curriculumForm.isActive,
        notes: curriculumForm.notes,
      }).then((result) => {
        if (result?.error) {
          setError(result.error);
          return;
        }

        setSuccess(result?.success || "Curriculum created");
      });
    });
  };

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
      });
    });
  };

  const handleAssignOffering = () => {
    setError("");
    setSuccess("");

    startTransition(() => {
      assignSubjectToCurriculum({
        curriculumId: offeringForm.curriculumId,
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
      });
    });
  };

  const handleAssignCurriculumToStudent = () => {
    setError("");
    setSuccess("");

    startTransition(() => {
      assignCurriculumToStudent({
        studentId: studentAssignmentForm.studentId,
        curriculumId: studentAssignmentForm.curriculumId,
      }).then((result) => {
        if (result?.error) {
          setError(result.error);
          return;
        }

        setSuccess(result?.success || "Curriculum assigned to student");
      });
    });
  };

  return (
    <div className="space-y-8">
      <FormError message={error} />
      <FormSuccess message={success} />

      <section className="rounded-lg border p-5 space-y-4">
        <h3 className="text-lg font-semibold">1. Curriculum List</h3>
        <div className="space-y-2 text-sm">
          {sortedCurriculums.length === 0 && <p>No curriculum versions yet.</p>}
          {sortedCurriculums.map((curriculum) => (
            <div key={curriculum.id} className="border rounded-md p-3">
              <p className="font-medium">
                {curriculum.programCode} Curriculum {curriculum.batchYear} - {curriculum.versionTag === "OLD" ? "Old Curriculum" : "New Curriculum"}
              </p>
              <p className="text-muted-foreground">
                {curriculum.batchLabel} | Subjects: {curriculum.subjectsCount} | Assigned Students: {curriculum.studentsCount}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border p-5 space-y-4">
        <h3 className="text-lg font-semibold">2. Create Curriculum</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel>Program Code</FieldLabel>
            <Select
              value={curriculumForm.programCode}
              onValueChange={(value: string) => {
                const matchedProgram = courses.find((program) => program.code === value);
                setCurriculumForm((prev) => ({
                  ...prev,
                  programCode: value,
                  title: matchedProgram?.title || prev.title,
                }));
              }}
            >
              <SelectTrigger className="w-full h-10">
                <SelectValue placeholder="Select program" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((program) => (
                  <SelectItem key={program.code} value={program.code}>
                    {program.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Title</FieldLabel>
            <Input
              value={curriculumForm.title}
              onChange={(e) =>
                setCurriculumForm((prev) => ({ ...prev, title: e.target.value }))
              }
              disabled={isPending}
              placeholder="Bachelor of Science in Computer Science"
            />
          </Field>
          <Field>
            <FieldLabel>Batch Label</FieldLabel>
            <Input
              value={curriculumForm.batchLabel}
              onChange={(e) =>
                setCurriculumForm((prev) => ({ ...prev, batchLabel: e.target.value }))
              }
              disabled={isPending}
              placeholder="A.Y. 2026-2027"
            />
          </Field>
          <Field>
            <FieldLabel>Batch Year</FieldLabel>
            <Input
              type="number"
              value={curriculumForm.batchYear}
              onChange={(e) =>
                setCurriculumForm((prev) => ({ ...prev, batchYear: e.target.value }))
              }
              disabled={isPending}
              placeholder="2026"
            />
          </Field>
          <Field>
            <FieldLabel>Version Tag</FieldLabel>
            <Select
              value={curriculumForm.versionTag}
              onValueChange={(value: "OLD" | "NEW") =>
                setCurriculumForm((prev) => ({ ...prev, versionTag: value }))
              }
            >
              <SelectTrigger className="w-full h-10">
                <SelectValue placeholder="Select version" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OLD">OLD</SelectItem>
                <SelectItem value="NEW">NEW</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Notes</FieldLabel>
            <Input
              value={curriculumForm.notes}
              onChange={(e) =>
                setCurriculumForm((prev) => ({ ...prev, notes: e.target.value }))
              }
              disabled={isPending}
              placeholder="CHED update for batch 2026"
            />
          </Field>
        </div>
        <Button disabled={isPending} onClick={handleCreateCurriculum}>
          {isPending ? "Saving..." : "Create Curriculum"}
        </Button>
      </section>

      <section className="rounded-lg border p-5 space-y-4">
        <h3 className="text-lg font-semibold">3. Add Subjects Per Curriculum</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <Field>
            <FieldLabel>Code</FieldLabel>
            <Input
              value={subjectForm.code}
              onChange={(e) =>
                setSubjectForm((prev) => ({ ...prev, code: e.target.value }))
              }
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
              onChange={(e) =>
                setSubjectForm((prev) => ({ ...prev, units: e.target.value }))
              }
              disabled={isPending}
              placeholder="3"
            />
          </Field>
        </div>
        <Button disabled={isPending} onClick={handleCreateSubject}>
          {isPending ? "Saving..." : "Create Subject"}
        </Button>
      </section>

      <section className="rounded-lg border p-5 space-y-4">
        <h3 className="text-lg font-semibold">Assign Subject to Curriculum</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel>Curriculum</FieldLabel>
            <Select
              value={offeringForm.curriculumId}
              onValueChange={(value) =>
                setOfferingForm((prev) => ({ ...prev, curriculumId: value }))
              }
            >
              <SelectTrigger className="w-full h-10">
                <SelectValue placeholder="Select curriculum" />
              </SelectTrigger>
              <SelectContent>
                {curriculumSelectItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
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
                {subjectSelectItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
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
        </div>
        <Button disabled={isPending} onClick={handleAssignOffering}>
          {isPending ? "Saving..." : "Assign Subject"}
        </Button>
      </section>

      <section className="rounded-lg border p-5 space-y-4">
        <h3 className="text-lg font-semibold">Add Prerequisite</h3>
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
                {subjectSelectItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Prerequisite</FieldLabel>
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
                {subjectSelectItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Button disabled={isPending} onClick={handleAddPrerequisite}>
          {isPending ? "Saving..." : "Add Prerequisite"}
        </Button>
      </section>

      <section className="rounded-lg border p-5 space-y-4">
        <h3 className="text-lg font-semibold">4. Assign Curriculum To Student</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel>Student</FieldLabel>
            <Select
              value={studentAssignmentForm.studentId}
              onValueChange={(value) =>
                setStudentAssignmentForm((prev) => ({ ...prev, studentId: value }))
              }
            >
              <SelectTrigger className="w-full h-10">
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {studentSelectItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Curriculum</FieldLabel>
            <Select
              value={studentAssignmentForm.curriculumId}
              onValueChange={(value) =>
                setStudentAssignmentForm((prev) => ({ ...prev, curriculumId: value }))
              }
            >
              <SelectTrigger className="w-full h-10">
                <SelectValue placeholder="Select curriculum" />
              </SelectTrigger>
              <SelectContent>
                {curriculumSelectItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Button disabled={isPending} onClick={handleAssignCurriculumToStudent}>
          {isPending ? "Saving..." : "Assign Curriculum"}
        </Button>
      </section>

      <section className="rounded-lg border p-5 space-y-4">
        <h3 className="text-lg font-semibold">5. Student Evaluation Uses Assigned Curriculum</h3>
        <p className="text-sm text-muted-foreground">
          Evaluation will read each student&apos;s assigned curriculum version from the student record.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={activeProgram === "ALL" ? "default" : "outline"}
            onClick={() => setActiveProgram("ALL")}
            disabled={isPending}
          >
            All Programs
          </Button>
          {courses.map((program) => (
            <Button
              key={program.code}
              variant={activeProgram === program.code ? "default" : "outline"}
              onClick={() => setActiveProgram(program.code)}
              disabled={isPending}
            >
              {program.code}
            </Button>
          ))}
        </div>
        <div className="space-y-2 text-sm">
          {visibleCurriculums.length === 0 && <p>No curriculum versions yet for this program.</p>}
          {visibleCurriculums.map((curriculum) => (
            <div key={curriculum.id} className="border rounded-md p-3">
              <p className="font-medium">
                {curriculum.programCode} - {curriculum.batchLabel} ({curriculum.versionTag})
              </p>
              <p className="text-muted-foreground">
                {curriculum.title} | Subjects: {curriculum.subjectsCount} | Assigned Students: {curriculum.studentsCount}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border p-5 space-y-4">
        <h3 className="text-lg font-semibold">Assigned Offerings</h3>
        <div className="space-y-2 text-sm">
          {assignments.length === 0 && <p>No offerings yet.</p>}
          {assignments.map((offering) => (
            <div key={offering.id} className="border rounded-md p-3">
              <p className="font-medium">{offering.subjectCode}</p>
              <p className="text-muted-foreground">
                {offering.curriculumLabel} | Year {offering.yearLevel} - {offering.semester}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border p-5 space-y-4">
        <h3 className="text-lg font-semibold">Prerequisite Links</h3>
        <div className="space-y-2 text-sm">
          {prerequisites.length === 0 && <p>No prerequisites yet.</p>}
          {prerequisites.map((item) => (
            <div key={item.id} className="border rounded-md p-3">
              <p className="font-medium">{item.subjectCode}</p>
              <p className="text-muted-foreground">Requires: {item.prerequisiteCode}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default CurriculumManager;
