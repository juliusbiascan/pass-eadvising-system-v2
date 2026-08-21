'use client';

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface CurriculumProgressProps {
  data: Array<{
    programCode: string;
    title: string;
    batchYear: number;
    totalStudents: number;
    completedStudents: number;
    pendingStudents: number;
    progressPercentage: number;
    status: string;
  }>;
}

export default function CurriculumProgress({ data }: CurriculumProgressProps) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No active curriculums with students.</p>
    );
  }

  return (
    <div className="w-full space-y-6">
      {data.map((record) => (
        <div key={`${record.programCode}-${record.batchYear}`} className="space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-semibold">
                {record.title} ({record.programCode})
              </p>
              <p className="text-xs text-muted-foreground">
                Batch {record.batchYear} • {record.completedStudents} of {record.totalStudents}{' '}
                students completed current-term evaluation
                {record.pendingStudents > 0 ? ` (${record.pendingStudents} pending)` : ''}
              </p>
            </div>
            <Badge variant={record.progressPercentage === 100 ? 'default' : 'secondary'}>
              {record.progressPercentage.toFixed(0)}%
            </Badge>
          </div>
          <Progress value={record.progressPercentage} className="h-2" />
        </div>
      ))}
    </div>
  );
}
