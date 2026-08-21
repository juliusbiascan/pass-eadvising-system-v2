import { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/lib/db";

import SubjectsCatalogTable from "./subjects-catalog-table";

export const metadata: Metadata = {
  title: "Subject Catalog",
  description: "Manage subject metadata across all curriculums",
};

export default async function SubjectCatalogPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const subjects = await db.subject.findMany({
    orderBy: { code: "asc" },
    select: {
      id: true,
      code: true,
      description: true,
      units: true,
      offerings: {
        select: {
          curriculum: {
            select: {
              programCode: true,
            },
          },
        },
      },
      _count: {
        select: {
          offerings: true,
        },
      },
    },
  });

  const data = subjects.map((item) => ({
    id: item.id,
    code: item.code,
    description: item.description,
    units: item.units,
    offeringsCount: item._count.offerings,
    programCodes: [
      ...new Set(item.offerings.map((offering) => offering.curriculum.programCode)),
    ].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" })),
  }));

  return (
    <div className="flex-col md:flex">
      <div className="space-y-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Subject Catalog</h2>
          <p className="text-sm text-muted-foreground">
            Edit subject code, description, and units used across curriculum offerings.
            Subjects are grouped by curriculum program code (e.g. BSCS, BSA, BSBA).
          </p>
        </div>
        <SubjectsCatalogTable data={data} />
      </div>
    </div>
  );
}
