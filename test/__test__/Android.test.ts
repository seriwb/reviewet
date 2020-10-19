import { beforeAll, afterAll, describe, expect, test } from '@jest/globals';
import puppeteer, { Browser, Page } from 'puppeteer';
import cheerio from 'cheerio';
import { testMatch } from '../../jest.config';

let browser: Browser;
let page: Page;

beforeAll(async () => {
  browser = await puppeteer.launch({
    args: ['--no-sandbox'],
  });
  page = await browser.newPage();
})

describe('Puppeteer test', () => {
// /*
  // JSON取得のテスト
  test('Get Google App Name', async () => {
    const appUrl = `https://play.google.com/store/apps/details?id=com.google.android.googlequicksearchbox&hl=ja`;
    const page = await browser.newPage();
    await page.goto(appUrl, { waitUntil: 'networkidle0' });
    const jsonValue = await page.$eval('script[type="application/ld+json"]', (el: Element) => el.textContent);

    if (typeof jsonValue === 'string') {
      const applicationJson = JSON.parse(jsonValue);
      // console.log(applicationJson);
      expect(applicationJson['name']).toBe('Google');
    }
  });

/*
  test('Get Google Review Data', async () => {
    const appUrl = `https://play.google.com/store/apps/details?id=com.google.android.googlequicksearchbox&hl=ja&showAllReviews=true`;
    const page = await browser.newPage();
    await page.goto(appUrl, { waitUntil: 'networkidle0', });

    // const xpath = `//h3/following-sibling::div/div/@jsdata`;
    // // await page.waitForXPath(xpath);
    // const elementHandles = await page.$x(xpath);

    // const jsHandle = await elementHandles[0].getProperty('textContent');  //yf3HXc;gp:AOqpTOGzn7x-k8RZHNdonX6O9v0oiMbun-hgZhSyN44JqtW6iSYtg5gZ_Yz-A7pfq7nt6A7YYNAfJQ4i_2adYg;$3 YjFXEf;_;$2
    // const jsonValue = await jsHandle.jsonValue();


    // if (typeof jsonValue === 'string') {
    //   const reviewId = jsonValue.match(/(gp:.*?);/); // 最短一致
    //   if (reviewId) {
    //     expect(reviewId[1]).toBe('gp:AOqpTOGzn7x-k8RZHNdonX6O9v0oiMbun-hgZhSyN44JqtW6iSYtg5gZ_Yz-A7pfq7nt6A7YYNAfJQ4i_2adYg');   // review id
    //   }
    // }

    const divHandles = await page.$$('main h3+div > div');
    const div = await page.evaluate((el: Element) => el.outerHTML, divHandles[0]);
    const $ = cheerio.load(div);
    const reviewId2 = $('div').attr('jsdata')?.match(/(gp:.*?);/);
    console.log(divHandles.length);
    if (reviewId2) {
      console.log(reviewId2[1]);
      expect(reviewId2[1]).toBe('gp:AOqpTOGzn7x-k8RZHNdonX6O9v0oiMbun-hgZhSyN44JqtW6iSYtg5gZ_Yz-A7pfq7nt6A7YYNAfJQ4i_2adYg');
    } else {
      console.log(reviewId2);
    }

    // elementHandles.map(async (elementHandle) => {
    // const aaaa = await elementHandles[0].$x('/div/@jsdata');
    // console.log(aaaa.length);
      // const jsHandle = await aaaa[0].getProperty('value');
      // const jsonValue = await jsHandle.jsonValue();

      // if (typeof jsonValue === 'string') {
      //   console.log(jsonValue);
      // }
    // });
  });
// */

  // TODO: ds:25のデータが取れないので諦めた
/*
  test('Get Google Review Data', async () => {
    const appUrl = `https://play.google.com/store/apps/details?id=com.google.android.googlequicksearchbox&hl=ja&showAllReviews=true`;
    const page = await browser.newPage();
    await page.goto(appUrl, { waitUntil: 'networkidle0' });

    const xpath = `//body/script`;
    // const xpath = `//script[contains(., "AF_initDataCallback(") and contains(., "ds:25")]`;
    // await page.waitForXPath(xpath);
    const elementHandles = await page.$x(xpath);

    // const elementHandles = await page.$$('body script');
    const jsonValues = await Promise.all(
      elementHandles.map(async (entryHandle: puppeteer.ElementHandle) => {
        // cheerioに変換
        const scriptStr = await page.evaluate((el: Element) => el.textContent, entryHandle);
        await entryHandle.dispose();
        if (scriptStr?.match(/AF_initDataCallback\({key: 'ds:25'/)) {
          console.log(scriptStr);
          return scriptStr;
        }
      })
    );
    console.log(jsonValues.length);
    console.log(jsonValues[0]);

    // const jsHandle = await elementHandles[0].getProperty('textContent');
    // const jsonValue = await jsHandle.jsonValue();

    // if (typeof jsonValue === 'string') {
    //   console.log(jsonValue.replace('AF_initDataCallback(', '').replace(');', ''));
    //   const applicationJson = JSON.parse(jsonValue.replace('AF_initDataCallback(', '').replace(');', ''));
    //   console.log(applicationJson);
    //   expect(applicationJson).toBe({});
    // }
  });
  // */
});

describe('Android test', () => {
  test('selector test', async () => {

  });


  test('analyzeReviewData', async () => {
    const testData = `
<div jscontroller="H6eOGe" jsmodel = "y8Aajc" jsdata = "yf3HXc;gp:AOqpTOESH7qt542uDQEY1qPjEF-eVcAebWpwl9nMK0xqSvKAexc7nR_dXkLdH_IIWfHEuFnNHbOdfHKvimTWlQ;$4 YjFXEf;_;$3">
  <div class="zc7KVe">
    <div class="vDSMeb bAhLNe" aria - hidden="true">
      <img src="https://lh3.googleusercontent.com/a-/AOh14GhQvfvmGgBwMWEY3tp9MExNwcy_iYfQ87E2Mn4M5Q=w48-h48-n-rw" srcset = "https://lh3.googleusercontent.com/a-/AOh14GhQvfvmGgBwMWEY3tp9MExNwcy_iYfQ87E2Mn4M5Q=w96-h96-n-rw 2x" class="T75of ZqMJr" aria - hidden="true" data - iml="1499.7149999835528">
    </div>
    <div class="d15Mdf bAhLNe">
      <div class="xKpxId zc7KVe">
        <div class="bAhLNe kx8XBd">
          <span class="X43Kjb">Jagriti Thakur 6th E roll no. 17</span>
          <div>
            <span class="nt2C1d">
              <div class="pf5lIe">
                <div aria-label="Rated 1 stars out of five stars" role="img">
                  <div class="vQHuPe bUWb7c"></div>
                  <div class="L0jl5e bUWb7c"></div>
                  <div class="L0jl5e bUWb7c"></div>
                  <div class="L0jl5e bUWb7c"></div>
                  <div class="L0jl5e bUWb7c"></div>
                </div>
              </div>
            </span>
            <span class="p2TkOb">October 3, 2020</span>
          </div>
        </div>
        <div class="YCMBp GVFJbb">
          <div jsaction="JIbuQc:isb5Wc(isb5Wc);NrJVc:tUsItb;Juy6d:Hw9KTb;yIJnmd:kuHRr;s4H3C:HBdSge;" jsname = "OuHhoc">
            <div class="XlMhZe">
              <div role="button" class="U26fgb mUbCce fKz7Od YYBxpf" jslog = "77038; 1:1212; track:JIbuQc;" jscontroller = "VXdfxd" jsaction = "click:cOuCgd; mousedown:UX7yZ; mouseup:lbsD7e; mouseenter:tfO1Yc; mouseleave:JywGue; focus:AHmuwe; blur:O22p3e; contextmenu:mg9Pef;touchstart:p6p2H; touchmove:FwuNnf; touchend:yfqBxc(preventMouseEvents=true|preventDefault=true); touchcancel:JMtRjd;" jsshadow = "" jsname = "isb5Wc" aria - label="Helpful" aria - disabled="false" tabindex = "0" data - tooltip="Helpful" data - tooltip - vertical - offset="-12" data - tooltip - horizontal - offset="0">
                <div class="VTBa7b MbhUzd" jsname = "ksKsZd"></div>
                <span jsslot="" class="xjKiLb">
                <span class="Ce1Y1c" style = "top: -12px">
                  <span class="DPvwYc y92BAb" aria - hidden="true" jsname = "eJYMSc"></span>
                  </span>
                </span>
              </div>
              <div class="jUL89d y92BAb" aria - label="Number of times this review was rated helpful"> 447 </div>
            </div>
            <div role="button" class="U26fgb JRtysb WzwrXb" jscontroller = "iSvg6e" jsaction = "click:cOuCgd; mousedown:UX7yZ; mouseup:lbsD7e; mouseenter:tfO1Yc; mouseleave:JywGue; focus:AHmuwe; blur:O22p3e; contextmenu:mg9Pef;touchstart:p6p2H; touchmove:FwuNnf; touchend:yfqBxc(preventMouseEvents=true|preventDefault=true); touchcancel:JMtRjd;;keydown:I481le;" jsshadow = "" jsname = "hHFCAc" aria - label="More options" aria - disabled="false" tabindex = "0" data - tooltip="More options" aria - haspopup="true" aria - expanded="false" data - tooltip - vertical - offset="-12" data - tooltip - horizontal - offset="0" id = "ow70" __is_owner = "true">
              <div class="NWlf3e MbhUzd" jsname = "ksKsZd"></div>
              <span jsslot="" class="MhXXcc oJeWuf">
                <span class="Lw7GHd snByac">
                  <span class="DPvwYc NE4Eeb" aria - hidden="true"></span>
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
      <div jscontroller="LVJlx" class="UD7Dzf">
        <span jsname="bN97Pc">Its a bad application. I cant even give 1 star to it. Because when i open it and type something, after pressing the search button it shows white screen. After waiting for 5 minites my result come. But when i try to up the screen it hangs. And after 3 minutes it shows google isn't responding. And whe...
          <div class="cQj82c">
            <button class="LkLjZd ScJHi OzU4dc" jsaction="click:TiglPc" jsname="gxjVle">Full Review</button>
          </div>
        </span>
        <span jsname="fbQN7e" style = "display: none;">Its a bad application. I cant even give 1 star to it. Because when i open it and type something, after pressing the search button it shows white screen. After waiting for 5 minites my result come. But when i try to up the screen it hangs. And after 3 minutes it shows google isn't responding. And when i go back to home screen and start using other app then also it shows same. And when i type google password then it shows wrong password. After changing, the password automatically changes.Worst app</span>
      </div>
    </div>
  </div>
</div>
`;

    const $ = cheerio.load(testData, {
      normalizeWhitespace: true
    });

    const tempReviewId = $('div').attr('jsdata')?.match(/(gp:.*?);/); // 最短一致
    let reviewId: string = '';
    if (tempReviewId) reviewId = tempReviewId[1];

    const title = $('div > div:nth-of-type(2) > div:first-of-type > div:first-of-type > span').text();
    // レビュー全文は、文字列オーバーしていない限りこのセレクタの場所にはない
    const message = $('div > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(2)').text();
    const ratings = $('div > div:nth-of-type(2) > div:first-of-type > div:first-of-type div[role="img"] > div');
    expect(ratings.eq(0).attr('class')).toBe("vQHuPe bUWb7c");
    expect(ratings.eq(4).attr('class')).toBe("L0jl5e bUWb7c");
    expect(ratings.parent().find('div').length).toBe(5);
    const starClassName = `div[class="${ratings.eq(0).attr('class')}"]`;
    expect(ratings.parent().find(starClassName).length).toBe(1);
    const nonStarClassName = `div[class="${ratings.eq(1).attr('class')}"]`;
    expect(ratings.parent().find(nonStarClassName).length).toBe(4);

    const postedAtStr = $('div > div:nth-of-type(2) > div:first-of-type > div:first-of-type > div:first-of-type > span:nth-of-type(2)').text();

    expect(reviewId).toBe('gp:AOqpTOESH7qt542uDQEY1qPjEF-eVcAebWpwl9nMK0xqSvKAexc7nR_dXkLdH_IIWfHEuFnNHbOdfHKvimTWlQ');
    expect(title).toBe('Jagriti Thakur 6th E roll no. 17');
    expect(message).toBe(`Its a bad application. I cant even give 1 star to it. Because when i open it and type something, after pressing the search button it shows white screen. After waiting for 5 minites my result come. But when i try to up the screen it hangs. And after 3 minutes it shows google isn't responding. And when i go back to home screen and start using other app then also it shows same. And when i type google password then it shows wrong password. After changing, the password automatically changes.Worst app`);
    // expect(rating).toBe('1');
    // expect(version).toBe('288.0');
    expect(postedAtStr).toBe('October 3, 2020');
  });

  afterAll(async () => {
    await browser.close();
  });
});
