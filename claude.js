import Anthropic from '@anthropic-ai/sdk';
import 'dotenv/config';
import { SYSTEM_PROMPT, POST_TYPE_INSTRUCTIONS } from './prompt.js';
import { logger } from './logger.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-sonnet-4-20250514';

function buildMarketContext(data) {
  const { market, topMover, fearGreed, headlines } = data;

  let ctx = '=== LIVE MARKET DATA ===\n';

  if (market) {
    for (const [symbol, c] of Object.entries(market)) {
      ctx += `${symbol}: $${c.price.toLocaleString()} | 24h: ${c.change24h}% | 7d: ${c.change7d}% | Vol: $${(c.volume24h / 1e9).toFixed(2)}B\n`;
    }
  }

  if (fearGreed) {
    ctx += `\nFear & Greed Index: ${fearGreed.value}/100 — ${fearGreed.label}\n`;
  }

  if (topMover) {
    ctx += `\nTop 24h Gainer: ${topMover.gainer.name} (${topMover.gainer.symbol}) +${topMover.gainer.change24h}% @ $${topMover.gainer.price}\n`;
    ctx += `Top 24h Loser: ${topMover.loser.name} (${topMover.loser.symbol}) ${topMover.loser.change24h}% @ $${topMover.loser.price}\n`;
  }

  if (headlines && headlines.length > 0) {
    ctx += `\nLatest Headlines:\n`;
    headlines.forEach((h, i) => { ctx += `${i + 1}. ${h}\n`; });
  }

  return ctx;
}

export async function generateBroadcastTweet(data, postType) {
  try {
    const context = buildMarketContext(data);
    const instruction = POST_TYPE_INSTRUCTIONS[postType] || POST_TYPE_INSTRUCTIONS['market_summary'];

    const userMessage = `${context}\n\n=== YOUR TASK ===\n${instruction}`;

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const tweet = response.content[0].text.trim();
    logger.info(`Generated ${postType} tweet (${tweet.length} chars)`);
    return tweet;
  } catch (err) {
    logger.error('generateBroadcastTweet failed', { err: err.message });
    return null;
  }
}

export async function isTopicAllowed(mentionText) {
  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 5,
      system: 'You are a topic classifier for a crypto Twitter bot. Your only job is to decide if a message is related to: cryptocurrency, Bitcoin, Ethereum, blockchain, DeFi, NFTs, tokens, altcoins, crypto trading, or financial markets. Reply with only the single word "yes" or "no". Nothing else.',
      messages: [{ role: 'user', content: `Is this message on-topic?\n\n"${mentionText.slice(0, 500)}"` }],
    });

    const answer = response.content[0].text.trim().toLowerCase();
    return answer === 'yes';
  } catch (err) {
    logger.error('isTopicAllowed failed', { err: err.message });
    return false;
  }
}

export async function generateReply(mentionText, data) {
  try {
    const context = buildMarketContext(data);

    const userMessage = `${context}\n\n=== INCOMING MENTION ===\n"${mentionText}"\n\n=== YOUR TASK ===\nReply directly to this mention. Answer the question or engage with the comment using the live market data above where relevant. Be sharp and specific. Under 220 characters. End with NFA if giving any market commentary.`;

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const reply = response.content[0].text.trim();
    logger.info(`Generated reply (${reply.length} chars)`);
    return reply;
  } catch (err) {
    logger.error('generateReply failed', { err: err.message });
    return null;
  }
}
