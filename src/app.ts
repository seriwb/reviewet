process.on('unhandledRejection', console.dir);

import { AndroidApp, IosApp } from 'application';

import { CronJob } from 'cron';
import { androidReview } from './domains/Android';
import { changeToArray } from './utils/array';
import config from 'config';
import http from 'http';
import { iosReview } from './domains/Ios';

const CRON_TIME: string = config.get('cron.time');
const TIME_ZONE: string = config.get('cron.timeZone');
const useSlack: boolean = config.get('slack.use');
const useEmail: boolean = config.get('email.use');


// 通知しない設定
let ignoreNotification: boolean = config.get('firstTimeIgnore');
let outputs: number = config.get('outputs');

// HTTPコネクション数の制限
if (config.get('maxConnections')) {
  http.globalAgent.maxSockets = config.get('maxConnections');
}

try {
  const iosApps: IosApp[] = changeToArray(config.get('app.iOS'));
  const androidApps: AndroidApp[] = changeToArray(config.get('app.android'));

  //  const CronJob = require('cron').CronJob;
  new CronJob(CRON_TIME, function () {

    // 未設定の場合は全件表示
    if (outputs === null) {
      outputs = -1;
    }
    // 文字列から数値変換 // TODO:要らなくなったかも
    // else {
    //   outputs = parseInt(outputs);
    // }

    if (iosApps) {
      try {
        iosReview({ iosApps, outputs, ignoreNotification, useSlack, useEmail });
      } catch (e) {
        console.log("application error(iOS): " + e);
      }
    }

    if (androidApps) {
      try {
        androidReview({ androidApps, outputs, ignoreNotification, useSlack, useEmail });
      } catch (e) {
        console.log("application error(Android): " + e);
      }
    }

    // 通知しない設定をオフにする
    ignoreNotification = false;
    outputs = -1;

  }, null, true, TIME_ZONE);
} catch (ex) {
  console.log("cron pattern not valid");
}
