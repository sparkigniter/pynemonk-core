import { Request, Response, NextFunction } from "express";
import { injectable, container } from "tsyringe";
import { AuthenticatedRequest } from "./AuthMiddleware.js";
import AcademicYearHelper from "../../modules/academics/helpers/AcademicYearHelper.js";

@injectable()
export class AcademicYearMiddleware {
    /**
     * Blocks write operations (POST, PUT, PATCH, DELETE) if the targeted
     * academic year is marked as 'closed'.
     */
    public async protectClosedYear(req: Request, res: Response, next: NextFunction): Promise<void> {
        const authReq = req as any;
        const skipMethods = ["GET", "HEAD", "OPTIONS"];
        if (skipMethods.includes(req.method)) {
            return next();
        }

        // 1. Identify academic_year_id from request
        const academicYearId = 
            req.body.academic_year_id || 
            req.body.academicYearId ||
            req.query.academic_year_id || 
            req.query.academicYearId ||
            req.params.academicYearId ||
            req.params.academic_year_id;

        if (!academicYearId) {
            // If no year is specified, we usually default to current, which should be active.
            // But for safety, some routes might require it. 
            // Here we allow if not specified, assuming the service handles defaults.
            return next();
        }

        try {
            const helper = container.resolve(AcademicYearHelper);
            const isClosed = await helper.isClosed(authReq.user.tenantId, parseInt(academicYearId as string));

            if (isClosed) {
                res.status(403).json({
                    success: false,
                    message: "Operation forbidden: This academic year is closed for modifications.",
                });
                return;
            }

            next();
        } catch (err) {
            console.error("[AcademicYearMiddleware] Error:", err);
            next(); // Allow on error to avoid breaking the app, or block for strict security?
        }
    }
}
