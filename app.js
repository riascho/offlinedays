require("dotenv").config();
const express = require("express");
const path = require("path");
const helmet = require("helmet");
const compression = require("compression");
const expressLayouts = require("express-ejs-layouts");
const indexRouter = require("./routes/index");
const { logInfo, logError } = require("./lib/logger");

const app = express();
const PORT = process.env.PORT || 3000;

// We run behind a reverse proxy / PaaS. Trust the first proxy hop so the real client IP (from X-Forwarded-For) is used for rate limiting and req.protocol reflects the original https request.
app.set("trust proxy", 1);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Views render into views/layout.ejs, which holds the full document shell.
app.use(expressLayouts);

// Security headers. CSP is tuned for this page: styles + fonts come from Google
// Fonts, and the paper-grain background is an inline data: URL in the CSS.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:"],
        scriptSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
  }),
);

// gzip responses (HTML/CSS/JS).
app.use(compression());

// Middleware. Small body limits — the only input is a single email field.
app.use(express.urlencoded({ extended: false, limit: "10kb" }));
app.use(express.json({ limit: "10kb" }));

// Static assets with caching. style.css / main.js are unhashed, so keep a moderate max-age (7d); etag lets clients revalidate cheaply.
app.use(
  express.static(path.join(__dirname, "public"), { maxAge: "7d", etag: true }),
);

app.use("/", indexRouter);

app.use((req, res) => {
  res
    .status(404)
    .render("error", {
      title: "Page Not Found",
      message: "Sorry, this page is offline. ✌️",
    });
});

// Error handler — catches async controller failures. We log the real error server-side, but only expose its message to the client outside production so internals aren't leaked to visitors.
app.use((err, req, res, next) => {
  logError("app", "Unhandled error reached the global handler.", {
    path: req.originalUrl,
    err: err.message,
    stack: err.stack,
  });
  const status = err.status || 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "Sorry, something broke on my end. Please try again in a moment. ✌️"
      : err.message;
  res.status(status).render("error", { title: "Error", message });
});

app.listen(PORT, () => {
  logInfo("app", `Server running at http://localhost:${PORT}`);
});
