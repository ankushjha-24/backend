class apiError extends Error{
    constructor(statuscode,stack="",error=[],message="Error"){
        super(message);
        this.statuscode=statuscode;
        this.message=message;
        this.error=error;
        this.success=false;
        if(stack){
            this.stack=stack;
        }else{
            Error.captureStackTrace(this,this.constructor);
        }
    }
    
}
export {apiError};