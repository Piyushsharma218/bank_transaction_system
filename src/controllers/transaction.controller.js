const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const accountModel = require("../models/account.model");
const emailService = require("../services/email.service");
const mongoose = require("mongoose");

// validate request body
//vlidate idempotency key
// check account status
//derive sender balance from ledger
//create transaction
//create debit ledger entry
//create credit ledger entry
//mark transaciton completed
//commit mongodb session
//send email notification

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
    if (isTransacitonAlreadyExists.status === "COMPLETE") {
      return res.status(200).json({
        message: "transaction already processed",
        transaction: isTransacitonAlreadyExists,
      });
    }
    if (isTransacitonAlreadyExists.status === "PENDING") {
      return res.status(200).json({
        message: "transaction is still processing",
      });
    }

    if (isTransacitonAlreadyExists.status === "FAILED") {
      return res.status(500).json({
        message: "transaction processing failed",
      });
    }

    if (isTransacitonAlreadyExists.status === "REVERSED") {
      return res.status(500).json({
        message: "transaction has been reversed",
      });
    }
  }

  // check account status

  if (
    fromUserAccount.status !== "ACTIVE" ||
    toUserAccount.status !== "ACTIVE"
  ) {
    return res.status(400).json({
      message: "fromAccount or toAccount is not active",
    });
  }

  // derive sender balance from ledger

  const balance = await fromUserAccount.getBalance();

  if (balance < amount) {
    return res.status(400).json({
      message: `insufficient balance. Current balance is ${balance}. Requested amount is ${amount}`,
    });
  }

  // create transaction

  const seession = await mongoose.startSession();
  session.startSession();

  const transaction = await transactionModel.create(
    {
      fromAccount,
      toAccount,
      amount,
      idempotencyKey,
      status: "PENDING",
    },
    { session: seession },
  );

  const debitLedgerEntry = await ledgerModel.create(
    {
      account: fromAccount,
      amount: amount,
      transaction: transaction._id,
      type: "DEBIT",
    },
    { session: seession },
  );

  const creditLedgerEntry = await ledgerModel.create(
    {
      account: toAccount,
      amount: amount,
      transaction: transaction._id,
      type: "CREDIT",
    },
    { session: seession },
  );

  transaction.status = "COMPLETE";
  await transaction.save({ session: seession });

  await seession.commitTransaction();
  seession.endSession();

  // send email notification to both sender and receiver

  await emailService.sendTransactionEmail(
    req.user.email,
    req.user.name,
    amount,
    toUserAccount._id,
  );

  return res.status(201).json({
    message: "transaction created successfully",
    transaction,
  });
}

async function createInitialFundsTransaction(req, res) {
  const { toAccount, amount, idempotencyKey } = req.body;

  if (!toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({
      message: "toAccount,amount and idempotency key is required",
    });
  }

  const toUserAccount = await accountModel.findOne({
    _id: toAccount,
  });

  if (!toUserAccount) {
    return res.status(400).json({
      message: "Invalid toAccount",
    });
  }

  const fromUserAccount = await accountModel.findOne({
    user: req.user._id,
  });

  if (!fromUserAccount) {
    return res.status(400).json({
      message: "system user account not found",
    });
  }
  const session = await mongoose.startSession();
  session.startTransaction();

  const transaction = new transactionModel({
    fromAccount: fromUserAccount._id,
    toAccount,
    amount,
    idempotencyKey,
    status: "PENDING",
  });

  const debitLedgerEntry = await ledgerModel.create(
    [
      {
        account: fromUserAccount._id,
        amount: amount,
        transaction: transaction._id,
        type: "DEBIT",
      },
    ],

    { session },
  );

  const creditLedgerEntry = await ledgerModel.create(
    [
      {
        account: toAccount,
        amount: amount,
        transaction: transaction._id,
        type: "CREDIT",
      },
    ],
    { session },
  );

  transaction.status = "COMPLETE";
  await transaction.save({ session });

  await session.commitTransaction();
  session.endSession();

  return res.status(201).json({
    message: "Initial funds transaction completed successfully",
    transaction: transaction,
  });
}

module.exports = { createTransaction, createInitialFundsTransaction };
