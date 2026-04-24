import { injectable, inject } from "tsyringe";
import e from "express";
import { SystemService } from "../services/SystemService.js";

@injectable()
export class SystemController {
    constructor(@inject(SystemService) private systemService: SystemService) {}

    async getStats(req: e.Request, res: e.Response) {
        try {
            const stats = await this.systemService.getStats();
            res.json({ success: true, data: stats });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
