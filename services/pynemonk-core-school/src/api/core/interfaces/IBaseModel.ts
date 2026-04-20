export default interface IBaseModel {
    id?: number;
    created_at?: Date;
    updated_at?: Date;

    validate(attributes: any): Promise<boolean>;
    save(attributes: any, skipValidation?: boolean): Promise<any>;
}
