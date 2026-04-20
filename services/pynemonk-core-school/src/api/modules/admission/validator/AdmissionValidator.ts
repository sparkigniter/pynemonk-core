import Joi from "joi";

export const AdmissionValidator = Joi.object({
    student: Joi.object({
        admission_no: Joi.string().required(),
        first_name: Joi.string().required(),
        last_name: Joi.string().required(),
        email: Joi.string().email().required(),
        gender: Joi.string().valid("male", "female", "other").required(),
        date_of_birth: Joi.string().isoDate().required(),
        blood_group: Joi.string().optional().allow(null, ""),
        nationality: Joi.string().optional().allow(null, ""),
        religion: Joi.string().optional().allow(null, ""),
        phone: Joi.string().optional().allow(null, ""),
        address: Joi.string().optional().allow(null, ""),
        avatar_url: Joi.string().uri().optional().allow(null, ""),
    }).required(),
    guardian: Joi.object({
        first_name: Joi.string().required(),
        last_name: Joi.string().required(),
        email: Joi.string().email().required(),
        phone: Joi.string().required(),
        gender: Joi.string().valid("male", "female", "other").optional(),
        relation: Joi.string().required(),
        occupation: Joi.string().optional().allow(null, ""),
        address: Joi.string().optional().allow(null, ""),
        is_emergency: Joi.boolean().default(false),
        avatar_url: Joi.string().uri().optional().allow(null, ""),
    }).required(),
    enrollment: Joi.object({
        classroom_id: Joi.number().integer().optional(),
        grade_id: Joi.number().integer().optional(),
        section: Joi.string().optional(),
        academic_year_id: Joi.number().integer().required(),
        roll_number: Joi.string().optional().allow(null, ""),
    })
        .or("classroom_id", "grade_id")
        .and("grade_id", "section")
        .required(),
});
