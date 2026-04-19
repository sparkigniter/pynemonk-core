import { injectable, inject } from "tsyringe";
import FeePaymentHelper from "../helpers/FeePaymentHelper.js";

@injectable()
export default class FeePaymentService {
    constructor(@inject(FeePaymentHelper) private feePaymentHelper: FeePaymentHelper) {}

    public async getPayments(tenantId: number) {
        return this.feePaymentHelper.findAll(tenantId);
    }

    public async getPaymentById(tenantId: number, id: number) {
        return this.feePaymentHelper.findById(tenantId, id);
    }

    public async recordPayment(tenantId: number, data: any) {
        return this.feePaymentHelper.create({ ...data, tenant_id: tenantId });
    }

    public async cancelPayment(tenantId: number, id: number) {
        return this.feePaymentHelper.delete(tenantId, id);
    }
}
