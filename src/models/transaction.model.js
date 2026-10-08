const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    fromAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "account",
      required: [true, "fromAccount is required"],
      index: true,
    },
    toAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "account",
      required: [true, "toAccount is required"],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ["PENDING", "COMPLETED", "FAILED", "REVERSED"],
        message: "status must be either PENDING, COMPLETED, FAILED or REVERSED",
      },
      default: "PENDING",
    },

    amount: {
      type: Number,
      required: [true, "amount is required"],
      min: [0, "Transaction amount cannot be negative"],
    },
    idempotencyKey: {
      type: String,
      required: [true, "idempotencyKey is required"],
      unique: true,
      index: true,
    },
  },
  { timestamps: true },
);

const transactionModel = mongoose.model("transaction", transactionSchema);
module.exports = transactionModel;
