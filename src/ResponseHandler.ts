import IResponseHandler from "./api/modules/interfaces/IResponseHandler";

class ResponseHandler {

    public static jsonResponse( response : IResponseHandler): JSON {
        let res:any = { "message": response.message, "success": response.success};
        if(response.data !== undefined){
            res["data"] = response.data;
        }
        return <JSON>res;
    }
}

export default ResponseHandler;
