import { Request, Response } from 'express';
import { injectable } from 'tsyringe';
import { IntegrationService } from '../services/IntegrationService.js';
import ApiResponseHandler from '../../../core/ApiResponseHandler.js';
import ResourceController from '../../../core/controllers/ResourceController.js';

@injectable()
export default class IntegrationController extends ResourceController {
    constructor(private integrationService: IntegrationService) {
        super();
    }

    public async listAvailable(req: Request, res: Response) {
        try {
            let tenantId = this.getTenantId(req);

            // Allow system admin to override tenantId via query
            const queryTenantId = parseInt(req.query.tenantId as string, 10);
            if (!isNaN(queryTenantId)) {
                const user = (req as any).user;
                if (user?.roles?.includes('system_admin')) {
                    tenantId = queryTenantId;
                }
            }

            if (!tenantId) {
                return ApiResponseHandler.ok(
                    res,
                    'Please select a school to manage integrations',
                    [],
                );
            }
            const list = await this.integrationService.listAvailableIntegrations(tenantId);
            return ApiResponseHandler.ok(res, 'Success', list);
        } catch (error: any) {
            return ApiResponseHandler.badrequest(res, error.message);
        }
    }

    public async toggle(req: Request, res: Response) {
        try {
            const { systemSlug } = req.params;
            const { isEnabled } = req.body;
            let tenantId = this.getTenantId(req);

            // Allow system admin to override tenantId via body
            const bodyTenantId = parseInt(req.body.tenantId as string, 10);
            if (!isNaN(bodyTenantId)) {
                const user = (req as any).user;
                if (user?.roles?.includes('system_admin')) {
                    tenantId = bodyTenantId;
                }
            }

            if (!tenantId) {
                return ApiResponseHandler.badrequest(
                    res,
                    'School context is required. Please select a school from the switcher.',
                );
            }

            const result = await this.integrationService.toggleIntegration(
                tenantId,
                systemSlug,
                isEnabled,
            );
            return ApiResponseHandler.ok(res, 'Integration status updated', result);
        } catch (error: any) {
            return ApiResponseHandler.badrequest(res, error.message);
        }
    }

    public async execute(req: Request, res: Response) {
        try {
            const { systemSlug, action } = req.params;
            const tenantId = this.getTenantId(req);

            if (!tenantId) {
                return ApiResponseHandler.badrequest(
                    res,
                    'School context is required. Please select a school from the switcher.',
                );
            }

            const options = { ...req.query, ...req.body };
            const result = await this.integrationService.executeAction(
                tenantId,
                systemSlug,
                action,
                options,
            );

            // ── File export: stream bytes directly ────────────────────────
            if (result.type === 'file') {
                res.setHeader('Content-Type', result.mimeType);
                res.setHeader(
                    'Content-Disposition',
                    `attachment; filename="${result.filename}"`,
                );
                res.setHeader('Content-Length', result.buffer.length);
                return res.end(result.buffer);
            }

            // ── Regular JSON response ──────────────────────────────────────
            return ApiResponseHandler.ok(res, 'Success', result.data);
        } catch (error: any) {
            return ApiResponseHandler.badrequest(res, error.message);
        }
    }
}
