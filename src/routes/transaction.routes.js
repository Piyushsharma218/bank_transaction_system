const express = require("express");
const transactionController = require("../controllers/transaction.controller.js");
const auhtMiddleware=require("../middleware/auth.middleware.js")

const router = express.Router();


router.post("/",auhtMiddleware.authMiddleware,transactionController.createTransaction)

router.post("/system/initial-funds",auhtMiddleware.authSystemUserMiddleware,transactionController.createInitialFundsTransaction)

module.exports=router