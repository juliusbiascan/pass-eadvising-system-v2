import { GraduationCap } from 'lucide-react';

interface PortalErrorStateProps {
  title: string;
  description: string;
}

export function PortalErrorState({ title, description }: PortalErrorStateProps) {
  return (
    <div className="student-portal-main flex min-h-[60svh] items-center justify-center px-4 py-10 sm:px-8">
      <div className="student-portal-fade-up w-full max-w-md rounded-2xl border border-border/80 bg-card p-6 text-center shadow-sm sm:p-8">
        <span
          className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-(--pass-gold)/20 text-(--pass-red) ring-1 ring-(--pass-gold)/40"
          aria-hidden
        >
          <GraduationCap className="size-7" />
        </span>
        <h1 className="mt-4 font-heading text-xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
