import AppModel from '../models/AppModel';
import ReviewModel from '../models/ReviewModel';
import ReviewRepository from '../repositories/ReviewRepository';

export abstract class AppOS {
  private reviewRepository: ReviewRepository;

  protected constructor(ignoreNotification: boolean) {
    this.reviewRepository = new ReviewRepository(ignoreNotification);
  }

  abstract getReviewDataUrl(appId: string, countryCode: string, page: number): string;
  abstract createReviews(url: string, app: AppModel): Promise<ReviewModel[]>;
  abstract analyzeReviewData($: cheerio.Root): ReviewModel;

  /**
   * レビュー情報の登録処理。
   * 取得したレビュー情報が新規であればDBに保存し、通知用データとして返却する。
   *
   * @param el 解析元データ
   * @param app アプリ情報
   */
  registerReviewData = ($: cheerio.Root, app: AppModel): Promise<ReviewModel> => {

    return new Promise((resolve, reject) => {
      const review = this.analyzeReviewData($);

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