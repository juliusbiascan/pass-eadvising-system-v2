"use client";

import Link from "next/link";
import { ChevronDown, KeyRound, LogOut, Settings, Users } from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/actions/logout";
import { useCurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";

interface UserButtonProps {
  className?: string;
  variant?: "default" | "compact";
  settingsHref?: string;
  teamsHref?: string;
}

function getInitials(name?: string | null) {
  if (!name?.trim()) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function getRoleLabel(role?: string, isRoot?: boolean) {
  if (isRoot) return "Root";
  if (role === "HEAD") return "Head";
  if (role === "ADMIN") return "Admin";
  if (role === "USER") return "Student";
  return null;
}

export const UserButton = ({
  className,
  variant = "default",
  settingsHref,
  teamsHref,
}: UserButtonProps) => {
  const user = useCurrentUser();
  const name = user?.name || "User";
  const initials = getInitials(user?.name);
  const roleLabel = getRoleLabel(user?.role, user?.isRoot);
  const passwordHref =
    user?.role === "USER"
      ? "/default/change-password"
      : "/dashboard/change-password";
  const isCompact = variant === "compact";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={isCompact ? "icon-lg" : "lg"}
          aria-label="Open account menu"
          className={cn(
            "rounded-full border-border/70 bg-card shadow-sm transition-all duration-300 hover:border-(--pass-gold)/50 hover:shadow-md",
            !isCompact && "gap-2 px-2 sm:px-3",
            className
          )}
        >
          <Avatar size="sm" className="size-5">
            <AvatarImage src={user?.image || ""} alt="" />
            <AvatarFallback className="bg-(--pass-gold)/15 text-[10px] font-semibold text-(--pass-cod) dark:text-(--pass-gold)">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!isCompact ? (
            <>
              <span className="hidden max-w-24 truncate text-sm font-medium sm:inline md:max-w-32">
                {name}
              </span>
              <ChevronDown className="hidden size-3.5 shrink-0 opacity-60 md:block" />
            </>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-64 max-w-[calc(100vw-2rem)]"
        align="end"
        sideOffset={6}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2.5 px-1.5 py-1.5">
            <Avatar size="sm">
              <AvatarImage src={user?.image || ""} alt="" />
              <AvatarFallback className="bg-(--pass-gold)/15 text-xs font-semibold text-(--pass-cod) dark:text-(--pass-gold)">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="grid min-w-0 flex-1 gap-0.5">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-medium text-foreground">
                  {name}
                </span>
                {roleLabel ? (
                  <Badge className="border-transparent bg-(--pass-gold)/20 px-1.5 text-[10px] text-(--pass-cod) dark:text-(--pass-gold)">
                    {roleLabel}
                  </Badge>
                ) : null}
              </div>
              {user?.email ? (
                <span className="truncate text-xs font-normal text-muted-foreground">
                  {user.email}
                </span>
              ) : null}
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          {settingsHref ? (
            <DropdownMenuItem asChild>
              <Link href={settingsHref}>
                <Settings />
                Settings
              </Link>
            </DropdownMenuItem>
          ) : null}
          {teamsHref ? (
            <DropdownMenuItem asChild>
              <Link href={teamsHref}>
                <Users />
                Teams
              </Link>
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem asChild>
            <Link href={passwordHref}>
              <KeyRound />
              Change password
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          onSelect={() => {
            void logout();
          }}
        >
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
