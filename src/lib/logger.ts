type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

const LEVELS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 100,
};

function getEnvLevel(): LogLevel {
  try {
    // Prefer explicit env var, fallback to development
    const env = process?.env?.LOG_LEVEL || process?.env?.NODE_ENV;
    if (!env) return 'info';
    const lower = String(env).toLowerCase();
    if (lower === 'development') return 'debug';
    if ((['debug','info','warn','error','silent'] as string[]).includes(lower)) return lower as LogLevel;
    return 'info';
  } catch (e) {
    return 'info';
  }
}

const CURRENT_LEVEL = getEnvLevel();

function shouldLog(level: LogLevel) {
  return LEVELS[level] >= LEVELS[CURRENT_LEVEL];
}

function formatMessage(level: LogLevel, msg: any[]) {
  const now = new Date().toISOString();
  return [`[ai-planet:${level}] ${now}`, ...msg];
}

const logger = {
  debug: (...msg: any[]) => {
    if (shouldLog('debug')) (console as any).debug(...formatMessage('debug', msg));
  },
  info: (...msg: any[]) => {
    if (shouldLog('info')) (console as any).info(...formatMessage('info', msg));
  },
  warn: (...msg: any[]) => {
    if (shouldLog('warn')) (console as any).warn(...formatMessage('warn', msg));
  },
  error: (...msg: any[]) => {
    if (shouldLog('error')) (console as any).error(...formatMessage('error', msg));
  },
};

export default logger;
