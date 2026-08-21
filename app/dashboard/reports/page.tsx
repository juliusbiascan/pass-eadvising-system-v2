import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getDashboardAccess } from '@/lib/staff-access';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EvaluationReport from '@/features/dashboard/components/evaluation-report';
import CurriculumReport from '@/features/dashboard/components/curriculum-report';
import AcademicProgressReport from '@/features/dashboard/components/academic-progress-report';
import FailedSubjects from '@/features/dashboard/components/failed-subjects';
import {
  getAcademicProgressReport,
  getCurriculumReport,
  getFullEvaluationReport,
} from '@/features/dashboard/lib/get-reports-data';
import { getFailedSubjects } from '@/features/dashboard/lib/get-dashboard-data';

export const metadata: Metadata = {
  title: 'Reports',
  description: 'Admin reports for evaluations, curriculum, and academic progress',
};

export default async function ReportsPage() {
  const access = await getDashboardAccess();

  if (!access) {
    redirect('/auth/login');
  }

  const courseCodes = access.courseCodes;
  const [evaluationReport, curriculumReport, progressReport, failedSubjects] =
    await Promise.all([
      getFullEvaluationReport(courseCodes),
      getCurriculumReport(courseCodes),
      getAcademicProgressReport(courseCodes),
      getFailedSubjects(courseCodes),
    ]);

  return (
    <div className="flex-col md:flex">
      <div className="space-y-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
          <p className="text-sm text-muted-foreground">
            Student evaluations, curriculum overview, subject performance, and academic progress
            {access.role === 'HEAD' && access.courses.length > 0
              ? ` for ${access.courses.map((course) => course.code).join(', ')}`
              : ''}
            .
          </p>
        </div>

        <Tabs defaultValue="evaluations" className="space-y-4">
          <TabsList>
            <TabsTrigger value="evaluations">Student evaluations</TabsTrigger>
            <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
            <TabsTrigger value="performance">Subject performance</TabsTrigger>
            <TabsTrigger value="progress">Academic progress</TabsTrigger>
          </TabsList>

          <TabsContent value="evaluations">
            <Card>
              <CardHeader>
                <CardTitle>Student evaluation report</CardTitle>
                <CardDescription>
                  Submitted evaluation requests with pass, eligible, and blocked counts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EvaluationReport data={evaluationReport} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="curriculum">
            <Card>
              <CardHeader>
                <CardTitle>Curriculum report</CardTitle>
                <CardDescription>
                  Program versions, subject counts, enrolled students, and term distribution.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CurriculumReport data={curriculumReport} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <CardTitle>Subject performance summary</CardTitle>
                <CardDescription>
                  Subjects with the highest failure counts and rates
                  {access.role === 'HEAD' ? ' in your assigned departments' : ' across all students'}
                  .
                </CardDescription>
              </CardHeader>
              <CardContent>
                {failedSubjects.length > 0 ? (
                  <FailedSubjects data={failedSubjects} />
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No failed grades recorded yet
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress">
            <Card>
              <CardHeader>
                <CardTitle>Academic progress report</CardTitle>
                <CardDescription>
                  Per-student completion rate based on passed subjects in their assigned curriculum.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AcademicProgressReport data={progressReport} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
