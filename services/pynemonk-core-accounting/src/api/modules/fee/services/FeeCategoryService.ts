import { injectable, inject } from "tsyringe";
import FeeCategoryHelper from "../helpers/FeeCategoryHelper.js";
import FeeCategoryValidator from "../validator/FeeCategoryValidator.js";

@injectable()
export default class FeeCategoryService {
    constructor(@inject(FeeCategoryHelper) private feeCategoryHelper: FeeCategoryHelper, @inject(FeeCategoryValidator) private feeCategoryValidator: FeeCategoryValidator) {}

    public async create(tenantId: number, data: any): Promise<any> {
        await this.feeCategoryValidator.validate("CREATE_FEE_CATEGORY", data);

        const existing = await this.feeCategoryHelper.findByName(tenantId, data.name);
        if (existing) {
            throw new Error(`Fee category with name '${data.name}' already exists.`);
        }

        return this.feeCategoryHelper.create(
            tenantId,
            data.name,
            data.description,
            data.is_mandatory
        );
    }

    public async list(tenantId: number): Promise<any[]> {
        return this.feeCategoryHelper.list(tenantId);
    }
}
