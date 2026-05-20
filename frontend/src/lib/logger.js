import log from 'loglevel';

log.setLevel(import.meta.env.DEV ? 'debug' : 'warn');

const levelColors = {
  TRACE: 'color: #9ca3af; font-weight: bold;',
  DEBUG: 'color: #3b82f6; font-weight: bold;',
  INFO:  'color: #10b981; font-weight: bold;',
  WARN:  'color: #f59e0b; font-weight: bold;',
  ERROR: 'color: #ef4444; font-weight: bold;'
};

const formatMessage = (level, ...args) => {
  const now = new Date();
  const time = `${now.toLocaleTimeString('id-ID', { hour12: false })}.${String(now.getMilliseconds()).padStart(3, '0')}`;
  const upperLevel = level.toUpperCase();
  const paddedLevel = upperLevel.padEnd(5, ' ');

  return [
    `%c[${time}] [${paddedLevel}]`, 
    levelColors[upperLevel], 
    ...args
  ];
};

export const logger = {
  trace: (...args) => log.trace(...formatMessage('trace', ...args)),
  debug: (...args) => log.debug(...formatMessage('debug', ...args)),
  info:  (...args) => log.info(...formatMessage('info', ...args)),
  warn:  (...args) => log.warn(...formatMessage('warn', ...args)),
  error: (...args) => log.error(...formatMessage('error', ...args)),
};