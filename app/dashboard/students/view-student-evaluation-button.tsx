"use client";

import { Button } from '@/components/ui/button';

export default function ViewStudentEvaluationButton() {
  const openEvaluation = () => {
    const id = window.prompt('Enter student record ID (not student number) to open evaluation:');
    if (!id) return;
    window.location.href = `/dashboard/students/${id}/evaluate`;
  };

  return (
    <Button variant="ghost" onClick={openEvaluation} className="ml-2">
      View Student Evaluation
    </Button>
  );
}
