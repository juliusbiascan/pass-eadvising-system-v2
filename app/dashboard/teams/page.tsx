import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ListPlus } from "lucide-react";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { ensureRootAdmin } from "@/lib/ensure-root-admin";

import TeamTable from "./team-table";

export const metadata: Metadata = {
  title: "Teams",
  description: "Register administrators and review the admin team",
};

export default async function TeamsPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  await ensureRootAdmin();

  const data = await db.user.findMany({
    where: { role: "ADMIN" },
    orderBy: [{ isRoot: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      isRoot: true,
      createdAt: true,
    },
  });

  const admins = data.map((admin) => ({
    id: admin.id,
    name: admin.name || "Unnamed admin",
    email: admin.email || "",
    isRoot: admin.isRoot,
    isCurrentUser: admin.id === session.user.id,
    createdAt: admin.createdAt,
  }));

  return (
    <div className="flex-col md:flex">
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight">Teams</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Administrators who can manage the dashboard. The first account
              created during setup is Root.
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/teams/register">
              <ListPlus className="mr-2 h-4 w-4" />
              Register Admin
            </Link>
          </Button>
        </div>
        <TeamTable data={admins} />
      </div>
    </div>
  );
}
