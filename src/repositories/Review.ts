import AppData from '../models/AppData';
import ReviewData from '../models/ReviewData';

/**
 * レビューの取得・解析処理を行う
 */
export default class Review {
  ignoreNotification: boolean;  // 初回通知しないオプション（起動後に設定されたレビュー結果を通知しないためのオプション）
  db: any; // TODO: 後で見直し

  constructor(ignoreNotification: boolean, db: any) {
    this.ignoreNotification = ignoreNotification;
    this.db = db;

    this.insertReviewData = this.insertReviewData.bind(this);
    this.pushData = this.pushData.bind(this);
    this.selectRecord = this.selectRecord.bind(this);
  }

  /**
   * レビューデータをDBに保存する。
   * テーブルにレビューIDがすでに存在する場合は登録処理をしないでfalseを返す。
   * Insertできた場合はtrueを返す。
   *
   * @param appData
   * @param reviewData
   * @returns {Promise}
   */
  insertReviewData(appData: AppData, reviewData: ReviewData): Promise<boolean> {

    return new Promise((resolve, reject) => {
      this.selectRecord(reviewData, appData.kind).then((result) => {

        // レコードの有無をチェックする
        if (result.cnt === 0) {
          this.db.serialize(() => {
            // 挿入用プリペアドステートメントを準備
            const ins_androidReview = this.db.prepare(
              "INSERT INTO review(id, kind, app_name, title, message, rating, updated, version, create_date) " +
              "VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)");

            ins_androidReview.run(
              reviewData.reviewId, appData.kind, appData.name, reviewData.title, reviewData.message,
              reviewData.rating, reviewData.updated, reviewData.version, new Date());
            ins_androidReview.finalize();
          });
          resolve(true);
        } else {
          resolve(false);
        }
      }).catch((err) => {
        console.log('DB Failure:', err);
        reject(false);
      });
    });
  }

  /**
   * 通知対象とするかの判定処理
   *
   * @param result
   * @param reviewData
   * @returns {Promise}
   */
  pushData(result: boolean, reviewData: ReviewData): Promise<ReviewData | null> {
    return new Promise((resolve, reject) => {
      // DB登録ができて通知可能な場合に、通知対象とする
      if (result && !this.ignoreNotification) {
        resolve(reviewData);
      } else {
        // レビュー情報が重複している、または通知しないオプションが付いていれば通知対象にしない
        resolve(null);
      }
    });
  }

  /**
   * レビュー情報がすでにDBに存在しているかを調べる。
   * レビューIDでのカウント数を返す。（0 or 1）
   *
   * @param condition チェック対象のレビューデータ
   * @param kind アプリのOS種別
   */
  selectRecord(reviewData: ReviewData, kind: string): Promise<any> { // TODO: sqliteからの書き直しが必要
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.get('SELECT count(*) as cnt FROM review WHERE id = $id AND kind = $kind',
          { $id: reviewData.reviewId, $kind: kind },
          (err: any, res: any) => {
            if (err) {
              return reject(err);
            }
            resolve(res);
          });
      });
    });
  }
}
