import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_PATH = path.join(__dirname, 'state.json');

const DEFAULT_STATE = {
  lastMentionId: null,
  postTypeIndex: 0,
  totalPostsPublished: 0,
  totalRepliesPublished: 0,
  lastBroadcastAt: null,
};

export function readState() {
  try {
    if (!fs.existsSync(STATE_PATH)) {
      fs.writeFileSync(STATE_PATH, JSON.stringify(DEFAULT_STATE, null, 2), 'utf8');
      return { ...DEFAULT_STATE };
    }
    const raw = fs.readFileSync(STATE_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    logger.error('Failed to read state.json, using defaults', { err: err.message });
    return { ...DEFAULT_STATE };
  }
}

export function writeState(patch) {
  try {
    let current = { ...DEFAULT_STATE };
    if (fs.existsSync(STATE_PATH)) {
      try {
        current = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
      } catch (_) { /* use defaults */ }
    }
    const updated = { ...current, ...patch };
    fs.writeFileSync(STATE_PATH, JSON.stringify(updated, null, 2), 'utf8');
    return updated;
  } catch (err) {
    logger.error('Failed to write state.json', { err: err.message });
  }
}
