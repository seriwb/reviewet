import { AndroidApp } from 'application';
import AppModel from '../models/AppModel';
import ReviewRepository from '../repositories/ReviewRepository';
import ReviewModel from '../models/ReviewModel';
import { changeToArray } from '../utils/array';
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
 *
 * @param {AndroidApp[]} androidApps レビューを取得するAndroidアプリの情報
 */
export const androidReview = (props: Props) => {
  const android = new Android(props.ignoreNotification);

  for (let i = 0; i < props.androidApps.length; i++) {
    const androidId: string = props.androidApps[i].id;
    const androidLanguageCodes: string[] = changeToArray(props.androidApps[i].languageCode);
    for (let j = 0; j < androidLanguageCodes.length; j++) {
      const androidLanguageCode = androidLanguageCodes[j];
      const android_url: string = android.getReviewDataUrl(androidId, androidLanguageCode);
      const androidApp = new AppModel("", "", KIND, androidId, androidLanguageCode);

      // Androidはストアサイトから直接データを取得するので、遷移先のURLにそのまま使う
      androidApp.url = android_url;

      // Androidアプリのレビューを通知
      // TODO:noticeAppReview(androidApp, android_url, props.outputs, props.useSlack, props.useEmail, android.analyzeData);
    }
  }
};

class Android {
  reviewRepository: ReviewRepository;

  constructor(ignoreNotification: boolean) {
    this.reviewRepository = new ReviewRepository(ignoreNotification);

    this.getReviewDataUrl = this.getReviewDataUrl.bind(this);
    this.analyzeData = this.analyzeData.bind(this);
    this.getReview = this.getReview.bind(this);
  }
  /**
   * Androidアプリのレビューデータ取得元のURLを生成する。
   * @param {string} appId 取得対象アプリのGooglePlay ID
   * @param {string} languageCode 取得対象アプリのGooglePlay言語コード
   */
  getReviewDataUrl(appId: string, languageCode: string) {
    return `https://play.google.com/store/apps/details?id=${appId}&hl=${languageCode}`;
  }


  /**
   * Androindのレビュー情報を解析して、整形したレビューデータを返却する。
   * ※Androidは$をそのまま使って処理してみる
   *
   * @param $
   * @param app
   * @returns {Promise}
   */
  analyzeData($: any, app: AppModel): Promise<ReviewModel[]> {

    return new Promise((resolve, reject) => {

      // レビュー本文の後ろにくる「全文を表示」を削除
      $('div.review-link').remove();

      // アプリ情報を設定
      app.name = $('.id-app-title').text();

      // レビュー情報を設定
      let reviewProcess: Promise<ReviewModel>[] = [];
      $('.single-review').each((i: number, element: any) => {
        reviewProcess.push(this.getReview($, app, element));
      });
      Promise.all(reviewProcess).then((data) => {
        let returnData = [];
        for (let i = 0; i < data.length; i++) {
          if (data[i] !== null) {
            returnData.push(data[i]);
          }
        }
        resolve(returnData);
      });
    });
  }


  /**
   * Androidのレビュー情報の解析処理。
   * 取得したレビュー情報が新規であればDBに保存し、通知用データとして返却する。
   *
   * @param $
   * @param app
   * @param element
   * @returns {Promise}
   */
  getReview($: any, app: AppModel, element: any): Promise<ReviewModel> {

    return new Promise((resolve, reject) => {
      const reviewInfo = $(element).find('.review-info');
      const reviewId = $(element).find('.review-header').attr('data-reviewid');
      const postedAt = $(reviewInfo).find('.review-date').text();

      // TODO:日本語以外にも対応する
      const tempRating = $(reviewInfo).find('.review-info-star-rating .tiny-star').attr('aria-label');
      const trimRatingLength = '5つ星のうち'.length;
      const rating = tempRating.substring(trimRatingLength, trimRatingLength + 1);

      // アプリバージョンは取れないのでハイフンにする
      const version = "-";

      const reviewBody = $(element).find('.review-body.with-review-wrapper');
      const title = $(reviewBody).find('.review-title').text();

      // レビュー本文の前からタイトルを削除し、前後の空白を削除
      const tempMessage = $(reviewBody).text().replace(title, "");
      const message = tempMessage.trim();

      const review = new ReviewModel(reviewId, title, "", message, version, rating, postedAt);

      // DBに登録を試みて、登録できれば新規レビューなので通知用レビューデータとして返却する
      this.reviewRepository.insertReviewData(app, review).then((result) => {
        this.reviewRepository.pushData(result, review).then((data) => {
          if (data) {
            resolve(data);
          }
        });
      });
    });
  }
}
