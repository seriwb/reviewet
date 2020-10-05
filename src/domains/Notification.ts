import AppModel from '../models/AppModel';
import ReviewModel from '../models/ReviewModel';
import { emailClient } from '../lib/email';
import { formatDate } from '../utils/date';
import fs from 'fs';
import { slackClient } from '../lib/slack';

/**
 * 対象OSのアプリレビューを取得して通知する
 */
export const notificateAppReview = (
  app: AppModel, outputs: number, useSlack: boolean, useEmail: boolean, reviews: ReviewModel[]
) => {
  const notification = new Notification(app, reviews);

  // 表示件数制御
  if (outputs >= 0 && reviews !== null && reviews.length > outputs) {
    reviews.length = outputs;
  }
  if (useSlack) {
    notification.slack();
  }

  if (useEmail) {
    notification.email();
  }
};

/**
 * 通知処理を行う
 */
export default class Notification {
  app: AppModel;
  reviews: ReviewModel[];

  constructor(app: AppModel, reviews: ReviewModel[],) {
    this.app = app;
    this.reviews = reviews;
  }

  slack() {
    if (this.reviews === null || this.reviews.length === 0) {
      return;
    }

    const channel: string = process.env.SLACK_CHANNEL!; // TODO:ないとエラーにする

    for (let i = 0; i < this.reviews.length; i++) {

      slackClient.webhook({
        channel: "#" + channel,
        username: "reviewet",
        attachments: [
          {
            "fallback": this.app.name + "の新着レビュー : <" + this.app.url + ">",
            "pretext": this.app.name + "の新着レビュー : <" + this.app.url + ">",
            "color": "#529B2F",
            "fields": [
              {
                "title": this.reviews[i].title,
                "value": this.reviews[i].message,
                "short": false
              },
              {
                "title": "Rating",
                "value": new Array(Number(this.reviews[i].rating) + 1).join(':star:'),
                "short": true
              },
              {
                "title": "Post date",
                "value": this.reviews[i].postedAt,
                "short": true
              },
              {
                "title": "OS",
                "value": this.app.kind,
                "short": true
              },
              {
                "title": "Version",
                "value": this.reviews[i].version,
                "short": true
              },
              {
                "title": "Language/Country",
                "value": this.app.langCountryCode,
                "short": true
              },
            ]
          }
        ]
      }, function (err, response) {
        if (err) {
          console.log(formatDate(new Date(), "YYYY/MM/DD hh:mm:ss") + " Error:", err, "\n", response);
        }
        // console.log(response);
      });
    }
  }

  email() {
    if (this.reviews === null || this.reviews.length === 0) {
      return;
    }

    const emailTemplate = fs.readFileSync('./email_template.html', 'utf8');

    let mailBody = '';
    for (let i = 0; i < this.reviews.length; i++) {
      // Placeholderを置換する
      mailBody += emailTemplate
        .replace('{{ app.name }}', this.app.name)
        .replace(/{{ app.url }}/g, this.app.url)
        .replace('{{ review.title }}', this.reviews[i].title)
        .replace('{{ review.message }}', this.reviews[i].message)
        .replace('{{ review.rating }}', new Array(Number(this.reviews[i].rating) + 1).join('☆'))
        .replace('{{ review.postedAt }}', this.reviews[i].postedAt)
        .replace('{{ review.kind }}', this.app.kind)
        .replace('{{ review.version }}', this.reviews[i].version);
    }

    // unicode文字でメールを送信
    const mailOptions: { [s: string]: string } = {  // TODO: これも型が使えないので自分で定義する
      from: `Reviewet <${process.env.EMAIL_FROM!}>`,
      to: process.env.EMAIL_TO!,
      subject: `[Reviewet][${this.app.kind}]${this.app.name}の新着レビュー`,
      html: mailBody
    };
    // メール送信
    emailClient.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        // console.log("Message sent: " + info.response);
      }
    });
  }
}
