const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const accountModel = require("../models/account.model");
const emailService = require("../services/email.service");

async function createTransaction(req, res) {
  // validate request

  const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

  if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({
      message: "fromAccount ,toAccount ,amount ,idempotencyKey are required",
    });
  }

  const fromUserAccount = await accountModel.findOne({
    _id: fromAccount,
  });

  const toUserAccount = await accountModel.findOne({
    _id: toAccount,
  });

  if (!fromUserAccount || toUserAccount) {
    return res.status(400).json({
      message: "invalid fromAccount or toAccount",
    });
  }

  //validate imdempotencyKey

  const isTransacitonAlreadyExists = await transactionModel.findOne({
    idempotencyKey: idempotencyKey,
  });

  if (isTransacitonAlreadyExists) {
    if(isTransacitonAlreadyExists.status === "COMPLETE") {
      res.status(200).json({
        message: "transaction already processed",
        transaction: isTransacitonAlreadyExists,
      });
    }
    if(isTransacitonAlreadyExists.status==="PENDING"){
      res.status(200).json({
        message: "transaction is stille processing"
      });
    }

    if(isTransacitonAlreadyExists.status==="FAILED"){
      res.status(500).json({
        message: "transaction processing failed",
      })
    }

    if(isTransacitonAlreadyExists.status==="REVERSED"){
      res.status(500).json({
        message: "transaction has been reversed",
      })
    }
  }
}
