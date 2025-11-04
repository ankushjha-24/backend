class apiError extends Error{
    constructor(statuscode,statck="",error=[],message="Error"){
        super(message);
        this.statuscode=statuscode;
        this.message=message;
        this.error=error;
        this.success=false;
        if(statck){
            this.stack=statck;
        }else{
            Error.captureStackTrace(this,this.constructor);
        }
    }
    
}
export {apiError};