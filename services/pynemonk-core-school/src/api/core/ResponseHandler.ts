import type IResponseHandler from "./interfaces/IResponseHandler.js";

class ResponseHandler {
    public static jsonResponse(response: IResponseHandler): JSON {
        const res: any = { message: response.message, success: response.success };
        if (response.data !== undefined) {
            res["data"] = response.data;
        }
        return res as JSON; // Type assertion to JSON
    }
}

export default ResponseHandler;
