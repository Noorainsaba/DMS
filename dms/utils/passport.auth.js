const passport = require("passport");

const LocalStrategy = require("passport-local").Strategy;

const User = require("../models/user.model");

passport.use(
  new LocalStrategy(
    {
      usernameField: "username",
      passwordField: "password",
    },
    async (username, password, done) => {
      try {
        const user = await User.findOne({ username });
        //username does not exists
        if (!user) {
          return done(null, false, { message: "username does not registered" });
        }
        //username exists
        const isMatch = await user.isValidPassword(password);

        if (isMatch) {
          return done(null, user);
        } else {
          return done(null, false, { message: "incorrect Password" });
        }
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.serializeUser(function (user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(async function (id, done) {
    try {
      const user = await User.findById(id).exec();
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
  