export type SupportFaq = {
  question: string;
  answer: string;
};

export const supportContact = {
  email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? 'support@passcollege.edu.ph',
  office: process.env.NEXT_PUBLIC_SUPPORT_OFFICE ?? 'Registrar / Academic Affairs Office',
  hours: process.env.NEXT_PUBLIC_SUPPORT_HOURS ?? 'Monday–Friday, 8:00 AM – 5:00 PM',
} as const;

export const supportFaqs: SupportFaq[] = [
  {
    question: 'I cannot log in to the student portal.',
    answer:
      'Confirm your account was created by an admin and linked to a student record. After registration, sign in with the emailed temporary password and set a new one before using the portal. If you see “No student record found,” ask the registrar or admin to register your profile. Use “Forgot password” on the login page if credentials need reset.',
  },
  {
    question: 'My curriculum or subjects are missing.',
    answer:
      'An admin must assign your curriculum before you can enter grades. Contact the registrar with your student ID so they can link the correct program and batch year.',
  },
  {
    question: 'Why is a subject blocked in my evaluation?',
    answer:
      'Blocked subjects have unmet requirements: a failed or missing prerequisite subject, year-standing rule (e.g. 3rdYr Standing), curriculum-units rule (e.g. 80% Curriculum units), or unfinished prior-term subjects (common after a curriculum shift). Pass the required subjects, complete leftover records, or advance to the required year level, then re-run your evaluation. See Documentation → Evaluation rules for details.',
  },
  {
    question: 'How do I import a curriculum from Excel?',
    answer:
      'Administrators open Dashboard → Curriculum → Import Curriculum, upload a .xlsx workbook (one curriculum per worksheet), review the detected sheets, and confirm import. If a program and batch already exist, choose Replace, Skip, or change the program code / batch year. Download the template from the import page or export an existing curriculum as a reference.',
  },
  {
    question: 'Are recommended subjects official enrollment?',
    answer:
      'No. Students save grades, then submit the printed grade slip to the registrar. The department head evaluates by date. The registrar or admin then checks and approves by date. Final subject lists and official enrollment are confirmed after that approval.',
  },
  {
    question: 'How do I change the active semester or passing grade rules?',
    answer:
      'Only administrators can update these under Dashboard → Settings. Students should contact the registrar if the active term looks incorrect.',
  },
  {
    question: 'Where can I find step-by-step instructions?',
    answer:
      'Open Documentation from the Help section at the bottom of the dashboard sidebar for admin, head, and student workflows (Records, curriculum shift, Excel import, evaluation rules, and the portal). Use Support for FAQs and registrar contact details.',
  },
  {
    question: 'What is the Subject Catalog?',
    answer:
      'The Subject Catalog (Curriculum → Subject Catalog) lists every unique subject code in the system, grouped by curriculum program code (e.g. BSCS, BSA), with description and units. Codes are shared across programs; curriculum offerings place each code into a specific year level and semester. Edit catalog entries when a subject’s title or units change institution-wide.',
  },
  {
    question: 'What is Records vs Students in the admin dashboard?',
    answer:
      'Students is for registering profiles, shifting curriculum, and opening the current-term evaluation. Records is the master academic file: all subjects by year and semester, grades for any term (including transferees, irregular students, and prior courses after a shift), evaluation and approval per term, leftover/retake confirmation, and full evaluation history. Use Records to maintain the full record; use View Evaluation for live advising on the current term.',
  },
  {
    question: 'How do I enter grades for a transferee or prior year?',
    answer:
      'Open Dashboard → Records → select the student. Enter grades under the correct year level and semester, then Save Grades. That term’s evaluation will show as pending until the department head evaluates that term and the registrar or admin approves it. You can evaluate and approve every term, not only the current one.',
  },
  {
    question: 'Why did an evaluation change to pending after I edited grades?',
    answer:
      'Saving grades for a term automatically marks that term’s evaluation as pending so advising results stay accurate. The department head must evaluate by date again, then the registrar or admin checks and approves by date.',
  },
  {
    question: 'How do I shift a student to another program or batch?',
    answer:
      'Administrators open Students → row actions → Shift Curriculum (also available from Edit Student and View Evaluation). Choose the destination curriculum. Year level and semester stay the same. Matching subject grades are copied; the previous course record stays in Records as a read-only prior course tab.',
  },
  {
    question: 'I shifted programs and some earlier subjects are still incomplete.',
    answer:
      'On the student portal Grades tab, print the leftover-subject request and submit it to an administrator. Staff confirm each subject for next semester or next year under Records → Subjects to take later. Until those grades are entered and passed, later subjects that depend on them may stay blocked.',
  },
  {
    question: 'Can I cancel my grade submission?',
    answer:
      'Yes, from the student portal Grades tab, until your department head evaluates the term. Canceling lets you edit grades and submit again; it does not delete the grades you already entered. After the head evaluates, you can still print, download, or email the grade slip, but you cannot cancel.',
  },
];
