"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  SEMESTER_TERMS,
  formatSemesterLabel,
  type SemesterTermValue,
} from "@/lib/semester-terms";
import { formatYearLevelLabel } from "@/lib/group-curriculum-offerings";

export type SemesterOffering = {
  id: string;
  yearLevel: number;
  semester: SemesterTermValue;
  displayOrder: number;
  curriculumId: string;
  programCode: string;
  programTitle: string;
  batchLabel: string;
  versionTag: "OLD" | "NEW";
  isActive: boolean;
  code: string;
  description: string;
  units: number;
};

type CurriculumGroup = {
  curriculumId: string;
  programCode: string;
  programTitle: string;
  batchLabel: string;
  versionTag: "OLD" | "NEW";
  isActive: boolean;
  yearGroups: {
    yearLevel: number;
    items: SemesterOffering[];
  }[];
};

interface SemestersOfferingsProps {
  offerings: SemesterOffering[];
}

function groupByCurriculum(offerings: SemesterOffering[]): CurriculumGroup[] {
  const groups = new Map<string, SemesterOffering[]>();

  for (const offering of offerings) {
    const current = groups.get(offering.curriculumId) ?? [];
    current.push(offering);
    groups.set(offering.curriculumId, current);
  }

  return Array.from(groups.entries())
    .map(([curriculumId, items]) => {
      const first = items[0];
      const yearLevels = [...new Set(items.map((item) => item.yearLevel))].sort(
        (a, b) => a - b
      );

      return {
        curriculumId,
        programCode: first.programCode,
        programTitle: first.programTitle,
        batchLabel: first.batchLabel,
        versionTag: first.versionTag,
        isActive: first.isActive,
        yearGroups: yearLevels.map((yearLevel) => ({
          yearLevel,
          items: items
            .filter((item) => item.yearLevel === yearLevel)
            .sort(
              (a, b) =>
                a.displayOrder - b.displayOrder || a.code.localeCompare(b.code)
            ),
        })),
      };
    })
    .sort((a, b) => {
      const program = a.programCode.localeCompare(b.programCode);
      if (program !== 0) {
        return program;
      }

      return a.batchLabel.localeCompare(b.batchLabel);
    });
}

const SemestersOfferings = ({ offerings }: SemestersOfferingsProps) => {
  const [semester, setSemester] = useState<SemesterTermValue>("FIRST");
  const [programCode, setProgramCode] = useState("all");
  const [query, setQuery] = useState("");

  const programs = useMemo(() => {
    const unique = new Map<string, string>();

    for (const offering of offerings) {
      if (!unique.has(offering.programCode)) {
        unique.set(offering.programCode, offering.programTitle);
      }
    }

    return Array.from(unique.entries())
      .map(([code, title]) => ({ code, title }))
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [offerings]);

  const counts = useMemo(() => {
    return SEMESTER_TERMS.reduce(
      (acc, term) => {
        acc[term] = offerings.filter((item) => item.semester === term).length;
        return acc;
      },
      { FIRST: 0, SECOND: 0 } as Record<SemesterTermValue, number>
    );
  }, [offerings]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();

    return offerings.filter((item) => {
      if (item.semester !== semester) {
        return false;
      }

      if (programCode !== "all" && item.programCode !== programCode) {
        return false;
      }

      if (!search) {
        return true;
      }

      return (
        item.code.toLowerCase().includes(search) ||
        item.description.toLowerCase().includes(search) ||
        item.programCode.toLowerCase().includes(search) ||
        item.batchLabel.toLowerCase().includes(search)
      );
    });
  }, [offerings, semester, programCode, query]);

  const grouped = useMemo(() => groupByCurriculum(filtered), [filtered]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>1st Semester</CardDescription>
            <CardTitle className="text-3xl">{counts.FIRST}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>2nd Semester</CardDescription>
            <CardTitle className="text-3xl">{counts.SECOND}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>All offerings</CardDescription>
            <CardTitle className="text-3xl">{offerings.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs
        value={semester}
        onValueChange={(value) => setSemester(value as SemesterTermValue)}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <TabsList>
            {SEMESTER_TERMS.map((term) => (
              <TabsTrigger key={term} value={term}>
                {formatSemesterLabel(term)}
                <Badge variant="secondary">{counts[term]}</Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-0 sm:w-72">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search code, subject, or batch"
                className="pl-8"
              />
            </div>
            <Select value={programCode} onValueChange={setProgramCode}>
              <SelectTrigger className="h-8 w-full sm:w-56">
                <SelectValue placeholder="All programs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All programs</SelectItem>
                {programs.map((program) => (
                  <SelectItem key={program.code} value={program.code}>
                    {program.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {SEMESTER_TERMS.map((term) => (
          <TabsContent key={term} value={term} className="mt-6 space-y-6">
            {offerings.length === 0 ? (
              <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                No subject offerings found. Add subjects to a curriculum first.
              </p>
            ) : grouped.length === 0 ? (
              <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                No {formatSemesterLabel(term).toLowerCase()} offerings match the
                current filters.
              </p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Showing {filtered.length} of {counts[term]}{" "}
                  {formatSemesterLabel(term).toLowerCase()} offering
                  {counts[term] === 1 ? "" : "s"}
                  {programCode !== "all" ? ` in ${programCode}` : ""}.
                </p>

                {grouped.map((group) => {
                  const offeringCount = group.yearGroups.reduce(
                    (sum, year) => sum + year.items.length,
                    0
                  );

                  return (
                    <Card key={group.curriculumId}>
                      <CardHeader className="border-b">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-1">
                            <CardTitle>
                              {group.programCode} · {group.batchLabel}
                            </CardTitle>
                            <CardDescription>
                              {group.programTitle} · {offeringCount} offering
                              {offeringCount === 1 ? "" : "s"}
                            </CardDescription>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              variant={
                                group.versionTag === "NEW" ? "default" : "outline"
                              }
                            >
                              {group.versionTag === "NEW"
                                ? "New curriculum"
                                : "Old curriculum"}
                            </Badge>
                            <Badge
                              variant={group.isActive ? "secondary" : "outline"}
                            >
                              {group.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Button asChild variant="outline" size="sm">
                              <Link
                                href={`/dashboard/curriculum/${group.curriculumId}/subjects`}
                              >
                                View subjects
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {group.yearGroups.map((yearGroup) => {
                          const totalUnits = yearGroup.items.reduce(
                            (sum, item) => sum + item.units,
                            0
                          );

                          return (
                            <section
                              key={`${group.curriculumId}-${yearGroup.yearLevel}`}
                              className="space-y-2"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <h3 className="font-medium">
                                  {formatYearLevelLabel(yearGroup.yearLevel)}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                  {yearGroup.items.length} subject
                                  {yearGroup.items.length === 1 ? "" : "s"} ·{" "}
                                  {totalUnits} units
                                </p>
                              </div>
                              <div className="rounded-lg border">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="w-28">Code</TableHead>
                                      <TableHead>Subject</TableHead>
                                      <TableHead className="w-20 text-right">
                                        Units
                                      </TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {yearGroup.items.map((item) => (
                                      <TableRow key={item.id}>
                                        <TableCell className="font-medium">
                                          {item.code}
                                        </TableCell>
                                        <TableCell>{item.description}</TableCell>
                                        <TableCell className="text-right">
                                          {item.units}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </section>
                          );
                        })}
                      </CardContent>
                    </Card>
                  );
                })}
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default SemestersOfferings;
