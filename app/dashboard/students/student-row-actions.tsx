"use client";

import Link from "next/link";
import {
  ArrowRightLeft,
  ClipboardCopy,
  ClipboardList,
  FolderOpen,
  MoreHorizontal,
  Pencil,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { StudentRecord } from "./columns";

interface StudentRowActionsProps {
  student: StudentRecord;
  canManageProfile?: boolean;
}

const StudentRowActions = ({
  student,
  canManageProfile = true,
}: StudentRowActionsProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <span className="sr-only">Open menu for {student.fullName}</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/students/${student.id}/evaluate`}>
            <ClipboardList />
            View Evaluation
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/records/${student.id}`}>
            <FolderOpen />
            Open Record
          </Link>
        </DropdownMenuItem>
        {canManageProfile ? (
          <>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/students/${student.id}/edit`}>
                <Pencil />
                Edit Student
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/students/${student.id}/shift`}>
                <ArrowRightLeft />
                Shift Curriculum
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        ) : (
          <DropdownMenuSeparator />
        )}
        <DropdownMenuItem
          onClick={() => navigator.clipboard.writeText(student.studentId)}
        >
          <ClipboardCopy />
          Copy Student ID
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => navigator.clipboard.writeText(student.id)}
        >
          <ClipboardCopy />
          Copy Record ID
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default StudentRowActions;
