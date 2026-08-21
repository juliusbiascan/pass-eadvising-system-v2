"use client";

import { MoreHorizontal } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EditSubjectDialog from "./edit-subject-dialog";
import EditOfferingDialog from "./edit-offering-dialog";
import type { SubjectOfferingRecord } from "./columns";

interface SubjectRowActionsProps {
  offering: SubjectOfferingRecord;
}

const SubjectRowActions = ({ offering }: SubjectRowActionsProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <EditOfferingDialog
          offering={{
            id: offering.id,
            subjectCode: offering.subjectCode,
            yearLevel: offering.yearLevel,
            semester: offering.semester,
            displayOrder: offering.displayOrder,
          }}
        />
        <EditSubjectDialog
          subject={{
            subjectId: offering.subjectId,
            code: offering.subjectCode,
            description: offering.description,
            units: offering.units,
          }}
        />
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/curriculum/${offering.curriculumId}/subjects/prerequisites`}>
            Prerequisites
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SubjectRowActions;
