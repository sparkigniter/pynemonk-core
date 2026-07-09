import PDFDocument from 'pdfkit';
import { injectable } from 'tsyringe';

@injectable()
export class ReportCardPDFService {
    /**
     * Generates a beautifully formatted official PDF report card and streams it to the response
     */
    public generate(reportData: any, settings: any, stream: NodeJS.WritableStream): void {
        const themeColors: { [key: string]: { primary: string, secondary: string, accent: string } } = {
            indigo: { primary: '#4f46e5', secondary: '#1e1b4b', accent: '#818cf8' },
            emerald: { primary: '#059669', secondary: '#064e3b', accent: '#34d399' },
            royal: { primary: '#7c3aed', secondary: '#2e1065', accent: '#a78bfa' },
            crimson: { primary: '#dc2626', secondary: '#450a0a', accent: '#f87171' }
        };

        const theme = themeColors[settings.theme] || themeColors.indigo;

        // Create PDF Document (A4 size: 595.28 x 841.89 points)
        const doc = new PDFDocument({
            size: 'A4',
            margins: { top: 40, bottom: 40, left: 40, right: 40 }
        });

        doc.pipe(stream);

        // --- PAGE LAYOUT & DECORATIVE BORDERS ---
        // 1. Draw elegant double outer border
        doc.rect(20, 20, 555.28, 801.89).lineWidth(1.5).strokeColor(theme.primary).stroke();
        doc.rect(24, 24, 547.28, 793.89).lineWidth(0.5).strokeColor(theme.accent).stroke();

        // 2. Draw watermark background crest / details (Subtle top-right circle)
        doc.circle(530, 80, 100).fillColor('#f8fafc').fill();
        doc.circle(80, 780, 80).fillColor('#f8fafc').fill();

        // --- 1. INSTITUTION HEADER ---
        let currentY = 50;
        
        if (settings.showLogo) {
            // Draw a high-end vector academic crest/logo since we don't have an image upload
            doc.save();
            doc.translate(297.64, currentY + 30);
            
            // Outer shield outline
            doc.moveTo(0, -25)
               .lineTo(20, -15)
               .lineTo(20, 10)
               .quadraticCurveTo(20, 25, 0, 35)
               .quadraticCurveTo(-20, 25, -20, 10)
               .lineTo(-20, -15)
               .closePath()
               .fillColor(theme.primary)
               .fill();
               
            // Inner book graphic
            doc.moveTo(-10, -5)
               .lineTo(0, -10)
               .lineTo(10, -5)
               .lineTo(10, 12)
               .quadraticCurveTo(0, 7, -10, 12)
               .closePath()
               .fillColor('#ffffff')
               .fill();
            
            // Dividing line for pages of the book
            doc.moveTo(0, -10)
               .lineTo(0, 10)
               .lineWidth(1)
               .strokeColor(theme.primary)
               .stroke();

            doc.restore();
            currentY += 80;
        }

        // Header Title
        doc.fillColor(theme.secondary);
        doc.font('Helvetica-Bold').fontSize(22);
        doc.text('LUVIA INTERNATIONAL ACADEMY', 40, currentY, { align: 'center' });
        
        currentY += 26;
        doc.fillColor(theme.primary);
        doc.font('Helvetica-Bold').fontSize(9);
        doc.text(settings.title.toUpperCase(), 40, currentY, { align: 'center', characterSpacing: 1.5 });
        
        // Horizontal separation bar
        currentY += 15;
        doc.moveTo(250, currentY).lineTo(345, currentY).lineWidth(2).strokeColor(theme.primary).stroke();
        currentY += 20;

        // --- 2. STUDENT INFORMATION BLOCK ---
        if (settings.showStudentInfo) {
            // Draw background card for details
            doc.rect(40, currentY, 515.28, 105)
               .fillColor('#f8fafc')
               .strokeColor('#e2e8f0')
               .lineWidth(0.5)
               .fillAndStroke();

            doc.fillColor(theme.secondary);
            
            // Left Column
            doc.font('Helvetica-Bold').fontSize(8).fillColor('#64748b').text('STUDENT NAME', 60, currentY + 15);
            doc.font('Helvetica-Bold').fontSize(12).fillColor(theme.secondary).text(reportData.student.name, 60, currentY + 27);
            
            doc.font('Helvetica-Bold').fontSize(8).fillColor('#64748b').text('ENROLLMENT NO', 60, currentY + 57);
            doc.font('Helvetica-Bold').fontSize(12).fillColor(theme.secondary).text(reportData.student.admission_no, 60, currentY + 69);
            
            // Right Column
            doc.font('Helvetica-Bold').fontSize(8).fillColor('#64748b').text('ACADEMIC TERM', 320, currentY + 15);
            doc.font('Helvetica-Bold').fontSize(12).fillColor(theme.secondary).text(`${reportData.exam.name} (${reportData.student.academic_year})`, 320, currentY + 27);
            
            doc.font('Helvetica-Bold').fontSize(8).fillColor('#64748b').text('GRADE / CLASSROOM', 320, currentY + 57);
            doc.font('Helvetica-Bold').fontSize(12).fillColor(theme.secondary).text(`${reportData.student.grade} - ${reportData.student.classroom}`, 320, currentY + 69);
            
            currentY += 130;
        }

        // --- 3. ACADEMIC PERFORMANCE TABLE ---
        // Table headers
        doc.rect(40, currentY, 515.28, 30).fillColor(theme.secondary).fill();
        
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8);
        doc.text('SUBJECT DESCRIPTION', 55, currentY + 11);
        doc.text('MAX MARKS', 270, currentY + 11, { width: 70, align: 'center' });
        doc.text('PASSING', 350, currentY + 11, { width: 60, align: 'center' });
        doc.text('OBTAINED', 420, currentY + 11, { width: 60, align: 'center' });
        doc.text('STATUS', 490, currentY + 11, { width: 50, align: 'right' });

        currentY += 30;

        // Render subject rows
        reportData.subjects.forEach((sub: any, idx: number) => {
            const rowHeight = 35;
            
            // Alternating backgrounds
            if (idx % 2 === 1) {
                doc.rect(40, currentY, 515.28, rowHeight).fillColor('#f8fafc').fill();
            }

            // Bottom border line
            doc.moveTo(40, currentY + rowHeight).lineTo(555.28, currentY + rowHeight).lineWidth(0.5).strokeColor('#f1f5f9').stroke();

            // Subject description & code
            doc.fillColor(theme.secondary).font('Helvetica-Bold').fontSize(10);
            doc.text(sub.name, 55, currentY + 8);
            doc.fillColor('#94a3b8').font('Helvetica').fontSize(7);
            doc.text(sub.code, 55, currentY + 20);

            // Marks
            doc.fillColor('#475569').font('Helvetica-Bold').fontSize(10);
            doc.text(sub.max.toFixed(2), 270, currentY + 13, { width: 70, align: 'center' });
            
            doc.fillColor('#94a3b8').font('Helvetica-Bold').fontSize(10);
            doc.text(sub.passing.toFixed(2), 350, currentY + 13, { width: 60, align: 'center' });
            
            doc.fillColor(sub.status === 'FAIL' ? '#dc2626' : theme.secondary).font('Helvetica-Bold').fontSize(12);
            doc.text(sub.obtained.toFixed(2), 420, currentY + 12, { width: 60, align: 'center' });

            // Status label
            if (sub.status === 'PASS') {
                doc.fillColor(theme.primary).font('Helvetica-Bold').fontSize(8);
                doc.text('PASS', 490, currentY + 14, { width: 50, align: 'right' });
            } else if (sub.status === 'FAIL') {
                doc.fillColor('#dc2626').font('Helvetica-Bold').fontSize(8);
                doc.text('FAIL', 490, currentY + 14, { width: 50, align: 'right' });
            } else {
                doc.fillColor('#94a3b8').font('Helvetica-Bold').fontSize(8);
                doc.text('ABSENT', 490, currentY + 14, { width: 50, align: 'right' });
            }

            currentY += rowHeight;
        });

        // Totals Footer Row
        doc.rect(40, currentY, 515.28, 45).fillColor('#f1f5f9').fill();
        
        doc.fillColor(theme.secondary).font('Helvetica-Bold').fontSize(8);
        doc.text('AGGREGATED TOTALS', 55, currentY + 18);

        doc.font('Helvetica-Bold').fontSize(10);
        doc.text(reportData.summary.total_max.toFixed(2), 270, currentY + 17, { width: 70, align: 'center' });
        doc.text(reportData.summary.total_obtained.toFixed(2), 420, currentY + 17, { width: 60, align: 'center' });

        if (settings.showAggregate) {
            doc.fontSize(14).fillColor(theme.secondary);
            doc.text(`${reportData.summary.percentage}%`, 480, currentY + 14, { width: 65, align: 'right' });
        }

        currentY += 45;

        // --- 4. SIGNATURES & FINAL RESULT BLOCK ---
        currentY += 40;

        // Draw side signature blocks and centered final stamp
        if (settings.showSignatures) {
            // Left signature: Class Teacher
            doc.moveTo(60, currentY + 50).lineTo(180, currentY + 50).lineWidth(1).strokeColor('#cbd5e1').stroke();
            doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(7);
            doc.text(settings.teacherLabel.toUpperCase(), 60, currentY + 57, { width: 120, align: 'center' });

            // Right signature: Principal
            doc.moveTo(415, currentY + 50).lineTo(535, currentY + 50).lineWidth(1).strokeColor('#cbd5e1').stroke();
            doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(7);
            doc.text(settings.principalLabel.toUpperCase(), 415, currentY + 57, { width: 120, align: 'center' });

            // Center Stamp: PASS / FAIL
            const isPass = reportData.summary.result === 'PASS';
            const stampColor = isPass ? theme.primary : '#dc2626';
            
            doc.save();
            doc.translate(297.64, currentY + 25);
            
            // Draw stamp outer circle border
            doc.circle(0, 0, 38).lineWidth(2.5).strokeColor(stampColor).stroke();
            
            // Inner text
            doc.fillColor(stampColor).font('Helvetica-Bold').fontSize(6).text('FINAL ASSESSMENT', -30, -18, { width: 60, align: 'center' });
            doc.fontSize(14).text(reportData.summary.result, -30, -5, { width: 60, align: 'center' });
            doc.fontSize(5).text('APPROVED', -30, 14, { width: 60, align: 'center' });
            
            doc.restore();
        }

        // --- 5. FOOTER INSCRIPTION ---
        doc.fillColor('#94a3b8').font('Helvetica-Oblique').fontSize(8);
        doc.text('"Intelligence plus character - that is the goal of true education."', 40, 770, { align: 'center' });
        
        doc.end();
    }
}
