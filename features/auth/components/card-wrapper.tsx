"use client";

import { Header } from "@/features/auth/components/header";
import { BackButton } from "@/features/auth/components/back-button";
import { cn } from "@/lib/utils";

interface CardWrapperProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  backButtonLabel?: string;
  backButtonHref?: string;
  className?: string;
}

export const CardWrapper = ({
  children,
  title,
  description,
  backButtonLabel,
  backButtonHref,
  className,
}: CardWrapperProps) => {
  return (
    <div className={cn("auth-card rounded-2xl p-6 sm:p-8", className)}>
      <Header title={title} description={description} />

      <div className="mt-8">{children}</div>

      {backButtonLabel && backButtonHref ? (
        <div className="mt-6 border-t border-border/70 pt-6">
          <BackButton label={backButtonLabel} href={backButtonHref} />
        </div>
      ) : null}
    </div>
  );
};
