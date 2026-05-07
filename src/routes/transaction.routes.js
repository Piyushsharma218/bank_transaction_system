const express = require("express");
const transactionController = require("../controllers/transaction.controller.js");
const auhtMiddleware=require("../middleware/auth.middleware.js")

const router = express.Router();


router.post("/",auhtMiddleware.authMiddleware)



module.exports=router