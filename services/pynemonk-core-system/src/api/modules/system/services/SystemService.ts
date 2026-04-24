import { injectable, inject } from "tsyringe";
import { SystemHelper } from "../helpers/SystemHelper.js";

@injectable()
export class SystemService {
    constructor(@inject(SystemHelper) private systemHelper: SystemHelper) {}

    async getStats() {
        return this.systemHelper.getGlobalStats();
    }
}
