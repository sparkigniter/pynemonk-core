/**
 * Karnataka SATS / STS Integration Plugin
 *
 * Demonstrates how to write a third-party plugin using only the
 * Pynemonk Plugin SDK (PluginContext API).
 *
 * This adapter does NOT import any internal service or helper directly —
 * it uses only the PluginContext API, making it fully portable.
 */
import { injectable } from 'tsyringe';
import type {
    IIntegrationAdapter,
    IntegrationManifest,
    PluginContext,
    ExportResult,
} from '../../core/IIntegrationAdapter.js';
import { ExcelExportHelper } from '../../helpers/ExcelExportHelper.js';

/** Column schema matching the Karnataka SATS official export format */
const SATS_STUDENT_COLUMNS = [
    { key: 'sl_no',          header: 'Sl. No.',        width: 8  },
    { key: 'student_name',   header: 'Student Name',   width: 30 },
    { key: 'sats_id',        header: 'SATS ID',        width: 20 },
    { key: 'gender',         header: 'Gender',         width: 12 },
    { key: 'dob',            header: 'Date of Birth',  width: 18 },
    { key: 'mother_tongue',  header: 'Mother Tongue',  width: 20 },
    { key: 'religion',       header: 'Religion',       width: 20 },
    { key: 'nationality',    header: 'Nationality',    width: 20 },
    { key: 'classroom',      header: 'Class / Section', width: 22 },
    { key: 'admission_no',   header: 'Admission No.',  width: 20 },
];

@injectable()
export class KarnatakaSATSAdapter implements IIntegrationAdapter {

    // ── Manifest ─────────────────────────────────────────────────────────────

    public getManifest(): IntegrationManifest {
        return {
            name: 'Karnataka SATS / STS',
            slug: 'karnataka-sats',
            description:
                'Integration for Karnataka State Student Achievement Tracking System. ' +
                'Exports student data in the official SATS Excel format.',
            version: '2.0.0',
            supportedActions: ['health_check', 'export_students'],

            uiPlacements: [
                {
                    location: 'sidebar',
                    label: 'SATS / STS',
                    group: 'people',
                    path: '/integrations?slug=karnataka-sats',
                    icon: 'Zap',
                    action: 'view',
                    permissions: ['student:read'],
                },
                {
                    location: 'student_list',
                    label: 'Export to SATS',
                    action: 'export_students',
                    icon: 'FileSpreadsheet',
                    permissions: ['student:read'],
                },
            ],

            exports: [
                {
                    action: 'export_students',
                    label: 'Export Students to SATS',
                    description:
                        'Downloads an Excel workbook in the official Karnataka SATS format.',
                    mimeType:
                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    extension: 'xlsx',
                    columns: SATS_STUDENT_COLUMNS,
                },
            ],
        };
    }

    // ── Dispatch ──────────────────────────────────────────────────────────────

    public async execute(
        context: PluginContext,
        action: string,
        options?: any,
    ): Promise<any> {
        switch (action) {
            case 'health_check':
                return this.performHealthCheck(context);
            case 'export_students':
                return this.exportStudents(context, options);
            default:
                throw new Error(
                    `Action "${action}" is not supported by the Karnataka SATS plugin.`,
                );
        }
    }

    // ── Health Check ─────────────────────────────────────────────────────────

    private async performHealthCheck(context: PluginContext) {
        context.log('info', 'Running health check…');

        const [result, identities] = await Promise.all([
            context.getAllStudents(),
            context.listExternalIds('student'),
        ]);

        const identitySet = new Set(identities.map((i) => i.entity_id));
        const errors: any[] = [];

        result.forEach((s) => {
            if (!s.mother_tongue) {
                errors.push({
                    entityId: s.id,
                    entityName: `${s.first_name} ${s.last_name}`,
                    message: 'Missing Mother Tongue',
                    field: 'mother_tongue',
                });
            }
        });

        return {
            total: result.length,
            mapped: identitySet.size,
            unmapped: result.length - identitySet.size,
            validationErrors: errors,
        };
    }

    // ── Excel Export ─────────────────────────────────────────────────────────

    private async exportStudents(
        context: PluginContext,
        options: any = {},
    ): Promise<ExportResult> {
        context.log('info', 'Generating SATS Excel export…', options);

        // Fetch all students + identity mappings in parallel
        const [students, identities] = await Promise.all([
            context.getAllStudents({
                classroom_id: options.classroom_id
                    ? parseInt(options.classroom_id)
                    : undefined,
                academic_year_id: options.academic_year_id
                    ? parseInt(options.academic_year_id)
                    : undefined,
            }),
            context.listExternalIds('student'),
        ]);

        const identityMap = new Map(
            identities.map((i) => [i.entity_id, i.external_id]),
        );

        // Map to SATS column keys
        const rows = students.map((s, idx) => ({
            sl_no:          idx + 1,
            student_name:   `${s.first_name} ${s.last_name ?? ''}`.trim(),
            sats_id:        identityMap.get(s.id) ?? '',
            gender:         s.gender ?? '',
            dob:            s.date_of_birth
                                ? new Date(s.date_of_birth).toLocaleDateString('en-IN')
                                : '',
            mother_tongue:  s.mother_tongue ?? '',
            religion:       s.religion ?? '',
            nationality:    s.nationality ?? 'Indian',
            classroom:      s.classroom_name
                                ? `${s.classroom_name}${s.classroom_section ? ' - ' + s.classroom_section : ''}`
                                : '',
            admission_no:   s.admission_no ?? '',
        }));

        const filename = `karnataka-sats_export_${new Date().toISOString().split('T')[0]}.xlsx`;

        return ExcelExportHelper.buildExportResult({
            sheetName: 'SATS Student Data',
            columns: SATS_STUDENT_COLUMNS,
            rows,
            filename,
            metadata: {
                title: 'Karnataka SATS Student Export',
                subject: 'Official SATS / STS student data sheet',
                author: 'Pynemonk School Management System',
                createdDate: new Date(),
            },
        });
    }
}
