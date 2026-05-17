import { injectable, inject } from 'tsyringe';
import { Pool } from 'pg';
import puppeteer from 'puppeteer';
import handlebars from 'handlebars';

@injectable()
export default class ExportHelper {
    constructor(
        @inject('DB') private db: Pool
    ) {}

    public generateCSV(data: any[], columns: { key: string, label: string }[]): string {
        const header = columns.map(c => c.label).join(',');
        const rows = data.map(row => {
            return columns.map(c => {
                const val = row[c.key] || '';
                return `"${val.toString().replace(/"/g, '""')}"`;
            }).join(',');
        });
        return [header, ...rows].join('\n');
    }

    public async generatePDF(reportData: any, templateId: number, tenantId: number): Promise<Buffer> {
        // 1. Fetch Template
        const tRes = await this.db.query(
            `SELECT * FROM accounting.report_template WHERE id = $1 AND (tenant_id = $2 OR tenant_id IS NULL)`,
            [templateId, tenantId]
        );
        const template = tRes.rows[0];
        if (!template) throw new Error('Report template not found');

        // 2. Prepare Data
        const tenantRes = await this.db.query(`SELECT name FROM auth.tenant WHERE id = $1`, [tenantId]);
        const context = {
            ...reportData,
            tenant_name: tenantRes.rows[0]?.name || 'Luvia Institutional',
            generated_at: new Date().toLocaleString(),
            report_name: template.name
        };

        // 3. Process HTML & Inject Table
        let htmlContent = template.template_html;
        const tableHtml = this.buildTableHtml(reportData.items, reportData.columns, reportData.totals);
        
        console.log(`[ExportHelper] Original HTML size: ${htmlContent.length}. Items: ${reportData.items?.length || 0}`);
        console.log(`[ExportHelper] Generated Table HTML size: ${tableHtml.length}`);
        
        // Use a more robust approach to find the placeholder
        const modernPlaceholder = 'data-matrix-placeholder';
        const legacyPlaceholder = 'Placeholder for Data Table';
        
        if (htmlContent.includes(modernPlaceholder)) {
            console.log(`[ExportHelper] Found modern designer placeholder.`);
            // Modern uses a specific class. We find the div that has it.
            const pIdx = htmlContent.indexOf(modernPlaceholder);
            const startIdx = htmlContent.lastIndexOf('<div', pIdx);
            // Find the corresponding closing div. Modern has a nested {{#table}} div.
            // So we look for the 2nd </div> after the marker.
            const markerIdx = htmlContent.indexOf('{{#table}}');
            const endIdx = htmlContent.indexOf('</div>', htmlContent.indexOf('</div>', markerIdx) + 1);
            
            if (startIdx !== -1 && endIdx !== -1) {
                htmlContent = htmlContent.substring(0, startIdx) + tableHtml + htmlContent.substring(endIdx + 6);
            }
        } else if (htmlContent.includes(legacyPlaceholder)) {
            console.log(`[ExportHelper] Found legacy designer placeholder.`);
            // Legacy is a div with specific text inside.
            const pIdx = htmlContent.indexOf(legacyPlaceholder);
            const startIdx = htmlContent.lastIndexOf('<div', pIdx);
            const endIdx = htmlContent.indexOf('</div>', pIdx); // Legacy div only has p tags, so 1st </div> is the container
            
            if (startIdx !== -1 && endIdx !== -1) {
                htmlContent = htmlContent.substring(0, startIdx) + tableHtml + htmlContent.substring(endIdx + 6);
            }
        }

        // Final catch-all for any missed markers
        if (htmlContent.includes('{{#table}}')) {
             htmlContent = htmlContent.replace(/\{\{#table\}\}/g, tableHtml);
        }

        // 4. Compile with Handlebars for other variables
        const hTemplate = handlebars.compile(htmlContent);
        const finalHtml = hTemplate(context);
        console.log(`[ExportHelper] Final HTML size: ${finalHtml.length}`);

        // 5. Render with Puppeteer
        let executablePath = '/usr/bin/chromium-browser';
        const paths = ['/usr/bin/chromium-browser', '/usr/bin/chromium', '/usr/local/bin/chromium'];
        for (const p of paths) {
            try {
                executablePath = p;
                break; 
            } catch {}
        }

        console.log(`[ExportHelper] Launching browser at ${executablePath}...`);
        const browser = await puppeteer.launch({ 
            headless: true,
            executablePath: executablePath,
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox', 
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        });
        const page = await browser.newPage();
        
        console.log(`[ExportHelper] Rendering PDF...`);
        await page.setContent(`
            <html>
                <head>
                    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
                    <style>
                        body { font-family: 'Inter', sans-serif; margin: 0; padding: 40px; color: #1e293b; }
                        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                        th { background: #f8fafc; border-bottom: 2px solid #e2e8f0; padding: 12px; text-align: left; font-weight: 800; font-size: 10px; text-transform: uppercase; }
                        td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 11px; }
                        .totals-row { background: #0f172a; color: white; font-weight: 900; }
                        .totals-row td { padding: 15px; border: none; }
                    </style>
                </head>
                <body>${finalHtml}</body>
            </html>
        `, { waitUntil: 'load' });

        const pdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
        });

        console.log(`[ExportHelper] PDF generated successfully. Size: ${pdf.length} bytes`);
        await browser.close();
        return pdf as Buffer;
    }

    private buildTableHtml(items: any[], columns: any[], totals?: any): string {
        let html = `<table><thead><tr>`;
        columns.forEach(col => {
            html += `<th style="text-align: ${col.align || 'left'}">${col.label}</th>`;
        });
        html += `</tr></thead><tbody>`;
        
        items.forEach(item => {
            html += `<tr>`;
            columns.forEach(col => {
                const val = item[col.key] || '-';
                html += `<td style="text-align: ${col.align || 'left'}">${val}</td>`;
            });
            html += `</tr>`;
        });
        
        html += `</tbody>`;
        if (totals) {
            html += `<tfoot><tr class="totals-row">`;
            columns.forEach((col, idx) => {
                if (idx === 0) html += `<td colspan="2">GRAND TOTALS</td>`;
                else if (idx < 2) return;
                else {
                    const val = totals[col.key] || '';
                    html += `<td style="text-align: right">${val}</td>`;
                }
            });
            html += `</tr></tfoot>`;
        }
        html += `</table>`;
        return html;
    }
}
