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
      'Blocked subjects have unmet requirements: a failed or missing prerequisite subject, year-standing rule (e.g. 3rdYr Standing), or curriculum-units rule (e.g. 80% Curriculum units). Pass the required subjects, advance to the required year level, or complete more curriculum units, then re-run your evaluation. See Documentation → Evaluation rules for details.',
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
      'Open Documentation from the top navigation for admin workflows (Records, curriculum Excel import, evaluation rules) and student portal guides. Use Support for FAQs and registrar contact details.',
  },
  {
    question: 'What is the Subject Catalog?',
    answer:
      'The Subject Catalog (Curriculum → Subject Catalog) lists every unique subject code in the system, grouped by curriculum program code (e.g. BSCS, BSA), with description and units. Codes are shared across programs; curriculum offerings place each code into a specific year level and semester. Edit catalog entries when a subject’s title or units change institution-wide.',
  },
  {
    question: 'What is Records vs Students in the admin dashboard?',
    answer:
      'Students is for registering profiles and opening the current-term evaluation. Records is the master academic file: all subjects by year and semester, grades for any term (including transferees), evaluation status per term, and full evaluation history. Use Records to maintain the complete record; use View Evaluation for live advising on the current term.',
  },
  {
    question: 'How do I enter grades for a transferee or prior year?',
    answer:
      'Open Dashboard → Records → select the student. Enter grades under the correct year level and semester, then Save Grades. That term’s evaluation will show as pending until the department head evaluates and the registrar or admin approves the current term.',
  },
  {
    question: 'Why did an evaluation change to pending after I edited grades?',
    answer:
      'Saving grades for a term automatically marks that term’s evaluation as pending so advising results stay accurate. The department head must evaluate by date again, then the registrar or admin checks and approves by date.',
  },
];
