import AppData from '../models/AppData';
import Review from '../repositories/Review';
import ReviewData from '../models/ReviewData';

export abstract class AppOS {
  private review: Review;

  protected constructor(ignoreNotification: boolean) {
    this.review = new Review(ignoreNotification);
  }

  abstract getReviewDataUrl(appId: string, countryCode: string, page: number): string;
  abstract getReviewData($: any, appData: AppData): Promise<ReviewData[]>;
  abstract analyzeReviewData(entry: any, appData: AppData): ReviewData;

  /**
   * iOSのレビュー情報の登録処理。
   * 取得したレビュー情報が新規であればDBに保存し、通知用データとして返却する。
   */
  registerReviewData = (entry: any, appData: AppData): Promise<ReviewData> => {

    return new Promise((resolve, reject) => {
      const reviewData = this.analyzeReviewData(entry, appData);

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