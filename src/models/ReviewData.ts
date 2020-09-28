/**
 * 表示するレビュー情報を保持するオブジェクト
 *
 * @param param
 * @constructor
 */
export default class ReviewData {
  updated: string;
  reviewId: string;
  title: string;
  titleLink: string;
  message: string;
  version: string;
  rating: string;

  constructor(param: { [s: string]: string }) {
    this.updated = param.updated;
    this.reviewId = param.reviewId;
    this.title = param.title;
    this.titleLink = param.titleLink;
    this.message = param.message;
    this.version = param.version;
    this.rating = param.rating;
  }
};