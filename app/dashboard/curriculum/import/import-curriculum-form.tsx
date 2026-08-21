"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Circle,
  Clock,
  Download,
  FileSpreadsheet,
  FileUp,
  GraduationCap,
  Layers,
  ListChecks,
  Sparkles,
} from "lucide-react";

import {
  importCurriculaFromExcel,
  previewCurriculumImport,
  type CurriculumImportSheetPreview,
  type CurriculumImportSheetResult,
  type ExistingCurriculumSummary,
} from "@/actions/curriculum";
import type { CourseOption } from "@/lib/courses";
import { detectCurriculumVersionTag } from "@/lib/curriculum-excel";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";

type ConflictAction = "replace" | "change-codes" | "skip";

type SheetDecision = {
  sheetName: string;
  included: boolean;
  programCode: string;
  versionTag: "OLD" | "NEW";
  versionLocked: boolean;
  batchYear: number;
  batchLabel: string;
  conflictAction: ConflictAction | "";
};

type ImportStage = "upload" | "review" | "progress" | "import";

type ImportProgressItem = {
  sheetName: string;
  programCode: string;
  title: string;
  versionTag: "OLD" | "NEW";
  versionReason: string;
  batchLabel: string;
  batchYear: number;
  subjectsCount: number;
  offeringsCount: number;
  mode: "import" | "replace";
  status: "pending" | "importing" | "success" | "error";
  message?: string;
};

const IMPORT_STAGES: { id: ImportStage; label: string }[] = [
  { id: "upload", label: "Upload" },
  { id: "review", label: "Review sheets" },
  { id: "progress", label: "Progress" },
  { id: "import", label: "Import" },
];

interface ImportCurriculumFormProps {
  courses: CourseOption[];
}

const EXCEL_ACCEPT =
  ".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function formatBatchLabel(year: number) {
  return `A.Y. ${year}-${year + 1}`;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function findExisting(
  programCode: string,
  batchYear: number,
  existing: ExistingCurriculumSummary[]
) {
  const code = programCode.trim().toUpperCase();
  return existing.find(
    (item) => item.programCode === code && item.batchYear === batchYear
  );
}

function isImportableSheet(sheet: CurriculumImportSheetPreview) {
  return !sheet.parseError && sheet.subjectsCount > 0 && sheet.offeringsCount > 0;
}

function formatElapsed(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function ImportStageStepper({ stage }: { stage: ImportStage }) {
  const currentIndex = IMPORT_STAGES.findIndex((item) => item.id === stage);

  return (
    <ol className="grid gap-3 sm:grid-cols-4">
      {IMPORT_STAGES.map((item, index) => {
        const done = index < currentIndex;
        const active = index === currentIndex;

        return (
          <li key={item.id} className="flex items-center gap-2">
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                done && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
                active && "bg-primary text-primary-foreground",
                !done && !active && "bg-muted text-muted-foreground"
              )}
            >
              {done ? <CheckCircle2 className="size-4" /> : index + 1}
            </span>
            <span
              className={cn(
                "text-sm",
                active ? "font-medium text-foreground" : "text-muted-foreground"
              )}
            >
              {item.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default function ImportCurriculumForm({
  courses,
}: ImportCurriculumFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<"preview" | "import" | null>(
    null
  );
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [confirmReplaceOpen, setConfirmReplaceOpen] = useState(false);
  const [sheets, setSheets] = useState<CurriculumImportSheetPreview[]>([]);
  const [existingCurricula, setExistingCurricula] = useState<
    ExistingCurriculumSummary[]
  >([]);
  const [decisions, setDecisions] = useState<SheetDecision[]>([]);
  const [results, setResults] = useState<CurriculumImportSheetResult[] | null>(
    null
  );
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgressItem[]>(
    []
  );
  const [stage, setStage] = useState<ImportStage>("upload");
  const [elapsedMs, setElapsedMs] = useState(0);

  const hasCourses = courses.length > 0;
  const isPreviewing = isPending && pendingAction === "preview";
  const isBusy = isPreviewing || isImporting;

  const updateDecision = (
    sheetName: string,
    patch: Partial<SheetDecision>
  ) => {
    setDecisions((prev) =>
      prev.map((decision) =>
        decision.sheetName === sheetName ? { ...decision, ...patch } : decision
      )
    );
  };

  const resetReview = () => {
    setSheets([]);
    setExistingCurricula([]);
    setDecisions([]);
    setResults(null);
    setImportProgress([]);
    setSuccess(undefined);
    setElapsedMs(0);
    setStage("upload");
  };

  const loadPreview = (nextFile: File) => {
    setError(undefined);
    setSuccess(undefined);
    setResults(null);
    setFile(nextFile);

    const formData = new FormData();
    formData.append("file", nextFile);

    setPendingAction("preview");
    startTransition(() => {
      previewCurriculumImport(formData).then((data) => {
        setPendingAction(null);
        if (data?.error) {
          setError(data.error);
          resetReview();
          return;
        }

        const nextSheets = data.sheets ?? [];
        setSheets(nextSheets);
        setExistingCurricula(data.existingCurricula ?? []);
        setDecisions(
          nextSheets.map((sheet) => ({
            sheetName: sheet.sheetName,
            included: isImportableSheet(sheet),
            programCode: sheet.suggestedProgramCode ?? "",
            versionTag: sheet.suggestedVersionTag,
            versionLocked: false,
            batchYear: sheet.batchYear,
            batchLabel: sheet.batchLabel,
            conflictAction: "",
          }))
        );
        setStage("review");
      });
    });
  };

  const handleSelectedFile = (nextFile: File | undefined) => {
    if (!nextFile) return;
    const isExcel =
      nextFile.name.toLowerCase().endsWith(".xlsx") ||
      nextFile.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    if (!isExcel) {
      setError("Please select an Excel file (.xlsx)");
      return;
    }
    loadPreview(nextFile);
  };

  const sheetIssues = useMemo(() => {
    const issues = new Map<string, string | null>();

    for (const decision of decisions) {
      const preview = sheets.find(
        (sheet) => sheet.sheetName === decision.sheetName
      );
      if (!preview) {
        issues.set(decision.sheetName, "Sheet is no longer in the workbook");
        continue;
      }

      if (!decision.included || decision.conflictAction === "skip") {
        issues.set(decision.sheetName, null);
        continue;
      }

      if (!isImportableSheet(preview)) {
        issues.set(
          decision.sheetName,
          preview.parseError || "No subjects found in this sheet"
        );
        continue;
      }

      if (!decision.programCode) {
        issues.set(decision.sheetName, "Select a course for this sheet");
        continue;
      }

      const match = findExisting(
        decision.programCode,
        decision.batchYear,
        existingCurricula
      );
      if (match && decision.conflictAction === "") {
        issues.set(
          decision.sheetName,
          "Confirm whether to replace, skip, or change codes"
        );
        continue;
      }
      if (match && decision.conflictAction === "change-codes") {
        issues.set(
          decision.sheetName,
          "Change the program code or batch year so it no longer matches an existing curriculum"
        );
        continue;
      }

      const duplicate = decisions.find(
        (other) =>
          other.sheetName !== decision.sheetName &&
          other.included &&
          other.conflictAction !== "skip" &&
          other.programCode === decision.programCode &&
          other.batchYear === decision.batchYear
      );
      if (duplicate) {
        issues.set(
          decision.sheetName,
          `Same program and batch as “${duplicate.sheetName}”`
        );
        continue;
      }

      issues.set(decision.sheetName, null);
    }

    return issues;
  }, [decisions, existingCurricula, sheets]);

  const resolvedVersions = useMemo(() => {
    const includedPeers = decisions
      .filter(
        (decision) => decision.included && decision.conflictAction !== "skip"
      )
      .map((decision) => ({
        programCode: decision.programCode,
        batchYear: decision.batchYear,
      }));

    const related = [
      ...existingCurricula.map((curriculum) => ({
        programCode: curriculum.programCode,
        batchYear: curriculum.batchYear,
      })),
      ...includedPeers,
    ];

    const resolved = new Map<
      string,
      { versionTag: "OLD" | "NEW"; reason: string; auto: boolean }
    >();

    for (const decision of decisions) {
      const detected = detectCurriculumVersionTag(
        {
          programCode: decision.programCode,
          batchYear: decision.batchYear,
        },
        related.filter(
          (item) =>
            !(
              item.programCode === decision.programCode &&
              item.batchYear === decision.batchYear
            )
        )
      );

      resolved.set(decision.sheetName, {
        versionTag: decision.versionLocked
          ? decision.versionTag
          : detected.versionTag,
        reason: detected.reason,
        auto: !decision.versionLocked,
      });
    }

    return resolved;
  }, [decisions, existingCurricula]);

  const importPlan = useMemo(() => {
    const ready = decisions.filter((decision) => {
      if (!decision.included || decision.conflictAction === "skip") return false;
      return !sheetIssues.get(decision.sheetName);
    });

    const replacing = ready.filter((decision) => {
      const match = findExisting(
        decision.programCode,
        decision.batchYear,
        existingCurricula
      );
      return Boolean(match) && decision.conflictAction === "replace";
    });

    const creating = ready.filter((decision) => {
      const match = findExisting(
        decision.programCode,
        decision.batchYear,
        existingCurricula
      );
      return !match;
    });

    const skipped = decisions.filter(
      (decision) => !decision.included || decision.conflictAction === "skip"
    );
    const blocked = decisions.filter(
      (decision) =>
        decision.included &&
        decision.conflictAction !== "skip" &&
        Boolean(sheetIssues.get(decision.sheetName))
    );

    return { ready, replacing, creating, skipped, blocked };
  }, [decisions, existingCurricula, sheetIssues]);

  useEffect(() => {
    if (!isImporting) return;
    const startedAt = Date.now();
    setElapsedMs(0);
    const timer = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, 250);
    return () => window.clearInterval(timer);
  }, [isImporting]);

  const canImport =
    hasCourses &&
    Boolean(file) &&
    stage === "review" &&
    importPlan.ready.length > 0 &&
    importPlan.blocked.length === 0 &&
    !isBusy;

  const processedCount = importProgress.filter(
    (item) => item.status === "success" || item.status === "error"
  ).length;
  const currentProgressItem = importProgress.find(
    (item) => item.status === "importing"
  );
  const progressPercent =
    importProgress.length === 0
      ? 0
      : Math.round((processedCount / importProgress.length) * 100);

  const runImport = async () => {
    if (!file || importPlan.ready.length === 0) return;

    setError(undefined);
    setSuccess(undefined);
    setResults([]);
    setStage("progress");
    setIsImporting(true);

    const queue = importPlan.ready;
    setImportProgress(
      queue.map((decision) => {
        const preview = sheets.find(
          (sheet) => sheet.sheetName === decision.sheetName
        );
        const version = resolvedVersions.get(decision.sheetName);
        const match = findExisting(
          decision.programCode,
          decision.batchYear,
          existingCurricula
        );

        return {
          sheetName: decision.sheetName,
          programCode: decision.programCode,
          title: preview?.title || "Untitled curriculum",
          versionTag: version?.versionTag ?? decision.versionTag,
          versionReason: version?.reason ?? "",
          batchLabel: decision.batchLabel,
          batchYear: decision.batchYear,
          subjectsCount: preview?.subjectsCount ?? 0,
          offeringsCount: preview?.offeringsCount ?? 0,
          mode:
            match && decision.conflictAction === "replace"
              ? "replace"
              : "import",
          status: "pending" as const,
        };
      })
    );

    await Promise.resolve();

    const collected: CurriculumImportSheetResult[] = [];

    try {
      for (let index = 0; index < queue.length; index += 1) {
        const decision = queue[index];
        if (!decision) continue;

        const version =
          resolvedVersions.get(decision.sheetName)?.versionTag ??
          decision.versionTag;
        const match = findExisting(
          decision.programCode,
          decision.batchYear,
          existingCurricula
        );

        setImportProgress((prev) =>
          prev.map((item, itemIndex) =>
            itemIndex === index ? { ...item, status: "importing" } : item
          )
        );

        const formData = new FormData();
        formData.append("file", file);
        formData.append(
          "sheets",
          JSON.stringify({
            sheets: [
              {
                sheetName: decision.sheetName,
                programCode: decision.programCode,
                versionTag: version,
                mode:
                  match && decision.conflictAction === "replace"
                    ? "replace"
                    : "import",
                batchYear: decision.batchYear,
                batchLabel: decision.batchLabel,
              },
            ],
          })
        );

        const data = await importCurriculaFromExcel(formData);
        const sheetResult = data.results?.[0] ?? {
          sheetName: decision.sheetName,
          programCode: decision.programCode,
          error: data.error || "Failed to import this sheet",
        };

        collected.push(sheetResult);
        setResults([...collected]);
        setImportProgress((prev) =>
          prev.map((item, itemIndex) =>
            itemIndex === index
              ? {
                  ...item,
                  status: sheetResult.error ? "error" : "success",
                  message: sheetResult.error || sheetResult.success,
                }
              : item
          )
        );
      }

      const successCount = collected.filter((item) => item.success).length;
      const errorCount = collected.filter((item) => item.error).length;

      if (successCount === 0) {
        setError(
          collected.find((item) => item.error)?.error ||
            "Failed to import curricula from Excel"
        );
      } else {
        const errorNote =
          errorCount > 0 ? ` ${errorCount} sheet(s) failed.` : "";
        setSuccess(
          `Imported ${successCount} curriculum${successCount === 1 ? "" : "a"}.${errorNote}`
        );
        router.refresh();
      }
      setStage("import");
    } catch (error) {
      console.error("Import curricula progress error:", error);
      setError("Failed to import curricula from Excel");
      setStage("import");
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportClick = () => {
    if (importPlan.replacing.length > 0) {
      setConfirmReplaceOpen(true);
      return;
    }
    runImport();
  };

  return (
    <div className="max-w-4xl space-y-6">
      {!hasCourses && (
        <Alert>
          <GraduationCap />
          <AlertTitle>No courses available</AlertTitle>
          <AlertDescription>
            Add at least one course before importing a curriculum.{" "}
            <Link href="/dashboard/courses">Manage courses</Link>
          </AlertDescription>
        </Alert>
      )}

      <ImportStageStepper stage={stage} />

      {stage === "upload" && (
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Workbook</CardTitle>
          <CardDescription>
            Each worksheet is treated as a separate curriculum. Sheet names like
            BSCS 24-25 are matched to courses automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href="/api/curriculum/template" download>
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </a>
            </Button>
          </div>

          <label
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              handleSelectedFile(event.dataTransfer.files?.[0]);
            }}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border bg-muted/30 hover:bg-muted/50",
              isBusy && "pointer-events-none opacity-60"
            )}
          >
            <FileSpreadsheet className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">
              Drop an Excel workbook or click to browse
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              .xlsx only — one curriculum per worksheet
            </p>
            <Input
              ref={fileInputRef}
              type="file"
              accept={EXCEL_ACCEPT}
              disabled={isBusy || !hasCourses}
              className="sr-only"
              onChange={(event) => {
                handleSelectedFile(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </label>

          {file && (
            <div className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                  {sheets.length > 0
                    ? ` · ${sheets.length} worksheet${sheets.length === 1 ? "" : "s"} detected`
                    : isPreviewing
                      ? " · Reading worksheets..."
                      : ""}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isBusy}
                onClick={() => {
                  setFile(null);
                  resetReview();
                  setError(undefined);
                }}
              >
                Clear
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {stage === "upload" && isPreviewing && (
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Reading workbook</CardTitle>
            <CardDescription>
              Parsing worksheets and matching them to existing courses and curricula.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={35} className="h-2 animate-pulse" />
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner />
              Detecting programs, batch years, and Old/New versions...
            </p>
          </CardContent>
        </Card>
      )}

      {stage === "review" && (
        <div className="space-y-4">
          {file && (
            <div className="flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)} · {sheets.length} worksheet
                  {sheets.length === 1 ? "" : "s"} ready for review
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFile(null);
                  resetReview();
                  setError(undefined);
                }}
              >
                Change file
              </Button>
            </div>
          )}
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold tracking-tight">
                Review detected curricula
              </h3>
              <p className="text-sm text-muted-foreground">
                {importPlan.creating.length} new, {importPlan.replacing.length}{" "}
                replace, {importPlan.skipped.length} skipped
                {importPlan.blocked.length > 0
                  ? `, ${importPlan.blocked.length} need confirmation`
                  : ""}
                . Versions are detected from older vs newer batch years.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isBusy}
                onClick={() =>
                  setDecisions((prev) =>
                    prev.map((decision) => ({
                      ...decision,
                      versionLocked: false,
                    }))
                  )
                }
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Auto-detect versions
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isBusy}
                onClick={() =>
                  setDecisions((prev) =>
                    prev.map((decision) => ({
                      ...decision,
                      versionTag: "NEW",
                      versionLocked: true,
                    }))
                  )
                }
              >
                Mark all as New
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isBusy}
                onClick={() =>
                  setDecisions((prev) =>
                    prev.map((decision) => ({
                      ...decision,
                      versionTag: "OLD",
                      versionLocked: true,
                    }))
                  )
                }
              >
                Mark all as Old
              </Button>
            </div>
          </div>

          {decisions.map((decision) => {
            const preview = sheets.find(
              (sheet) => sheet.sheetName === decision.sheetName
            );
            if (!preview) return null;

            const existing = findExisting(
              decision.programCode,
              decision.batchYear,
              existingCurricula
            );
            const issue = sheetIssues.get(decision.sheetName);
            const importable = isImportableSheet(preview);
            const selectedCourse = courses.find(
              (course) => course.code === decision.programCode
            );
            const version = resolvedVersions.get(decision.sheetName);

            return (
              <Card
                key={decision.sheetName}
                className={cn(
                  existing && decision.included && decision.conflictAction !== "skip"
                    ? "ring-1 ring-amber-500/30"
                    : undefined
                )}
              >
                <CardHeader className="border-b">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle className="flex flex-wrap items-center gap-2">
                        <Layers className="h-4 w-4 text-muted-foreground" />
                        {decision.sheetName}
                        {existing ? (
                          <Badge variant="destructive">Exists</Badge>
                        ) : importable ? (
                          <Badge variant="secondary">New record</Badge>
                        ) : (
                          <Badge variant="outline">Skipped</Badge>
                        )}
                        {importable && (
                          <Badge variant="outline">
                            {version?.versionTag === "OLD"
                              ? "Old version"
                              : "New version"}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {preview.title || "Untitled curriculum"} ·{" "}
                        {preview.batchLabel} · {preview.subjectsCount} subjects,{" "}
                        {preview.offeringsCount} offerings
                      </CardDescription>
                    </div>
                    <Field orientation="horizontal" className="w-auto shrink-0">
                      <Checkbox
                        id={`include-${decision.sheetName}`}
                        checked={decision.included}
                        disabled={isBusy || !importable}
                        onCheckedChange={(checked) =>
                          updateDecision(decision.sheetName, {
                            included: checked === true,
                            conflictAction:
                              checked === true ? decision.conflictAction : "",
                          })
                        }
                      />
                      <FieldLabel htmlFor={`include-${decision.sheetName}`}>
                        Include
                      </FieldLabel>
                    </Field>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  {!importable && (
                    <Alert variant="destructive">
                      <AlertTriangle />
                      <AlertTitle>This sheet cannot be imported</AlertTitle>
                      <AlertDescription>
                        {preview.parseError ||
                          "No subjects were found. Check that the sheet uses the PASS curriculum template."}
                      </AlertDescription>
                    </Alert>
                  )}

                  <FieldGroup>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field>
                        <FieldLabel>Course / program code</FieldLabel>
                        <Select
                          value={decision.programCode}
                          onValueChange={(value) =>
                            updateDecision(decision.sheetName, {
                              programCode: value,
                              conflictAction: "",
                              versionLocked: false,
                            })
                          }
                          disabled={isBusy || !decision.included || !hasCourses}
                        >
                          <SelectTrigger className="h-10 w-full">
                            <SelectValue placeholder="Select course" />
                          </SelectTrigger>
                          <SelectContent>
                            {courses.map((course) => (
                              <SelectItem key={course.code} value={course.code}>
                                {course.code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldDescription>
                          {selectedCourse?.title ||
                            (preview.suggestedProgramCode
                              ? `Detected from sheet: ${preview.suggestedProgramCode}`
                              : "Could not detect a course from this sheet name")}
                        </FieldDescription>
                      </Field>

                      <Field>
                        <FieldLabel>Version</FieldLabel>
                        <Select
                          value={version?.versionTag ?? decision.versionTag}
                          onValueChange={(value: "OLD" | "NEW") =>
                            updateDecision(decision.sheetName, {
                              versionTag: value,
                              versionLocked: true,
                            })
                          }
                          disabled={isBusy || !decision.included}
                        >
                          <SelectTrigger className="h-10 w-full">
                            <SelectValue placeholder="Select version" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NEW">New Curriculum</SelectItem>
                            <SelectItem value="OLD">Old Curriculum</SelectItem>
                          </SelectContent>
                        </Select>
                        <FieldDescription>
                          {version?.auto
                            ? version.reason
                            : `Manually set. Auto-detect: ${version?.reason}`}
                        </FieldDescription>
                      </Field>

                      <Field>
                        <FieldLabel>Batch year</FieldLabel>
                        <Input
                          type="number"
                          value={decision.batchYear}
                          disabled={isBusy || !decision.included}
                          onChange={(event) => {
                            const nextYear = Number(event.target.value);
                            updateDecision(decision.sheetName, {
                              batchYear: Number.isFinite(nextYear)
                                ? nextYear
                                : decision.batchYear,
                              batchLabel: Number.isFinite(nextYear)
                                ? formatBatchLabel(nextYear)
                                : decision.batchLabel,
                              conflictAction: "",
                              versionLocked: false,
                            });
                          }}
                        />
                      </Field>

                      <Field>
                        <FieldLabel>Batch label</FieldLabel>
                        <Input
                          value={decision.batchLabel}
                          disabled={isBusy || !decision.included}
                          onChange={(event) =>
                            updateDecision(decision.sheetName, {
                              batchLabel: event.target.value,
                            })
                          }
                        />
                      </Field>
                    </div>
                  </FieldGroup>

                  {decision.included && existing && (
                    <Alert>
                      <BookOpen />
                      <AlertTitle>
                        Curriculum already exists for {existing.programCode} (
                        {existing.batchLabel})
                      </AlertTitle>
                      <AlertDescription>
                        {existing.title} currently has {existing.subjectsCount}{" "}
                        subjects ({existing.versionTag === "OLD" ? "Old" : "New"}{" "}
                        curriculum). Confirm whether to replace it, skip this
                        sheet, or import under a different program code / batch
                        year.
                      </AlertDescription>
                    </Alert>
                  )}

                  {decision.included && existing && (
                    <FieldSet>
                      <FieldLegend variant="label">
                        Confirmation required
                      </FieldLegend>
                      <RadioGroup
                        value={decision.conflictAction}
                        onValueChange={(value) =>
                          updateDecision(decision.sheetName, {
                            conflictAction: value as ConflictAction,
                          })
                        }
                        disabled={isBusy}
                        className="grid gap-3"
                      >
                        <FieldLabel htmlFor={`${decision.sheetName}-replace`}>
                          <Field orientation="horizontal">
                            <RadioGroupItem
                              value="replace"
                              id={`${decision.sheetName}-replace`}
                            />
                            <FieldContent>
                              <FieldTitle>Replace existing subjects</FieldTitle>
                              <FieldDescription>
                                Rebuild this program and batch from the Excel
                                sheet. Assigned students stay linked.
                              </FieldDescription>
                            </FieldContent>
                          </Field>
                        </FieldLabel>
                        <FieldLabel htmlFor={`${decision.sheetName}-change`}>
                          <Field orientation="horizontal">
                            <RadioGroupItem
                              value="change-codes"
                              id={`${decision.sheetName}-change`}
                            />
                            <FieldContent>
                              <FieldTitle>
                                Change program code or batch year
                              </FieldTitle>
                              <FieldDescription>
                                Keep the existing curriculum and import this
                                sheet as a new version under different codes.
                              </FieldDescription>
                            </FieldContent>
                          </Field>
                        </FieldLabel>
                        <FieldLabel htmlFor={`${decision.sheetName}-skip`}>
                          <Field orientation="horizontal">
                            <RadioGroupItem
                              value="skip"
                              id={`${decision.sheetName}-skip`}
                            />
                            <FieldContent>
                              <FieldTitle>Skip this sheet</FieldTitle>
                              <FieldDescription>
                                Leave the existing curriculum unchanged.
                              </FieldDescription>
                            </FieldContent>
                          </Field>
                        </FieldLabel>
                      </RadioGroup>
                    </FieldSet>
                  )}

                  {issue && decision.included && decision.conflictAction !== "skip" && (
                    <p className="text-sm text-destructive">{issue}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {stage === "progress" && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Import progress</CardTitle>
              <CardDescription>
                {processedCount} of {importProgress.length} sheets processed
                {file ? ` · ${file.name}` : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <p className="font-medium">
                  {progressPercent}% complete
                </p>
                <p className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="size-3.5" />
                  {formatElapsed(elapsedMs)}
                </p>
              </div>
              <Progress value={isImporting && progressPercent === 0 ? 8 : progressPercent} className="h-2" />
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border px-3 py-2">
                  <p className="text-xs text-muted-foreground">Creating</p>
                  <p className="text-lg font-semibold">
                    {importProgress.filter((item) => item.mode === "import").length}
                  </p>
                </div>
                <div className="rounded-lg border px-3 py-2">
                  <p className="text-xs text-muted-foreground">Replacing</p>
                  <p className="text-lg font-semibold">
                    {importProgress.filter((item) => item.mode === "replace").length}
                  </p>
                </div>
                <div className="rounded-lg border px-3 py-2">
                  <p className="text-xs text-muted-foreground">Remaining</p>
                  <p className="text-lg font-semibold">
                    {importProgress.filter((item) => item.status === "pending" || item.status === "importing").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {currentProgressItem ? (
            <Card className="ring-1 ring-primary/30">
              <CardHeader className="border-b">
                <CardTitle className="flex flex-wrap items-center gap-2">
                  <Spinner />
                  Now importing
                  <Badge>{currentProgressItem.sheetName}</Badge>
                </CardTitle>
                <CardDescription>{currentProgressItem.title}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border px-3 py-2 text-sm">
                    <p className="text-xs text-muted-foreground">Course</p>
                    <p className="font-medium">{currentProgressItem.programCode}</p>
                  </div>
                  <div className="rounded-lg border px-3 py-2 text-sm">
                    <p className="text-xs text-muted-foreground">Version</p>
                    <p className="font-medium">
                      {currentProgressItem.versionTag === "OLD"
                        ? "Old curriculum"
                        : "New curriculum"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {currentProgressItem.versionReason}
                    </p>
                  </div>
                  <div className="rounded-lg border px-3 py-2 text-sm">
                    <p className="text-xs text-muted-foreground">Batch</p>
                    <p className="font-medium">
                      {currentProgressItem.batchLabel} ({currentProgressItem.batchYear})
                    </p>
                  </div>
                  <div className="rounded-lg border px-3 py-2 text-sm">
                    <p className="text-xs text-muted-foreground">Action</p>
                    <p className="font-medium">
                      {currentProgressItem.mode === "replace"
                        ? "Replace existing subjects"
                        : "Create new curriculum"}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <ListChecks className="size-4" />
                    Work for this sheet
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2 rounded-lg border px-3 py-2">
                      <Spinner className="mt-0.5" />
                      <span>
                        Saving the {currentProgressItem.programCode} curriculum
                        record for {currentProgressItem.batchLabel}
                      </span>
                    </li>
                    <li className="flex items-start gap-2 rounded-lg border px-3 py-2">
                      <Circle className="mt-0.5 size-4 text-muted-foreground" />
                      <span>
                        Importing {currentProgressItem.subjectsCount} subjects
                      </span>
                    </li>
                    <li className="flex items-start gap-2 rounded-lg border px-3 py-2">
                      <Circle className="mt-0.5 size-4 text-muted-foreground" />
                      <span>
                        Creating {currentProgressItem.offeringsCount} term
                        offerings
                      </span>
                    </li>
                    <li className="flex items-start gap-2 rounded-lg border px-3 py-2">
                      <Circle className="mt-0.5 size-4 text-muted-foreground" />
                      <span>Linking prerequisites and standing rules</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          ) : processedCount === importProgress.length &&
            importProgress.length > 0 ? (
            <Card>
              <CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                <Spinner />
                Finishing import...
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                <Spinner />
                Preparing import queue...
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Sheet queue</CardTitle>
              <CardDescription>
                Finished sheets stay listed so you can track what already ran.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {importProgress.map((item, index) => (
                <div
                  key={item.sheetName}
                  className={cn(
                    "rounded-lg border px-3 py-3 text-sm",
                    item.status === "importing" && "border-primary/40 bg-primary/5"
                  )}
                >
                  <div className="flex items-start gap-2">
                    {item.status === "importing" ? (
                      <Spinner className="mt-0.5" />
                    ) : item.status === "success" ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
                    ) : item.status === "error" ? (
                      <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" />
                    ) : (
                      <Circle className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">
                        {index + 1}. {item.sheetName} · {item.programCode}
                      </p>
                      <p className="text-muted-foreground">
                        {item.batchLabel} ·{" "}
                        {item.versionTag === "OLD" ? "Old" : "New"} ·{" "}
                        {item.subjectsCount} subjects · {item.offeringsCount}{" "}
                        offerings ·{" "}
                        {item.mode === "replace" ? "Replace" : "Create"}
                      </p>
                      <p
                        className={
                          item.status === "error"
                            ? "text-destructive"
                            : "text-muted-foreground"
                        }
                      >
                        {item.status === "pending"
                          ? "Waiting in queue"
                          : item.status === "importing"
                            ? "Currently focused — writing curriculum data..."
                            : item.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {stage === "import" && results && results.length > 0 && (
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Import results
            </CardTitle>
            <CardDescription>
              Review each worksheet that was processed from this workbook.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {results.map((result) => (
              <div
                key={result.sheetName}
                className="rounded-lg border px-3 py-2 text-sm"
              >
                <p className="font-medium">
                  {result.sheetName} · {result.programCode}
                </p>
                <p
                  className={
                    result.error ? "text-destructive" : "text-muted-foreground"
                  }
                >
                  {result.error || result.success}
                </p>
                {result.curriculumId && (
                  <Link
                    href={`/dashboard/curriculum/${result.curriculumId}/subjects`}
                    className="mt-1 inline-block text-xs underline"
                  >
                    Open subjects
                  </Link>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {stage !== "progress" && <FormError message={error} />}
      {stage === "import" && <FormSuccess message={success} />}

      <div className="flex flex-wrap items-center justify-end gap-3">
        {stage === "progress" ? (
          <p className="mr-auto text-sm text-muted-foreground">
            Stay on this page until every sheet finishes.
          </p>
        ) : (
          <Button asChild variant="outline" type="button" disabled={isBusy}>
            <Link href="/dashboard/curriculum">Cancel</Link>
          </Button>
        )}
        {stage === "import" ? (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFile(null);
                resetReview();
                setError(undefined);
                setSuccess(undefined);
              }}
            >
              Import another
            </Button>
            <Button asChild>
              <Link href="/dashboard/curriculum">Back to list</Link>
            </Button>
          </>
        ) : stage === "review" ? (
          <Button
            type="button"
            onClick={handleImportClick}
            disabled={!canImport}
          >
            <FileUp className="mr-2 h-4 w-4" />
            Confirm review
          </Button>
        ) : stage === "progress" ? (
          <Button type="button" disabled>
            <Spinner className="mr-2" />
            {currentProgressItem
              ? `Importing ${processedCount + 1} of ${importProgress.length}`
              : "Starting..."}
          </Button>
        ) : null}
      </div>

      <AlertDialog open={confirmReplaceOpen} onOpenChange={setConfirmReplaceOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogMedia>
              <AlertTriangle />
            </AlertDialogMedia>
            <AlertDialogTitle>Replace existing curricula?</AlertDialogTitle>
            <AlertDialogDescription>
              This will rebuild subjects for{" "}
              {importPlan.replacing
                .map(
                  (decision) => `${decision.programCode} (${decision.batchLabel})`
                )
                .join(", ")}
              . Assigned students stay on the same curriculum record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmReplaceOpen(false);
                runImport();
              }}
            >
              Replace and continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
