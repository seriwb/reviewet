process.on('unhandledRejection', console.dir);
// アプリのデータを保持するオブジェクト
// @param string kind ios or android
AppData = function(kind, appId) {
  this.kind = kind;
  this.appId = appId;
};
var appDataParam = {
  name : "",
  url : "",
  recentId : ""
};
AppData.prototype = appDataParam;

// 表示するレビュー情報を保持するオブジェクト
ReviewData = function(param) {
  this.updated = param.updated
  this.reviewId = param.reviewId;
  this.title = param.title;
  this.titleLink = param.titleLink;
  this.message = param.message;
  this.version = param.version;
  this.rating = param.rating;
};

// モジュールの取り込み
var sqlite3 = require('sqlite3').verbose();
var config = require('config');

// --- 初期設定 ---
// 国別コードの指定はjaをメインに、jpをサブにする。
var lang = config.acceptLanguage;
var lang_sub = lang;
if (lang === "ja") {
  lang_sub = "jp"
} else if (lang === "jp") {
  lang = "ja"
}

// IDがnullのものに対しては処理をしない
var iosIds = config.appId.iOS;
if (iosIds != null && !Array.isArray(iosIds)) {
    iosIds = [iosIds];
}
var androidIds = config.appId.android;
if (androidIds != null && !Array.isArray(androidIds)) {
    androidIds = [androidIds];
}

// 情報取得元のURLを生成
var ios_base_url = "http://itunes.apple.com/" + lang_sub + "/rss/customerreviews"

var cronTime = config.cron.time;
var timeZone = config.cron.timeZone;

var DB_PATH = __dirname + "/reviewet.sqlite";

// 初回通知しないオプション（起動後に設定されたレビュー結果を通知しないためのオプション）
var firstTimeIgnore = config.firstTimeIgnore;
var outputs = config.outputs;
// --- ここまで ---

// DB作成
var db = new sqlite3.Database(DB_PATH);
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


/**
 * http://qiita.com/osakanafish/items/c64fe8a34e7221e811d0
 * 日付をフォーマットする
 * @param  {Date}   date     日付
 * @param  {String} [format] フォーマット
 * @return {String}          フォーマット済み日付
 */
var formatDate = function (date, format) {
  if (!format) format = 'YYYY-MM-DD hh:mm:ss.SSS';
  format = format.replace(/YYYY/g, date.getFullYear());
  format = format.replace(/MM/g, ('0' + (date.getMonth() + 1)).slice(-2));
  format = format.replace(/DD/g, ('0' + date.getDate()).slice(-2));
  format = format.replace(/hh/g, ('0' + date.getHours()).slice(-2));
  format = format.replace(/mm/g, ('0' + date.getMinutes()).slice(-2));
  format = format.replace(/ss/g, ('0' + date.getSeconds()).slice(-2));
  if (format.match(/S/g)) {
    var milliSeconds = ('00' + date.getMilliseconds()).slice(-3);
    var length = format.match(/S/g).length;
    for (var i = 0; i < length; i++) format = format.replace(/S/, milliSeconds.substring(i, i + 1));
  }
  return format;
};


/**
 * iOSアプリのレビューデータ取得元のURLを生成する。
 * @param appId 取得対象アプリのAppStore ID
 * @param page ページング
 */
function createIosUrl(appId, page) {
  var url;
  if (page != null && page > 0) {
    url = ios_base_url + "/page=" + page + "/id=" + appId + "/sortBy=mostRecent/xml";
  } else {
    url = ios_base_url + "/id=" + appId + "/sortBy=mostRecent/xml";
  }

  return url;
}


/**
 * Androidアプリのレビューデータ取得元のURLを生成する。
 * @param appId 取得対象アプリのGooglePlay ID
 */
function createAndroidUrl(appId) {
  var url = "https://play.google.com/store/apps/details?id=" + appId + "&hl=" + lang;

  return url;
}


function slackNotification(appData, reviewDatas) {

  if (reviewDatas == null || reviewDatas.length == 0) {
    return;
  }

  var Slack = require('slack-node');

  webhookUri = config.slack.webhook;

  slack = new Slack();
  slack.setWebhook(webhookUri);

  for (var i=0; i < reviewDatas.length; i++) {

    slack.webhook({
      channel: "#" + config.slack.channel,
      username: "reviewet",
      attachments: [
      {
         "fallback":appData.name + "の新着レビュー : <" + appData.url + ">",
         "pretext":appData.name + "の新着レビュー : <" + appData.url + ">",
         "color":"#529B2F",
         "fields":[
            {
               "title":reviewDatas[i].title,
               "value":reviewDatas[i].message,
               "short":false
            },
            {
               "title":"Rating",
               "value":Array(Number(reviewDatas[i].rating)+1).join(':star:'),
               "short":true
            },
            {
               "title":"Updated",
               "value":reviewDatas[i].updated,
               "short":true
            },
            {
               "title":"OS",
               "value":appData.kind,
               "short":true
            },
            {
               "title":"Version",
               "value":reviewDatas[i].version,
               "short":true
            }
         ]
      }
      ]
    }, function(err, response) {
      if (err) {
        console.log(formatDate(new Date(), "YYYY/MM/DD hh:mm:ss") + " Error:", err, "\n", response);
      }
      // console.log(response);
    });
  }
}


function emailNotification(appData, reviewDatas) {

  if (reviewDatas == null || reviewDatas.length == 0) {
    return;
  }

  var fs = require('fs');
  var emailTemplate = fs.readFileSync('./email_template.html', 'utf8');

  var mailBody = '';
  for (var i=0; i < reviewDatas.length; i++) {
    // Placeholderを置換する
    var reviewRow = emailTemplate
                      .replace('{{ appData.name }}', appData.name)
                      .replace(/{{ appData.url }}/g, appData.url)
                      .replace('{{ review.title }}', reviewDatas[i].title)
                      .replace('{{ review.message }}', reviewDatas[i].message)
                      .replace('{{ review.rating }}', Array(Number(reviewDatas[i].rating)+1).join('☆'))
                      .replace('{{ review.updated }}', reviewDatas[i].updated)
                      .replace('{{ review.kind }}', appData.kind)
                      .replace('{{ review.version }}', reviewDatas[i].version);
    mailBody += reviewRow;
  }

  var nodemailer = require("nodemailer");

  // SMTPコネクションプールを作成
  var smtpConfig;
  if (config.email.smtp.auth.user != null) {
    smtpConfig = {
      host: config.email.smtp.host,
      port: config.email.smtp.port,
      secure: config.email.smtp.ssl,
      auth: {
        user: config.email.smtp.auth.user,
        pass: config.email.smtp.auth.pass
      }
    };
  } else {
    smtpConfig = {
      host: config.email.smtp.host,
      port: config.email.smtp.port,
      secure: config.email.smtp.ssl
    };
  }
  var transporter = nodemailer.createTransport(smtpConfig);

  // unicode文字でメールを送信
  var mailOptions = {
      from: "Reviewet <" + config.email.from + ">",
      to: config.email.to,
      subject: "[Reviewet][" + appData.kind + "]" + appData.name + "の新着レビュー",
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


/**
 * レビュー情報がすでにDBに存在しているかを調べる。
 * レビューIDでのカウント数を返す。（0 or 1）
 * @param condition チェック対象のレビューデータ
 * @param kind アプリのOS種別
 */
function selectRecord(condition, kind) {
  return new Promise(function (resolve, reject) {
    db.serialize(function () {
      db.get('SELECT count(*) as cnt FROM review WHERE id = $id AND kind = $kind',
        { $id: condition.reviewId, $kind: kind },
        function (err, res) {
          if (err) {
            return reject(err);
          }
          resolve(res);
        });
    });
  });
}


/**
 * レビューデータをDBに保存する。
 * テーブルにレビューIDがすでに存在する場合は登録処理をしないでfalseを返す。
 * Insertできた場合はtrueを返す。
 */
function insertReviewData(appData, reviewData) {

  return new Promise(function (resolve, reject) {

    selectRecord(reviewData, appData.kind).then(function (result) {

      // レコードの有無をチェックする
      if (result.cnt === 0) {
        db.serialize(function(){
          // 挿入用プリペアドステートメントを準備
          var ins_androidReview = db.prepare(
            "INSERT INTO review(id, kind, app_name, title, message, rating, updated, version, create_date) " +
            "VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)");

          ins_androidReview.run(
            reviewData.reviewId, appData.kind, appData.name, reviewData.title, reviewData.message,
            reviewData.rating, reviewData.updated, reviewData.version, new Date());
          ins_androidReview.finalize();
        });
        resolve(true);
      } else {
        resolve(false);
      }
    }).catch(function (err) {
      console.log('Failure:', err);
      reject(false);
    });

  });
}


/**
 * 通知対象とするかの判定処理
 */
function pushData(result, reviewData) {
  return new Promise(function (resolve, reject) {
    // レビュー情報が重複している、または初回通知しないオプションが付いていれば通知対象にしない
    if (result && !firstTimeIgnore) {
      resolve(reviewData);
    } else {
      resolve(null);
    }
  });
}


/**
 * Androidのレビュー情報の解析処理。
 * 取得したレビュー情報が新規であればDBに保存し、通知用データとして返却する。
 */
function getAndroidReview($, appData, element) {

  return new Promise(function (resolve, reject) {
    var param = [];

    var reviewInfo = $(element).find('.review-info');
    param.reviewId = $(element).find('.review-header').attr('data-reviewid');
    param.updated = $(reviewInfo).find('.review-date').text();

    // TODO:日本語以外にも対応する
    var tempRating = $(reviewInfo).find('.review-info-star-rating .tiny-star').attr('aria-label');
    var trimRatingLength = '5つ星のうち'.length;
    param.rating = tempRating.substring(trimRatingLength, trimRatingLength + 1);

    // アプリバージョンは取れないのでハイフンにする
    param.version = "-";

    var reviewBody = $(element).find('.review-body.with-review-wrapper');
    param.title = $(reviewBody).find('.review-title').text();

    // レビュー本文の前からタイトルを削除し、前後の空白を削除
    var tempMessage = $(reviewBody).text().replace(param.title, "");
    param.message = tempMessage.trim();

    var reviewData = new ReviewData(param);

    // DBに登録を試みて、登録できれば新規レビューなので通知用レビューデータとして返却する
    insertReviewData(appData, reviewData).then(function(result) {
      pushData(result, reviewData).then(function (data) {
        resolve(data)
      });
    });
  });
}


/**
 * Androindのレビュー情報を解析して、整形したレビューデータを返却する。
 * ※Androidは$をそのまま使って処理してみる
 */
function analyzeAndroidData($, appData) {

  return new Promise(function(resolve, reject) {

    // レビュー本文の後ろにくる「全文を表示」を削除
    $('div.review-link').remove();

    // アプリ情報を設定
    appData.name = $('.id-app-title').text();

    // レビュー情報を設定
    var reviewProcess = [];
    $('.single-review').each(function (i, element) {
      reviewProcess.push(getAndroidReview($, appData, element));
    });
    Promise.all(reviewProcess).then(function(datas) {
      var returnDatas = [];
      for (var i=0; i < datas.length; i++) {
        if (datas[i] != null) {
          returnDatas.push(datas[i]);
        }
      }
      resolve(returnDatas);
    });
  });
};


/**
 * iOSのレビュー情報の解析処理。
 * 取得したレビュー情報が新規であればDBに保存し、通知用データとして返却する。
 */
function getIosReview($, appData, entry) {

  return new Promise(function (resolve, reject) {
    var param = [];

    // Android側の制御にあわせて日付を文字列で保持する
    param.updated = formatDate(new Date(entry.updated[0]), "YYYY/MM/DD hh:mm:ss");
    param.reviewId = entry.id[0];
    param.title = entry.title[0];
    param.message = entry.content[0]._;
    param.rating = entry['im:rating'];
    param.version = entry['im:version'] + ''; // 文字列に変換

    var reviewData = new ReviewData(param);

    // DBに登録を試みて、登録できれば新規レビューなので通知用レビューデータとして返却する
    insertReviewData(appData, reviewData).then(function(result) {
      pushData(result, reviewData).then(function (data) {
        resolve(data)
      });
    });
  });
}


/**
 * iOSのレビュー情報を解析して、整形したレビューデータを返却する。
 */
function analyzeIosData($, appData) {

  return new Promise(function(resolve, reject) {

    // RSSの内容を解析してレビューデータを作成
    var parseString = require('xml2js').parseString;
    var reviewDataXml = $.xml();
    //console.log(reviewDataXml);
    var reviewDatas = [];
    parseString(reviewDataXml, function(err, result) {

      // アプリレビューがない場合は終了
      if (result.feed.entry == null) {
        resolve(reviewDatas);
      }

      // アプリ情報を設定
      appData.name = result.feed.entry[0]['im:name'];
      appData.url = result.feed.entry[0].link[0].$.href;

      // レビュー情報を設定
      var reviewProcess = [];
      for (var i=1; i < result.feed.entry.length; i++) {
        var entry = result.feed.entry[i];
        reviewProcess.push(getIosReview($, appData, entry));
      }
      Promise.all(reviewProcess).then(function(datas) {
        var returnDatas = [];
        for (var i=0; i < datas.length; i++) {
          if (datas[i] != null) {
            returnDatas.push(datas[i]);
          }
        }
        resolve(returnDatas);
      });
    });
  });
}


function getAppRawData(appData, url, appfunc, outputs) {
  // アプリのレビューデータを取得
  var client = require('cheerio-httpcli');
  var param = {};
  client.fetch(url, param, function (err, $, res) {
    if (err) {
      console.log(formatDate(new Date(), "YYYY/MM/DD hh:mm:ss") + " Error:", err);
      return;
    }

    appfunc($, appData).then(function (reviewDatas) {

      // 表示件数制御
      if (outputs >= 0 && reviewDatas != null && reviewDatas.length > outputs) {
        reviewDatas.length = outputs;
      }
//      console.log(reviewDatas.length);
      if (config.slack.use) {
        slackNotification(appData, reviewDatas);
      }

      if (config.email.use) {
        emailNotification(appData, reviewDatas);
      }
    });
  });
}


function main(outputs) {
  var iosId, ios_url, iosApp;
  if (iosIds != null) {
    for (var i=0; i < iosIds.length; i++) {
      iosId = iosIds[i];
      ios_url = createIosUrl(iosId, 1);
      iosApp = new AppData("iOS", iosId);

      // iOSアプリのデータ取得
      getAppRawData(iosApp, ios_url, analyzeIosData, outputs);
    }
  }

  var androidId, android_url, androidApp;
  if (androidIds != null) {
    for (var i=0; i < androidIds.length; i++) {
      androidId = androidIds[i];
      android_url = createAndroidUrl(androidId);
      androidApp = new AppData("Android", androidId);
      androidApp.url = android_url;

      // Androidアプリのデータ取得
      getAppRawData(androidApp, android_url, analyzeAndroidData, outputs);
    }
  }
}


try {
  var CronJob = require('cron').CronJob;
  new CronJob(cronTime, function() {

    // 未設定の場合は全件表示
    if (outputs == null) {
      outputs = -1;
    }
    // 文字列から数値変換
    else {
      outputs = parseInt(outputs);
    }

    main(outputs);

    // 通知しない設定をオフにする
    firstTimeIgnore = false;
    outputs = -1;

  }, null, true, timeZone);
} catch (ex) {
  console.log("cron pattern not valid");
}
