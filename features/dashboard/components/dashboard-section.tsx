import { cn } from '@/lib/utils';

type DashboardSectionProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
};

export function DashboardSection({
  title,
  description,
  children,
  className,
  contentClassName,
}: DashboardSectionProps) {
  return (
    <section
      className={cn(
        'group/section overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md',
        className
      )}
    >
      <div className="relative border-b border-border/70 px-5 py-4">
        <span
          className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-linear-to-r from-(--pass-red) via-(--pass-gold) to-(--pass-red) transition-transform duration-500 group-hover/section:scale-x-100"
          aria-hidden
        />
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        {description ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className={cn('p-5', contentClassName)}>{children}</div>
    </section>
  );
}
