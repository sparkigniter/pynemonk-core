import "reflect-metadata";
import { container } from "tsyringe";
import ClientModel from "./api/modules/oauth2/models/ClientModel.ts";
import OauthClientHelper from "./api/modules/oauth2/helpers/OauthClientHelper.ts";
import Validator from "./api/core/Validator.ts";
import ClientValidator from "./api/modules/oauth2/validator/ClientValidator.ts";


function setupDI() {
    // DB singleton
    const dbConnection: any[] = [];

    // Register dependencies using interfaces as tokens
    container.register("IValidator", { useClass: Validator });
    container.register("IOauthClientHelper", { useClass: OauthClientHelper });
    container.register("IClientModel", { useClass: ClientModel }); // BaseModel is inherited
    container.register("IClientValidator", { useClass: ClientValidator });
    container.register("DB", { useValue: dbConnection });
}

export default setupDI;