import { beforeAll, afterAll, describe, expect, test } from '@jest/globals';
import puppeteer, { Browser, Page } from 'puppeteer';
import cheerio from 'cheerio';

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

  // test('Get App Name', async () => {
  //   const appUrl = `https://apps.apple.com/jp/app/id284882215`;
  //   const page = await browser.newPage();
  //   await page.goto(appUrl);//, { waitUntil: 'networkidle0' });
  //   // const name = await page.$eval('.product-header__title', (el: Element) => el.textContent?.trim());

  //   const xpath = '//h1[contains(@class, "product-header__title")]/text()';
  //   const elems = await page.$x(xpath);
  //   const jsHandle = await elems[1].getProperty('textContent');
  //   const name = await jsHandle.jsonValue();

  //   if (typeof name === 'string') {
  //     console.log(name);
  //     expect(name).toBe('Facebook');
  //   }
  // });
});

describe('Ios test', () => {
  test('analyzeReviewData', async () => {
    const testData = `
<updated>2020-09-17T19:07:21-07:00</updated>
<id>6440274534</id>
<title>アバターが作れない。</title>
<content type="text">世間ではFacebookアバター祭ですが、どこを探しても作成できるところに辿り着けません。 色々調べてはみました。 avatarタブが無い。 友達のアバターを見ても何も無い。 よくある質問から訊ねると「お住まいの地域ではご利用いただけません」と出る…まさかの地域限定？ それとも、iOS14にアップデートしたのがいけなかったのでしょうか？</content>
<im:contentType term="Application" label="アプリケーション"/>
<im:voteSum>0</im:voteSum>
<im:voteCount>0</im:voteCount>
<im:rating>1</im:rating>
<im:version>288.0</im:version>
<author>
  <name>yrmna</name>
  <uri>https://itunes.apple.com/jp/reviews/id1060694637</uri>
</author>
<link rel="related" href="https://itunes.apple.com/jp/review?id=284882215&type=Purple%20Software"/>
<content type="html"><table border="0" width="100%"> <tr> <td> <table border="0" width="100%" cellspacing="0" cellpadding="0"> <tr valign="top" align="left"> <td width="100%"> <b><a href="https://apps.apple.com/jp/app/facebook/id284882215?uo=2">アバターが作れない。</a></b><br/> <font size="2" face="Helvetica,Arial,Geneva,Swiss,SunSans-Regular"> </font> </td> </tr> </table> </td> </tr> <tr> <td> <font size="2" face="Helvetica,Arial,Geneva,Swiss,SunSans-Regular"><br/>世間ではFacebookアバター祭ですが、どこを探しても作成できるところに辿り着けません。<br/>色々調べてはみました。<br/>avatarタブが無い。<br/>友達のアバターを見ても何も無い。<br/>よくある質問から訊ねると「お住まいの地域ではご利用いただけません」と出る…まさかの地域限定？<br/>それとも、iOS14にアップデートしたのがいけなかったのでしょうか？</font><br/> </td> </tr> </table> </content>
`;
    // const ios = new Ios(true);
    // const review = ios.analyzeReviewData($);

    const $ = cheerio.load(testData, {
      normalizeWhitespace: true,
      xmlMode: true
    });

    const reviewId = $('id').text();
    const title = $('title').text();
    const message = $('content[type="text"]').text();
    const rating = $('im\\:rating').text();
    const version = $('im\\:version').text();
    const postedAtStr = $('updated').text();

    expect(reviewId).toBe('6440274534');
    expect(title).toBe('アバターが作れない。');
    expect(message).toBe('世間ではFacebookアバター祭ですが、どこを探しても作成できるところに辿り着けません。 色々調べてはみました。 avatarタブが無い。 友達のアバターを見ても何も無い。 よくある質問から訊ねると「お住まいの地域ではご利用いただけません」と出る…まさかの地域限定？ それとも、iOS14にアップデートしたのがいけなかったのでしょうか？');
    expect(rating).toBe('1');
    expect(version).toBe('288.0');
    expect(postedAtStr).toBe('2020-09-17T19:07:21-07:00');
  });
});

afterAll(async () => {
  await browser.close();
});