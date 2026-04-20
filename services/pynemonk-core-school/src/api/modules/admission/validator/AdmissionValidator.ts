import Joi from 'joi';

export const AdmissionValidator = Joi.object({
    student: Joi.object({
        admission_no: Joi.string().required(),
        first_name: Joi.string().required(),
        last_name: Joi.string().required(),
        email: Joi.string().email().required(),
        gender: Joi.string().valid('male', 'female', 'other').required(),
        date_of_birth: Joi.string().isoDate().required(),
        address: Joi.string().optional()
    }).required(),
    guardian: Joi.object({
        first_name: Joi.string().required(),
        last_name: Joi.string().required(),
        email: Joi.string().email().required(),
        phone: Joi.string().required(),
        relation: Joi.string().required()
    }).required(),
    enrollment: Joi.object({
        classroom_id: Joi.number().integer().required(),
        academic_year_id: Joi.number().integer().required(),
        roll_number: Joi.string().optional()
    }).required()
});
