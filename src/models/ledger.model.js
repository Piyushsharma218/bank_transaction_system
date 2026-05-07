const mongoose = require("mongoose");

const ledgerSchema = new mongoose.Schema({
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "account",
    required: [true, "ledger mustn be assoicated with the account"],
    index: true,
    immutable: true,
  },
  amount: {
    type: Number,
    required: [true, "ledger is required for creating a ledger entry"],
    immutable: true,
  },
  transaction: {
    type: mongoose.Schema.Types.ObejectId,
    ref: "transaction",
    required: [true, "ledger must be associated with the transaciton"],
    index: true,
    immutable: true,
  },
  type: {
    type: String,
    enum: {
      values: ["CREDIT", DEBIT],
      message: "type can be either credit or debit",
    },
    required: [true, "ledger type is required"],
    immutable: true,
  },
});

function preventLedgerModification() {
  throw new Error(
    "Ledger entries are immutable and cannot be modified or deleted",
  );
}

ledgerSchema.pre("findOneAndUpdate", preventLedgerModification);
ledgerSchema.pre("updateOne", preventLedgerModification);
ledgerSchema.pre("deleteOne", preventLedgerModification);
ledgerSchema.pre("remove", preventLedgerModification);
ledgerSchema.pre("deleteMany", preventLedgerModification);
ledgerSchema.pre("updateMany", preventLedgerModification);
ledgerSchema.pre("updateMany", preventLedgerModification);
ledgerSchema.pre("findOneAndDelete", preventLedgerModification);
ledgerSchema.pre("findOneAndReplace", preventLedgerModification);

const ledgerModel = mongoose.model("ledger", ledgerSchema);

module.exports = ledgerModel;
