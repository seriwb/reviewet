import Slack from 'slack-node';
import nodemailer from 'nodemailer';
import fs from 'fs';
import { IConfig } from 'config';

import { formatDate } from '../utils/date';
import AppData from './AppData';
import ReviewData from './ReviewData';

/**
 * 通知処理を行う
 */
export default class Notification {
  appData: AppData;
  reviewDatas: ReviewData[];
  config: IConfig;

  constructor(appData: AppData, reviewDatas: ReviewData[], config: IConfig) {
    this.appData = appData;
    this.reviewDatas = reviewDatas;
    this.config = config;
  }

  slack() {
    if (this.reviewDatas === null || this.reviewDatas.length === 0) {
      return;
    }

    const webhookUri: string = this.config.get('slack.webhook');
    const channel: string = this.config.get('slack.channel');

    let slack = new Slack();
    slack.setWebhook(webhookUri);

    for (let i = 0; i < this.reviewDatas.length; i++) {

      slack.webhook({
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

    // SMTPコネクションプールを作成
    let smtpConfig: { [s: string]: string | { [s: string]: string} }; // TODO:型がexportされていないので、自前で定義すること
    if (this.config.get('email.smtp.auth.user') !== null) {
      smtpConfig = {
        host: this.config.get('email.smtp.host'),
        port: this.config.get('email.smtp.port'),
        secure: this.config.get('email.smtp.ssl'),
        auth: {
          user: this.config.get('email.smtp.auth.user'),
          pass: this.config.get('email.smtp.auth.pass')
        }
      };
    } else {
      smtpConfig = {
        host: this.config.get('email.smtp.host'),
        port: this.config.get('email.smtp.port'),
        secure: this.config.get('email.smtp.ssl')
      };
    }
    const transporter = nodemailer.createTransport(smtpConfig);

    // unicode文字でメールを送信
    const mailOptions: { [s: string]: string } = {  // TODO: これも型が使えないので自分で定義する
      from: "Reviewet <" + this.config.get('email.from') + ">",
      to: this.config.get('email.to'),
      subject: "[Reviewet][" + this.appData.kind + "]" + this.appData.name + "の新着レビュー",
      html: mailBody
    };
    // 先ほど宣言したトランスポートオブジェクトでメールを送信
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        // console.log("Message sent: " + info.response);
      }
    });
  }
}
