import AppModel from '../models/AppModel';
import ReviewModel from '../models/ReviewModel';
import { mysqlClient } from '../lib/mysql';
import { RowDataPacket, FieldPacket } from 'mysql2';

/**
 * レビューの取得・解析処理を行う
 */
export default class ReviewRepository {
  ignoreNotification: boolean;  // 初回通知しないオプション（起動後に設定されたレビュー結果を通知しないためのオプション）

  constructor(ignoreNotification: boolean) {
    this.ignoreNotification = ignoreNotification;

    this.insertReviewData = this.insertReviewData.bind(this);
    this.pushData = this.pushData.bind(this);
    this.selectRecord = this.selectRecord.bind(this);
  }

  /**
   * レビューデータをDBに保存する。
   * テーブルにレビューIDがすでに存在する場合は登録処理をしないでfalseを返す。
   * Insertできた場合はtrueを返す。
   *
   * @param app
   * @param review
   * @returns {Promise}
   */
  async insertReviewData(app: AppModel, review: ReviewModel): Promise<boolean> {

    // レコードの有無をチェックする
    if (await this.selectRecord(review, app.kind) === 0) {
      try {
        // TODO: 言語コードを入れる
        const [rows, fields]: [RowDataPacket[], FieldPacket[]] = await mysqlClient.execute(
          "INSERT INTO review(id, kind, app_name, title, message, rating, posted_at, version) " +
          "VALUES(?, ?, ?, ?, ?, ?, ?, ?)",
          [
            review.reviewId, app.kind, app.name, review.title, review.message,
            review.rating, review.postedAt, review.version
          ]);
        return true;
      } catch (e) {
        // TODO: 例外時の対応を検討したい
        console.log('登録失敗！！')
        return false;
      }
    } else {
      return false;
    }
}

/**
 * 通知対象とするかの判定処理
 *
 * @param result
 * @param review
 * @returns {Promise}
 */
pushData(result: boolean, review: ReviewModel): Promise < ReviewModel | null > {
  return new Promise((resolve, reject) => {
    // DB登録ができて通知可能な場合に、通知対象とする
    if (result && !this.ignoreNotification) {
      resolve(review);
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
async selectRecord(review: ReviewModel, kind: string): Promise < number > {
  const [rows, fields]: [RowDataPacket[], FieldPacket[]] = await mysqlClient.execute(
    'SELECT count(*) as cnt FROM review WHERE id = ? AND kind = ?', [review.reviewId, kind]);
  return rows[0]['cnt'];
}
}
