import ExcelJS from "exceljs";

import { formatPrerequisiteDisplay } from "@/lib/curriculum-prerequisites";
import type { SemesterTermValue } from "@/lib/semester-terms";

import type {
  CurriculumExportOffering,
  OfferingPrerequisiteDisplay,
} from "@/lib/curriculum-excel";

const LAST_COL = 9;
const FONT = "Arial";

const YEAR_ORDINALS = ["", "1st", "2nd", "3rd", "4th", "5th"] as const;

const COLUMN_HEADERS = [
  "Code ",
  "Pre- Req.",
  "Subject Description",
  "Units",
  "",
  "Code ",
  "Pre- Req.",
  "Subject Description",
  "Units",
] as const;

export type CurriculumExcelExportInput = {
  programCode: string;
  title: string;
  batchLabel: string;
  batchYear: number;
  offerings: CurriculumExportOffering[];
  prerequisiteByOfferingId: Map<string, OfferingPrerequisiteDisplay>;
};

function formatYearHeader(yearLevel: number, suffix = ""): string {
  const ordinal = YEAR_ORDINALS[yearLevel] ?? `${yearLevel}th`;
  return suffix ? `${ordinal}  YEAR ${suffix}` : `${ordinal}  YEAR`;
}

function formatSheetName(programCode: string, batchYear: number): string {
  const endYear = String(batchYear + 1).slice(-2);
  const startYear = String(batchYear).slice(-2);
  return `${programCode} ${startYear}-${endYear}`.slice(0, 31);
}

function formatPrereqDisplay(
  offeringId: string,
  map: Map<string, OfferingPrerequisiteDisplay>
): string {
  const entry = map.get(offeringId);
  if (!entry) return "none";
  return formatPrerequisiteDisplay(entry.subjectCodes, entry.standingLabel);
}

function configureColumns(sheet: ExcelJS.Worksheet) {
  sheet.columns = [
    { width: 12 },
    { width: 18 },
    { width: 42 },
    { width: 8 },
    { width: 3 },
    { width: 12 },
    { width: 18 },
    { width: 42 },
    { width: 8 },
  ];
}

function applyBorder(
  cell: ExcelJS.Cell,
  borders: Partial<ExcelJS.Borders> = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  }
) {
  cell.border = borders;
}

function writeMergedRow(
  sheet: ExcelJS.Worksheet,
  row: number,
  value: string,
  style: Partial<ExcelJS.Style>
) {
  sheet.mergeCells(row, 1, row, LAST_COL);
  const cell = sheet.getCell(row, 1);
  cell.value = value;
  cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  Object.assign(cell, style);
}

function styleHeaderBlock(sheet: ExcelJS.Worksheet, startRow: number) {
  const headerRow = sheet.getRow(startRow);
  COLUMN_HEADERS.forEach((label, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = label;
    cell.font = { name: FONT, bold: true, size: 10 };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD9D9D9" },
    };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    applyBorder(cell);
  });
  headerRow.height = 22;
}

function writeDataRow(
  sheet: ExcelJS.Worksheet,
  row: number,
  values: (string | number)[],
  options?: { bold?: boolean; fill?: string }
) {
  const sheetRow = sheet.getRow(row);
  values.forEach((value, index) => {
    const cell = sheetRow.getCell(index + 1);
    cell.value = value;
    cell.font = {
      name: FONT,
      size: 10,
      bold: options?.bold ?? false,
    };
    cell.alignment = {
      vertical: "middle",
      wrapText: index === 2 || index === 7,
      horizontal: index === 3 || index === 8 ? "center" : "left",
    };
    if (options?.fill) {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: options.fill },
      };
    }
    applyBorder(cell);
  });
  sheetRow.height = 18;
}

async function buildWorkbook(
  input: CurriculumExcelExportInput,
  options?: { templateMode?: boolean }
): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "PASS e-Advising";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(
    formatSheetName(input.programCode, input.batchYear)
  );
  configureColumns(sheet);

  const degreeTitle = options?.templateMode
    ? "Bachelor of Science in [Program Name]"
    : input.title;
  const batchLine = options?.templateMode
    ? "A.Y. YYYY - YYYY"
    : input.batchLabel;

  let row = 1;
  writeMergedRow(sheet, row++, "PASS College", {
    font: { name: FONT, bold: true, size: 12 },
  });
  writeMergedRow(sheet, row++, "Quezon Avenue, City of Alaminos", {
    font: { name: FONT, size: 11 },
  });
  writeMergedRow(sheet, row++, "CURRICULUM LEADING TO THE DEGREE OF", {
    font: { name: FONT, bold: true, size: 11 },
  });
  writeMergedRow(sheet, row++, degreeTitle, {
    font: { name: FONT, bold: true, size: 12 },
  });
  writeMergedRow(sheet, row++, batchLine, {
    font: { name: FONT, bold: true, size: 11 },
  });

  row += 3;

  if (options?.templateMode) {
    writeMergedRow(sheet, row++, "1st  YEAR", {
      font: { name: FONT, bold: true, size: 11 },
    });
    styleHeaderBlock(sheet, row++);
    writeDataRow(sheet, row, [
      "SUBJ 101",
      "none",
      "Sample Subject Description",
      3,
      "",
      "SUBJ 102",
      "SUBJ 101",
      "Another Sample Subject",
      3,
    ]);
    writeDataRow(
      sheet,
      row,
      ["", "", "TOTAL", 3, "", "", "", "TOTAL", 3],
      { bold: true, fill: "FFF2F2F2" }
    );
    return workbook;
  }

  const maxYear = input.offerings.reduce(
    (max, item) => Math.max(max, item.yearLevel),
    0
  );

  const sortByDisplayOrder = (
    a: CurriculumExportOffering,
    b: CurriculumExportOffering
  ) => a.displayOrder - b.displayOrder;

  for (let year = 1; year <= maxYear; year++) {
    const yearOfferings = input.offerings.filter((o) => o.yearLevel === year);
    const firstSem = yearOfferings
      .filter((o) => o.semester === "FIRST")
      .sort(sortByDisplayOrder);
    const secondSem = yearOfferings
      .filter((o) => o.semester === ("SECOND" as SemesterTermValue))
      .sort(sortByDisplayOrder);
    const singleSemesterLayout =
      firstSem.length > 0 && secondSem.length === 0;

    if (singleSemesterLayout) {
      const midYearSuffix =
        yearOfferings.length <= 3 && year >= 3 ? "Mid-Year Class" : "";
      writeMergedRow(sheet, row++, formatYearHeader(year, midYearSuffix), {
        font: { name: FONT, bold: true, size: 11 },
      });
      styleHeaderBlock(sheet, row++);

      let total = 0;
      for (const offering of firstSem) {
        writeDataRow(sheet, row++, [
          offering.subject.code,
          formatPrereqDisplay(offering.id, input.prerequisiteByOfferingId),
          offering.subject.description,
          offering.subject.units,
          "",
          "",
          "",
          "",
          "",
        ]);
        total += offering.subject.units;
      }

      writeDataRow(
        sheet,
        row++,
        ["", "", "TOTAL", total, "", "", "", "", ""],
        { bold: true, fill: "FFF2F2F2" }
      );
      row += 1;
      continue;
    }

    writeMergedRow(sheet, row++, formatYearHeader(year), {
      font: { name: FONT, bold: true, size: 11 },
    });
    styleHeaderBlock(sheet, row++);

    const pairCount = Math.max(firstSem.length, secondSem.length);
    let firstTotal = 0;
    let secondTotal = 0;

    for (let index = 0; index < pairCount; index++) {
      const first = firstSem[index] ?? null;
      const second = secondSem[index] ?? null;

      if (first) firstTotal += first.subject.units;
      if (second) secondTotal += second.subject.units;

      writeDataRow(sheet, row++, [
        first?.subject.code ?? "",
        first
          ? formatPrereqDisplay(first.id, input.prerequisiteByOfferingId)
          : "",
        first?.subject.description ?? "",
        first?.subject.units ?? "",
        "",
        second?.subject.code ?? "",
        second
          ? formatPrereqDisplay(second.id, input.prerequisiteByOfferingId)
          : "",
        second?.subject.description ?? "",
        second?.subject.units ?? "",
      ]);
    }

    writeDataRow(
      sheet,
      row++,
      ["", "", "TOTAL", firstTotal, "", "", "", "TOTAL", secondTotal],
      { bold: true, fill: "FFF2F2F2" }
    );
    row += 1;
  }

  sheet.views = [{ state: "frozen", ySplit: 0, activeCell: "A1" }];
  return workbook;
}

export async function buildCurriculumExcelBuffer(
  input: CurriculumExcelExportInput
): Promise<Buffer> {
  const workbook = await buildWorkbook(input);
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

export async function buildCurriculumExcelTemplateBuffer(
  programCode = "PROGRAM"
): Promise<Buffer> {
  const year = new Date().getFullYear();
  const workbook = await buildWorkbook(
    {
      programCode,
      title: "Bachelor of Science in [Program Name]",
      batchLabel: `A.Y. ${year} - ${year + 1}`,
      batchYear: year,
      offerings: [],
      prerequisiteByOfferingId: new Map(),
    },
    { templateMode: true }
  );
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
