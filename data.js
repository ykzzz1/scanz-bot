import axios from 'axios';
import 'dotenv/config';
import { parseStringPromise } from 'xml2js';
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
  try {
    const res = await axios.get('https://cryptopanic.com/api/v1/posts/', {
      params: {
        auth_token: process.env.CRYPTOPANIC_API_KEY,
        kind: 'news',
        public: true,
      },
    });

    const headlines = res.data.results
      .slice(0, 5)
      .map(item => item.title);

    logger.data(`Fetched ${headlines.length} headlines`);
    return headlines;
  } catch (err) {
    logger.error('getHeadlines failed', { err: err.message });
    return [];
  }
}


export async function getGlassnodeRSS() {
  try {
    const res = await axios.get('https://insights.glassnode.com/rss', {
      headers: { 'User-Agent': 'ScanZBot/1.0' },
      timeout: 8000,
    });
    const parsed = await parseStringPromise(res.data);
    const items = parsed.rss.channel[0].item.slice(0, 3);
    const headlines = items.map(item => ({
      title: item.title[0],
      summary: item.description[0].replace(/<[^>]*>/g, '').slice(0, 200),
    }));
    logger.data(`Glassnode RSS: ${headlines.length} items fetched`);
    return headlines;
  } catch (err) {
    logger.error('getGlassnodeRSS failed', { err: err.message });
    return [];
  }
}

export async function getCoinDeskRSS() {
  try {
    const res = await axios.get(
      'https://www.coindesk.com/arc/outboundfeeds/rss/',
      { headers: { 'User-Agent': 'ScanZBot/1.0' }, timeout: 8000 }
    );
    const parsed = await parseStringPromise(res.data);
    const items = parsed.rss.channel[0].item.slice(0, 4);
    const headlines = items.map(item => item.title[0]);
    logger.data(`CoinDesk RSS: ${headlines.length} headlines fetched`);
    return headlines;
  } catch (err) {
    logger.error('getCoinDeskRSS failed', { err: err.message });
    return [];
  }
}

export async function getDefiantRSS() {
  try {
    const res = await axios.get('https://thedefiant.io/api/feed', {
      headers: { 'User-Agent': 'ScanZBot/1.0' },
      timeout: 8000,
    });
    const parsed = await parseStringPromise(res.data);
    const items = parsed.rss.channel[0].item.slice(0, 3);
    const headlines = items.map(item => item.title[0]);
    logger.data(`The Defiant RSS: ${headlines.length} headlines fetched`);
    return headlines;
  } catch (err) {
    logger.error('getDefiantRSS failed', { err: err.message });
    return [];
  }
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
         glassnodeRSS, coindeskHeadlines, defiantHeadlines,
         cowenPosts] = await Promise.all([
    getMarketSnapshot(),
    getTopMover(),
    getFearGreed(),
    getHeadlines(),
    getGlassnodeRSS(),
    getCoinDeskRSS(),
    getDefiantRSS(),
    twitterClient ? getBenjaminCowenPosts(twitterClient) : Promise.resolve([]),
  ]);

  return {
    market,
    topMover,
    fearGreed,
    headlines,
    glassnodeRSS,
    coindeskHeadlines,
    defiantHeadlines,
    cowenPosts,
  };
}