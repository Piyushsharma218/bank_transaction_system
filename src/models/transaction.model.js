const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    fromAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "account",
      required: [true, "Transaction must be associated with a fromAccount"],
      index: true,
    },
    toAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "account",
      required: [true, "Transaciton must be associated with a toAccount"],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ["PENDING", "COMPLETE", "FAILED", "REVERSED"],
        message:
          "status can be either PENDING , COMPLETED , FAILED OR REVERSED",
      },
      default: "PENDING",
    },
    amount: {
      type: Number,
      required: [true, "Amount is required for creating a transaction"],
      min: [0, "transaction cannot be negative"],
    },
    idempotencyKey: {
      type: String,
      required: [
        true,
        "idempotency key is required for creating a transaciton",
      ],
      index: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  },
);


const transactionModel=mongoose.model("transaction",transactionSchema)

module.exports=transactionModel