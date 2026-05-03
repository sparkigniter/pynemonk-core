import { UserModel } from "../models/UserModel.js";
import { injectable, inject } from "tsyringe";

@injectable()
class UserHelper {

    private userModel: UserModel;

    public constructor(@inject(UserModel) userModel: UserModel) {
        this.userModel = userModel;
    }

    public async getUserByEmail(email: string): Promise<any> {
        // get user from database
        return UserModel.findByEmail(email);
    }

    public async getUserCredential(email: string): Promise<any> {
        // get user from database
        return UserModel.findByEmail(email);
    }

    public async getFullLoginContext(email: string, clientId: string, schoolSlug?: string): Promise<any> {
        return UserModel.getFullLoginContext(email, clientId, schoolSlug);
    }

    public async getIdentityContext(email: string, clientId: string): Promise<any> {
        return this.getFullLoginContext(email, clientId);
    }
}

export default UserHelper;