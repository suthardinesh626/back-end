import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens = async (userId) => {
   try {
      const user = await User.findById(userId)
      const accessToken = user.generateAccessToken()
      const refreshToken = user.generateRefreshToken()

      user.refreshToken = refreshToken
      await user.save({ validateBeforeSave: false })


      return { accessToken, refreshToken }


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

   // if (!user) {
   //    console.log("user not created")
   // }
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
   const { username, email, password } = req.body
   if (!username && !email) {
      throw new ApiError(400, "username or passowrd is required")
   }

   const user = await User.findOne({
      $or: [{ email }, { username }]
   })
   // console.log(username)
   // console.log(password)


   if (!user) {
      throw new ApiError(404, "User does not exist")
   }
   const isPasswordValid = await user.isPasswordCorrect(password)

   if (!isPasswordValid) {
      throw new ApiError(401, "Invalid user credential!")
   }

   const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

   const logInUser = await User.findById(user._id).select("-password -refreshToken")

   const options = {
      httpOnly: true,
      secure: true
   }

   return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
         new ApiResponse(
            200,
            {
               user: logInUser, accessToken, refreshToken
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
      .clearCookies("accessToken", options)
      .clearCookies("refreshToken", options)
      .json(new ApiResponse(200, {}, "User Logged out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
   const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

   if (!incomingRefreshToken) {
      throw new ApiError(401, "unauthorized request")
   }

   try {
      const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

      const user = await User.findById(decodedToken?._id)

      if (!user) {
         throw new ApiError(401, "Invalid refresh token")
      }

      if (incomingRefreshToken !== user?.refreshToken) {
         throw new ApiError(401, "Refresh token is expired ")
      }

      const options = {
         httpOnly: true,
         secure: true
      }

      const { accessToken, newrefreshToken } = await generateAccessAndRefreshTokens(user._id)

      return res
         .status(200)
         .cookie("accessToken", accessToken, options)
         .cookie("refreshToken", newrefreshToken, options)
         .json(
            new ApiResponse(200, { accessToken, refreshToken: newrefreshToken }, "Access Token refresh successfully")
         )
   } catch (error) {
      throw new ApiError(401, "Invaid refersh token")
   }
})


const changeCurrentPassword = asyncHandler(async (req, res) => {
   const { newPassword, oldPassword } = req.body

   const user = await User.findById(req.user?._id)
   const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

   if (!isPasswordCorrect) {
      throw new ApiError(400, "Invalid Password")
   }

   user.password = newPassword
   await user.save({ validateBeforeSave: false })

   return res

})

const getCurrentuser = asyncHandler(async (req, res) => {
   return res
      .status(200)
      .json(200, req.user, "Curretn user fetched succesfully")
})


const updateAccountDetail = asyncHandler(async (req, res) => {
   const { fullName, email } = req.body

   if (!(fullName || email)) {
      throw new ApiError(400, "All feild are required")
   }

   const user = User.findByIdAndUpdate(
      req.user?._id,
      {
         $set: {
            fullName,
            email: email
         }
      },
      {
         new: true
      }
   ).select("-password")

   return res.status(200).json(new ApiResponse(200, user, "Account details are upadted succesfully"))
})

const updateUserAvatar = asyncHandler(async (res, req) => {
   const avatarLocalPath = req.file?.path

   if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file path is missing")
   }
   const avatar = await uploadOnCloudinary(avatarLocalPath)

   if (!avatar.url) {
      throw new ApiError(400, "Error while uploading")
   }

   const user = await User.findByIdAndUpdate(
      req.body?._id,
      {
         $set: {
            avatar: avatar.url
         }
      },
      {
         new: true
      }
   ).select("-password")


   return res
      .status(200)
      .json(new ApiResponse(200, user, "Avatar is updated succesfully"))
})

const updateUserCoverImage = asyncHandler(async (res, req) => {
   const coverImageLocalPath = req.file?.path

   if (!coverImageLocalPath) {
      throw new ApiError(400, "CoverImage file path is missing")
   }
   const coverImage = await uploadOnCloudinary(coverImageLocalPath)

   if (!coverImage.url) {
      throw new ApiError(400, "Error while uploading")
   }

   const user = await User.findByIdAndUpdate(
      req.body?._id,
      {
         $set: {
            coverImage: coverImage.url
         }
      },
      {
         new: true
      }
   ).select("-password")

   return res
      .status(200)
      .json(new ApiResponse(200, user, "Cover Image is updated succesfully"))
})

export { resgiterUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentuser, updateAccountDetail, updateUserAvatar, updateUserCoverImage }