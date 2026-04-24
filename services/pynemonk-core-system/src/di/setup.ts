import { container } from "tsyringe";
import { SystemHelper } from "../api/modules/system/helpers/SystemHelper.js";
import { SystemService } from "../api/modules/system/services/SystemService.js";
import { SystemController } from "../api/modules/system/controllers/SystemController.js";

export function setupDI(): void {
    container.register(SystemHelper, { useClass: SystemHelper });
    container.register(SystemService, { useClass: SystemService });
    container.register(SystemController, { useClass: SystemController });
}
