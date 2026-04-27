type LogLevel = "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

const writeLog = (level: LogLevel, message: string, context: LogContext = {}) => {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  };

  const output = JSON.stringify(entry);

  if (level === "error") {
    console.error(output);
    return;
  }

  if (level === "warn") {
    console.warn(output);
    return;
  }

  console.log(output);
};

export const logInfo = (message: string, context?: LogContext) =>
  writeLog("info", message, context);

export const logWarn = (message: string, context?: LogContext) =>
  writeLog("warn", message, context);

export const logError = (message: string, context?: LogContext) =>
  writeLog("error", message, context);
