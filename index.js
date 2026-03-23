const express = require('express');
const { getList } = require('./getList');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();
const { Redis } = require('@upstash/redis');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 5000;
const millisecondsInMinute = 1000 * 60;

/**
 * -----------------------
 * Upstash Redis setup
 * -----------------------
 */

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

/**
 * -----------------------
 * Redis helpers
 * -----------------------
 */

async function saveLastId(platform, id) {
  await redis.set(`lastId:${platform}`, id);
}

async function loadLastId(platform) {
  return await redis.get(`lastId:${platform}`);
}

/**
 * -----------------------
 * Telegram notification
 * -----------------------
 */

const sendNotification = async (platform, item) => {
  return await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT}/sendMessage`, {
    chat_id: process.env.TELEGRAM_CHAT_ID,
    text: `🆕 ${platform}\n${item.title}`,
  });
};

/**
 * -----------------------
 * Main update logic
 * -----------------------
 */

const updateList = async platform => {
  try {
    const prevIdRaw = await loadLastId(platform);
    const prevId = prevIdRaw ? prevIdRaw.toString() : null;

    const list = await getList(platform);
    if (!list || !list.length) return;

    const currId = list[0].id.toString();

    if (!prevId) {
      await saveLastId(platform, currId);
      return;
    }

    let newItems = [];

    for (const item of list) {
      if (item.id.toString() === prevId) break;
      newItems.push(item);
    }

    if (newItems.length > 0) {
      for (const item of newItems.reverse()) {
        await sendNotification(platform, item);
      }

      await saveLastId(platform, currId);
    }
  } catch (error) {
    console.error(`Error updating ${platform}:`, error);
  }
};

/**
 * -----------------------
 * Start polling
 * -----------------------
 */

setInterval(async () => {
  await updateList('djinni');
  await updateList('dou');
}, millisecondsInMinute);

/**
 * -----------------------
 * Express server
 * -----------------------
 */

app.get('/', (req, res) => {
  res.send('Server is up and running!');
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
