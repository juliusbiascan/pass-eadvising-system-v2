import { Skeleton } from "@/components/ui/skeleton";

export function AuthFormSkeleton() {
  return (
    <div className="auth-card rounded-2xl p-6 sm:p-8" aria-busy aria-label="Loading form">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-full max-w-xs" />
      </div>
      <div className="mt-8 space-y-4">
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
      <Skeleton className="mt-5 h-11 w-full" />
    </div>
  );
}
