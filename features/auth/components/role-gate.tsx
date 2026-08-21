"use client";

import Link from "next/link";

import { Loader2 } from "lucide-react";
import { UserRole } from "@/app/generated/prisma/client";
import { useCurrentRole } from "@/hooks/use-current-role";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";

interface RoleGateProps {
  children: React.ReactNode;
  allowedRole: UserRole | UserRole[];
}

export const RoleGate = ({
  children,
  allowedRole,
}: RoleGateProps) => {
  const role = useCurrentRole();
  const allowedRoles = Array.isArray(allowedRole) ? allowedRole : [allowedRole];

  // Show loading state while role is being determined
  if (role === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!allowedRoles.includes(role as UserRole)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <FormError message="You do not have permission to view this content!" />
        <Button asChild>
          <Link href="/dashboard">
            Go Back to Dashboard
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      {children}
    </>
  );
};
