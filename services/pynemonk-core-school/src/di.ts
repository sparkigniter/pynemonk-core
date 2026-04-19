import "reflect-metadata";
import { container } from "tsyringe";
import pool from "./db/pg-pool.js";

import StudentHelper from "./api/modules/student/helpers/StudentHelper.js";
import StudentValidator from "./api/modules/student/validator/StudentValidator.js";
import StudentService from "./api/modules/student/services/StudentService.js";
import StudentController from "./api/modules/student/controllers/StudentController.js";
import StaffHelper from "./api/modules/staff/helpers/StaffHelper.js";
import StaffValidator from "./api/modules/staff/validator/StaffValidator.js";
import StaffService from "./api/modules/staff/services/StaffService.js";
import StaffController from "./api/modules/staff/controllers/StaffController.js";
import ClassroomHelper from "./api/modules/classroom/helpers/ClassroomHelper.js";
import ClassroomService from "./api/modules/classroom/services/ClassroomService.js";
import ClassroomController from "./api/modules/classroom/controllers/ClassroomController.js";
import AdmissionService from "./api/modules/admission/services/AdmissionService.js";
import AdmissionController from "./api/modules/admission/controllers/AdmissionController.js";
import EnrollmentHelper from "./api/modules/student/helpers/EnrollmentHelper.js";
import GuardianHelper from "./api/modules/guardian/helpers/GuardianHelper.js";


import { InternalAuthClient } from "./api/core/clients/InternalAuthClient.js";

function setupDI(): void {
    // ── Infrastructure ──────────────────────────────────────────────────────
    container.registerInstance("DB", pool);
    container.register("IAuthClient", { useClass: InternalAuthClient });

    // ── Student Module ──────────────────────────────────────────────────────
    container.register(StudentHelper, { useClass: StudentHelper });
    container.register(StudentValidator, { useClass: StudentValidator });
    container.register(StudentService, { useClass: StudentService });
    container.register(StudentController, { useClass: StudentController });

    // ── Staff Module ────────────────────────────────────────────────────────
    container.register(StaffHelper, { useClass: StaffHelper });
    container.register(StaffValidator, { useClass: StaffValidator });
    container.register(StaffService, { useClass: StaffService });
    container.register(StaffController, { useClass: StaffController });

    // ── Classroom Module ────────────────────────────────────────────────────
    container.register(ClassroomHelper, { useClass: ClassroomHelper });
    container.register(ClassroomService, { useClass: ClassroomService });
    container.register(ClassroomController, { useClass: ClassroomController });

    // ── Admission Module ────────────────────────────────────────────────────
    container.register(EnrollmentHelper, { useClass: EnrollmentHelper });
    container.register(GuardianHelper, { useClass: GuardianHelper });
    container.register(AdmissionService, { useClass: AdmissionService });
    container.register(AdmissionController, { useClass: AdmissionController });
}

export default setupDI;
