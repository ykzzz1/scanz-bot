import 'dotenv/config';
import { startBroadcaster } from './broadcaster.js';
import { startResponder } from './responder.js';
import { readState } from './state.js';
import { logger } from './logger.js';

function validateEnv() {
  const required = [
    'TWITTER_APP_KEY',
    'TWITTER_APP_SECRET',
    'TWITTER_ACCESS_TOKEN',
    'TWITTER_ACCESS_SECRET',
    'ANTHROPIC_API_KEY',
    'COINGECKO_API_KEY',
    'BOT_USER_ID',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    logger.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
}

function printBanner() {
  console.log(`
  ███████╗ ██████╗ █████╗ ███╗   ██╗███████╗
  ██╔════╝██╔════╝██╔══██╗████╗  ██║╚══███╔╝
  ███████╗██║     ███████║██╔██╗ ██║  ███╔╝
  ╚════██║██║     ██╔══██║██║╚██╗██║ ███╔╝
  ███████║╚██████╗██║  ██║██║ ╚████║███████╗
  ╚══════╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝
  Autonomous Crypto Signal Bot — by TraderYKZ
  `);
}

async function main() {
  printBanner();
  validateEnv();

  const state = readState();
  logger.boot('ScanZ booting up...');
  logger.boot(`State: posts=${state.totalPostsPublished} | replies=${state.totalRepliesPublished} | postTypeIndex=${state.postTypeIndex}`);
  logger.boot(`Last broadcast: ${state.lastBroadcastAt || 'never'}`);
  logger.boot(`Last mention ID: ${state.lastMentionId || 'none'}`);

  startBroadcaster();
  startResponder();

  logger.boot('All systems running. ScanZ is live.');

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', { err: err.message, stack: err.stack });
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', { reason: String(reason) });
  });
}

main();
