import AppModel from '../models/AppModel';
import ReviewRepository from '../repositories/ReviewRepository';
import ReviewModel from '../models/ReviewModel';

export abstract class AppOS {
  private reviewRepository: ReviewRepository;

  protected constructor(ignoreNotification: boolean) {
    this.reviewRepository = new ReviewRepository(ignoreNotification);
  }

  abstract getReviewDataUrl(appId: string, countryCode: string, page: number): string;
  abstract getReviews($: any, app: AppModel): Promise<ReviewModel[]>;
  abstract analyzeReviewData(entry: any, app: AppModel): ReviewModel;

  /**
   * レビュー情報の登録処理。
   * 取得したレビュー情報が新規であればDBに保存し、通知用データとして返却する。
   *
   * @param entry 解析元データ
   * @param app アプリ情報
   */
  registerReviewData = (entry: any, app: AppModel): Promise<ReviewModel> => {

    return new Promise((resolve, reject) => {
      const review = this.analyzeReviewData(entry, app);

      // DBに登録を試みて、登録できれば新規レビューなので通知用レビューデータとして返却する
      this.reviewRepository.insertReviewData(app, review).then((result) => {
        this.reviewRepository.pushData(result, review).then((data) => {
          if (data) {
            resolve(data);
          }
        });
      });
    });
  };
}