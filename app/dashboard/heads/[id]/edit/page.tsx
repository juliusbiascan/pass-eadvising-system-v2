import { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { listCourses } from "@/lib/courses";
import { Button } from "@/components/ui/button";

import HeadForm from "../../head-form";

export const metadata: Metadata = {
  title: "Edit Head",
  description: "Update department head details and assigned courses",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditHeadPage({ params }: PageProps) {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { id } = await params;

  const [head, courses] = await Promise.all([
    db.head.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        courses: {
          select: { courseId: true },
        },
      },
    }),
    listCourses(),
  ]);

  if (!head) {
    notFound();
  }

  return (
    <div className="flex-col md:flex">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight">Edit Head</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Update {head.fullName}&apos;s account and the departments they can
              view.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard/heads">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Heads
            </Link>
          </Button>
        </div>
        <HeadForm
          courses={courses}
          mode="edit"
          head={{
            id: head.id,
            fullName: head.fullName,
            email: head.email,
            courseIds: head.courses.map((assignment) => assignment.courseId),
          }}
        />
      </div>
    </div>
  );
}
