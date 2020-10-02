import AppData from '../models/AppData';
import { AppOS } from './AppOS';
import { IosApp } from 'application';
import ReviewData from '../models/ReviewData';
import { changeToArray } from '../utils/array';
import cheerioClient from 'cheerio-httpcli';
import { formatDate } from '../utils/date';
import { notificateAppReview } from './Notification';
import { parseString } from 'xml2js';

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
  const ios = new Ios(props.ignoreNotification);

  for (let i = 0; i < props.iosApps.length; i++) {
    const iosId: string = props.iosApps[i].id;
    const iosCountryCodes: string[] = changeToArray(props.iosApps[i].countryCode);
    for (let j = 0; j < iosCountryCodes.length; j++) {
      const iosCountryCode = iosCountryCodes[j];
      const ios_url: string = ios.getReviewDataUrl(iosId, iosCountryCode);
      const iosApp = new AppData(KIND, iosId, iosCountryCode);

      const reviewDatas = await ios.getReviewData(ios_url, iosApp);
      // iOSアプリのレビューを通知
      notificateAppReview(iosApp, props.outputs, props.useSlack, props.useEmail, reviewDatas);
     }
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
   * iOSのレビュー情報を解析して、整形したレビューデータを返却する。
   */
  getReviewData = async (url: string, appData: AppData): Promise<ReviewData[]> => {
    // アプリのレビューデータを取得
    let result: cheerioClient.FetchResult;
    try {
      const param = {};
      result = await cheerioClient.fetch(url, param);
    } catch (err) {
      console.log(formatDate(new Date(), "YYYY/MM/DD hh:mm:ss") + " Error:", err);
    }

    return new Promise((resolve, reject) => {
      // RSSの内容を解析してレビューデータを作成
      const reviewDataXml = result.body;//TODO:$.xml();
      let reviewDatas: ReviewData[] = [];

      parseString(reviewDataXml, (err, result) => { // TODO: xml関連の型を調べる
        // アプリレビューがない場合は終了
        if (!result.feed.entry) {
          resolve(reviewDatas);
          return;
        }

        // TODO: これもう取れないので別に処理を書く
        // アプリ情報を設定
        appData.name = result.feed.entry[0]['im:name'];
        appData.url = result.feed.entry[0].link[0].$.href;

        // レビュー情報を設定
        let reviewProcess: Promise<ReviewData>[] = [];
        for (let i = 1; i < result.feed.entry.length; i++) {
          const entry = result.feed.entry[i];
          reviewProcess.push(this.registerReviewData(appData, entry));
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
   */
  analyzeReviewData = (entry: any, appData: AppData): ReviewData => {
    const reviewId = entry.id[0];
    const title = entry.title[0];
    const message = entry.content[0]._;
    const rating = entry['im:rating'];
    const version = entry['im:version'] + ''; // 文字列に変換
    // Android側の制御にあわせて日付を文字列で保持する
    const updated = formatDate(new Date(entry.updated[0]), "YYYY/MM/DD hh:mm:ss");

    return new ReviewData(reviewId, title, "", message, version, rating, updated); // TODO: アプリ名とURLの取得処理が追加で必要
  };
}