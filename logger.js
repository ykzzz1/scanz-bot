const TAGS = {
  BROADCAST: '\x1b[36m[BROADCAST]\x1b[0m',
  REPLY:     '\x1b[32m[REPLY]\x1b[0m',
  SKIP:      '\x1b[33m[SKIP]\x1b[0m',
  ERROR:     '\x1b[31m[ERROR]\x1b[0m',
  DATA:      '\x1b[35m[DATA]\x1b[0m',
  BOOT:      '\x1b[34m[BOOT]\x1b[0m',
  INFO:      '\x1b[37m[INFO]\x1b[0m',
};

function timestamp() {
  return new Date().toISOString();
}

function log(tag, message, extra = null) {
  const prefix = TAGS[tag] || `[${tag}]`;
  const line = `${timestamp()} ${prefix} ${message}`;
  console.log(line);
  if (extra) console.log(JSON.stringify(extra, null, 2));
}

export const logger = {
  broadcast: (msg, extra) => log('BROADCAST', msg, extra),
  reply:     (msg, extra) => log('REPLY', msg, extra),
  skip:      (msg, extra) => log('SKIP', msg, extra),
  error:     (msg, extra) => log('ERROR', msg, extra),
  data:      (msg, extra) => log('DATA', msg, extra),
  boot:      (msg, extra) => log('BOOT', msg, extra),
  info:      (msg, extra) => log('INFO', msg, extra),
};
