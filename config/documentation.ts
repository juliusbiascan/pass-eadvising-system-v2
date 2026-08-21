export type DocGuide = {
  title: string;
  summary: string;
  steps: string[];
  href?: string;
};

export type DocSection = {
  id: string;
  title: string;
  description: string;
  guides: DocGuide[];
};

/** In-app admin documentation derived from PRD and implemented routes. */
export const documentationSections: DocSection[] = [
  {
    id: 'overview',
    title: 'System overview',
    description:
      'PASS e-Advising is a pre-enrollment evaluation tool for PASS College. It analyzes grades, prerequisites, and curriculum progress to recommend subjects for the next term. Official enrollment remains with the registrar.',
    guides: [
      {
        title: 'What this system does',
        summary: 'Scope of the platform',
        steps: [
          'Manage student profiles, master academic records (Records), curriculums, subjects, and prerequisites.',
          'Import or export curriculums from Excel using the official PASS template format.',
          'Let students enter grades and run term evaluations from the student portal.',
          'Show passed, failed, eligible, and blocked subjects automatically from prerequisite and standing rules.',
          'Provide admin dashboards, reports, and per-term evaluation history for monitoring progress.',
        ],
      },
      {
        title: 'Admin sidebar modules',
        summary: 'Where to find each area of the dashboard',
        steps: [
          'Dashboard — institution overview, charts, and recent activity.',
          'Students — register students, assign curriculum, open current-term evaluation.',
          'Records — master academic file per student (all year levels and semesters).',
          'Heads — register department heads and assign the courses they can view.',
          'Courses — degree programs (BSCS, BSA, and others) used by curriculum import and create.',
          'Curriculum — program batches, subject offerings, prerequisites, Excel import/export.',
          'Reports — four report tabs (evaluations, curriculum, subject performance, academic progress).',
          'Terms — academic years and semester alignment.',
          'Settings — active semester and pass/fail grade rules.',
          'Documentation & Support — top navigation guides and FAQs (this page).',
        ],
        href: '/dashboard',
      },
      {
        title: 'What this system does not do',
        summary: 'Out of scope per product requirements',
        steps: [
          'Process official enrollment, payments, or registrar transactions.',
          'Handle class schedules, sectioning, or room assignments.',
          'Replace final confirmation from the registrar.',
        ],
      },
    ],
  },
  {
    id: 'admin',
    title: 'Admin guide',
    description:
      'Administrators manage master data, academic records, active terms, grade rules, and evaluations from the dashboard sidebar. Use Records for the full transcript-style view; use Students → evaluation for the current term’s live advising.',
    guides: [
      {
        title: 'Students vs Records vs Evaluation',
        summary: 'Which screen to use for common tasks',
        steps: [
          'Students — add or edit profiles, assign curriculum, copy record ID, open View Evaluation (current term only).',
          'Records (sidebar) — open the master record: every subject by year level and 1st/2nd semester, grades for any term.',
          'Current-term evaluation — from Records or Students. Heads evaluate by date; registrar or admin then checks and approves by date (approval applies progression).',
          'Failed subject retakes — from Records, confirm a printed student request so the failed subject can be taken next semester or next year; it then appears on the student grade form for that term.',
          'Transferees or backfilled grades — use Records to enter prior-term grades; saving marks that term’s evaluation as pending until the head evaluates and the registrar approves again.',
          'Evaluate by date and Check and approve are only available on the student’s current term (in Records or on the evaluation page).',
        ],
      },
      {
        title: 'Dashboard',
        summary: 'Monitor institution-wide activity',
        steps: [
          'Overview tab — stat cards (students, curriculums, catalog subjects, approved/pending evaluations) and charts for evaluation status, grade outcomes, year level, and semester distribution.',
          'Overview also shows curriculum evaluation completion by program batch.',
          'Quick reports tab — evaluation summary table and top failed subjects; link to full Reports for curriculum and academic progress.',
        ],
        href: '/dashboard',
      },
      {
        title: 'Students',
        summary: 'Register and maintain student profiles',
        steps: [
          'Add students with student ID, name, email, year level, and curriculum. A portal account is created and a temporary password is emailed; the student must change it on first login.',
          'Edit student details or reassign curriculum from the row actions menu.',
          'View Evaluation — grade input and live evaluation for the student’s current year level and semester only. Heads evaluate by date; registrar or admin checks and approves by date.',
          'Open Record — jumps to Records for the full curriculum across all terms.',
        ],
        href: '/dashboard/students',
      },
      {
        title: 'Heads',
        summary: 'Register department heads and assign courses',
        steps: [
          'Register a head with name, email, and one or more departments (courses). A dashboard account is created and a temporary password is emailed.',
          'The head must change that password on first login, then can open Dashboard, Students, Records, and Reports.',
          'Heads only see students, records, and reports in their assigned departments. They cannot manage courses, curriculum, terms, or settings.',
          'Only heads complete current-term evaluation by date. After that, the registrar or admin checks and approves by date.',
          'Edit a head later to change name, email, or assigned departments.',
        ],
        href: '/dashboard/heads',
      },
      {
        title: 'Records (master academic record)',
        summary: 'Full curriculum grades and evaluation status by term',
        steps: [
          'From the Records list, open a student to see summary badges (passed, failed, pending, total subjects).',
          'Subjects are grouped by year level with 1st and 2nd semester side by side (same layout as curriculum subjects).',
          'Use Search code or description to filter subjects across all years.',
          'Enter numeric grades and status per subject; Save Grades applies pass/fail rules from Settings.',
          'Saving grades for a term sets that term’s evaluation to PENDING until the department head evaluates and the registrar or admin approves it again.',
          'The current term is labeled and links to Evaluate term (heads) or Review evaluation (registrar/admin).',
          'Heads evaluate the current term by date. Registrar or admin then checks and approves by date. Past terms are for grade maintenance only.',
          'Evaluation History at the bottom lists pending, evaluated, and approved term evaluations with dates.',
        ],
        href: '/dashboard/records',
      },
      {
        title: 'Courses',
        summary: 'Degree programs used by curriculum and students',
        steps: [
          'Open Dashboard → Courses to add, edit, or deactivate programs such as BSCS or BSA.',
          'Each course has a short code and a full title. The code is what curriculum import and create use as the program.',
          'Inactive courses stay in history but no longer appear in import or create dropdowns.',
          'A course cannot be deleted while curriculum versions still reference it.',
        ],
        href: '/dashboard/courses',
      },
      {
        title: 'Curriculum',
        summary: 'Define programs, subjects, and prerequisites',
        steps: [
          'Add or edit degree programs under Dashboard → Courses (code + title). Curriculum import and create use this list instead of hardcoded program codes.',
          'Create curriculums by selecting a course, batch year, and version (OLD or NEW).',
          'From the curriculum table, use Open Subjects, Assign Students, Edit Curriculum, or Download Excel.',
          'Open Subjects to view offerings grouped by year level with 1st and 2nd semester tables side by side.',
          'Use Subject Catalog (top of Curriculum Management) to edit shared subject codes, descriptions, and units.',
          'Add subjects manually, import from Excel, or manage prerequisites from each curriculum’s subjects page.',
          'Assign students to the correct curriculum version via Assign Students or from the Students edit dialog.',
        ],
        href: '/dashboard/curriculum',
      },
      {
        title: 'Subject catalog',
        summary: 'Global subject codes used across all programs',
        steps: [
          'Open Curriculum Management → Subject Catalog.',
          'Subjects are grouped by curriculum program code (e.g. BSCS, BSA), with code, description, units, and offering count per row.',
          'Editing a catalog subject updates metadata for all curriculums that reference that code.',
          'New subjects are created automatically during Excel import or when adding a subject to a curriculum.',
        ],
        href: '/dashboard/curriculum/subjects',
      },
      {
        title: 'Curriculum Excel import & export',
        summary: 'Bulk load or share curriculum using spreadsheet templates',
        steps: [
          'From Curriculum Management, open Import Curriculum and download the blank template if needed.',
          'Use the PASS layout: college header, degree title, batch label, then year blocks with 1st-semester (left) and 2nd-semester (right) columns.',
          'Each subject row includes Code, Pre-Req., Subject Description, and Units.',
          'Put each program on its own worksheet. Sheet names like BSCS 24-25 are matched to courses automatically.',
          'Supported programs are the courses maintained under Dashboard → Courses; each sheet must follow the same template structure.',
          'Review every detected sheet. Old vs New is detected from batch years; confirm any existing program/batch, then import one or more curricula together.',
          'If a curriculum for that program and batch already exists, confirm whether to replace it, skip the sheet, or change the program code / batch year to import as new.',
          'Per curriculum, use Download Excel from the subjects page or row actions to export a formatted workbook.',
        ],
        href: '/dashboard/curriculum/import',
      },
      {
        title: 'Prerequisite types in curriculum',
        summary: 'How requirements are stored from Excel or manual entry',
        steps: [
          'Subject prerequisites — link one subject to another (e.g. CC 102 requires CC 101). Multiple codes can be comma-separated or use ampersand shorthand (e.g. AE 5 & 12 means AE 5 and AE 12).',
          'Year standing — rules such as 2ndYr Standing, 3rdYr Standing, or 1-3Yr Standing require the student to reach the matching year level before the subject is eligible.',
          'Curriculum units threshold — rules such as 80% Curriculum units require the student to pass enough total curriculum units (by unit count) before enrollment.',
          'Imported standing and unit rules appear in the Pre-Req. column on the curriculum subjects page alongside subject codes.',
          'Manage individual subject-to-subject links from a curriculum’s Prerequisites page when editing manually.',
        ],
        href: '/dashboard/curriculum',
      },
      {
        title: 'Current-term evaluation',
        summary: 'Head evaluation then registrar or admin approval',
        steps: [
          'Open from Students → View Evaluation or Records → current-term evaluation.',
          'Grade Input lists subjects for the student’s current year level and semester only.',
          'Evaluation Results show passed subjects for the current term, plus eligible and blocked subjects for the next enrollment term (with prerequisite completion %).',
          'Department heads Evaluate by date to store results. Registrar or admin then Check and approve by date to apply progression.',
          'Evaluation History shows evaluated and approved dates for prior terms.',
        ],
        href: '/dashboard/students',
      },
      {
        title: 'Terms',
        summary: 'Academic years and semesters',
        steps: [
          'Maintain academic years and semester records under Terms.',
          'Keep these aligned with Settings (active semester) and each student’s current semester.',
          'Students and evaluations use 1st and 2nd semester only (no summer term in the system).',
        ],
        href: '/dashboard/terms',
      },
      {
        title: 'Settings',
        summary: 'Active term and pass/fail rules',
        steps: [
          'Set the active semester used across evaluations (optional global default).',
          'Configure the passing threshold and grade scale (percentage or GWA).',
          'Numeric grades saved by students or admins auto-derive PASSED or FAILED using these rules.',
        ],
        href: '/dashboard/settings',
      },
      {
        title: 'Reports',
        summary: 'Evaluation and progress exports',
        steps: [
          'Student evaluations — submitted term evaluations with passed, eligible, and blocked counts per student.',
          'Curriculum — program versions, subject counts, enrolled students, and term distribution by curriculum.',
          'Subject performance — subjects with the highest failure counts and rates across all students.',
          'Academic progress — per-student completion rate based on passed subjects in their assigned curriculum.',
        ],
        href: '/dashboard/reports',
      },
      {
        title: 'Support & access',
        summary: 'Help resources and who can use admin tools',
        steps: [
          'Documentation and Support are in the top navigation bar on every dashboard page.',
          'Support lists FAQs and registrar contact details for common login, curriculum, and evaluation questions.',
          'Curriculum, Terms, and Settings require an ADMIN account; department heads are redirected from those pages.',
          'Department heads can sign in to the dashboard and see Dashboard, Students, Records, and Reports only for the courses assigned to them.',
          'Administrators register heads from Heads, assign one or more departments, and email a temporary password.',
          'Students use the portal at the default route to enter grades and print the grade slip for the registrar.',
        ],
        href: '/dashboard/support',
      },
    ],
  },
  {
    id: 'student',
    title: 'Student portal guide',
    description:
      'Students sign in and use the portal at the default route. After registration they must replace the emailed temporary password, then the portal has four tabs for curriculum, grades, results, and progress.',
    guides: [
      {
        title: 'First login',
        summary: 'Replace the temporary password',
        steps: [
          'Sign in with the email and temporary password from your registration message.',
          'Choose a new password of at least 6 characters. You cannot reuse the temporary password.',
          'After saving, you can open curriculum, grades, results, and progress.',
        ],
      },
      {
        title: 'Curriculum tab',
        summary: 'Subjects for the current year level',
        steps: [
          'Browse subjects assigned to your curriculum and term.',
          'Confirm your year level and semester before entering grades.',
        ],
      },
      {
        title: 'Input grades tab',
        summary: 'Enter and save term grades',
        steps: [
          'Enter numeric grades per subject for the active term. Approved retake subjects appear here marked Retake.',
          'If you fail a subject, print the Request to Retake Subject form and submit it to an administrator.',
          'Save your grades; the system applies pass/fail rules when grades are numeric.',
          'After saving, print or submit the grade slip to the registrar. Your department head evaluates by date, then the registrar or admin checks and approves by date.',
        ],
      },
      {
        title: 'Evaluation results tab',
        summary: 'Passed, eligible, and blocked subjects',
        steps: [
          'Review subjects marked passed or failed for the term.',
          'See eligible subjects recommended for the next enrollment term.',
          'Blocked subjects list missing requirements—failed prerequisites, unmet year standing, or insufficient curriculum units completed.',
        ],
      },
      {
        title: 'Progress / study plan tab',
        summary: 'Long-term completion view',
        steps: [
          'Track overall curriculum completion.',
          'Use recommendations as a study plan before registrar confirmation.',
        ],
      },
    ],
  },
  {
    id: 'evaluation',
    title: 'Evaluation rules',
    description:
      'Advising logic used after grades are saved. Students submit the grade slip to the registrar. Department heads evaluate by date. The registrar or admin then checks and approves by date.',
    guides: [
      {
        title: 'Term evaluations and grade saves',
        summary: 'How evaluation status changes when grades are updated',
        steps: [
          'Each student has at most one evaluation record per curriculum, year level, and semester (PENDING, EVALUATED, or COMPLETED/approved).',
          'When grades are saved for a term, that term’s evaluation is reset to PENDING (staff or student save).',
          'From Records, saving past-term grades marks that past term pending—not the student’s current term unless you edited the current term.',
          'Students save grades in the portal, then submit the printed grade slip to the registrar.',
          'Only department heads can Evaluate by date. That stores passed, eligible, and blocked lists and waits for approval.',
          'Only the registrar or admin can Check and approve by date. Approval applies progression for the student.',
        ],
        href: '/dashboard/records',
      },
      {
        title: 'Pass and fail',
        summary: 'Grade-based status',
        steps: [
          'Percentage scale: grades at or above the passing threshold are PASSED; below are FAILED.',
          'GWA scale: lower values are better; at or below the threshold counts as PASSED.',
          'Non-numeric or empty grades keep manual status until a valid number is saved (admins can set status manually).',
          'Rules are configured under Settings and apply to saves from Records, Students evaluation, and the student portal.',
        ],
        href: '/dashboard/settings',
      },
      {
        title: 'Prerequisites',
        summary: 'Subject availability and special requirements',
        steps: [
          'A subject becomes eligible when all linked prerequisite subjects are passed.',
          'Multiple prerequisites must all be satisfied (e.g. IT 2 and AE 5, or AE 5 and AE 12).',
          'Year-standing rules block a subject until the student’s year level meets the requirement (e.g. 3rdYr Standing).',
          'Curriculum-units rules block a subject until the student has passed enough total units in the curriculum (e.g. 80% Curriculum units).',
          'If a subject prerequisite failed, dependent subjects appear as blocked until it is retaken and passed.',
        ],
      },
      {
        title: 'Failed subject retakes',
        summary: 'Printed request and admin confirmation',
        steps: [
          'After a student fails a subject, the grades tab shows a Request to Retake Subject form to print and submit to an administrator.',
          'On Records, confirm each failed subject for next semester or next year.',
          'Once confirmed, that subject appears on the student grade evaluation form for the approved term so a new grade can be entered.',
          'Passing the retake updates the subject to PASSED and completes the retake record.',
        ],
        href: '/dashboard/records',
      },
      {
        title: 'Advising disclaimer',
        summary: 'Registrar confirmation required',
        steps: [
          'Recommendations are advisory only.',
          'Students must confirm final subject lists with the registrar before official enrollment.',
        ],
      },
    ],
  },
];

export const documentationQuickLinks = [
  { title: 'Admin dashboard', href: '/dashboard' },
  { title: 'Students', href: '/dashboard/students' },
  { title: 'Records', href: '/dashboard/records' },
  { title: 'Curriculum & import', href: '/dashboard/curriculum' },
  { title: 'Subject catalog', href: '/dashboard/curriculum/subjects' },
  { title: 'Reports', href: '/dashboard/reports' },
  { title: 'Settings', href: '/dashboard/settings' },
  { title: 'Support', href: '/dashboard/support' },
  { title: 'Student portal', href: '/default' },
] as const;
