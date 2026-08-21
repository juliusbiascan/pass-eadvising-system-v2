"use client"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"

import {
  Settings,
  LogOut,
  ChevronDown,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { LogoutButton } from "./logout-button"
import { cn } from "@/lib/utils"

import { useCurrentUser } from "@/hooks/use-current-user"

interface UserButtonProps {
  className?: string;
  variant?: "default" | "compact";
  settingsHref?: string;
}

export const UserButton = ({ className, variant = "default", settingsHref }: UserButtonProps) => {
  const user = useCurrentUser();
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "flex items-center gap-2 h-8 rounded-md transition-all",
            // Mobile: Just avatar with minimal padding
            "px-2 sm:px-3",
            // Compact variant
            variant === "compact" && "w-8 px-2 justify-center",
            className
          )}
        >
          <Avatar className="h-5 w-5 shrink-0">
            <AvatarImage
              src={user?.image || ""}
              alt={user?.name || "User"}
            />
            <AvatarFallback className={cn("text-xs bg-white",)}>
              {(user?.name || "U")[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {variant === "default" && (
            <>
              {/* Hide name on mobile (< sm), show on tablet and up */}
              <span className="hidden sm:inline text-sm font-medium truncate max-w-20 md:max-w-30">
                {user?.name || "User"}
              </span>
              {/* Hide chevron on mobile, show on desktop */}
              <ChevronDown className="hidden md:block h-3 w-3 ml-1 shrink-0" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 max-w-[calc(100vw-2rem)]"
        align="end"
        forceMount
        sideOffset={4}
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none truncate">
              {user?.name || "User"}
            </p>
            <p className="text-xs leading-none text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />


        {settingsHref && (
          <>
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => router.push(settingsHref)}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        )}

        <LogoutButton>
          <DropdownMenuItem>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </LogoutButton>
      </DropdownMenuContent>
    </DropdownMenu>
  )

}