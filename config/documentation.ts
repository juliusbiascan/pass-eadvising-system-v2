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

/** In-app admin documentation derived from implemented routes and current workflows. */
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
          'Manage student profiles, master academic records, degree programs, curriculums, subjects, and prerequisites.',
          'Import or export curriculums from Excel using the official PASS template format.',
          'Shift a student to a different program or curriculum batch while keeping the previous course record and copying matching subject grades.',
          'Let students enter grades, print or email a grade slip, request retakes or leftover subjects, and review advising results in the student portal.',
          'Show passed, failed, eligible, and blocked subjects automatically from prerequisite and standing rules.',
          'Let department heads evaluate any term by date, then let the registrar or admin check and approve that same term.',
          'Provide dashboards, reports, and per-term evaluation history for monitoring progress.',
        ],
      },
      {
        title: 'Who can sign in',
        summary: 'Three account types',
        steps: [
          'Administrators (including the Root account from initial setup) manage master data, students, heads, curriculum, terms, settings, and evaluation approval.',
          'Department heads sign in to the dashboard and see only their assigned courses. They evaluate terms by date; they cannot manage courses, curriculum, terms, settings, heads, or teams.',
          'Students sign in to the portal at /default to view curriculum, enter grades, print or email the grade slip, and review results and progress.',
          'New staff and student accounts receive a temporary password by email and must set a new password on first login.',
          'Use Forgot password on the login page if credentials need a reset.',
        ],
      },
      {
        title: 'Admin sidebar modules',
        summary: 'Where to find each area of the dashboard',
        steps: [
          'Dashboard — institution or department overview, charts, quick actions, recent evaluations, and at-risk subjects.',
          'Students — register students (admin), assign curriculum, shift curriculum, open current-term evaluation.',
          'Records — master academic file per student, including prior course records after a shift.',
          'Heads — register department heads and assign the courses they can view (admin only).',
          'Courses — degree programs (BSCS, BSA, and others) used by curriculum import and create (admin only).',
          'Curriculum — program batches, subject offerings, prerequisites, Excel import/export (admin only).',
          'Reports — figures, analysis, and Excel/PDF export for evaluations, curriculum, subject performance, and academic progress.',
          'Terms — academic years and semester alignment (admin only).',
          'Settings — active semester and pass/fail grade rules (admin only).',
          'Help (sidebar footer) — Documentation and Support.',
          'Account menu — Settings (admin), Teams (admin), Change password, Log out. The first setup account is marked Root.',
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
      'Administrators manage master data, academic records, curriculum shifts, active terms, grade rules, and evaluations. Department heads share Students, Records, Reports, and current-term evaluation for their assigned courses only.',
    guides: [
      {
        title: 'Students vs Records vs Evaluation vs Shift',
        summary: 'Which screen to use for common tasks',
        steps: [
          'Students — add or edit profiles, assign curriculum, copy student ID, open View Evaluation (current-term live advising), or Shift Curriculum.',
          'Records (Record Management) — open the master record: every subject by year level and 1st/2nd semester, grades for any term, plus prior course records after a shift.',
          'Term evaluation — from Records, heads evaluate any term by date; registrar or admin then checks and approves that same term. Approving the current term applies progression.',
          'Shift Curriculum — move a student to a different program or batch. The previous course record stays in Records; matching subject grades are copied to the new curriculum.',
          'Failed or leftover subjects — from Records, confirm a printed student request so the subject can be taken next semester, next year, or in a makeup term after the last curriculum term is approved; it then appears on the student grade form for that term.',
          'Transferees, irregulars, or backfilled grades — use Records to enter grades for any year/semester, then evaluate and approve that term. Saving marks that term’s evaluation as pending until the head evaluates and the registrar or admin approves it.',
          'Evaluate by date and Check and approve are available on every term in Records. Students → View Evaluation is the live advising view for the current term only.',
        ],
      },
      {
        title: 'Dashboard',
        summary: 'Monitor institution-wide or department activity',
        steps: [
          'Administrators see Admin overview. Department heads see Department overview scoped to their assigned courses, shown as badges at the top.',
          'Stat cards show students, curriculums, catalog subjects, approved terms, and evaluations awaiting head or registrar action.',
          'Term completion shows the share of evaluations that are approved.',
          'Charts cover evaluation status, grade outcomes, students by year level, students by semester, and curriculum evaluation completion by program batch.',
          'The sidebar of the overview has Quick actions, Recent evaluations, and At-risk subjects (highest failure rates). Open Reports for full exports.',
        ],
        href: '/dashboard',
      },
      {
        title: 'Students',
        summary: 'Register and maintain student profiles',
        steps: [
          'Administrators add students with student ID, name, email, year level, and curriculum. A portal account is created and a temporary password is emailed; the student must change it on first login.',
          'Edit student details from the row actions menu. Changing curriculum is a shift — use Shift Curriculum instead of the edit form.',
          'View Evaluation — grade input and live evaluation for the student’s current year level and semester. Heads evaluate by date; registrar or admin checks and approves by date.',
          'Open Record — jumps to Records for the full curriculum across all terms, including prior courses after a shift.',
          'Department heads can open evaluation and records for students in their assigned departments. They cannot register, edit, or shift students.',
        ],
        href: '/dashboard/students',
      },
      {
        title: 'Shift curriculum',
        summary: 'Move a student to a different program or batch',
        steps: [
          'Only administrators can shift a student. Open it from Students row actions, Edit Student, or View Evaluation.',
          'Choose the destination curriculum (program, batch, and OLD/NEW version). The student cannot already be in that curriculum.',
          'Year level and current semester stay the same. The previous course record is kept in Record Management as a read-only prior course tab.',
          'Subject grades that exist on both curricula (same catalog subject) are copied to the new curriculum. Confirmed retakes are remapped when the subject still exists.',
          'After a mid-year shift, earlier terms in the new curriculum may still lack grades. The student portal shows a prior-term banner; students can request leftover subjects so staff can assign them to next semester or next year.',
        ],
        href: '/dashboard/students',
      },
      {
        title: 'Heads',
        summary: 'Register department heads and assign courses',
        steps: [
          'Register a head with name, email, and one or more departments (courses). A dashboard account is created and a temporary password is emailed.',
          'The head must change that password on first login, then can open Dashboard, Students, Records, and Reports for assigned departments only.',
          'Heads cannot manage courses, curriculum, terms, settings, heads, or teams. Settings and Teams are hidden from their account menu.',
          'Only heads complete term evaluation by date (any term in Records, or the current term on View Evaluation). After that, the registrar or admin checks and approves that term by date.',
          'Edit a head later to change name, email, or assigned departments.',
        ],
        href: '/dashboard/heads',
      },
      {
        title: 'Teams',
        summary: 'Register additional administrators',
        steps: [
          'The first administrator created during initial setup is the Root account and shows a Root badge.',
          'Open the account menu in the top bar, then Teams, to see every admin account. Root cannot be reassigned from this list.',
          'Register another admin with name and email. A dashboard account is created and a temporary password is emailed.',
          'The new admin must change that password on first login, then has the same dashboard access as other administrators.',
        ],
        href: '/dashboard/teams',
      },
      {
        title: 'Records (master academic record)',
        summary: 'Full curriculum grades, prior courses, and evaluation status by term',
        steps: [
          'Record Management lists students. Open one to see summary badges (passed, failed, pending, total subjects).',
          'The current course record groups subjects by year level with 1st and 2nd semester side by side (same layout as curriculum subjects).',
          'After a shift, tabs appear for the current course and each prior course. Prior course grades are kept for history and cannot be edited from the current course.',
          'Use Search code or description to filter subjects across all years.',
          'Enter numeric grades and status per subject; Save Grades applies pass/fail rules from Settings. Saving a term sets that term’s evaluation to PENDING until the department head evaluates and the registrar or admin approves it again.',
          'The current term is labeled and also links to the live View Evaluation page (heads: Evaluate term; registrar/admin: Review evaluation).',
          'Heads can Evaluate by date on any term. Registrar or admin then Checks and approves that same term by date. Approving a past term does not advance standing; approving the current term can apply progression.',
          'Subjects to take later — confirm failed subjects and unfinished leftover subjects for next semester, next year, or a makeup term after every curriculum term is already approved.',
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
          'Create curriculums by selecting a course, batch year, and version (OLD or NEW). Curricula on the list are grouped by program so batches and versions can be compared together.',
          'From the curriculum table, use Open Subjects, Assign Students, Edit Curriculum, or Download Excel.',
          'Open Subjects to view offerings grouped by year level with 1st and 2nd semester tables side by side.',
          'Use Subject Catalog (top of Curriculum Management) to edit shared subject codes, descriptions, and units.',
          'Add subjects manually, import from Excel, or manage prerequisites from each curriculum’s subjects page.',
          'Assign students to the correct curriculum version via Assign Students or from the Students edit dialog. Use Shift Curriculum when the student is already on a different program or batch.',
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
          'Grade Input lists subjects for the student’s current year level and semester only, including confirmed retake subjects.',
          'Evaluation Results show passed subjects for the current term, plus eligible and blocked subjects for the next enrollment term (with prerequisite completion %).',
          'Department heads Evaluate by date to store results (name, date, and optional remarks). Registrar or admin then Check and approve by date to apply progression.',
          'Evaluation History shows evaluated and approved dates for prior terms.',
        ],
        href: '/dashboard/students',
      },
      {
        title: 'Terms',
        summary: 'Academic years and semesters',
        steps: [
          'Terms Management shows academic years derived from curriculum batch years, and how many subject offerings exist in 1st vs 2nd semester.',
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
          'Open Settings from the sidebar or the account menu. Department heads do not have Settings.',
        ],
        href: '/dashboard/settings',
      },
      {
        title: 'Reports',
        summary: 'Figures, analysis, and branded exports',
        steps: [
          'Each report opens with the PASS College letterhead (logo, school name, and address), then key figures, charts, written analysis, and the detailed register.',
          'Student evaluations — status mix, evaluations by course and year level, approval rate, and passed / eligible / blocked counts.',
          'Curriculum — students and subjects by batch, active vs inactive versions, and term distribution.',
          'Subject performance — failure-rate chart, risk bands (high ≥30%), and every graded subject.',
          'Academic progress — completion distribution, averages by course and year, and students who need advising.',
          'Export Excel for the open report or the full workbook. Print / PDF saves the on-screen report. Every export includes the school logo and PASS College name.',
          'Department heads see the same four tabs, limited to their assigned courses.',
        ],
        href: '/dashboard/reports',
      },
      {
        title: 'Support & access',
        summary: 'Help resources and who can use admin tools',
        steps: [
          'Documentation and Support are in the Help section at the bottom of the dashboard sidebar (also in the mobile menu).',
          'Support lists FAQs and registrar contact details, and can open a pre-filled email to the support address.',
          'Curriculum, Courses, Heads, Terms, Settings, and Teams require an ADMIN account; department heads are redirected from those pages.',
          'Department heads can sign in to the dashboard and see Dashboard, Students, Records, and Reports only for the courses assigned to them.',
          'Administrators register heads from Heads, assign one or more departments, and email a temporary password.',
          'Administrators register additional admins from Teams. The first setup account is Root and is labeled with a Root badge.',
          'Change password is in the account menu for staff and students. First-login temporary passwords must be replaced before the dashboard or portal can be used.',
          'Use the theme toggle in the header to switch light and dark mode.',
          'Students use the portal at /default to enter grades and print, download, or email the grade slip for the registrar.',
        ],
        href: '/dashboard/support',
      },
    ],
  },
  {
    id: 'student',
    title: 'Student portal guide',
    description:
      'Students sign in at /default. After registration they must replace the emailed temporary password. The portal has four tabs: curriculum, grades, results, and progress.',
    guides: [
      {
        title: 'First login',
        summary: 'Replace the temporary password',
        steps: [
          'Sign in with the email and temporary password from your registration message.',
          'Choose a new password of at least 6 characters. You cannot reuse the temporary password.',
          'After saving, you can open curriculum, grades, results, and progress. Change password later from the account menu.',
          'If you see “No student record found” or “Curriculum not assigned,” ask an administrator to register you and assign a curriculum.',
        ],
      },
      {
        title: 'Curriculum tab',
        summary: 'Subjects for your standing',
        steps: [
          'Browse subjects for Year 1 through your current year level, grouped by semester.',
          'Prior years are marked read-only. Enter grades for the current term under Input grades.',
          'Confirm your year level and semester on the welcome card before entering grades.',
        ],
      },
      {
        title: 'Prior term records',
        summary: 'Incomplete earlier terms after a shift or irregular standing',
        steps: [
          'If earlier terms are missing passed grades, an amber banner appears above the tabs.',
          'This is common after a mid-year curriculum shift, when 1st-semester subjects may still be unfinished while you are already in 2nd semester.',
          'On Input grades, print a leftover-subject request and submit it to an administrator. Staff confirm each subject for next semester, next year, or a makeup term (after the last curriculum term is approved) under Record Management.',
          'Until those records are updated, subjects that depend on them may stay blocked in Evaluation results.',
        ],
      },
      {
        title: 'Input grades tab',
        summary: 'Enter, save, and submit term grades',
        steps: [
          'Enter numeric grades per subject for the active term. Confirmed leftover subjects appear marked Makeup; failed subjects appear marked Retake.',
          'After the last curriculum term is approved, leftover or failed subjects are assigned to a makeup term. That makeup term is what you grade here — not the already-approved years.',
          'When every curriculum term — including a makeup term, if one was needed — is approved and every subject is passed, Input grades shows a congratulations screen instead of a grade form.',
          'Save your grades; the system applies pass/fail rules when grades are numeric. Quick status shows passed, failed, incomplete, and pending counts.',
          'After saving, grade entry is closed. Print, download, or email the Grade Submission Form, then submit the printed slip to the registrar.',
          'Cancel the submission if you need to edit grades before your department head evaluates. You cannot cancel after the head evaluates the term.',
          'If you fail a subject, print the Request to Retake Subject form and submit it to an administrator.',
          'Leftover subjects from an earlier term (pending or incomplete) use a similar printed request so staff can assign them to next semester, next year, or a makeup term after the last curriculum term is approved.',
          'Your department head evaluates by date, then the registrar or admin checks and approves by date.',
        ],
      },
      {
        title: 'Evaluation results tab',
        summary: 'Passed, eligible, and blocked subjects',
        steps: [
          'The status panel shows whether the term is pending evaluation, evaluated by the head, or approved by the registrar or admin.',
          'Review subjects marked passed for the current term, and failed subjects that still need a retake.',
          'Eligible subjects are recommended for the next enrollment term, with prerequisite completion %.',
          'Blocked subjects list missing requirements—failed prerequisites, unmet year standing, insufficient curriculum units, or unfinished prior-term subjects.',
        ],
      },
      {
        title: 'Progress / study plan tab',
        summary: 'Path to graduation and recommended focus',
        steps: [
          'Path to graduation estimates remaining years and semesters if you stay on track, and the expected final term.',
          'Academic progress shows overall completion from Year 1 through your current year level.',
          'Study plan lists failed or incomplete subjects to resolve first, then eligible subjects for the next enrollment term.',
          'Failed or incomplete subjects can add extra semesters. Official graduation still depends on evaluation and registrar clearance.',
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
          'Students save grades in the portal, then submit the printed grade slip to the registrar. They may cancel the submission until the head evaluates.',
          'Only department heads can Evaluate by date on any term in Records (or the current term on View Evaluation). That stores passed, eligible, and blocked lists and waits for approval.',
          'Only the registrar or admin can Check and approve by date for that same term. Approval of the current term applies progression; approval of a past term does not change standing.',
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
          'Unfinished prior-term subjects (for example after a shift) can also keep later subjects blocked until those grades are entered and passed.',
        ],
      },
      {
        title: 'Failed subjects, leftovers, and retakes',
        summary: 'Printed request and admin confirmation',
        steps: [
          'After a student fails a subject, the grades tab shows a Request to Retake Subject form to print and submit to an administrator.',
          'Leftover subjects (pending or incomplete from an earlier term, often after a shift) use a similar request so they can be scheduled the same way.',
          'On Records, under Subjects to take later, confirm each subject for next semester, next year, or a makeup term if every year and term in the curriculum is already approved.',
          'Once confirmed, that subject appears on the student grade evaluation form for that term so a new grade can be entered. A makeup term opens after the last approved curriculum term so leftover work is not trapped on a locked grade form.',
          'Passing the retake or makeup updates the subject to PASSED and completes the retake record.',
        ],
        href: '/dashboard/records',
      },
      {
        title: 'Curriculum shift and advising',
        summary: 'How a program change affects records and evaluation',
        steps: [
          'A shift does not change year level or semester. Progression still happens only when the current term is approved.',
          'Matching catalog subjects keep their grades on the new curriculum. The old curriculum remains visible as a read-only prior course record.',
          'Subjects that exist only on the old curriculum stay on that prior record. Subjects unique to the new curriculum start without a grade.',
          'If the student is already in 2nd semester, unfinished 1st-semester subjects on the new curriculum should be requested as leftovers and confirmed in Records.',
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
  { title: 'Heads', href: '/dashboard/heads' },
  { title: 'Courses', href: '/dashboard/courses' },
  { title: 'Curriculum & import', href: '/dashboard/curriculum' },
  { title: 'Subject catalog', href: '/dashboard/curriculum/subjects' },
  { title: 'Reports', href: '/dashboard/reports' },
  { title: 'Settings', href: '/dashboard/settings' },
  { title: 'Support', href: '/dashboard/support' },
  { title: 'Student portal', href: '/default' },
] as const;
