const router = require("express").Router();
const passport = require("passport");
const User = require("../models/user.model");
const { body, validationResult } = require("express-validator");
const {ensureLoggedOut,ensureLoggedIn} = require("connect-ensure-login");
const { registerValidator } = require('../utils/validators');
router.get(
  "/login",
  ensureLoggedOut({ redirectTo: "/" }),
  async (req, res, next) => {
    res.render("Login");
  }
);

router.post(
  "/login",
  ensureLoggedOut({ redirectTo: "/" }),
  passport.authenticate("local", {
    // successRedirect: '/',
    successReturnToOrRedirect: "/",
    failureRedirect: "/auth/login",
    failureFlash: true,
  })
);
router.get(
  '/register',
  ensureLoggedOut({ redirectTo: '/' }),
  async (req, res, next) => {
    res.render('register');
  }
);

router.post(
  '/register',
  ensureLoggedOut({ redirectTo: '/' }),
  registerValidator,
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        errors.array().forEach((error) => {
          req.flash('error', error.msg);
        });
        res.render('register', {
          username: req.body.username,
          messages: req.flash(),
        });
        return;
      }
      const { username} = req.body;
      const doesExist = await User.findOne({ username });
      if (doesExist) {
        req.flash('warning', 'Username/email already exists');
        res.redirect('/auth/register');
        return;
      }
      const user = new User(req.body);
      await user.save();
      req.flash(
        'success',
        `${user.email} registered succesfully, you can now login`
      );
      res.redirect('/auth/login');
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/logout",
  ensureLoggedIn({ redirectTo: "/" }),
  async (req, res, next) => {
    req.logout(function (err) {
      if (err) {
        console.error("Error occurred during logout:", err);
        return next(err); // Call next with error to pass it to the error handling middleware
      }
      // If no error occurred during logout
      res.redirect("/auth/login"); // Redirect to homepage or any other appropriate route
    });
  }
);

module.exports = router;

