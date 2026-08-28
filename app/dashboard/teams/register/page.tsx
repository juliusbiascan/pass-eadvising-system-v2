import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";

import AdminForm from "../admin-form";

export const metadata: Metadata = {
  title: "Register Admin",
  description: "Register another administrator for the dashboard",
};

export default async function RegisterAdminPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="flex-col md:flex">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight">Register Admin</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Add another administrator account and send login credentials for
              the dashboard. The Root badge stays with the first setup admin.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard/teams">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Teams
            </Link>
          </Button>
        </div>
        <AdminForm />
      </div>
    </div>
  );
}
