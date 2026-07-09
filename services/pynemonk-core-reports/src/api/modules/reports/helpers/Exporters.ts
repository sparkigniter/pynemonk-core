import { injectable, inject } from "tsyringe";
import { Pool } from "pg";
import puppeteer from "puppeteer";
import handlebars from "handlebars";
import * as XLSX from "xlsx";

@injectable()
export default class Exporters {
    constructor(@inject("DB") private db: Pool) {}

    /**
     * Generates a standard CSV string from the dataset and columns.
     */
    public generateCSV(data: any[], columns: { key: string; label: string }[]): string {
        const header = columns.map((c) => c.label).join(",");
        const rows = data.map((row) => {
            return columns
                .map((c) => {
                    const val = row[c.key] !== undefined && row[c.key] !== null ? row[c.key] : "";
                    return `"${val.toString().replace(/"/g, '""')}"`;
                })
                .join(",");
        });
        return [header, ...rows].join("\n");
    }

    /**
     * Generates a standard Excel workbook Buffer from the dataset and columns.
     */
    public generateExcel(data: any[], columns: { key: string; label: string }[]): Buffer {
        // Map data keys to their labels for clear sheet headers
        const mappedData = data.map((row) => {
            const newRow: any = {};
            columns.forEach((c) => {
                newRow[c.label] = row[c.key] !== undefined && row[c.key] !== null ? row[c.key] : "";
            });
            return newRow;
        });

        const worksheet = XLSX.utils.json_to_sheet(mappedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Report Data");
        
        // Write the workbook to a Buffer
        const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
        return buffer;
    }

    /**
     * Compiles data into an HTML template using Handlebars and prints to A4 PDF using Puppeteer.
     */
    public async generatePDF(
        reportData: any,
        templateHtml: string,
        templateCss: string,
        tenantName: string
    ): Promise<Buffer> {
        // 1. Prepare data context
        const context = {
            ...reportData,
            tenant_name: tenantName,
            generated_at: new Date().toLocaleString(),
        };

        // 2. Process HTML & inject Table
        let htmlContent = templateHtml;
        const tableHtml = this.buildTableHtml(reportData.items, reportData.columns, reportData.totals);

        console.log(`[Exporters:PDF] Original HTML size: ${htmlContent.length}. Items: ${reportData.items?.length || 0}`);

        // Inject table html at the placeholder
        const modernPlaceholder = "data-matrix-placeholder";
        const legacyPlaceholder = "Placeholder for Data Table";

        if (htmlContent.includes(modernPlaceholder)) {
            const pIdx = htmlContent.indexOf(modernPlaceholder);
            const startIdx = htmlContent.lastIndexOf("<div", pIdx);
            const markerIdx = htmlContent.indexOf("{{#table}}");
            const endIdx = htmlContent.indexOf("</div>", htmlContent.indexOf("</div>", markerIdx) + 1);

            if (startIdx !== -1 && endIdx !== -1) {
                htmlContent = htmlContent.substring(0, startIdx) + tableHtml + htmlContent.substring(endIdx + 6);
            }
        } else if (htmlContent.includes(legacyPlaceholder)) {
            const pIdx = htmlContent.indexOf(legacyPlaceholder);
            const startIdx = htmlContent.lastIndexOf("<div", pIdx);
            const endIdx = htmlContent.indexOf("</div>", pIdx);

            if (startIdx !== -1 && endIdx !== -1) {
                htmlContent = htmlContent.substring(0, startIdx) + tableHtml + htmlContent.substring(endIdx + 6);
            }
        }

        if (htmlContent.includes("{{#table}}")) {
            htmlContent = htmlContent.replace(/\{\{#table\}\}/g, tableHtml);
        }

        // 3. Compile with Handlebars
        const hTemplate = handlebars.compile(htmlContent);
        const finalHtml = hTemplate(context);

        // 4. Render with Puppeteer
        const browserOptions: any = {
            headless: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
            ],
        };

        // Look for system Chromium if Puppeteer execution fails
        const paths = [
            "/usr/bin/chromium-browser",
            "/usr/bin/chromium",
            "/usr/local/bin/chromium",
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        ];
        
        for (const p of paths) {
            try {
                if (require("fs").existsSync(p)) {
                    browserOptions.executablePath = p;
                    break;
                }
            } catch {}
        }

        console.log(`[Exporters:PDF] Launching Puppeteer...`);
        const browser = await puppeteer.launch(browserOptions);
        try {
            const page = await browser.newPage();
            
            // Replicate design system and modern typography
            const containerHtml = `
                <html>
                    <head>
                        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap" rel="stylesheet">
                        <style>
                            body { font-family: 'Inter', sans-serif; margin: 0; padding: 40px; color: #1e293b; background-color: #ffffff; }
                            table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 11px; }
                            th { background: #f8fafc; border-bottom: 2px solid #e2e8f0; padding: 12px; text-align: left; font-weight: 800; font-size: 10px; text-transform: uppercase; color: #475569; }
                            td { padding: 12px; border-bottom: 1px solid #f1f5f9; color: #334155; }
                            .totals-row { background: #0f172a; color: #ffffff; font-weight: 900; }
                            .totals-row td { padding: 15px; border: none; color: #ffffff; }
                            ${templateCss || ""}
                        </style>
                    </head>
                    <body>${finalHtml}</body>
                </html>
            `;

            await page.setContent(containerHtml, { waitUntil: "load" });
            const pdfBuffer = await page.pdf({
                format: "A4",
                printBackground: true,
                margin: { top: "20px", right: "20px", bottom: "20px", left: "20px" },
            });

            console.log(`[Exporters:PDF] PDF generated successfully. Size: ${pdfBuffer.length} bytes`);
            return Buffer.from(pdfBuffer);
        } finally {
            await browser.close();
        }
    }

    private buildTableHtml(items: any[], columns: any[], totals?: any): string {
        let html = `<table><thead><tr>`;
        columns.forEach((col) => {
            html += `<th style="text-align: ${col.align || "left"}">${col.label}</th>`;
        });
        html += `</tr></thead><tbody>`;

        if (items && items.length > 0) {
            items.forEach((item) => {
                html += `<tr>`;
                columns.forEach((col) => {
                    const val = item[col.key] !== undefined && item[col.key] !== null ? item[col.key] : "-";
                    html += `<td style="text-align: ${col.align || "left"}">${val}</td>`;
                });
                html += `</tr>`;
            });
        } else {
            html += `<tr><td colspan="${columns.length}" style="text-align: center; padding: 20px; color: #94a3b8;">No data available</td></tr>`;
        }

        html += `</tbody>`;

        if (totals) {
            html += `<tfoot><tr class="totals-row">`;
            columns.forEach((col, idx) => {
                if (idx === 0) {
                    html += `<td colspan="2">GRAND TOTALS</td>`;
                } else if (idx < 2) {
                    return;
                } else {
                    const val = totals[col.key] !== undefined && totals[col.key] !== null ? totals[col.key] : "";
                    html += `<td style="text-align: ${col.align || "right"}">${val}</td>`;
                }
            });
            html += `</tr></tfoot>`;
        }

        html += `</table>`;
        return html;
    }
}
