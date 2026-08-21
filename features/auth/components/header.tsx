import Image from "next/image";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title: string;
  description?: string;
  className?: string;
  showLogo?: boolean;
}

export const Header = ({
  title,
  description,
  className,
  showLogo = true,
}: HeaderProps) => {
  return (
    <div className={cn("space-y-5", className)}>
      {showLogo && (
        <div className="flex justify-center lg:hidden">
          <span className="relative">
            <span
              className="auth-brand-glow absolute inset-0 rounded-2xl bg-(--pass-gold)/50 blur-md"
              aria-hidden
            />
            <span className="relative flex size-16 items-center justify-center overflow-hidden rounded-2xl bg-card ring-1 ring-(--pass-gold)/40">
              <Image
                src="/passlogo-small.png"
                alt="PASS College"
                width={56}
                height={56}
                className="size-12 object-contain"
                priority
              />
            </span>
          </span>
        </div>
      )}

      <div className="space-y-1.5 text-center lg:text-left">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-(--pass-red) lg:hidden">
          PASS College
        </p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-[1.7rem]">
          {title}
        </h1>
        {description ? (
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>
    </div>
  );
};
