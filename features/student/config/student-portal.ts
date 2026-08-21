export type StudentPortalTab = 'curriculum' | 'grades' | 'results' | 'progress';

export type StudentPortalNavItem = {
  id: StudentPortalTab;
  title: string;
  shortTitle: string;
  description: string;
};

export const studentPortalNav: StudentPortalNavItem[] = [
  {
    id: 'curriculum',
    title: 'Curriculum',
    shortTitle: 'Curriculum',
    description: 'Subjects for your year level',
  },
  {
    id: 'grades',
    title: 'Input grades',
    shortTitle: 'Grades',
    description: 'Enter term grades',
  },
  {
    id: 'results',
    title: 'Evaluation results',
    shortTitle: 'Results',
    description: 'Passed, failed, and eligibility',
  },
  {
    id: 'progress',
    title: 'Progress / study plan',
    shortTitle: 'Progress',
    description: 'Completion and recommended focus',
  },
];

export const defaultStudentPortalTab: StudentPortalTab = 'grades';
