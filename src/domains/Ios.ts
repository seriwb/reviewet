import puppeteer, { Browser, ElementHandle, Page } from 'puppeteer';

import AppModel from '../models/AppModel';
import { AppOS } from './AppOS';
import { IosApp } from 'application';
import ReviewModel from '../models/ReviewModel';
import { changeToArray } from '../utils/array';
import cheerio from 'cheerio';
import { formatDate } from '../utils/date';
import { notificateAppReview } from './Notification';

export const KIND = "iOS";
interface Props {
  iosApps: IosApp[];
  outputs: number;
  ignoreNotification: boolean;
  useSlack: boolean;
  useEmail: boolean;
}

/**
 * iOSのストアレビューを通知する
 * 指定されたiOS/AndroidのアプリIDに対して、レビューの取得処理を実施する。
 * 設定されていないOSについては何もしない。
 *
 * @param {IosApp[]} iosApps レビューを取得するiOSアプリの情報
 */
export const iosReview = async (props: Props): Promise<void> => {

  for (let i = 0; i < props.iosApps.length; i++) {
    const iosId: string = props.iosApps[i].id;
    const iosCountryCodes: string[] = changeToArray(props.iosApps[i].countryCode);

    for (let j = 0; j < iosCountryCodes.length; j++) {
      const iosCountryCode = iosCountryCodes[j];

      // TODO: アプリが存在していない国に対して取得をかけようとしたときの例外処理が無い
      const appUrl = `https://apps.apple.com/${iosCountryCode}/app/id${iosId}`;
      const appName = await getAppName(appUrl);
      const ios = new Ios(props.ignoreNotification);
      const reviewDataUrl = ios.getReviewDataUrl(iosId, iosCountryCode);
      const iosApp = new AppModel(appName, appUrl, KIND, iosId, iosCountryCode);
      const reviews: ReviewModel[] = await ios.createReviews(reviewDataUrl, iosApp);

      // iOSアプリのレビューを通知
      notificateAppReview(iosApp, props.outputs, props.useSlack, props.useEmail, reviews);
     }
  }
};

/**
 * アプリ名が見つからなかった場合は、ダミー名を返却する
 *
 * @param url アプリ情報取得先URL
 */
const getAppName = async (url: string): Promise<string> => {
  // TODO: pupetterで取得
  const browser = await puppeteer.launch({
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.goto(url);

  const jsonValue = await page.$eval('script[name="schema:software-application"]', (el: Element) => el.textContent);
  await browser.close();

  if (typeof jsonValue === 'string') {
    const applicationJson = JSON.parse(jsonValue);
    return Promise.resolve(applicationJson['name']);
  }
  else {
    return Promise.resolve("!!!No Name!!!");
  }
};

class Ios extends AppOS {

  constructor(ignoreNotification: boolean) {
    super(ignoreNotification);
  }

  /**
   * iOSアプリのレビューデータ取得元のURLを生成する。
   * @param {string} appId 取得対象アプリのAppStore ID
   * @param {string} countryCode 取得対象アプリのAppStore国コード
   * @param {number} page ページインデックス
   */
  getReviewDataUrl = (appId: string, countryCode: string, page: number = 0): string => {
    let url = `http://itunes.apple.com/${countryCode}/rss/customerreviews`;
    if (page > 0) {
      url += `/page=${page}/id=${appId}/sortBy=mostRecent/xml`;
    } else {
      url += `/id=${appId}/sortBy=mostRecent/xml`;
    }

    return url;
  };

  /**
   * iOSのレビュー情報を取得・解析して、整形したレビューデータを返却する。
   *
   * @param url
   * @param app
   */
  createReviews = async (url: string, app: AppModel): Promise<ReviewModel[]> => {
    // アプリのレビューデータを取得
    const browser: Browser = await puppeteer.launch({
      args: ['--no-sandbox']
    });
    const page: Page = await browser.newPage();
    await page.goto(url);

    // レビューデータの分析と登録
    const entryHandles = await page.$$('entry');
    const reviews: ReviewModel[] = await Promise.all(
      entryHandles.map(async (entryHandle: ElementHandle) => {
        // cheerioに変換
        const xml = await page.evaluate((el) => el.innerHTML, entryHandle);
        const $ = cheerio.load(xml, {
          normalizeWhitespace: true,
          xmlMode: true
        });
        await entryHandle.dispose();

        return await this.registerReviewData($, app);
      })
    );

    return Promise.resolve(reviews);
  };

  /**
   * iOSのレビュー情報の解析処理。
   *
   * @param $ 解析元データ
   */
  analyzeReviewData = ($: cheerio.Root): ReviewModel => {
    const reviewId = $('id').text();
    const title = $('title').text();
    const message = $('content[type="text"]').text();
    const rating = $('im\\:rating').text();
    const version = $('im\\:version').text();
    // Android側の制御にあわせて日付を文字列で保持する
    const postedAtStr = $('updated').text();
    const postedAt = formatDate(new Date(postedAtStr), "YYYY/MM/DD hh:mm:ss");

    return new ReviewModel(reviewId, title, "", message, version, rating, postedAt); // TODO: タイトルリンクの取得処理が必要だが、iOS側は取得できる現状レビュー単位のURLが使い物にならない
  };
}