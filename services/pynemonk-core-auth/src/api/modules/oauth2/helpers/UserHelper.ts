import UserModel from "../models/UserModel.js";
import { injectable, inject } from "tsyringe";

@injectable()
class UserHelper {

    private userModel: UserModel;

    public constructor(@inject(UserModel) userModel: UserModel) {
        this.userModel = userModel;
    }

    public async getUserByEmail(email: string): Promise<any> {
        // get user from database
        return this.userModel.getUser(email);
    }

    public async getUserCredential(email: string): Promise<any> {
        // get user from database
        return this.userModel.getUserCredential(email);
    }
}

export default UserHelper;