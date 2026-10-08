const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const emailService = require("../services/email.service");
const blacklistModel = require("../models/blacklist.model");

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

  res.status(201).json({
    message: "User Registered Succecsully",
    status: "success",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
    token,
  });

  await emailService.sendRegistrationEmail(user.email, user.name);
}

/**
 * - User login controller
 * - POST api/auth/login
 */
async function userLoginController(req, res) {
  const { email, password } = req.body;
  if (!(email || password)) {
    res.status(400).json({
      messsage: "Please provide email and  password",
    });
  }
  const user = await userModel.findOne({
    email,
  });

  if (!user) {
    res.status(404).json({
      message: "User is not registered",
    });
  }

  const isValidPassword = await user.comparePassword(password);

  if (!isValidPassword) {
    res.status(404).json({
      message: "Invalid Password",
    });
  }

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
    message: "Login Succefull",
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
 * - User logout controller
 * - POST api/auth/logout
 */
async function userLogoutController(req, res) {
  const token = req.cookies.token;
  if (!token) {
    return res.status(400).json({
      message: "Unaothorized access, Token is required or Already logged out",
    });
  }
  const blacklist = await blacklistModel.create({ token });
  res.clearCookie("token");
  res.status(200).json({
    message: "Logout successful",
    status: "success",
  });
}

module.exports = {
  userRegisterController,
  userLoginController,
  userLogoutController,
};
