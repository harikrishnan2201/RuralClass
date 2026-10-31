import * as XLSX from 'xlsx';

export interface RawParsedSheet {
  sheetName: string;
  headers: string[];
  rows: Record<string, string | number>[];
  rawGrid: (string | number)[][];
}

/**
 * Parses XLSX, XLS, or CSV buffers into structured raw rows across all sheets.
 * Security: Reads cached values only (`cellFormula: false`), capping rows to prevent DoS.
 */
export function parseAllSpreadsheetSheets(buffer: Buffer, maxRows: number = 2000): RawParsedSheet[] {
  const workbook = XLSX.read(buffer, {
    type: 'buffer',
    raw: false,
    cellFormula: false, // Read cached values only, never evaluate formulas
  });

  const results: RawParsedSheet[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    const rawGrid = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, {
      header: 1,
      defval: '',
      blankrows: false,
    });

    if (rawGrid.length === 0) continue;

    // Find header row (skipping leading title/banner rows if any)
    let headerIndex = 0;
    for (let i = 0; i < Math.min(rawGrid.length, 5); i++) {
      const row = rawGrid[i];
      if (row && row.filter(cell => String(cell).trim().length > 0).length >= 2) {
        headerIndex = i;
        break;
      }
    }

    const headers = (rawGrid[headerIndex] || []).map((h, idx) => 
      String(h || '').trim() || `Column_${idx + 1}`
    );

    const rows: Record<string, string | number>[] = [];
    for (let r = headerIndex + 1; r < Math.min(rawGrid.length, headerIndex + 1 + maxRows); r++) {
      const rowCells = rawGrid[r];
      if (!rowCells || !rowCells.some(c => String(c).trim() !== '')) {
        continue;
      }

      // Skip repeated header rows or "Total" / "Average" summary rows
      const firstCell = String(rowCells[0] || '').trim().toLowerCase();
      if (firstCell === 'total' || firstCell === 'average' || firstCell === headers[0].toLowerCase()) {
        continue;
      }

      const rowObj: Record<string, string | number> = {};
      headers.forEach((h, colIdx) => {
        rowObj[h] = rowCells[colIdx] !== undefined ? rowCells[colIdx] : '';
      });
      rows.push(rowObj);
    }

    if (headers.length > 0 && rows.length > 0) {
      results.push({
        sheetName,
        headers,
        rows,
        rawGrid: rawGrid.slice(0, maxRows + 10)
      });
    }
  }

  return results;
}

export function parseSpreadsheetBuffer(buffer: Buffer): RawParsedSheet {
  const all = parseAllSpreadsheetSheets(buffer);
  return all[0] || { sheetName: 'Sheet1', headers: [], rows: [], rawGrid: [] };
}
