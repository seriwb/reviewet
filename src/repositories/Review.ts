import AppData from '../models/AppData';
import ReviewData from '../models/ReviewData';
import { mysqlClient } from '../lib/mysql';
import { RowDataPacket, FieldPacket } from 'mysql2';

/**
 * レビューの取得・解析処理を行う
 */
export default class Review {
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
   * @param appData
   * @param reviewData
   * @returns {Promise}
   */
  async insertReviewData(appData: AppData, reviewData: ReviewData): Promise<boolean> {

    // レコードの有無をチェックする
    if (await this.selectRecord(reviewData, appData.kind) === 0) {
      try {
        const [rows, fields]: [RowDataPacket[], FieldPacket[]] = await mysqlClient.execute(
          "INSERT INTO review(id, kind, app_name, title, message, rating, updated, version) " +
          "VALUES(?, ?, ?, ?, ?, ?, ?, ?)",
          [
            reviewData.reviewId, appData.kind, appData.name, reviewData.title, reviewData.message,
            reviewData.rating, reviewData.updated, reviewData.version
          ]);
        return true;
      } catch (e) {
        // TODO: 例外時の対応を検討したい
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
 * @param reviewData
 * @returns {Promise}
 */
pushData(result: boolean, reviewData: ReviewData): Promise < ReviewData | null > {
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
async selectRecord(reviewData: ReviewData, kind: string): Promise < number > {
  const [rows, fields]: [RowDataPacket[], FieldPacket[]] = await mysqlClient.execute(
    'SELECT count(*) as cnt FROM review WHERE id = ? AND kind = ?', [reviewData.reviewId, kind]);
  return rows[0]['cnt'];
}
}
