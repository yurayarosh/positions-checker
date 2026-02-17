const express = require('express');
const { getList } = require('./getList');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());

const PORT = process.env.PORT || 5000;
let listDjinni = [];
let listDou = [];
const millisecondsInDay = 1000 * 60 * 60 * 24;
const millisecondsInMinute = 1000 * 60;

const sendNotification = async platform => {
  return await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT}/sendMessage`, {
    chat_id: process.env.TELEGRAM_CHAT_ID,
    text: `${platform} positions list updated`,
  });
};

const updateList = async platform => {
  let list = platform === 'dou' ? listDou : listDjinni;
  const prev = list.concat();
  if (platform === 'dou') listDou = await getList(platform);
  else listDjinni = await getList(platform);

  if (prev[0] && prev[0] !== list[0]) {
    try {
      await sendNotification(platform);
    } catch (error) {
      console.error(error);
    }
  }
};

(async () => {
  // await updateList('djinni');
  // await updateList('dou');
})();

setInterval(async () => {
  await updateList('djinni');
  await updateList('dou');
}, millisecondsInMinute);

app.get('/list-djinni', (req, res) => {
  listDjinni.length > 0
    ? res.status(200).json(listDjinni)
    : res.status(500).json("Couldn't get the list");
});
app.get('/list-dou', (req, res) => {
  listDou.length > 0
    ? res.status(200).json(listDou)
    : res.status(500).json("Couldn't get the list");
});

app.get('/', (req, res) => {
  res.send('Server is up and running!');
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
