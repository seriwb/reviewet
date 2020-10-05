import puppeteer, { ElementHandle, Page } from 'puppeteer';

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
 * 指定されたiOSのアプリIDに対して、国コード別のレビューを取得し、結果を通知する。
 *
 * @param props レビューを取得するiOSアプリの情報
 */
export const iosReview = async (props: Props): Promise<void> => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox']
  });

  try {
    const page = await browser.newPage();

    for (let i = 0; i < props.iosApps.length; i++) {
      const iosId: string = props.iosApps[i].id;
      const iosCountryCodes: string[] = changeToArray(props.iosApps[i].countryCode);

      for (let j = 0; j < iosCountryCodes.length; j++) {
        const iosCountryCode = iosCountryCodes[j];
        const ios = new Ios(props.ignoreNotification);

        // iOSアプリの情報を生成
        // TODO: アプリが存在していない国に対して取得をかけようとしたときの例外処理が無い
        const appUrl = `https://apps.apple.com/${iosCountryCode}/app/id${iosId}`;
        await page.goto(appUrl);
        const appName = await ios.getAppName(page);
        const iosApp = new AppModel(appName, appUrl, KIND, iosId, iosCountryCode);

        // アプリのレビューデータを取得
        const reviewDataUrl = ios.getReviewDataUrl(iosId, iosCountryCode);
        await page.goto(reviewDataUrl);
        const reviews: ReviewModel[] = await ios.createReviews(page, iosApp);

        // iOSアプリのレビューを通知
        notificateAppReview(iosApp, props.outputs, props.useSlack, props.useEmail, reviews);
      }
    }
  } catch (e) {
    console.log(e);
  } finally {
    await browser.close();
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
   * アプリ名が見つからなかった場合は、ダミー名を返却する
   *
   * @param page アプリ情報取得先ページ
   */
  getAppName = async (page: Page): Promise<string> => {
    const jsonValue = await page.$eval('script[name="schema:software-application"]', (el: Element) => el.textContent);

    if (typeof jsonValue === 'string') {
      const applicationJson = JSON.parse(jsonValue);
      return Promise.resolve(applicationJson['name']);
    }
    else {
      return Promise.resolve("!!!No Name!!!");
    }
  };

  /**
   * iOSのレビュー情報を取得・解析して、整形したレビューデータを返却する。
   *
   * @param page
   * @param app
   */
  createReviews = async (page: Page, app: AppModel): Promise<ReviewModel[]> => {
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

        // レビューデータの分析と登録
        const review = this.analyzeReviewData($);
        return await this.registerReviewData(app, review);
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