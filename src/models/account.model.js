const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: [true, "User is required to create a new account"],
    index: true,
  },
  status: {
    type: String,
    enum: {
      values: ["ACTIVE", "FROZEN", "BLOCKED"],
      message: "Status can be either active,frozen or blocked",
    },
  },
  currency: {
    type: String,
    required: [true, "Currency is required for crating a accoount"],
    defualt: "INR",
  },
});

accountSchema.index({ user: 1, status: 1 });

const accountModel = mongoose.model("account", accountSchema);

momdule.exports = accountModel;
