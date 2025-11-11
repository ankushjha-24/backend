import mongoose, {Schema} from "mongoose";

const videoSchema = new Schema(
    {
        id:{
            type:String,
            required:true,
            unique:true,
            index:true,
        },
        videofile:{
            type:String, //cloudnary url
        },
        thumbnail:{
            type:String, //cloudnary url
        },
        title:{
            type:String,
            required:true,
            trim:true,
            index:true,
        },
        owner:{
            type:Schema.Types.ObjectId,
            ref:"User",
            required:true,
        },
        description:{
            type:String,
            trim:true,
        },
        duration:{
            type:Number, //in seconds
            required:true,
        },
        views:{
            type:Number,
            default:0,
        },
        isPublished:{
            type:Boolean,
            default:false,
        },
    },
     
   {
        timestamps:true,
    }
);

export const Video = mongoose.model("Video", videoSchema);