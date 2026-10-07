const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");

/**
 * - User register controller
 * - POST api/auth/register
 */
async function userRegisterController(req, res) {
  const { email, password, name } = req.body;
  const isAlreadyExist = await userModel.findOne({
    email: email,
  });
  if (isAlreadyExist) {
    res.status(422).json({
      message: "User already registered with the email",
      status: "failed",
    });
  }
  const user = await userModel.create({
    name,
    email,
    password,
  });

  const token = jwt.sign(
    {
      id: user._id,
      name: user.name,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "3d",
    },
  );

  res.cookie("token", token);

  res.status(200).json({
    message: "User Registered Succecsully",
    status: "success",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
    token,
  });
}

/**
 * - User login controller
 * - POST api/auth/login
 */

module.exports = {
  userRegisterController,
};
