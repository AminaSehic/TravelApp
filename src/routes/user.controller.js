const express = require("express");
const router = express.Router();
const userServices = require("../services/user.services");
const Role = require("../helpers/role");
const { jwt, jwtOptional } = require("../helpers/jwt");

//routes
router.post("/authenticate", authenticate);
router.post("/logout", logout);
router.post("/register", register);

router.get("/posts", jwt(), getUserPosts);

router.put("/:id", jwt(), update);

router.get("/", jwtOptional(), getAll);
router.get("/current", jwtOptional(), getCurrent);
router.get("/:id", jwt(), getById);

router.delete("/:id", jwt(Role.Admin), _delete);

module.exports = router;

function authenticate(req, res, next) {
  userServices
    .authenticate(req.body)
    .then((user) => {
      if (user) {
        res.cookie("authToken", user.token, {
          httpOnly: true,
          sameSite: "Strict",
          path: "/",
          maxAge: 3600000,
        });
      }
      user
        ? res.json({ user: user, message: "User logged in successfully" })
        : res
            .status(400)
            .json({ message: "Username or password is incorrect." });
    })
    .catch((error) => next(error));
}

function logout(req, res, next) {
  res.clearCookie("authToken", {
    httpOnly: true,
    sameSite: "Strict",
    path: "/",
  });

  res.json({ message: "User logged out successfully" });
}

function register(req, res, next) {
  userServices
    .create(req.body)
    .then((user) =>
      res.json({
        user: user,
        message: `User Registered successfully with email ${req.body.email}`,
      })
    )
    .catch((error) => next(error));
}

function getAll(req, res, next) {
  userServices
    .getAll(req.user?.sub)
    .then((users) => res.json(users))
    .catch((err) => next(err));
}

function getUserPosts(req, res, next) {
  userServices
    .getUserPosts(req.user.sub, req.query)
    .then((posts) => res.json(posts))
    .catch((err) => next(err));
}

function getCurrent(req, res, next) {
  if (!req.user) {
    return res.json({ user: null });
  }
  userServices
    .getById(req.user.sub)
    .then((user) => (user ? res.json(user) : res.status(404)))
    .catch((error) => next(error));
}

function getById(req, res, next) {
  userServices
    .getById(req.params.id)
    .then((user) => {
      if (!user) {
        res.status(404).json({ message: "User Not Found!" });
        next();
      }
      return res.json(user);
    })
    .catch((error) => next(error));
}

function updateToAdmin(req, res, next) {
  userServices
    .update(req.params.id, req.body)
    .then(() =>
      res.json({
        message: `User with id: ${req.params.id} updated successfully.`,
      })
    )
    .catch((error) => next(error));
}

function update(req, res, next) {
  userServices
    .update(req.params.id, req.body)
    .then(() =>
      res.json({
        message: `User with id: ${req.params.id} updated successfully.`,
      })
    )
    .catch((error) => next(error));
}

function _delete(req, res, next) {
  userServices
    .delete(req.params.id)
    .then(() =>
      res.json({
        message: `User with id: ${req.params.id} deleted successfully.`,
      })
    )
    .catch((error) => next(error));
}
