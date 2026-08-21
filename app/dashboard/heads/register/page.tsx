import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { auth } from "@/auth";
import { listCourses } from "@/lib/courses";
import { Button } from "@/components/ui/button";

import HeadForm from "../head-form";

export const metadata: Metadata = {
  title: "Register Head",
  description: "Register a department head and assign courses",
};

export default async function RegisterHeadPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const courses = await listCourses();

  return (
    <div className="flex-col md:flex">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight">Register Head</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Add a department head account, assign one or more courses, and
              send login credentials for the dashboard.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard/heads">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Heads
            </Link>
          </Button>
        </div>
        <HeadForm courses={courses} mode="register" />
      </div>
    </div>
  );
}
