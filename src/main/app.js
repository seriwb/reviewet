process.on('unhandledRejection', console.dir);

// モジュールの取り込み
import app from "./service";

let config = require('config');

const cronTime = config.cron.time;
const timeZone = config.cron.timeZone;

// 初回通知しないオプション（起動後に設定されたレビュー結果を通知しないためのオプション）
let firstTimeIgnore = config.firstTimeIgnore;
let outputs = config.outputs;

try {
  const CronJob = require('cron').CronJob;
  new CronJob(cronTime, function() {

    // 未設定の場合は全件表示
    if (outputs === null) {
      outputs = -1;
    }
    // 文字列から数値変換
    else {
      outputs = parseInt(outputs);
    }

    try {
      app.main(outputs);
    } catch (e) {
      console.log("application error: " + e);
    }

    // 通知しない設定をオフにする
    firstTimeIgnore = false;
    outputs = -1;

  }, null, true, timeZone);
} catch (ex) {
  console.log("cron pattern not valid");
}
