import Joi from "joi";

export interface Grade {
    id?: number;
    tenant_id: number;
    name: string;
    slug: string;
    sequence_order: number;
    created_at?: Date;
    updated_at?: Date;
}

export const GradeValidator = Joi.object({
    name: Joi.string().required().min(2).max(50),
    slug: Joi.string().required().min(2).max(50),
    sequence_order: Joi.number().integer().min(0).default(0),
});
