
import { IosApp } from 'application';
import { changeToArray } from '../utils/array';
import AppData from '../models/AppData';
import { noticeAppReview } from './Notification';
import ReviewData from '../models/ReviewData';
import Review from '../repositories/Review';
import { parseString } from 'xml2js';
import { formatDate } from '../utils/date';

interface Props {
  iosApps: IosApp[];
  outputs: number;
  ignoreNotification: boolean;
  db: any;
  useSlack: boolean;
  useEmail: boolean;
}

/**
 * iOSのストアレビューを通知する
* 指定されたiOS/AndroidのアプリIDに対して、レビューの取得処理を実施する。
* 設定されていないOSについては何もしない。
 * @param {IosApp[]} iosApps レビューを取得するiOSアプリの情報
 */
export const iosReview = (props: Props) => {
  const ios = new Ios(props.ignoreNotification, props.db);

  for (let i = 0; i < props.iosApps.length; i++) {
    const iosId: string = props.iosApps[i].id;
    const iosCountryCodes: string[] = changeToArray(props.iosApps[i].countryCode);
    for (let j = 0; j < iosCountryCodes.length; j++) {
      const iosCountryCode = iosCountryCodes[j];
      const ios_url: string = ios.getUrl(iosId, iosCountryCode);
      const iosApp = new AppData("iOS", iosId, iosCountryCode);

      // iOSアプリのレビューを通知
      noticeAppReview(iosApp, ios_url, props.outputs, props.useSlack, props.useEmail, ios.analyzeData);
    }
  }
};

class Ios {
  review: Review;

  constructor(ignoreNotification: boolean, db: any) {
    this.review = new Review(ignoreNotification, db);

    this.getUrl = this.getUrl.bind(this);
    this.analyzeData = this.analyzeData.bind(this);
    this.getReview = this.getReview.bind(this);
  }

  /**
   * iOSアプリのレビューデータ取得元のURLを生成する。
   * @param {string} appId 取得対象アプリのAppStore ID
   * @param {string} countryCode 取得対象アプリのAppStore国コード
   * @param {number} page ページインデックス
   */
  getUrl(appId: string, countryCode: string, page: number = 0): string {
    let url = `http://itunes.apple.com/${countryCode}/rss/customerreviews`;
    if (page > 0) {
      url += `/page=${page}/id=${appId}/sortBy=mostRecent/xml`;
    } else {
      url += `/id=${appId}/sortBy=mostRecent/xml`;
    }

    return url;
  };

  /**
   * iOSのレビュー情報を解析して、整形したレビューデータを返却する。
   */
  analyzeData($: any, appData: AppData): Promise<ReviewData[]> {

    return new Promise((resolve, reject) => {
      // RSSの内容を解析してレビューデータを作成
      const reviewDataXml = $.xml();
      let reviewDatas: ReviewData[] = [];
      parseString(reviewDataXml, (err, result) => { // TODO: xml関連の型を調べる

        // アプリレビューがない場合は終了
        if (!result.feed.entry) {
          resolve(reviewDatas);
          return
        }

        // アプリ情報を設定
        appData.name = result.feed.entry[0]['im:name'];
        appData.url = result.feed.entry[0].link[0].$.href;

        // レビュー情報を設定
        let reviewProcess: Promise<ReviewData>[] = [];
        for (let i = 1; i < result.feed.entry.length; i++) {
          const entry = result.feed.entry[i];
          reviewProcess.push(this.getReview(appData, entry));
        }
        Promise.all(reviewProcess).then((datas) => {
          let returnData: ReviewData[] = [];
          for (let i = 0; i < datas.length; i++) {
            if (datas[i] !== null) {
              returnData.push(datas[i]);
            }
          }
          resolve(returnData);
        });
      });
    });
  };

  /**
   * iOSのレビュー情報の解析処理。
   * 取得したレビュー情報が新規であればDBに保存し、通知用データとして返却する。
   */
  getReview(entry: any, appData: AppData): Promise<ReviewData> {

    return new Promise((resolve, reject) => {
      const reviewId = entry.id[0];
      const title = entry.title[0];
      const message = entry.content[0]._;
      const rating = entry['im:rating'];
      const version = entry['im:version'] + ''; // 文字列に変換
      // Android側の制御にあわせて日付を文字列で保持する
      const updated = formatDate(new Date(entry.updated[0]), "YYYY/MM/DD hh:mm:ss");

      let reviewData = new ReviewData(reviewId, title, "", message, version, rating, updated);

      // DBに登録を試みて、登録できれば新規レビューなので通知用レビューデータとして返却する
      this.review.insertReviewData(appData, reviewData).then((result) => {
        this.review.pushData(result, reviewData).then((data) => {
          if (data) {
            resolve(data);
          }
        });
      });
    });
  };
}