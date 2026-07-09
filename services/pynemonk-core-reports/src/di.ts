import "reflect-metadata";
import { container } from "tsyringe";
import pool from "./db/pg-pool.js";

import Exporters from "./api/modules/reports/helpers/Exporters.js";
import SecurityHelper from "./api/modules/reports/helpers/SecurityHelper.js";
import EmailHelper from "./api/modules/reports/helpers/EmailHelper.js";
import QueueWorker from "./api/modules/reports/workers/QueueWorker.js";
import ReportService from "./api/modules/reports/services/ReportService.js";
import ReportController from "./api/modules/reports/controllers/ReportController.js";

function setupDI(): void {
    // Infrastructure connection pool
    container.registerInstance("DB", pool);

    // Helpers & Workers
    container.register(Exporters, { useClass: Exporters });
    container.register(SecurityHelper, { useClass: SecurityHelper });
    container.register(EmailHelper, { useClass: EmailHelper });
    container.register(QueueWorker, { useClass: QueueWorker });

    // Services & Controllers
    container.register(ReportService, { useClass: ReportService });
    container.register(ReportController, { useClass: ReportController });
}

export default setupDI;
