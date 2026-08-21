"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, UserPlus, Users } from "lucide-react";

import {
  assignCurriculumToStudent,
  unassignCurriculumFromStudent,
} from "@/actions/curriculum";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";

type StudentOption = {
  id: string;
  studentId: string;
  fullName: string;
  yearLevel: number;
  course: string;
  curriculum: string;
  curriculumId: string | null;
};

type CurriculumInfo = {
  id: string;
  programCode: string;
  title: string;
  batchLabel: string;
  versionTag: "OLD" | "NEW";
  isActive: boolean;
};

interface AssignStudentsManagerProps {
  curriculum: CurriculumInfo;
  students: StudentOption[];
}

type AvailableFilter = "unassigned" | "other" | "all";

const YEAR_LEVEL_LABELS: Record<number, string> = {
  1: "1st Year",
  2: "2nd Year",
  3: "3rd Year",
  4: "4th Year",
};

function yearLabel(yearLevel: number) {
  return YEAR_LEVEL_LABELS[yearLevel] || `Year ${yearLevel}`;
}

function matchesQuery(student: StudentOption, query: string) {
  if (!query) {
    return true;
  }

  const haystack = `${student.studentId} ${student.fullName}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
}

const AssignStudentsManager = ({
  curriculum,
  students,
}: AssignStudentsManagerProps) => {
  const router = useRouter();
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const [assignedQuery, setAssignedQuery] = useState("");
  const [availableQuery, setAvailableQuery] = useState("");
  const [availableFilter, setAvailableFilter] =
    useState<AvailableFilter>("unassigned");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const assignedStudents = useMemo(
    () =>
      students.filter((student) => student.curriculumId === curriculum.id),
    [students, curriculum.id]
  );

  const availableStudents = useMemo(
    () =>
      students.filter((student) => student.curriculumId !== curriculum.id),
    [students, curriculum.id]
  );

  const unassignedCount = availableStudents.filter(
    (student) => !student.curriculumId
  ).length;
  const otherCurriculumCount = availableStudents.filter(
    (student) => Boolean(student.curriculumId)
  ).length;

  const visibleAssigned = assignedStudents.filter((student) =>
    matchesQuery(student, assignedQuery)
  );

  const visibleAvailable = availableStudents.filter((student) => {
    if (!matchesQuery(student, availableQuery)) {
      return false;
    }

    if (availableFilter === "unassigned") {
      return !student.curriculumId;
    }

    if (availableFilter === "other") {
      return Boolean(student.curriculumId);
    }

    return true;
  });

  const selectedStudents = availableStudents.filter((student) =>
    selectedIds.includes(student.id)
  );
  const selectedFromOther = selectedStudents.filter((student) =>
    Boolean(student.curriculumId)
  );

  const toggleSelected = (studentId: string, checked: boolean) => {
    setSelectedIds((current) =>
      checked
        ? [...current, studentId]
        : current.filter((id) => id !== studentId)
    );
  };

  const toggleVisible = (checked: boolean) => {
    const visibleIds = visibleAvailable.map((student) => student.id);

    setSelectedIds((current) => {
      if (checked) {
        return Array.from(new Set([...current, ...visibleIds]));
      }

      return current.filter((id) => !visibleIds.includes(id));
    });
  };

  const allVisibleSelected =
    visibleAvailable.length > 0 &&
    visibleAvailable.every((student) => selectedIds.includes(student.id));

  const handleAssign = () => {
    if (selectedIds.length === 0) {
      return;
    }

    setError("");
    setSuccess("");

    startTransition(async () => {
      for (const studentId of selectedIds) {
        const result = await assignCurriculumToStudent({
          studentId,
          curriculumId: curriculum.id,
        });

        if (result?.error) {
          setError(result.error);
          return;
        }
      }

      setSuccess(
        selectedIds.length === 1
          ? "Student assigned to this curriculum"
          : `${selectedIds.length} students assigned to this curriculum`
      );
      setSelectedIds([]);
      router.refresh();
    });
  };

  const handleUnassign = (studentId: string) => {
    setError("");
    setSuccess("");

    startTransition(() => {
      unassignCurriculumFromStudent(studentId).then((result) => {
        if (result?.error) {
          setError(result.error);
          return;
        }

        setSuccess("Student removed from this curriculum");
        router.refresh();
      });
    });
  };

  const filters: { id: AvailableFilter; label: string; count: number }[] = [
    { id: "unassigned", label: "Unassigned", count: unassignedCount },
    { id: "other", label: "Other curriculum", count: otherCurriculumCount },
    { id: "all", label: "All available", count: availableStudents.length },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>{curriculum.programCode}</CardTitle>
          <CardDescription>{curriculum.title}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{curriculum.batchLabel}</Badge>
          <Badge variant={curriculum.versionTag === "NEW" ? "default" : "outline"}>
            {curriculum.versionTag === "NEW" ? "New curriculum" : "Old curriculum"}
          </Badge>
          <Badge variant={curriculum.isActive ? "secondary" : "outline"}>
            {curriculum.isActive ? "Active" : "Inactive"}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {assignedStudents.length} assigned · {unassignedCount} unassigned
          </span>
        </CardContent>
      </Card>

      <FormError message={error} />
      <FormSuccess message={success} />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader className="border-b">
            <CardTitle>Assigned to this curriculum</CardTitle>
            <CardDescription>
              Students currently under {curriculum.programCode}{" "}
              {curriculum.batchLabel}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={assignedQuery}
                onChange={(event) => setAssignedQuery(event.target.value)}
                placeholder="Search assigned students"
                className="pl-8"
              />
            </div>

            {assignedStudents.length === 0 ? (
              <Empty className="border border-dashed">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Users />
                  </EmptyMedia>
                  <EmptyTitle>No students assigned yet</EmptyTitle>
                  <EmptyDescription>
                    Use the list on the right to add unassigned students to this
                    curriculum.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : visibleAssigned.length === 0 ? (
              <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                No assigned students match “{assignedQuery}”.
              </p>
            ) : (
              <div className="space-y-2">
                {visibleAssigned.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-start justify-between gap-3 rounded-xl border p-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">{student.fullName}</p>
                      <p className="text-sm text-muted-foreground">
                        {student.studentId} · {yearLabel(student.yearLevel)}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleUnassign(student.id)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="border-b">
            <CardTitle>Add students</CardTitle>
            <CardDescription>
              Select students to place in this curriculum. Students already
              assigned here are hidden from this list.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {students.length === 0 ? (
              <Empty className="border border-dashed">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <UserPlus />
                  </EmptyMedia>
                  <EmptyTitle>No student records yet</EmptyTitle>
                  <EmptyDescription>
                    Register a student first, then return here to assign them.{" "}
                    <Link href="/dashboard/students/register">
                      Register student
                    </Link>
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <>
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={availableQuery}
                    onChange={(event) => setAvailableQuery(event.target.value)}
                    placeholder="Search by name or student ID"
                    className="pl-8"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {filters.map((filter) => (
                    <Button
                      key={filter.id}
                      type="button"
                      size="sm"
                      variant={
                        availableFilter === filter.id ? "default" : "outline"
                      }
                      onClick={() => setAvailableFilter(filter.id)}
                    >
                      {filter.label}
                      <Badge
                        variant={
                          availableFilter === filter.id ? "secondary" : "outline"
                        }
                        className="ml-1"
                      >
                        {filter.count}
                      </Badge>
                    </Button>
                  ))}
                </div>

                {selectedFromOther.length > 0 && (
                  <Alert>
                    <AlertTitle>These students will be moved</AlertTitle>
                    <AlertDescription>
                      {selectedFromOther.length === 1
                        ? "1 selected student is already assigned to another curriculum and will be transferred here."
                        : `${selectedFromOther.length} selected students are already assigned to another curriculum and will be transferred here.`}
                    </AlertDescription>
                  </Alert>
                )}

                {visibleAvailable.length === 0 ? (
                  <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                    {availableFilter === "unassigned"
                      ? "No unassigned students match this search."
                      : "No available students match this filter."}
                  </p>
                ) : (
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
                      <Checkbox
                        checked={allVisibleSelected}
                        onCheckedChange={(checked) =>
                          toggleVisible(checked === true)
                        }
                        disabled={isPending}
                      />
                      Select all shown
                    </label>

                    <div className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
                      {visibleAvailable.map((student) => {
                        const checked = selectedIds.includes(student.id);
                        const assignedElsewhere = Boolean(student.curriculumId);

                        return (
                          <label
                            key={student.id}
                            className={cn(
                              "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
                              checked
                                ? "border-primary bg-primary/5 ring-1 ring-primary"
                                : "hover:bg-muted/40"
                            )}
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(next) =>
                                toggleSelected(student.id, next === true)
                              }
                              disabled={isPending}
                              className="mt-0.5"
                            />
                            <div className="min-w-0 flex-1 space-y-1.5">
                              <div>
                                <p className="font-medium">{student.fullName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {student.studentId} · {yearLabel(student.yearLevel)}
                                </p>
                              </div>
                              {assignedElsewhere ? (
                                <Badge variant="outline">
                                  Currently: {student.curriculum}
                                </Badge>
                              ) : (
                                <Badge variant="secondary">Unassigned</Badge>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 border-t pt-4">
                  <p className="text-sm text-muted-foreground">
                    {selectedIds.length === 0
                      ? "Select one or more students"
                      : `${selectedIds.length} selected`}
                  </p>
                  <Button
                    onClick={handleAssign}
                    disabled={isPending || selectedIds.length === 0}
                  >
                    {isPending
                      ? "Assigning..."
                      : selectedIds.length <= 1
                        ? "Assign to curriculum"
                        : `Assign ${selectedIds.length} students`}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AssignStudentsManager;
