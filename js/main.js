// n8n redirects back here with ?signup=success|exists|error (plus &reason=...
// for errors). Show the matching message, then tidy the URL.

// Error text is looked up from a fixed list, never read from the URL, so a
// crafted link can't put its own words on the page. A Map (not a plain object)
// so reasons like "toString" don't match inherited properties.
const ERROR_MESSAGES = new Map([
  ["invalid", "Please enter a valid email address."],
  ["too_long", "That email address is too long."],
  [
    "rate_limited",
    "You've tried that a few too many times. Please wait a bit before you submit your email again.",
  ],
]);
const DEFAULT_ERROR_MESSAGE = ERROR_MESSAGES.get("invalid");

document.getElementById("year").textContent = new Date().getFullYear();

// Only index.html has the signup card; 404.html loads this file for the year.
const signupForm = document.getElementById("signup-form");
const params = new URLSearchParams(window.location.search);
const signup = params.get("signup");

if (signupForm && signup) {
  if (signup === "success" || signup === "exists") {
    signupForm.hidden = true;
    document.getElementById("signup-" + signup).hidden = false;
  } else if (signup === "error") {
    const error = document.getElementById("signup-error");
    error.textContent =
      ERROR_MESSAGES.get(params.get("reason")) || DEFAULT_ERROR_MESSAGE;
    error.hidden = false;
  }

  // Drop the query so a refresh doesn't replay the message.
  window.history.replaceState(null, "", window.location.pathname);
}
