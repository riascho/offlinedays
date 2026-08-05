// Tiny logging helper so every part of the app logs the same way: an ISO
// timestamp, a level, a bracketed context tag, the message, and optional
// structured metadata (e.g. the signup email) we can grep for when debugging.

function write(stream, level, context, message, meta) {
  const line = `[${new Date().toISOString()}] [${level}] [${context}] ${message}`;
  if (meta && Object.keys(meta).length > 0) {
    stream(line, meta);
  } else {
    stream(line);
  }
}

function logInfo(context, message, meta) {
  write(console.log, "INFO", context, message, meta);
}

function logWarn(context, message, meta) {
  write(console.warn, "WARN", context, message, meta);
}

function logError(context, message, meta) {
  write(console.error, "ERROR", context, message, meta);
}

module.exports = { logInfo, logWarn, logError };
