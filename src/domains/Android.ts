import puppeteer, { ElementHandle, Page } from 'puppeteer';

import { AndroidApp } from 'application';
import AppModel from '../models/AppModel';
import { AppOS } from './AppOS';
import ReviewModel from '../models/ReviewModel';
import { changeToArray } from '../utils/array';
import cheerio from 'cheerio';
import { notificateAppReview } from './Notification';

export const KIND = "Android";

interface Props {
  androidApps: AndroidApp[];
  outputs: number;
  ignoreNotification: boolean;
  useSlack: boolean;
  useEmail: boolean;
}

/**
 * Androidのストアレビューを通知する
 * 指定されたAndroidのアプリIDに対して、言語別のレビューを取得し、結果を通知する。
 *
 * @param props レビューを取得するAndroidアプリの情報
 */
export const androidReview = async (props: Props): Promise<void> => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox']
  });

  try {
    const page = await browser.newPage();

    for (let i = 0; i < props.androidApps.length; i++) {
      const androidId: string = props.androidApps[i].id;
      const androidLanguageCodes: string[] = changeToArray(props.androidApps[i].languageCode);

      for (let j = 0; j < androidLanguageCodes.length; j++) {
        const androidLanguageCode = androidLanguageCodes[j];
        const android = new Android(props.ignoreNotification);

        // Androidはストアサイトから直接データを取得するので、遷移先のURLにそのまま使う
        const reviewDataUrl: string = android.getReviewDataUrl(androidId, androidLanguageCode);

        // Androidアプリの情報を生成
        await page.goto(reviewDataUrl, { waitUntil: 'networkidle0' });
        const appName = await android.getAppName(page);
        const androidApp = new AppModel(appName, reviewDataUrl, KIND, androidId, androidLanguageCode);

        // アプリのレビューデータを取得
        await page.goto(reviewDataUrl + '&showAllReviews=true', { waitUntil: 'networkidle0' });
        const reviews: ReviewModel[] = await android.createReviews(page, androidApp);

        // Androidアプリのレビューを通知
        notificateAppReview(androidApp, props.outputs, props.useSlack, props.useEmail, reviews);
      }
    }
  } catch (e) {
    console.log(e);
  } finally {
    await browser.close();
  }
};

class Android extends AppOS {

  constructor(ignoreNotification: boolean) {
    super(ignoreNotification);
  }

  /**
   * Androidアプリのレビューデータ取得元のURLを生成する。
   * すべてのレビューを参照する場合は、パラメータに&showAllReviews=trueを追加する必要がある
   *
   * @param {string} appId 取得対象アプリのGooglePlay ID
   * @param {string} languageCode 取得対象アプリのGooglePlay言語コード
   */
  getReviewDataUrl = (appId: string, languageCode: string): string => {
    return `https://play.google.com/store/apps/details?id=${appId}&hl=${languageCode}`;
  };

  /**
   * アプリ名が見つからなかった場合は、ダミー名を返却する
   *
   * @param page アプリ情報取得先ページ
   */
  getAppName = async (page: Page): Promise<string> => {
    const jsonValue = await page.$eval('script[type="application/ld+json"]', (el: Element) => el.textContent);

    if (typeof jsonValue === 'string') {
      const applicationJson = JSON.parse(jsonValue);
      return Promise.resolve(applicationJson['name']);
    }
    else {
      return Promise.resolve("!!!No Name!!!");
    }
  };

  /**
   * Androindのレビュー情報を解析して、整形したレビューデータを返却する。
    *
   * @param page
   * @param app
   */
  createReviews = async (page: Page, app: AppModel): Promise<ReviewModel[]> => {
    const elementHandles = await page.$$('main h3+div > div');
    const reviews: ReviewModel[] = await Promise.all(
      elementHandles.map(async (elementHandle: ElementHandle) => {
        // 分析用にcheerioへ変換
        const html = await page.evaluate((el: Element) => el.outerHTML, elementHandle);
        const $ = cheerio.load(html, {
          normalizeWhitespace: true
        });
        await elementHandle.dispose();

        // レビューデータの分析と登録
        const review = this.analyzeReviewData($);
        return await this.registerReviewData(app, review);
      })
    );

    return Promise.resolve(reviews);
  };

  /**
   * Androidのレビュー情報の解析処理。
   *
   * ratingの取得ロジック
   * 1. rating対象のdivタグからclass名を取得
   * 2. 1つ目のクラス名を基準にする
   * 3. 同一のクラス名の個数をratingとして返却する
   *
   * @param $ 解析元データ
   */
  analyzeReviewData = ($: cheerio.Root): ReviewModel => {
    const tempReviewId = $('div').attr('jsdata')?.match(/(gp:.*?);/); // 最短一致
    let reviewId: string = '';
    if (tempReviewId) reviewId = tempReviewId[1];

    // タイトルが存在しないのでレビュー者の名前にする
    const title = $('div:first-of-type > div:first-of-type > div:nth-of-type(2) > div:first-of-type > div:first-of-type > span').text();
    const message = $('div:first-of-type > div:first-of-type > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(1)').text();

    // ratingの取得
    const ratingData = $('div:first-of-type > div:first-of-type > div:nth-of-type(2) > div:first-of-type > div:first-of-type div[role="img"] > div');
    const starClassName = `div[class="${ratingData.eq(0).attr('class')}"]`;
    const rating = ratingData.parent().find(starClassName).length.toString();

    const version = "-";  // アプリバージョンは取れないのでハイフンにする
    const postedAt = $('div:first-of-type > div:first-of-type > div:nth-of-type(2) > div:first-of-type > div:first-of-type > div:first-of-type > span:nth-of-type(2)').first().text();

    // console.log(reviewId, title, message, rating, version, postedAt);
    return new ReviewModel(reviewId, title, "", message, version, rating, postedAt); // TODO: タイトルリンクの取得処理が必要
  };
}