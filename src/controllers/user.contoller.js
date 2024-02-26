import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { json } from "express"

const resgiterUser = asyncHandler(async (req, res) => {
   //get user details from the frontend
   //validation -not empty
   //check if user already exits : username and email
   //check for image and avtar
   //upload to the cloudinary, avtar
   //craete a user object -create entry in db 
   //remove password and refresh token  field from response
   //check foe user
   //return response

   const { fullname, email, username, password } = req.body
   console.log("email:", email)

   if (
      [fullname, email, username, password].some((feild) => feild?.trim() == "")
   ) {
      throw new ApiError(400, "Full name is required")
   }

   const existedUser = User.findOne({
      $or: [{ username }, { email }]
   })

   if (existedUser) {
      throw new ApiError(409, "User with this email or username already exist")
   }

   const avatarLocalPath = req.files?.avatar[0]?.path;
   const coverImageLocalPath = req.files?.coverImage[0]?.path;

   if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is required")
   }

   const avatar = await uploadOnCloudinary(avatarLocalPath)
   const coverImage = await uploadOnCloudinary(coverImageLocalPath)

   if (!avatar) {
      throw new ApiError(400, "avatar file is required ")
   }


   const user = await User.create({
      fullname,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      email,
      password,
      username: username.toLowerCase()
   })

   const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
   )

   if (!createdUser) {
      throw new ApiError(500, "Something went wrong while registering user")
   }

   return res.status(201).json(
      new ApiResponse(200, createdUser, "User registered succesfully")
   )
})

export { resgiterUser }