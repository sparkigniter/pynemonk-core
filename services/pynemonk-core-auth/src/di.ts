import "reflect-metadata";
import { container } from "tsyringe";
import ClientModel from "./api/modules/oauth2/models/ClientModel.ts";
import OauthClientHelper from "./api/modules/oauth2/helpers/OauthClientHelper.ts";
import Validator from "./api/core/Validator.ts";
import ClientValidator from "./api/modules/oauth2/validator/ClientValidator.ts";
import pool from "../src/db//pg-pool.ts";
import ScopeValidator from "./api/modules/oauth2/validator/ScopeValidator.ts";
import OauthScopeHelper from "./api/modules/oauth2/helpers/OauthScopeHelper.ts";
import ScopeModel from "./api/modules/oauth2/models/ScopeModel.ts";


function setupDI() {

    // Register dependencies using interfaces as tokens

    //Validators
    container.register(ClientValidator, { useClass: ClientValidator });
    container.register(ScopeValidator, { useClass: ScopeValidator });

    //Helpers
    container.register(OauthClientHelper, { useClass: OauthClientHelper });
    container.register(OauthScopeHelper, { useClass: OauthScopeHelper }); 
        

    //models
    container.register(ClientModel, { useClass: ClientModel });
    container.register(ScopeModel, { useClass: ScopeModel });

    
    // Register the database pool as a singleton
    container.register("DB", { useValue: pool });
}

export default setupDI;