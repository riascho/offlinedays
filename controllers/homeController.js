const { validationResult, matchedData } = require("express-validator");
const { sendSignupNotification, addContact } = require("../lib/mailer");
const { logInfo, logError } = require("../lib/logger");

// Default shown when we land on ?signup=error without a message (e.g. someone
// hits the URL directly). Never a blank error box.
const DEFAULT_ERROR_MESSAGE = "Please enter a valid email address.";

exports.index = (req, res) => {
  res.render("index", {
    title: "The Offline Days",
    signupSuccess: req.query.signup === "success",
    signupExists: req.query.signup === "exists",
    signupError: req.query.signup === "error",
    signupErrorMessage: req.query.msg || DEFAULT_ERROR_MESSAGE,
  });
};

exports.joinWaitlist = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Malformed input is the user's to fix — surface the specific message.
    const message = errors.array()[0].msg;
    return res.redirect("/?signup=error&msg=" + encodeURIComponent(message));
  }

  const { email } = matchedData(req);

  try {
    const { alreadyExists } = await addContact(email);
    if (alreadyExists) {
      return res.redirect("/?signup=exists");
    }
    logInfo("waitlist", "New waitlist signup stored.", { email });
    sendSignupNotification(email);
    res.redirect("/?signup=success");
  } catch (err) {
    // Anything caused by our app or an external API/network call must never
    // reach the user. Log it (with the email so we can follow up later) and
    // still tell them the submission worked.
    logError("waitlist", "Signup failed but reported as success to the user.", {
      email,
      err: err.message,
      stack: err.stack,
    });
    res.redirect("/?signup=success");
  }
};
