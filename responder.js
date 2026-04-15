import cron from 'node-cron';
import 'dotenv/config';
import { TwitterApi } from 'twitter-api-v2';
import { getAllData } from './data.js';
import { isTopicAllowed, generateReply } from './claude.js';
import { readState, writeState } from './state.js';
import { logger } from './logger.js';

const client = new TwitterApi({
  appKey: process.env.TWITTER_APP_KEY,
  appSecret: process.env.TWITTER_APP_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

const rwClient = client.readWrite;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runResponder() {
  logger.info('Polling for mentions...');

  try {
    const state = readState();
    const params = {
      max_results: 10,
      'tweet.fields': ['author_id', 'text', 'created_at'],
    };

    if (state.lastMentionId) {
      params.since_id = state.lastMentionId;
    }

    const timeline = await rwClient.v2.userMentionTimeline(
      process.env.BOT_USER_ID,
      params
    );

    const mentions = timeline.data?.data;

    if (!mentions || mentions.length === 0) {
      logger.info('No new mentions found');
      return;
    }

    logger.info(`Found ${mentions.length} new mention(s)`);

    const maxReplies = parseInt(process.env.MAX_REPLIES_PER_CYCLE) || 5;
    const replyDelay = parseInt(process.env.REPLY_DELAY_MS) || 10000;
    let repliesThisCycle = 0;
    let latestMentionId = state.lastMentionId;

    for (const mention of mentions) {
      if (repliesThisCycle >= maxReplies) {
        logger.skip(`Max replies per cycle (${maxReplies}) reached — stopping`);
        break;
      }

      latestMentionId = mention.id;
      const mentionText = mention.text;

      logger.info(`Checking mention ${mention.id}: "${mentionText.slice(0, 80)}..."`);

      const allowed = await isTopicAllowed(mentionText);

      if (!allowed) {
        logger.skip(`Off-topic mention ${mention.id} — skipping`);
        continue;
      }

      logger.reply(`On-topic mention ${mention.id} — generating reply`);

      const data = await getAllData();
      const replyText = await generateReply(mentionText, data);

      if (!replyText) {
        logger.error(`Reply generation failed for mention ${mention.id}`);
        continue;
      }

      await rwClient.v2.reply(replyText, mention.id);
      logger.reply(`Replied to ${mention.id}: "${replyText}"`);

      writeState({
        totalRepliesPublished: (state.totalRepliesPublished || 0) + 1,
      });

      repliesThisCycle++;

      if (repliesThisCycle < maxReplies) {
        logger.info(`Waiting ${replyDelay}ms before next reply...`);
        await sleep(replyDelay);
      }
    }

    if (latestMentionId !== state.lastMentionId) {
      writeState({ lastMentionId: latestMentionId });
      logger.info(`Updated lastMentionId to ${latestMentionId}`);
    }

  } catch (err) {
    logger.error('Responder cycle failed', { err: err.message, stack: err.stack });
  }
}

export function startResponder() {
  logger.boot('Responder started — polling every 3 minutes');
  cron.schedule('*/3 * * * *', runResponder);
}
