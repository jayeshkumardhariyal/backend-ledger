const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");

async function authMiddleware(req, res, next) {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({
      message: "Unauthorized Access, token is missing",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.id).select("-password");
    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({
      message: "Unauthorized acccess, Invalid token",
    });
  }
}

async function authSystemUserMiddleware(req, res, next) {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({
      message: "Unauthorized Access, token is missing",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.id).select("+systemUser");
    if (!user.systemUser) {
      return res.status(403).json({
        message: "Access denied, only system users can perform this action",
      });
    }
    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({
      message: "Unauthorized access, Invalid token",
    });
  }
}

module.exports = {
  authMiddleware,
  authSystemUserMiddleware,
};
