import AppModel from '../models/AppModel';
import { Page } from 'puppeteer';
import ReviewModel from '../models/ReviewModel';
import ReviewRepository from '../repositories/ReviewRepository';

export abstract class AppOS {
  private reviewRepository: ReviewRepository;

  protected constructor(ignoreNotification: boolean) {
    this.reviewRepository = new ReviewRepository(ignoreNotification);
  }

  abstract getReviewDataUrl(appId: string, countryCode: string, page: number): string;
  abstract getAppName(page: Page): Promise<string>;
  abstract createReviews(page: Page, app: AppModel): Promise<ReviewModel[]>;
  abstract analyzeReviewData($: cheerio.Root): ReviewModel;

  /**
   * レビュー情報の登録処理。
   * レビュー情報が新規であればDBに保存し、通知用データとして返却する。
   *
   * @param app アプリ情報
   * @param review 登録するレビュー情報
   */
  registerReviewData = (app: AppModel, review: ReviewModel): Promise<ReviewModel> => {

    return new Promise((resolve, reject) => {
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