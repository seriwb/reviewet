/**
 * 表示するレビュー情報を保持するオブジェクト
 *
 * @param param
 * @constructor
 */
export default class ReviewModel {
  reviewId: string;
  title: string;
  titleLink: string;
  message: string;
  version: string;
  rating: string;
  postedAt: string;

  constructor(reviewId: string, title: string, titleLink: string, message: string, version: string, rating: string, postedAt: string) {
    this.reviewId = reviewId;
    this.title = title;
    this.titleLink = titleLink;
    this.message = message;
    this.version = version;
    this.rating = rating;
    this.postedAt = postedAt;
  }
};