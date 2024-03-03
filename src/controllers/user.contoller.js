import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import json from "express"

const generateAccessAndRefreshTokens = async (userId) => {
   try {
      const user = await User.findById(userId)
      const accessToken = user.generateAccessToken()
      const refreshToken = user.generateRefreshToken()

      user.refreshToken = refreshToken
      await user.save({ validateBeforeSave: false })

   } catch (error) {
      throw new ApiError(500, "something went wrong while generating refresh and access token")

   }
}

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

   const { fullName, email, username, password } = req.body
   // console.log("email:", email)
   // console.log("password", password)
   // console.log("username", username)
   // console.log("fullName", fullName)
   // console.log("password", password)
   if (
      [fullName, email, username, password].some((field) => field?.trim() === "")
   ) {
      throw new ApiError(400, "All fields are required")
   }

   const existedUser = await User.findOne({
      $or: [{ username }, { email }]
   })


   if (existedUser) {
      throw new ApiError(409, "User with email or username already exists")
   }
   console.log(req.files)

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
      fullName,
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

const loginUser = asyncHandler(async (req, res) => {
   //req.body -> data 
   //check the backend if value are same or not? username or email
   //if value are defferent then send error, user not found or invalid password
   //if user exist and credential are correct
   //genrate access token and refresh token
   //send cookies
   const { username, email, password } = req.body()

   if (!username || !email) {
      throw new ApiError(400, "username or passowrd is required")
   }

   const user = await User.findOne({
      $or: [{ email }, { username }]
   })

   if (!user) {
      throw new ApiError(404, "User does not exist")
   }
   const isPasswordValid = await user.isPasswordCorrect(password)

   if (!isPasswordValid) {
      throw new ApiError(401, "Invalid user credential!")
   }

   const { refreshToken, accessToken } = await generateRefreshToken(user._id)

   const loggInUser = await User.findById(user._id).select("-password -refreshToken")

   const options = {
      httpOnly: true,
      secure: true
   }

   return res
      .status(200)
      .cookie("accesToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
         new ApiResponse(
            200,
            {
               user: loggInUser, accessToken, refreshToken
            },
            "User logged in Successfully"
         )
      )
})


const logoutUser = asyncHandler(async (res, req) => {
   await User.findByIdAndUpdate(
      req.user._id,
      {
         $set: {
            refreshToken: undefined,
         }
      }, {
      new: true
   }
   )
   const options = {
      httpOnly: true,
      secure: true
   }

   return res
      .status(200)
      .clearCookies("accesToken", accessToken, options)
      .clearCookies("accesToken", accessToken, options)
      .json(new ApiResponse(200, {}, "User Logged out"))
})
export { resgiterUser, loginUser, logoutUser }