import * as z from "zod/v4";
import { SEMESTER_TERMS } from "@/lib/semester-terms";

export const NewPasswordSchema = z.object({
  password: z.string().min(6, {
    message: "Minimum of 6 characters required",
  }),
});

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, {
      message: "Current password is required",
    }),
    password: z.string().min(6, {
      message: "Minimum of 6 characters required",
    }),
    confirmPassword: z.string().min(1, {
      message: "Confirm your new password",
    }),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((value) => value.password !== value.currentPassword, {
    message: "New password must be different from your temporary password",
    path: ["password"],
  });

export const ResetSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
});

export const LoginSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
  password: z.string().min(1, {
    message: "Password is required",
  }),
  code: z.optional(z.string()),
});

export const RegisterSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
  password: z.string().min(6, {
    message: "Minimum 6 characters required",
  }),
  username: z.string()
    .min(3, {
      message: "Username must be at least 3 characters",
    })
    .max(20, {
      message: "Username must be at most 20 characters",
    })
    .regex(/^[a-zA-Z0-9_]+$/, {
      message: "Username can only contain letters, numbers, and underscores",
    }),
});

export const UpdateStudentSchema = z.object({
  id: z.string().min(1, { message: "Student record is required" }),
  studentId: z.string().min(1, {
    message: "Student ID is required",
  }),
  email: z.string().email({
    message: "Valid email is required",
  }),
  fullName: z.string().min(3, {
    message: "Full name must be at least 3 characters",
  }),
  yearLevel: z.coerce.number().int().min(1, {
    message: "Year level must be at least 1",
  }).max(6, {
    message: "Year level must be at most 6",
  }),
  curriculumId: z.string().min(1, {
    message: "Curriculum is required",
  }),
});

export const ShiftStudentCurriculumSchema = z.object({
  id: z.string().min(1, { message: "Student record is required" }),
  curriculumId: z.string().min(1, {
    message: "Curriculum is required",
  }),
});

const ActionDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: "Select a valid date",
});

export const SubmitEvaluationSchema = z.object({
  studentId: z.string().min(1, { message: "Student is required" }),
  curriculumId: z.string().optional(),
  /** Term being evaluated. Defaults to the student's current year/semester. */
  yearLevel: z.number().int().min(1).max(6).optional(),
  semester: z.enum(SEMESTER_TERMS).optional(),
  completedByName: z.string().trim().min(2, {
    message: "Name of the person who evaluated this term is required",
  }).max(120, {
    message: "Name must be at most 120 characters",
  }),
  actionDate: ActionDateSchema,
  remarks: z
    .string()
    .trim()
    .max(2000, { message: "Remarks must be at most 2000 characters" })
    .optional(),
  confirmed: z.literal(true, {
    message: "Please confirm this evaluation before completing it",
  }),
});

export const ApproveEvaluationSchema = z.object({
  studentId: z.string().min(1, { message: "Student is required" }),
  curriculumId: z.string().optional(),
  /** Term being approved. Defaults to the student's current year/semester. */
  yearLevel: z.number().int().min(1).max(6).optional(),
  semester: z.enum(SEMESTER_TERMS).optional(),
  approvedByName: z.string().trim().min(2, {
    message: "Name of the person who approved this evaluation is required",
  }).max(120, {
    message: "Name must be at most 120 characters",
  }),
  actionDate: ActionDateSchema,
  remarks: z
    .string()
    .trim()
    .max(2000, { message: "Remarks must be at most 2000 characters" })
    .optional(),
  confirmed: z.literal(true, {
    message: "Please confirm this approval before recording it",
  }),
});

export const AdminRegistrationSchema = z.object({
  fullName: z.string().min(3, {
    message: "Full name must be at least 3 characters",
  }),
  email: z.string().email({
    message: "Valid email is required",
  }),
});

export const HeadRegistrationSchema = z.object({
  fullName: z.string().min(3, {
    message: "Full name must be at least 3 characters",
  }),
  email: z.string().email({
    message: "Valid email is required",
  }),
  courseIds: z.array(z.string().min(1)).min(1, {
    message: "Assign at least one department",
  }),
});

export const UpdateHeadSchema = z.object({
  id: z.string().min(1, { message: "Head record is required" }),
  fullName: z.string().min(3, {
    message: "Full name must be at least 3 characters",
  }),
  email: z.string().email({
    message: "Valid email is required",
  }),
  courseIds: z.array(z.string().min(1)).min(1, {
    message: "Assign at least one department",
  }),
});

export const StudentRegistrationSchema = z.object({
  studentId: z.string().min(1, {
    message: "Student ID is required",
  }),
  email: z.string().email({
    message: "Valid email is required",
  }),
  fullName: z.string().min(3, {
    message: "Full name must be at least 3 characters",
  }),
  yearLevel: z.coerce.number().int().min(1, {
    message: "Year level must be at least 1",
  }).max(6, {
    message: "Year level must be at most 6",
  }),
  curriculumId: z.string().min(1, {
    message: "Curriculum is required",
  }),
});

export const CreateCourseSchema = z.object({
  code: z
    .string()
    .min(2, { message: "Course code is required" })
    .max(20, { message: "Course code must be at most 20 characters" })
    .regex(/^[A-Za-z0-9]+$/, {
      message: "Course code can only contain letters and numbers",
    }),
  title: z.string().min(3, {
    message: "Course title is required",
  }),
  isActive: z.boolean().default(true),
});

export const UpdateCourseSchema = CreateCourseSchema.extend({
  id: z.string().min(1, { message: "Course is required" }),
});

export const CreateCurriculumSchema = z.object({
  programCode: z.string().min(2, {
    message: "Program code is required",
  }),
  title: z.string().min(3, {
    message: "Curriculum title is required",
  }),
  batchLabel: z.string().min(4, {
    message: "Batch label is required",
  }),
  batchYear: z.coerce.number().int().min(2000, {
    message: "Batch year must be valid",
  }).max(2100, {
    message: "Batch year must be valid",
  }),
  versionTag: z.enum(["OLD", "NEW"]),
  isActive: z.boolean().default(true),
  notes: z.string().optional(),
});

export const UpdateCurriculumSchema = CreateCurriculumSchema.extend({
  id: z.string().min(1, { message: "Curriculum is required" }),
});

export const ImportCurriculumSheetSchema = z.object({
  sheetName: z.string().min(1, { message: "Sheet name is required" }),
  programCode: z.string().min(2, {
    message: "Program code is required",
  }),
  versionTag: z.enum(["OLD", "NEW"]),
  mode: z.enum(["import", "replace", "skip"]),
  batchYear: z.coerce.number().int().min(2000).max(2100),
  batchLabel: z.string().min(1, { message: "Batch label is required" }),
});

export const ImportCurriculumSheetsPayloadSchema = z.object({
  sheets: z.array(ImportCurriculumSheetSchema).min(1, {
    message: "Select at least one sheet to import",
  }),
});

export const CreateSubjectSchema = z.object({
  code: z.string().min(2, {
    message: "Subject code is required",
  }),
  description: z.string().min(3, {
    message: "Subject description is required",
  }),
  units: z.coerce.number().int().min(1, {
    message: "Units must be at least 1",
  }).max(10, {
    message: "Units must be at most 10",
  }),
});

export const UpdateSubjectSchema = CreateSubjectSchema.extend({
  id: z.string().min(1, { message: "Subject is required" }),
});

export const UpdateCurriculumSubjectOfferingSchema = z.object({
  id: z.string().min(1, { message: "Curriculum subject offering is required" }),
  yearLevel: z.coerce.number().int().min(1, {
    message: "Year level is required",
  }).max(6, {
    message: "Year level must be at most 6",
  }),
  semester: z.enum(SEMESTER_TERMS),
  displayOrder: z.coerce.number().int().min(0).default(0),
});

export const AssignSubjectToCurriculumSchema = z.object({
  curriculumId: z.string().min(1, {
    message: "Curriculum is required",
  }),
  subjectId: z.string().min(1, {
    message: "Subject is required",
  }),
  yearLevel: z.coerce.number().int().min(1, {
    message: "Year level is required",
  }).max(6, {
    message: "Year level must be at most 6",
  }),
  semester: z.enum(SEMESTER_TERMS),
  displayOrder: z.coerce.number().int().min(0).default(0),
});

export const CreateCurriculumSubjectSchema = z.object({
  curriculumId: z.string().min(1, {
    message: "Curriculum is required",
  }),
  code: z.string().min(2, {
    message: "Subject code is required",
  }),
  description: z.string().min(3, {
    message: "Subject description is required",
  }),
  units: z.coerce.number().int().min(1, {
    message: "Units must be at least 1",
  }).max(10, {
    message: "Units must be at most 10",
  }),
  yearLevel: z.coerce.number().int().min(1, {
    message: "Year level is required",
  }).max(6, {
    message: "Year level must be at most 6",
  }),
  semester: z.enum(SEMESTER_TERMS),
  displayOrder: z.coerce.number().int().min(0).default(0),
  prerequisiteIds: z.array(z.string().min(1)).default([]),
});

export const AddSubjectPrerequisiteSchema = z.object({
  subjectId: z.string().min(1, {
    message: "Subject is required",
  }),
  prerequisiteId: z.string().min(1, {
    message: "Prerequisite subject is required",
  }),
}).refine((value) => value.subjectId !== value.prerequisiteId, {
  message: "Subject cannot be its own prerequisite",
  path: ["prerequisiteId"],
});

export const AssignCurriculumToStudentSchema = z.object({
  studentId: z.string().min(1, {
    message: "Student is required",
  }),
  curriculumId: z.string().min(1, {
    message: "Curriculum is required",
  }),
});

export const EvaluateStudentSchema = z.object({
  studentId: z.string().min(1, { message: 'Student is required' }),
  curriculumId: z.string().optional(),
  yearLevel: z.number().int().optional(),
  semester: z.enum(SEMESTER_TERMS).optional(),
});

export const SaveStudentGradesSchema = z.object({
  studentId: z.string().min(1, { message: 'Student is required' }),
  /** When saving grades for a past/future term (e.g. transferee credit), marks that term's evaluation pending. */
  yearLevel: z.number().int().min(1).optional(),
  semester: z.enum(SEMESTER_TERMS).optional(),
  grades: z.array(
    z.object({
      curriculumSubjectId: z.string().min(1),
      grade: z.string().optional(),
      status: z.enum(['PASSED', 'FAILED', 'INCOMPLETE', 'PENDING']),
    })
  ),
});

export const ConfirmSubjectRetakeSchema = z.object({
  studentId: z.string().min(1, { message: 'Student is required' }),
  curriculumSubjectId: z.string().min(1, { message: 'Subject is required' }),
  schedule: z.enum(['NEXT_SEMESTER', 'NEXT_YEAR']),
});

export const ClearSubjectRetakeSchema = z.object({
  studentId: z.string().min(1, { message: 'Student is required' }),
  curriculumSubjectId: z.string().min(1, { message: 'Subject is required' }),
});
