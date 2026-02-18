const express = require('express');
const { getList } = require('./getList');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();
const { writeFileSync, existsSync, readFileSync } = require('fs');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 5000;
const millisecondsInDay = 1000 * 60 * 60 * 24;
const millisecondsInMinute = 1000 * 60;

function saveLastId(fileName = '', id) {
  writeFileSync(fileName, id);
}

function loadLastId(fileName = '') {
  if (!existsSync(fileName)) return null;
  return readFileSync(fileName, 'utf-8');
}

const sendNotification = async platform => {
  return await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT}/sendMessage`, {
    chat_id: process.env.TELEGRAM_CHAT_ID,
    text: `${platform} positions list updated`,
  });
};

const updateList = async platform => {
  const fileName = platform === 'dou' ? 'lastDouId.txt' : 'lastDjinniId.txt';
  const prevId = loadLastId(fileName);
  const list = await getList(platform);
  const [currId] = list;
  saveLastId(fileName, currId);

  if (prevId && currId && prevId !== currId) {
    try {
      await sendNotification(platform);
    } catch (error) {
      console.error(error);
    }
  }
};

setInterval(async () => {
  await updateList('djinni');
  await updateList('dou');
}, millisecondsInMinute);

app.get('/', (req, res) => {
  res.send('Server is up and running!');
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
