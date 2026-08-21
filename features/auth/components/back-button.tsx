"use client";

import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

interface BackButtonProps {
  href: string;
  label: string;
}

export const BackButton = ({ href, label }: BackButtonProps) => {
  return (
    <Button
      variant="ghost"
      className="group w-full gap-2 text-muted-foreground transition-colors hover:text-foreground"
      size="sm"
      asChild
    >
      <Link href={href}>
        <ArrowLeftIcon
          className="size-4 transition-transform duration-200 group-hover:-translate-x-0.5"
          aria-hidden
        />
        {label}
      </Link>
    </Button>
  );
};
