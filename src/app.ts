process.on('unhandledRejection', console.dir);

// モジュールの取り込み
import config from 'config';
import { CronJob } from 'cron';
import http from 'http';

import Review from './models/Review';

const CRON_TIME: string = config.get('cron.time');
const TIME_ZONE: string = config.get('cron.timeZone');


// 通知しない設定
let ignoreNotification: boolean = config.get('firstTimeIgnore');
let outputs: number = config.get('outputs');

// DB作成
// TODO: 消すやつ
const sqlite3 = require('sqlite3').verbose();
const DB_PATH = process.cwd() + "/reviewet.sqlite";
const db = new sqlite3.Database(DB_PATH);
db.serialize(function(){
  db.run(
    "CREATE TABLE IF NOT EXISTS review(" +
    "id TEXT, " +             // レビューID（重複していたら登録しない）
    "kind TEXT, " +           // アプリのOS種別
    "app_name TEXT, " +       // アプリ名
    "title TEXT, " +          // レビュータイトル
    "message TEXT, " +        // レビュー内容
    "rating INTEGER, " +      // 評価
    "updated TEXT, " +        // レビュー投稿日（日付の文字列）
    "version TEXT, " +        // レビューしたアプリのバージョン
    "create_date DATE, " +    // 登録日
    "PRIMARY KEY (id, kind))"
  );
});

// HTTPコネクション数の制限
if (config.get('maxConnections')) {
  http.globalAgent.maxSockets = config.get('maxConnections');
}

try {
//  const CronJob = require('cron').CronJob;
  new CronJob(CRON_TIME, function() {

    // 未設定の場合は全件表示
    if (outputs === null) {
      outputs = -1;
    }
    // 文字列から数値変換 // TODO:要らなくなったかも
    // else {
    //   outputs = parseInt(outputs);
    // }

    try {
      let app = new Review(outputs, ignoreNotification, config, db);
      app.main();
    } catch (e) {
      console.log("application error: " + e);
    }

    // 通知しない設定をオフにする
    ignoreNotification = false;
    outputs = -1;

  }, null, true, TIME_ZONE);
} catch (ex) {
  console.log("cron pattern not valid");
}
