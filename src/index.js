import dotenv from "dotenv";
import connnectDB from "./db/index.js";
// import express  from "express";
// const app = express()
import { app } from "./app.js"

dotenv.config({
  path: "./.env",
});

connnectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`server is running at port:  ${process.env.PORT}`);
    })
  })
  .catch((err) => {
    console.log("MONGODB connection failed !!!!", err)
  })

// import express from "express";

// const app = express();

// (async () => {
//   try {
//     await mongoose.connect(`${process.env.MONGOOSE_URI}/${DB_NAME}`);
//     app.on("error", (error) => {
//       console.log("ERROR: ", error);
//       throw error;
//     });

//     app.listen(process.env.PORT, () => {
//       console.log(`App is listening on port ${process.env.PORT}`);
//     });
//   } catch (error) {
//     console.error("ERROR", error);
//     throw error;
//   }
// })();
