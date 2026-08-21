export type AuthBrandSubject = {
  code: string;
  description: string;
};

export type AuthBrandStats = {
  progressPct: number;
  termLabel: string;
  subjectCount: number;
  readyLabel: string;
  subjects: AuthBrandSubject[];
};
