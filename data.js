import axios from 'axios';
import 'dotenv/config';
import { logger } from './logger.js';

const CG_BASE = 'https://api.coingecko.com/api/v3';
const CG_HEADERS = { 'x-cg-demo-api-key': process.env.COINGECKO_API_KEY };

export async function getMarketSnapshot() {
  try {
    const res = await axios.get(`${CG_BASE}/coins/markets`, {
      headers: CG_HEADERS,
      params: {
        vs_currency: 'usd',
        ids: 'bitcoin,ethereum,solana,binancecoin,ripple',
        order: 'market_cap_desc',
        sparkline: false,
        price_change_percentage: '24h,7d',
      },
    });

    const coins = {};
    for (const c of res.data) {
      coins[c.symbol.toUpperCase()] = {
        name: c.name,
        symbol: c.symbol.toUpperCase(),
        price: c.current_price,
        change24h: c.price_change_percentage_24h?.toFixed(2),
        change7d: c.price_change_percentage_7d_in_currency?.toFixed(2),
        marketCap: c.market_cap,
        volume24h: c.total_volume,
        circulatingSupply: c.circulating_supply,
      };
    }

    logger.data(`Market snapshot fetched for ${Object.keys(coins).join(', ')}`);
    return coins;
  } catch (err) {
    logger.error('getMarketSnapshot failed', { err: err.message });
    return null;
  }
}

export async function getTopMover() {
  try {
    const res = await axios.get(`${CG_BASE}/coins/markets`, {
      headers: CG_HEADERS,
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 250,
        page: 1,
        sparkline: false,
        price_change_percentage: '24h',
      },
    });

    const sorted = res.data
      .filter(c => c.price_change_percentage_24h != null)
      .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);

    const gainer = sorted[0];
    const loser = sorted[sorted.length - 1];

    logger.data(`Top mover: ${gainer.symbol.toUpperCase()} +${gainer.price_change_percentage_24h.toFixed(2)}% | Loser: ${loser.symbol.toUpperCase()} ${loser.price_change_percentage_24h.toFixed(2)}%`);

    return {
      gainer: {
        name: gainer.name,
        symbol: gainer.symbol.toUpperCase(),
        price: gainer.current_price,
        change24h: gainer.price_change_percentage_24h.toFixed(2),
      },
      loser: {
        name: loser.name,
        symbol: loser.symbol.toUpperCase(),
        price: loser.current_price,
        change24h: loser.price_change_percentage_24h.toFixed(2),
      },
    };
  } catch (err) {
    logger.error('getTopMover failed', { err: err.message });
    return null;
  }
}

export async function getFearGreed() {
  try {
    const res = await axios.get('https://api.alternative.me/fng/?limit=1');
    const d = res.data.data[0];
    logger.data(`Fear & Greed: ${d.value} (${d.value_classification})`);
    return {
      value: parseInt(d.value),
      label: d.value_classification,
    };
  } catch (err) {
    logger.error('getFearGreed failed', { err: err.message });
    return { value: 50, label: 'Neutral' };
  }
}

export async function getHeadlines() {
  // Try multiple cryptocurrency.cv endpoints in order
  const endpoints = [
    'https://cryptocurrency.cv/api/news/international',
    'https://cryptocurrency.cv/api/news',
    'https://cryptocurrency.cv/cache/latest.json',
  ];

  for (const url of endpoints) {
    try {
      const res = await axios.get(url, { timeout: 10000 });
      const raw = res.data;

      // Find the articles array in the response
      let articles = [];
      if (Array.isArray(raw)) {
        articles = raw;
      } else if (raw.articles && Array.isArray(raw.articles) && raw.articles.length > 0) {
        articles = raw.articles;
      } else if (raw.data && Array.isArray(raw.data) && raw.data.length > 0) {
        articles = raw.data;
      } else if (raw.results && Array.isArray(raw.results) && raw.results.length > 0) {
        articles = raw.results;
      }

      if (articles.length > 0) {
        const headlines = articles.slice(0, 10).map(a => ({
          title: a.title || a.headline || '',
          source: a.source || a.provider || 'Unknown',
          description: a.description || a.summary || '',
        }));
        logger.data(`cryptocurrency.cv: ${headlines.length} headlines fetched from ${url}`);
        return headlines;
      }
    } catch (err) {
      logger.error(`cryptocurrency.cv endpoint failed: ${url}`, { err: err.message });
    }
  }

  logger.data('cryptocurrency.cv: all endpoints returned 0 headlines');
  return [];
}

export async function getBenjaminCowenPosts(twitterClient) {
  try {
    const user = await twitterClient.v2.userByUsername('intothecryptoverse');
    const userId = user.data.id;
    const tweets = await twitterClient.v2.userTimeline(userId, {
      max_results: 5,
      'tweet.fields': ['text', 'created_at'],
      exclude: ['retweets', 'replies'],
    });
    const posts = tweets.data?.data?.map(t => t.text) || [];
    logger.data(`Benjamin Cowen: ${posts.length} posts fetched`);
    return posts;
  } catch (err) {
    logger.error('getBenjaminCowenPosts failed', { err: err.message });
    return [];
  }
}

export async function getAllData(twitterClient) {
  const [market, topMover, fearGreed, headlines,
         cowenPosts] = await Promise.all([
    getMarketSnapshot(),
    getTopMover(),
    getFearGreed(),
    getHeadlines(),
    twitterClient ? getBenjaminCowenPosts(twitterClient) : Promise.resolve([]),
  ]);

  return {
    market,
    topMover,
    fearGreed,
    headlines,
    cowenPosts,
  };
}
