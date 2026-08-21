import { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { listCourses } from "@/lib/courses";

import CreateCurriculumForm from "./create-curriculum-form";

export const metadata: Metadata = {
  title: "Create Curriculum",
  description: "Create a new curriculum version",
};

export default async function CreateCurriculumPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const courses = await listCourses({ activeOnly: true });

  return (
    <div className="flex-col md:flex">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Create Curriculum</h2>
        </div>
        <CreateCurriculumForm courses={courses} />
      </div>
    </div>
  );
}
