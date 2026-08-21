import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ListPlus } from "lucide-react";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";

import HeadsTable from "./heads-table";

export const metadata: Metadata = {
  title: "Heads",
  description: "Register department heads and assign courses",
};

export default async function HeadsPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const data = await db.head.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      fullName: true,
      createdAt: true,
      courses: {
        select: {
          course: {
            select: {
              code: true,
              title: true,
            },
          },
        },
        orderBy: {
          course: { code: "asc" },
        },
      },
    },
  });

  const heads = data.map((head) => ({
    id: head.id,
    email: head.email,
    fullName: head.fullName,
    createdAt: head.createdAt,
    departments: head.courses.map((assignment) => assignment.course.code),
  }));

  return (
    <div className="flex-col md:flex">
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight">Heads</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Register department heads and assign the courses they can view on
              the dashboard, students, and records pages.
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/heads/register">
              <ListPlus className="mr-2 h-4 w-4" />
              Register Head
            </Link>
          </Button>
        </div>
        <HeadsTable data={heads} />
      </div>
    </div>
  );
}
