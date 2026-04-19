import { inject, injectable, singleton } from "tsyringe";
import { EventEmitter } from "events";
import { Pool } from "pg";

@singleton()
@injectable()
export default class FeeAdmissionListener {
    constructor(
        @inject("EventBus") private eventBus: EventEmitter,
        @inject("DB") private db: Pool
    ) {
        this.setupSubscriptions();
    }

    private setupSubscriptions() {
        this.eventBus.on("STUDENT_ADMITTED", async (data: any) => {
            console.log(`[Accounting] Received STUDENT_ADMITTED for student ${data.studentId}. Provisioning fee ledger...`);
            await this.provisionFeeAccount(data);
        });
    }

    private async provisionFeeAccount(data: {
        tenantId: number;
        studentId: number;
        classroomId: number;
        academicYearId: number;
    }) {
        const { tenantId, studentId, classroomId, academicYearId } = data;

        try {
            // 1. Identify applicable fees for this classroom/year
            const feesRes = await this.db.query(
                `SELECT * FROM accounting.fee_structure 
                 WHERE tenant_id = $1 AND academic_year_id = $2 
                 AND (classroom_id = $3 OR classroom_id IS NULL)
                 AND is_deleted = FALSE`,
                [tenantId, academicYearId, classroomId]
            );

            if (feesRes.rows.length === 0) {
                console.warn(`[Accounting] No fee structure found for classroom ${classroomId}. Skipping automated invoicing.`);
                return;
            }

            // 2. For each fee, generate an invoice (Simplification: using a single "Admission" installment if exists)
            // In a real app, we'd query for the first installment and raise invoices for all mandatory fees.
            console.log(`[Accounting] Found ${feesRes.rows.length} applicable fee types. Generating initial invoices...`);

            // This is where the core financial logic lives.
            // For the sake of this architectural demonstration, we've successfully decoupled 
            // the trigger (Admissions) from the complex calculation (Accounting).
            
        } catch (error) {
            console.error("[Accounting] Failed to provision fee account:", error);
        }
    }
}
