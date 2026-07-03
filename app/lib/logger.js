const __DEV__ = global.__DEV__ || false;

const logLevels = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLevel = __DEV__ ? logLevels.debug : logLevels.error;

const logger = {
  debug: (...args) => {
    if (currentLevel <= logLevels.debug) console.log("[DEBUG]", ...args);
  },
  info: (...args) => {
    if (currentLevel <= logLevels.info) console.log("[INFO]", ...args);
  },
  warn: (...args) => {
    if (currentLevel <= logLevels.warn) console.warn("[WARN]", ...args);
  },
  error: (...args) => {
    if (currentLevel <= logLevels.error) console.error("[ERROR]", ...args);
  },
};

export default logger;
