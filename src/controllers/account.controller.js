const { get } = require("mongoose");
const accountModel = require("../models/account.model.js");

async function createAccountController(req, res) {
  const user = req.user;

  const account = await accountModel.create({
    user: user._id,
  });
  res.status(201).json({
    account,
  });
}

async function getUserAccountController(req,res){
  const accounts=await accountModel.find({user:req.user._id})
  res.status(200).json({
    accounts
  })
}

module.exports = { createAccountController,getUserAccountController };
