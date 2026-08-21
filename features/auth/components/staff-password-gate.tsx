"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useCurrentUser } from "@/hooks/use-current-user";

const CHANGE_PASSWORD_PATH = "/dashboard/change-password";

export function StaffPasswordGate({ children }: { children: React.ReactNode }) {
  const user = useCurrentUser();
  const pathname = usePathname();
  const router = useRouter();
  const mustChangePassword = Boolean(user?.mustChangePassword);
  const onChangePasswordPage = pathname === CHANGE_PASSWORD_PATH;

  useEffect(() => {
    if (!user) {
      return;
    }

    if (mustChangePassword && !onChangePasswordPage) {
      router.replace(CHANGE_PASSWORD_PATH);
      return;
    }

    if (!mustChangePassword && onChangePasswordPage) {
      router.replace("/dashboard");
    }
  }, [mustChangePassword, onChangePasswordPage, router, user]);

  if (!user) {
    return <>{children}</>;
  }

  if (mustChangePassword && !onChangePasswordPage) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
