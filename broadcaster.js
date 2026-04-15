import cron from 'node-cron';
import 'dotenv/config';
import { TwitterApi } from 'twitter-api-v2';
import { getAllData } from './data.js';
import { generateBroadcastTweet } from './claude.js';
import { readState, writeState } from './state.js';
import { POST_TYPES } from './prompt.js';
import { logger } from './logger.js';

const client = new TwitterApi({
  appKey: process.env.TWITTER_APP_KEY,
  appSecret: process.env.TWITTER_APP_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

const rwClient = client.readWrite;

async function runBroadcast() {
  logger.broadcast('Starting broadcast cycle...');

  try {
    const data = await getAllData();

    if (!data.market) {
      logger.error('Market data unavailable — skipping broadcast cycle');
      return;
    }

    const state = readState();
    const postType = POST_TYPES[state.postTypeIndex % POST_TYPES.length];
    logger.broadcast(`Post type: ${postType}`);

    const tweet = await generateBroadcastTweet(data, postType);

    if (!tweet) {
      logger.error('Tweet generation returned null — skipping');
      return;
    }

    if (tweet.length > 280) {
      logger.error(`Tweet too long (${tweet.length} chars) — skipping`, { tweet });
      return;
    }

    const posted = await rwClient.v2.tweet(tweet);
    logger.broadcast(`Posted tweet ID ${posted.data.id}: "${tweet}"`);

    writeState({
      postTypeIndex: (state.postTypeIndex + 1) % POST_TYPES.length,
      totalPostsPublished: (state.totalPostsPublished || 0) + 1,
      lastBroadcastAt: new Date().toISOString(),
    });

  } catch (err) {
    logger.error('Broadcast cycle failed', { err: err.message, stack: err.stack });
  }
}

export function startBroadcaster() {
  const intervalHours = parseInt(process.env.POST_INTERVAL_HOURS) || 2;
  const cronExpression = `0 */${intervalHours} * * *`;

  logger.boot(`Broadcaster started — posting every ${intervalHours} hour(s) [${cronExpression}]`);

  runBroadcast();

  cron.schedule(cronExpression, runBroadcast);
}
