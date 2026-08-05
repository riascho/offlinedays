const { Resend } = require("resend");
const { logInfo, logWarn, logError } = require("./logger");

const apiKey = process.env.RESEND_API_KEY;
const notifyTo = process.env.NOTIFY_EMAIL;
const notifyFrom =
  process.env.NOTIFY_FROM || "The Offline Days <waitlist@resend.dev>";

const resend = apiKey ? new Resend(apiKey) : null;

async function addContact(email) {
  if (!resend) {
    throw new Error(
      "[audience] Resend is not configured — check RESEND_API_KEY.",
    );
  }
  const existing = await resend.contacts.get({ email }).catch((err) => {
    // A read failure shouldn't be silent — log it, then fall through to a
    // create attempt (the controller treats any remaining failure as success).
    logError("audience", "Failed to look up contact in Resend.", {
      email,
      err: err.message,
    });
    return null;
  });
  if (existing && existing.data && existing.data.id) {
    return { alreadyExists: true };
  }

  const { error } = await resend.contacts.create({
    email,
    unsubscribed: false,
  });

  if (error) {
    const err = new Error(
      error.message || "[audience] Failed to store contact in Resend.",
    );
    err.name = error.name || "ResendError";
    throw err;
  }

  return { alreadyExists: false };
}

async function sendSignupNotification(email) {
  if (!resend || !notifyTo) {
    logWarn("mailer", "Resend is not configured — check RESEND_API_KEY.", {
      email,
    });
    return;
  }

  try {
    const { error } = await resend.emails.send({
      from: notifyFrom,
      to: notifyTo,
      subject: "New waitlist signup — The Offline Days",
      text: `Someone just joined the waitlist:\n\n${email}`,
      replyTo: email,
    });

    if (error) {
      logError("mailer", "Resend returned an error sending notification.", {
        email,
        err: error.message || error,
      });
    } else {
      logInfo("mailer", "Notification sent.", { email });
    }
  } catch (err) {
    logError("mailer", "Failed to send notification.", {
      email,
      err: err.message,
    });
  }
}

module.exports = { sendSignupNotification, addContact };
