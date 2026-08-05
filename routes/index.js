const express = require("express");
const { body } = require("express-validator");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const { index, joinWaitlist } = require("../controllers/homeController");

// Throttle signups per IP to stop inbox/quota spam. On limit, redirect back to
// the homepage signup area with the message inline — same uniform path as a
// validation error, rather than a full-page render at /waitlist.
const RATE_LIMIT_MESSAGE =
  "You've tried that a few too many times. Please wait a bit before you submit your email again.";
const signupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) =>
    res.redirect("/?signup=error&msg=" + encodeURIComponent(RATE_LIMIT_MESSAGE)),
});

const validatedEmail = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please enter a valid email address.")
    .bail()
    .normalizeEmail()
    .isLength({ max: 254 })
    .withMessage("That email address is too long."),
];

router.get("/", index);
router.post("/waitlist", signupLimiter, validatedEmail, joinWaitlist);

module.exports = router;
