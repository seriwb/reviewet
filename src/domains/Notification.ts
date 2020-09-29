import AppData from '../models/AppData';
import ReviewData from '../models/ReviewData';
import client from 'cheerio-httpcli';
import { emailClient } from '../lib/email';
import { formatDate } from '../utils/date';
import fs from 'fs';
import { slackClient } from '../lib/slack';

/**
 * 通知処理を行う
 */
export default class Notification {
  appData: AppData;
  reviewDatas: ReviewData[];

  constructor(appData: AppData, reviewDatas: ReviewData[],) {
    this.appData = appData;
    this.reviewDatas = reviewDatas;
  }

  slack() {
    if (this.reviewDatas === null || this.reviewDatas.length === 0) {
      return;
    }

    const channel: string = process.env.SLACK_CHANNEL!; // TODO:ないとエラーにする

    for (let i = 0; i < this.reviewDatas.length; i++) {

      slackClient.webhook({
        channel: "#" + channel,
        username: "reviewet",
        attachments: [
          {
            "fallback": this.appData.name + "の新着レビュー : <" + this.appData.url + ">",
            "pretext": this.appData.name + "の新着レビュー : <" + this.appData.url + ">",
            "color": "#529B2F",
            "fields": [
              {
                "title": this.reviewDatas[i].title,
                "value": this.reviewDatas[i].message,
                "short": false
              },
              {
                "title": "Rating",
                "value": new Array(Number(this.reviewDatas[i].rating) + 1).join(':star:'),
                "short": true
              },
              {
                "title": "Updated",
                "value": this.reviewDatas[i].updated,
                "short": true
              },
              {
                "title": "OS",
                "value": this.appData.kind,
                "short": true
              },
              {
                "title": "Version",
                "value": this.reviewDatas[i].version,
                "short": true
              },
              {
                "title": "Language/Country",
                "value": this.appData.langCountryCode,
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
    if (this.reviewDatas === null || this.reviewDatas.length === 0) {
      return;
    }

    const emailTemplate = fs.readFileSync('./email_template.html', 'utf8');

    let mailBody = '';
    for (let i = 0; i < this.reviewDatas.length; i++) {
      // Placeholderを置換する
      mailBody += emailTemplate
        .replace('{{ appData.name }}', this.appData.name)
        .replace(/{{ appData.url }}/g, this.appData.url)
        .replace('{{ review.title }}', this.reviewDatas[i].title)
        .replace('{{ review.message }}', this.reviewDatas[i].message)
        .replace('{{ review.rating }}', new Array(Number(this.reviewDatas[i].rating) + 1).join('☆'))
        .replace('{{ review.updated }}', this.reviewDatas[i].updated)
        .replace('{{ review.kind }}', this.appData.kind)
        .replace('{{ review.version }}', this.reviewDatas[i].version);
    }

    // unicode文字でメールを送信
    const mailOptions: { [s: string]: string } = {  // TODO: これも型が使えないので自分で定義する
      from: `Reviewet <${process.env.EMAIL_FROM!}>`,
      to: process.env.EMAIL_TO!,
      subject: `[Reviewet][${this.appData.kind}]${this.appData.name}の新着レビュー`,
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


/**
 * 対象OSのアプリレビューを取得して通知する
 *
 * @param appfunc OS別のレビュー取得処理
 */
export const noticeAppReview = (
  appData: AppData, url: string, outputs: number, useSlack: boolean, useEmail: boolean,
  appfunc: ($: any, appData: AppData) => Promise<ReviewData[]>
) => {

  // アプリのレビューデータを取得
  let param = {};
  client.fetch(url, param, (err, $, res) => {
    if (err) {
      console.log(formatDate(new Date(), "YYYY/MM/DD hh:mm:ss") + " Error:", err);
      return;
    }

    appfunc($, appData).then((reviewDatas) => {
      const notification = new Notification(appData, reviewDatas);
      // 表示件数制御
      if (outputs >= 0 && reviewDatas !== null && reviewDatas.length > outputs) {
        reviewDatas.length = outputs;
      }
      if (useSlack) {
        notification.slack();
      }

      if (useEmail) {
        notification.email();
      }
    });
  });
};