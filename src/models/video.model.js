import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
    {
        videoFile: {
            type: String, //cloudinary 
            requied: true,

        },
        thumbnail: {
            type: String, 
            requied: true,
        },
        title: {
            type: String, 
            requied: true,
        },
        description: {
            type: String, 
            requied: true,
        },
        duration: {
            type: Number, //cloudinary 
            requied: true,
        },
        views: {
            type: Number,  
            default: 0,
        },
        isPublished: {
            type: Boolean, 
            dafault: true,
        },
        owner: {
            type: Schema.Types.ObjectId, 
            ref: "User",
        },
    },
    {
        timestamps: true
    }
)

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video", videoSchema)