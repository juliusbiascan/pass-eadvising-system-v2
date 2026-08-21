'use client';

import { useState } from 'react';

import {
  defaultStudentPortalTab,
  type StudentPortalTab,
} from '../config/student-portal';
import type { StudentPortalData } from '../lib/types';
import type { SemesterTermValue } from '@/lib/semester-terms';

import { CurriculumView } from './curriculum-view';
import { EvaluationResultsView } from './evaluation-results-view';
import { GradesView } from './grades-view';
import { ProgressView } from './progress-view';
import { PriorRecordsBanner } from './prior-records-banner';
import { StudentPortalHero } from './student-portal-hero';
import { StudentPortalNav } from './student-portal-nav';

interface StudentPortalShellProps {
  data: StudentPortalData;
}

export function StudentPortalShell({ data }: StudentPortalShellProps) {
  const [activeTab, setActiveTab] = useState<StudentPortalTab>(defaultStudentPortalTab);

  const {
    student,
    curriculumId,
    gradePassSettings,
    activeSemester,
    currentTermLabel,
    nextEnrollmentLabel,
    curriculumData,
    activeOfferingData,
    existingGrades,
    displayEvaluation,
    termEvaluationLists,
    priorTermGaps,
    gradeStats,
    hasSubmittedTermGrades,
    maxYearLevel,
    retakeOfferingData,
  } = data;

  const handleTabChange = (tab: StudentPortalTab) => {
    setActiveTab(tab);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  return (
    <div className="student-portal-main mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      <StudentPortalHero
        student={student}
        progressPct={gradeStats.progressPct}
        currentTermLabel={currentTermLabel}
      />

      {priorTermGaps.hasGap ? (
        <div className="mt-4 sm:mt-6">
          <PriorRecordsBanner
            studentYearLevel={student.yearLevel}
            gaps={priorTermGaps.gaps}
          />
        </div>
      ) : null}

      <div className="mt-5 flex flex-col gap-5 lg:mt-8 lg:flex-row lg:gap-10">
        <StudentPortalNav activeTab={activeTab} onTabChange={handleTabChange} />

        <div key={activeTab} className="student-portal-fade-up min-w-0 flex-1">
          {activeTab === 'curriculum' && (
            <CurriculumView
              yearLevel={student.yearLevel}
              curriculumData={curriculumData}
              existingGrades={existingGrades}
            />
          )}

          {activeTab === 'grades' && (
            <GradesView
              student={student}
              studentId={student.id}
              curriculumId={curriculumId}
              semester={activeSemester as SemesterTermValue}
              currentTermLabel={currentTermLabel}
              offerings={activeOfferingData}
              retakeOfferings={retakeOfferingData}
              existingGrades={existingGrades}
              gradePassSettings={gradePassSettings}
              evaluationStatus={displayEvaluation.status}
              hasSubmittedTermGrades={hasSubmittedTermGrades}
              deferredSubjects={data.deferredSubjects}
              gradeCounts={{
                passed: gradeStats.passed.length,
                failed: gradeStats.failed.length,
                incomplete: gradeStats.incomplete.length,
                pending: gradeStats.pending.length,
              }}
            />
          )}

          {activeTab === 'results' && (
            <EvaluationResultsView
              displayEvaluation={displayEvaluation}
              yearLevel={student.yearLevel}
              semester={activeSemester}
              currentTermLabel={currentTermLabel}
              nextEnrollmentLabel={nextEnrollmentLabel}
              termEvaluationLists={termEvaluationLists}
              failedSubjects={gradeStats.failed}
              hasPriorTermGaps={priorTermGaps.hasGap}
            />
          )}

          {activeTab === 'progress' && (
            <ProgressView
              yearLevel={student.yearLevel}
              maxYearLevel={maxYearLevel}
              curriculumData={curriculumData}
              gradeStats={gradeStats}
              activeSemester={activeSemester}
              nextEnrollmentLabel={nextEnrollmentLabel}
              eligibleSubjects={termEvaluationLists.eligible}
            />
          )}
        </div>
      </div>
    </div>
  );
}
