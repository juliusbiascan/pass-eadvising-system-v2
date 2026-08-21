import { AlertCircle } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

import { isEvaluationApproved } from '@/lib/evaluation';

import type { PriorTermGap } from '../lib/types';

interface PriorRecordsBannerProps {
  studentYearLevel: number;
  gaps: PriorTermGap[];
}

export function PriorRecordsBanner({ studentYearLevel, gaps }: PriorRecordsBannerProps) {
  if (!gaps.length) return null;

  return (
    <Alert className="border-amber-500/40 bg-amber-500/10">
      <AlertCircle className="h-4 w-4 text-amber-600" />
      <AlertTitle>Prior term records incomplete</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>
          You are registered in <strong>Year {studentYearLevel}</strong>, but some earlier terms in
          your curriculum do not have complete grades yet — including 1st semester subjects when
          your current term is already 2nd semester (common after a shift). Until those are
          updated, subjects that depend on them may stay blocked in your evaluation.
        </p>
        <p className="text-sm">
          On <strong>Grades</strong>, request leftover or failed subjects so an administrator can
          assign them to next semester or next year. Admins confirm this under{' '}
          <strong>Record Management</strong>.
        </p>
        <ul className="flex flex-wrap gap-2">
          {gaps.map((gap) => (
            <li key={gap.key}>
              <Badge variant="outline" className="font-normal">
                {gap.label}: {gap.missingGrades} of {gap.totalSubjects} not passed
                {!isEvaluationApproved(gap.evaluationStatus)
                  ? gap.evaluationStatus === 'EVALUATED'
                    ? ' • awaiting approval'
                    : ' • evaluation pending'
                  : ''}
              </Badge>
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
