"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, MoreHorizontal, Plus } from "lucide-react";

import {
  createCourse,
  deleteCourse,
  loadInitialCourses,
  updateCourse,
} from "@/actions/course";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";

export type CourseRecord = {
  id: string;
  code: string;
  title: string;
  isActive: boolean;
  curriculumsCount: number;
  createdAt: Date;
};

export type CourseTemplate = {
  code: string;
  title: string;
};

type CourseFormState = {
  code: string;
  title: string;
  isActive: boolean;
};

const emptyForm: CourseFormState = {
  code: "",
  title: "",
  isActive: true,
};

interface CoursesManagerProps {
  courses: CourseRecord[];
  templateCourses: CourseTemplate[];
}

const CoursesManager = ({ courses, templateCourses }: CoursesManagerProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<CourseRecord | null>(null);
  const [deleting, setDeleting] = useState<CourseRecord | null>(null);
  const [form, setForm] = useState<CourseFormState>(emptyForm);
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();

  const resetMessages = () => {
    setError(undefined);
    setSuccess(undefined);
  };

  const openEdit = (course: CourseRecord) => {
    resetMessages();
    setForm({
      code: course.code,
      title: course.title,
      isActive: course.isActive,
    });
    setEditing(course);
  };

  const handleCreate = () => {
    resetMessages();
    startTransition(() => {
      createCourse(form).then((result) => {
        if (result?.error) {
          setError(result.error);
          return;
        }
        setSuccess(result?.success || "Course created");
        setCreateOpen(false);
        setForm(emptyForm);
        router.refresh();
      });
    });
  };

  const handleUpdate = () => {
    if (!editing) return;
    resetMessages();
    startTransition(() => {
      updateCourse({ id: editing.id, ...form }).then((result) => {
        if (result?.error) {
          setError(result.error);
          return;
        }
        setSuccess(result?.success || "Course updated");
        setEditing(null);
        router.refresh();
      });
    });
  };

  const handleLoadInitial = () => {
    resetMessages();
    startTransition(() => {
      loadInitialCourses().then((result) => {
        if (result?.error) {
          setError(result.error);
          return;
        }
        setSuccess(result?.success || "Initial courses loaded");
        router.refresh();
      });
    });
  };

  const handleDelete = () => {
    if (!deleting) return;
    resetMessages();
    startTransition(() => {
      deleteCourse(deleting.id).then((result) => {
        if (result?.error) {
          setError(result.error);
          setDeleting(null);
          return;
        }
        setSuccess(result?.success || "Course deleted");
        setDeleting(null);
        router.refresh();
      });
    });
  };

  const formFields = (
    <>
      <Field>
        <FieldLabel>Course code</FieldLabel>
        <Input
          value={form.code}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
          }
          disabled={isPending}
          placeholder="BSCS"
        />
      </Field>
      <Field>
        <FieldLabel>Title</FieldLabel>
        <Input
          value={form.title}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, title: e.target.value }))
          }
          disabled={isPending}
          placeholder="Bachelor of Science in Computer Science"
        />
      </Field>
      <Field>
        <FieldLabel>Status</FieldLabel>
        <Select
          value={form.isActive ? "active" : "inactive"}
          onValueChange={(value) =>
            setForm((prev) => ({ ...prev, isActive: value === "active" }))
          }
          disabled={isPending}
        >
          <SelectTrigger className="w-full h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </Field>
    </>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Dialog
          open={createOpen}
          onOpenChange={(open) => {
            setCreateOpen(open);
            if (open) {
              resetMessages();
              setForm(emptyForm);
            } else {
              resetMessages();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Course
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Course</DialogTitle>
              <DialogDescription>
                Create a degree program that can be selected when importing or creating a
                curriculum.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <FormError message={error} />
              {formFields}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isPending}>
                {isPending ? "Saving..." : "Create Course"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <FormError message={createOpen || editing ? undefined : error} />
      <FormSuccess message={success} />

      {courses.length === 0 ? (
        <div className="rounded-xl border border-dashed">
          <Empty className="py-10">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <GraduationCap />
              </EmptyMedia>
              <EmptyTitle>No courses yet</EmptyTitle>
              <EmptyDescription>
                Load the initial degree programs template, or add a course
                manually.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="max-w-xl">
              <div className="w-full overflow-hidden rounded-md border text-left">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Title</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templateCourses.map((course) => (
                      <TableRow key={course.code}>
                        <TableCell className="font-medium">{course.code}</TableCell>
                        <TableCell>{course.title}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Button onClick={handleLoadInitial} disabled={isPending}>
                {isPending ? "Loading..." : "Load initial courses"}
              </Button>
            </EmptyContent>
          </Empty>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Curriculums</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="font-medium">{course.code}</TableCell>
                  <TableCell>{course.title}</TableCell>
                  <TableCell>{course.curriculumsCount}</TableCell>
                  <TableCell>{course.isActive ? "Active" : "Inactive"}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => openEdit(course)}
                        >
                          Edit Course
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="cursor-pointer text-destructive"
                          onClick={() => setDeleting(course)}
                          disabled={course.curriculumsCount > 0}
                        >
                          Delete Course
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>
              Changing the code also updates linked curriculums and student course
              fields.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <FormError message={error} />
            {formFields}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditing(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isPending}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.code}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the course from the dashboard list. Curriculums that still
              use it must be removed first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CoursesManager;
