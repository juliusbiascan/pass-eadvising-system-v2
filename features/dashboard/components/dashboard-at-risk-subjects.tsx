import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

type AtRiskSubject = {
  subjectCode: string;
  subjectDescription: string;
  failureCount: number;
  totalEnrolled: number;
  failureRate: number;
};

export function DashboardAtRiskSubjects({ data }: { data: AtRiskSubject[] }) {
  const top = data.slice(0, 5);

  if (top.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No failed grades recorded yet.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {top.map((record) => (
        <li key={record.subjectCode} className="space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{record.subjectCode}</p>
              <p className="line-clamp-1 text-xs text-muted-foreground">
                {record.subjectDescription}
              </p>
            </div>
            <Badge
              variant={record.failureRate > 30 ? 'destructive' : 'secondary'}
              className="shrink-0 tabular-nums"
            >
              {record.failureRate.toFixed(0)}%
            </Badge>
          </div>
          <Progress value={Math.min(100, record.failureRate)} className="h-1.5" />
          <p className="text-[10px] text-muted-foreground">
            {record.failureCount} of {record.totalEnrolled} enrolled failed
          </p>
        </li>
      ))}
    </ul>
  );
}
