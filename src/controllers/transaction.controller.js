const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const accountModel = require("../models/account.model");
const emailService = require("../services/email.service");
const mongoose = require("mongoose");

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
    toUserAccount._id
  );

  return res.status(201).json({
    message: "transaction created successfully",
    transaction,
  });
}

module.exports={ createTransaction };