/**
 * ExcelExportHelper
 *
 * A reusable, generic utility for building styled Excel workbooks.
 * Plugins call buildWorkbook() with column definitions and data rows,
 * and receive a ready-to-stream Buffer back.
 *
 * All formatting decisions (header style, column width, frozen row)
 * are centralised here so every plugin export looks consistent.
 */
import * as XLSX from 'xlsx';
import type { ExportColumn } from '../core/IIntegrationAdapter.js';

export interface WorkbookOptions {
    /** Name of the primary worksheet */
    sheetName?: string;
    /** Column schema — defines headers and formatting */
    columns: ExportColumn[];
    /** Data rows — keys must match ExportColumn.key values */
    rows: Record<string, any>[];
    /** Optional extra properties set on the workbook's Props */
    metadata?: {
        title?: string;
        subject?: string;
        author?: string;
        company?: string;
        createdDate?: Date;
    };
}

export class ExcelExportHelper {
    /**
     * Build an XLSX workbook buffer from column definitions and data rows.
     * This is the primary entry-point for plugins producing Excel exports.
     */
    public static buildWorkbook(options: WorkbookOptions): Buffer {
        const { sheetName = 'Export', columns, rows, metadata } = options;

        // ── Build data array (header row + data rows) ──────────────────
        const headerRow = columns.map((col) => col.header);

        const dataRows = rows.map((row) =>
            columns.map((col) => {
                const val = row[col.key];
                if (val === null || val === undefined) return '';
                return val;
            }),
        );

        const aoa = [headerRow, ...dataRows]; // array-of-arrays

        // ── Create sheet ───────────────────────────────────────────────
        const ws = XLSX.utils.aoa_to_sheet(aoa);

        // ── Column widths ──────────────────────────────────────────────
        ws['!cols'] = columns.map((col) => ({ wch: col.width ?? 22 }));

        // ── Freeze the header row ──────────────────────────────────────
        ws['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activeCell: 'A2', sqref: 'A2' };

        // ── Create workbook ────────────────────────────────────────────
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);

        if (metadata) {
            wb.Props = {
                Title: metadata.title,
                Subject: metadata.subject,
                Author: metadata.author ?? 'Pynemonk',
                Company: metadata.company,
                CreatedDate: metadata.createdDate ?? new Date(),
            };
        }

        // ── Write to buffer ────────────────────────────────────────────
        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        return Buffer.from(buf);
    }

    /**
     * Convenience method: build a workbook and return an ExportResult
     * that the IntegrationController can stream directly to the browser.
     */
    public static buildExportResult(
        options: WorkbookOptions & { filename: string },
    ) {
        const buffer = ExcelExportHelper.buildWorkbook(options);
        return {
            buffer,
            mimeType:
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            filename: options.filename,
        };
    }
}
