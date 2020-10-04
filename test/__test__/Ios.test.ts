import { beforeAll, afterAll, describe, expect, test } from '@jest/globals';
import puppeteer, { Browser, Page } from 'puppeteer';

let browser: Browser;
let page: Page;

beforeAll(async () => {
  browser = await puppeteer.launch({
    args: ['--no-sandbox']
  });
  page = await browser.newPage();
})

describe('Puppeteer test', () => {
  // test('has title "Google"', async () => {
  //   await page.goto('https://google.com', { waitUntil: 'networkidle0' });
  //   const title = await page.title();
  //   expect(title).toBe('Google');
  // });

  // test('Hacker News', async () => {
  //   const page = await browser.newPage();
  //   await page.goto('https://news.ycombinator.com/news');
  //   const name = await page.$eval('.hnname > a', (el: Element) => el.innerHTML);
  //   expect(name).toBe('Hacker News');
  // });

  test('Get App Name', async () => {
    const appUrl = `https://apps.apple.com/jp/app/id284882215`;
    const page = await browser.newPage();
    await page.goto(appUrl);//, { waitUntil: 'networkidle0' });
    // const name = await page.$eval('.product-header__title', (el: Element) => el.textContent?.trim());

    const xpath = '//h1[contains(@class, "product-header__title")]/text()';
    const elems = await page.$x(xpath);
    const jsHandle = await elems[1].getProperty('textContent');
    const name = await jsHandle.jsonValue();

    if (typeof name === 'string') {
      console.log(name);
      expect(name).toBe('Facebook');
    }
  });

  afterAll(async () => {
    await browser.close();
  });
});
