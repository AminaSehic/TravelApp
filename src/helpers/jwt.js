const expressJwt = require("express-jwt");
const config = require("../../config.json");
const db = require("../helpers/db");
const jwtDecode = require("jwt-decode");
const jsonwebtoken = require("jsonwebtoken");

const attachUser = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const authToken = authHeader && authHeader.split(" ")[1];

  const token = authToken;
  if (!token || token === "undefined") {
    return res.status(401).json({ message: "Authentication invalid" });
  }
  const decodedToken = jsonwebtoken.decode(token);
  if (decodedToken?.exp * 1000 < Date.now()) {
    return res.status(401).json({ message: "Token has expired" });
  }

  if (!decodedToken) {
    return res.status(401).json({
      message: "There was a problem authorizing the request",
    });
  } else {
    req.user = decodedToken;
    next();
  }
};

const optionalAttachUser = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const authToken = authHeader && authHeader.split(" ")[1];
  const token = authToken;

  if (!token || token === "undefined") {
    console.log("optional: ", token);
    next();
  }
  const decodedToken = jsonwebtoken.decode(token);
  if (decodedToken?.exp * 1000 < Date.now()) {
    return res.status(401).json({ message: "Token has expired" });
  }
  // console.log("decodedToken-> ", decodedToken);

  if (decodedToken) {
    req.user = decodedToken;
    next();
  }
};

const requireAuth = jwt({
  secret: config.secret,
  audience: "api.orbit",
  issuer: "api.orbit",
  getToken: (req) => req.cookies.token,
});

function jwt(roles = []) {
  return [
    attachUser,
    async (req, res, next) => {
      const user = await db.User.findById(req.user.sub);

      if (!user || (roles.length && !roles.includes(user.role))) {
        return res.status(401).json({ message: "Only Admin is Authorized!" });
      }
      next();
    },
  ];
}

function jwtOptional() {
  return [
    optionalAttachUser,
    async (req, res, next) => {
      next();
    },
  ];
}

module.exports = { jwt, jwtOptional, attachUser, requireAuth };
