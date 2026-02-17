const puppeteer = require('puppeteer');
require('dotenv').config();

const getList = async platform => {
  const url =
    platform === 'dou'
      ? 'https://jobs.dou.ua/vacancies/?category=Front%20End'
      : 'https://djinni.co/jobs/?primary_keyword=Svelte&primary_keyword=Markup&primary_keyword=Angular&primary_keyword=JavaScript&primary_keyword=Vue.js&primary_keyword=React.js&page=1';

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--disable-setuid-sandbox', '--no-sandbox', '--no-zygote'],
    executablePath:
      process.env.NODE_ENV === 'production'
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
  });
  let list = [];
  try {
    const page = await browser.newPage();

    await page.goto(url);

    // Set screen size
    await page.setViewport({ width: 1080, height: 1024 });

    list = platform === 'dou'
      ? await page.$$eval('#vacancyListId > ul > li a.vt', links => links.map(link => {
        const href = link.href
        const match = href.match(/vacancies\/(\d+)/);
        return match[1];
      }))
     : await page.$$eval('.list-jobs > li', items => items.map(item => item.id));
  } catch (e) {
    console.log(e);
    res.status(500).json(`Something went wrong while running Puppeteer: ${e}`);
  } finally {
    await browser.close();
    return list;
  }
};

module.exports = { getList };
