'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  GraduationCap,
  Layers,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserCog,
  Users,
} from 'lucide-react';

import {
  createCourse,
  deleteCourse,
  loadInitialCourses,
  updateCourse,
} from '@/actions/course';
import { FormError } from '@/components/form-error';
import { FormSuccess } from '@/components/form-success';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export type CourseRecord = {
  id: string;
  code: string;
  title: string;
  isActive: boolean;
  curriculumsCount: number;
  headsCount: number;
  studentsCount: number;
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

type StatusFilter = 'all' | 'active' | 'inactive';

const emptyForm: CourseFormState = {
  code: '',
  title: '',
  isActive: true,
};

const statusFilters: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

interface CoursesManagerProps {
  courses: CourseRecord[];
  templateCourses: CourseTemplate[];
}

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function CourseCodeMark({ code }: { code: string }) {
  return (
    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-(--pass-gold)/18 font-heading text-[11px] font-semibold tracking-wide text-(--pass-cod) dark:text-(--pass-gold)">
      {code || '—'}
    </div>
  );
}

const CoursesManager = ({ courses, templateCourses }: CoursesManagerProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
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

  const openCreate = () => {
    resetMessages();
    setForm(emptyForm);
    setCreateOpen(true);
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
        setSuccess(result?.success || 'Course created');
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
        setSuccess(result?.success || 'Course updated');
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
        setSuccess(result?.success || 'Initial courses loaded');
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
        setSuccess(result?.success || 'Course deleted');
        setDeleting(null);
        router.refresh();
      });
    });
  };

  const stats = useMemo(() => {
    const activeCount = courses.filter((course) => course.isActive).length;
    return [
      {
        label: 'Programs',
        value: courses.length,
        hint: 'Degree programs in the catalog',
      },
      {
        label: 'Active',
        value: activeCount,
        hint: `${courses.length - activeCount} inactive`,
        tone: 'gold' as const,
      },
      {
        label: 'Curriculums',
        value: courses.reduce((sum, course) => sum + course.curriculumsCount, 0),
        hint: 'Batches linked to these programs',
      },
      {
        label: 'Students',
        value: courses.reduce((sum, course) => sum + course.studentsCount, 0),
        hint: 'Enrolled across all programs',
      },
    ];
  }, [courses]);

  const filteredCourses = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return courses.filter((course) => {
      if (statusFilter === 'active' && !course.isActive) return false;
      if (statusFilter === 'inactive' && course.isActive) return false;
      if (!normalized) return true;

      return [course.code, course.title]
        .join(' ')
        .toLowerCase()
        .includes(normalized);
    });
  }, [courses, query, statusFilter]);

  const formFields = (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl border border-border/80 bg-muted/40 p-3">
        <CourseCodeMark code={form.code.trim().toUpperCase()} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {form.code.trim() || 'Course code'}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {form.title.trim() || 'Degree program title'}
          </p>
        </div>
      </div>
      <Field>
        <FieldLabel>Course code</FieldLabel>
        <Input
          value={form.code}
          onChange={(event) =>
            setForm((prev) => ({
              ...prev,
              code: event.target.value.toUpperCase(),
            }))
          }
          disabled={isPending}
          placeholder="BSCS"
        />
      </Field>
      <Field>
        <FieldLabel>Title</FieldLabel>
        <Input
          value={form.title}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, title: event.target.value }))
          }
          disabled={isPending}
          placeholder="Bachelor of Science in Computer Science"
        />
      </Field>
      <div className="flex items-center justify-between gap-4 rounded-xl border border-border/80 px-4 py-3">
        <div className="space-y-0.5">
          <p className="text-sm font-medium">Active program</p>
          <p className="text-xs text-muted-foreground">
            Available when creating or importing a curriculum
          </p>
        </div>
        <Switch
          checked={form.isActive}
          onCheckedChange={(checked) =>
            setForm((prev) => ({ ...prev, isActive: checked }))
          }
          disabled={isPending}
          aria-label="Active program"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-(--pass-red)">
            Program catalog
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-(--pass-cod) dark:text-(--pass-iron) sm:text-3xl">
            Courses
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Degree programs used when creating or importing a curriculum, assigning
            heads, and placing students. Add a course here instead of hardcoding
            program codes.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/curriculum">Open curriculum</Link>
          </Button>
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
                <Plus className="mr-2 size-4" />
                Add Course
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Course</DialogTitle>
                <DialogDescription>
                  Create a degree program that can be selected when importing or
                  creating a curriculum.
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
                  {isPending ? 'Saving...' : 'Create Course'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {courses.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={cn(
                'rounded-2xl border border-border/80 bg-card p-4 shadow-sm',
                stat.tone === 'gold' && 'border-(--pass-gold)/40 bg-(--pass-gold)/8'
              )}
            >
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                {stat.label}
              </p>
              <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums">
                {stat.value.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{stat.hint}</p>
            </div>
          ))}
        </div>
      ) : null}

      <FormError message={createOpen || editing ? undefined : error} />
      <FormSuccess message={success} />

      {courses.length === 0 ? (
        <section className="overflow-hidden rounded-2xl border border-dashed border-border/80 bg-card shadow-sm">
          <Empty className="py-10">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <GraduationCap />
              </EmptyMedia>
              <EmptyTitle>No courses yet</EmptyTitle>
              <EmptyDescription>
                Load the initial PASS degree programs, or add a course manually.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="max-w-3xl">
              <div className="grid w-full gap-2 text-left sm:grid-cols-2">
                {templateCourses.map((course) => (
                  <div
                    key={course.code}
                    className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/60 px-3 py-2.5"
                  >
                    <CourseCodeMark code={course.code} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{course.code}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {course.title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                <Button onClick={handleLoadInitial} disabled={isPending}>
                  {isPending ? 'Loading...' : 'Load initial courses'}
                </Button>
                <Button
                  variant="outline"
                  onClick={openCreate}
                  disabled={isPending}
                >
                  Add course manually
                </Button>
              </div>
            </EmptyContent>
          </Empty>
        </section>
      ) : (
        <section className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative min-w-0 max-w-sm flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search code or title..."
                className="pl-9"
              />
            </div>
            <div className="inline-flex rounded-xl border border-border/80 bg-card p-1">
              {statusFilters.map((filter) => (
                <Button
                  key={filter.value}
                  type="button"
                  size="sm"
                  variant={statusFilter === filter.value ? 'default' : 'ghost'}
                  className="rounded-lg"
                  onClick={() => setStatusFilter(filter.value)}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>

          {filteredCourses.length === 0 ? (
            <Empty className="rounded-2xl border border-dashed py-12">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Search />
                </EmptyMedia>
                <EmptyTitle>No matching courses</EmptyTitle>
                <EmptyDescription>
                  Try a different program code, title, or status filter.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredCourses.map((course) => (
                <article
                  key={course.id}
                  className={cn(
                    'group/section relative overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md',
                    !course.isActive && 'opacity-80'
                  )}
                >
                  <span
                    className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-linear-to-r from-(--pass-red) via-(--pass-gold) to-(--pass-red) transition-transform duration-500 group-hover/section:scale-x-100"
                    aria-hidden
                  />
                  <div className="flex items-start justify-between gap-3 px-5 py-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <CourseCodeMark code={course.code} />
                      <div className="min-w-0 space-y-1">
                        <h2 className="truncate text-base font-semibold tracking-tight">
                          {course.title}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          {course.code}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge
                        variant={course.isActive ? 'secondary' : 'outline'}
                        className={
                          course.isActive
                            ? 'border-transparent bg-(--pass-gold)/20 text-(--pass-cod) dark:text-(--pass-gold)'
                            : undefined
                        }
                      >
                        {course.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                          >
                            <span className="sr-only">
                              Open menu for {course.code}
                            </span>
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => openEdit(course)}
                          >
                            <Pencil />
                            Edit Course
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href="/dashboard/curriculum">
                              <Layers />
                              View curricula
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="cursor-pointer text-destructive"
                            onClick={() => setDeleting(course)}
                            disabled={course.curriculumsCount > 0}
                          >
                            <Trash2 />
                            Delete Course
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 border-t border-border/70 bg-muted/30 px-5 py-3">
                    <div className="min-w-0">
                      <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Layers className="size-3.5" />
                        Curriculums
                      </p>
                      <p className="mt-0.5 text-sm font-semibold tabular-nums">
                        {course.curriculumsCount}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Users className="size-3.5" />
                        Students
                      </p>
                      <p className="mt-0.5 text-sm font-semibold tabular-nums">
                        {course.studentsCount}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <UserCog className="size-3.5" />
                        Heads
                      </p>
                      <p className="mt-0.5 text-sm font-semibold tabular-nums">
                        {course.headsCount}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
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
              {isPending ? 'Saving...' : 'Save Changes'}
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
              This removes {deleting?.title ?? 'the course'} from the catalog.
              {deleting && deleting.curriculumsCount > 0
                ? ` ${pluralize(deleting.curriculumsCount, 'curriculum', 'curriculums')} still use it and must be removed first.`
                : ' Curriculums that still use it must be removed first.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CoursesManager;
