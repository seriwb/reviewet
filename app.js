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
// 情報取得元のURLを生成
var iosId = config.appId.iOS;
var androidId = config.appId.android;
var ios_base_url = "http://itunes.apple.com/" + lang_sub + "/rss/customerreviews"

var cronTime = config.cron.time;
var timeZone = config.cron.timeZone;

var DB_PATH = __dirname + "/reviewet.sqlite";

// 初回通知しないオプション（起動後に設定されたレビュー結果を通知しないためのオプション）
var firstTimeIgnore = config.firstTimeIgnore;
// --- ここまで ---

// DB作成
var db = new sqlite3.Database(DB_PATH);
db.serialize(function(){
  db.run(
    "CREATE TABLE IF NOT EXISTS android_review(" +
    "id TEXT PRIMARY KEY, " + // レビューID（重複していたら登録しない）
    "app_name TEXT, " +       // アプリ名
    "title TEXT, " +          // レビュータイトル
    "message TEXT, " +        // レビュー内容
    "rating INTEGER, " +      // 評価
    "updated TEXT, " +        // レビュー投稿日（日付の文字列）
    "version TEXT, " +        // レビューしたアプリのバージョン
    "create_date DATE)"       // 登録日
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
  var url = "https://play.google.com/store/apps/details?id=" + androidId + "&hl=" + lang;
  
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
        console.log("Error:", err, "\n", response);
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
 * Androidのレビュー情報がすでにDBに存在しているかを調べる。
 * レビューIDでのカウント数を返す。（0 or 1）
 * @param condition チェック対象のレビューデータ
 */
function selectRecord(condition) {
  return new Promise(function (resolve, reject) {
    db.serialize(function () {
      db.get('SELECT count(*) as cnt FROM android_review WHERE id = $id',
        { $id: condition.reviewId  },
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
 * AndroidのレビューデータをDBに保存する。
 * テーブルにレビューIDがすでに存在する場合は登録処理をしないでfalseを返す。
 * Insertできた場合はtrueを返す。
 */
function insertAndroidReviewData(appData, reviewData) {
  
  return new Promise(function (resolve, reject) {

    // レコードの有無をチェックする
    var nodata = false;
    selectRecord(reviewData).then(function (result) {
      // console.log('Success:', result.cnt);
      if (result.cnt === 0) {
        nodata = true;
      }
      if (nodata) {
        db.serialize(function(){
          // 挿入用プリペアドステートメントを準備
          var ins_androidReview = db.prepare(
            "INSERT INTO android_review(id, app_name, title, message, rating, updated, version, create_date) " +
            "VALUES(?, ?, ?, ?, ?, ?, ?, ?)");

          ins_androidReview.run(
            reviewData.reviewId, appData.name, reviewData.title, reviewData.message,
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
 * レビュー情報の解析処理。
 * 取得したレビュー情報が新規であればDBに保存し、通知用データとして返却する。
 */
function reviewGetLoop($, appData, element) {

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
    
    var pushData = function (result, reviewData) {
      return new Promise(function (resolve, reject) {
        // レビュー情報が重複している、または初回通知しないオプションが付いていれば通知対象にしない
        if (result && !firstTimeIgnore) {
          resolve(reviewData);
        } else {
          resolve(null);
        }
      });
    }
    // DBに登録を試みて、登録できれば新規レビューなので通知用レビューデータとして返却する
    insertAndroidReviewData(appData, reviewData).then(function(result) {
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
function analyzeAndroidData($, appData, checkDate) {
  
  return new Promise(function(resolve, reject) {
  
    // レビュー本文の後ろにくる「全文を表示」を削除
    $('div.review-link').remove();
    
    // アプリ情報を設定
    appData.name = $('.id-app-title').text();

    // レビュー情報を設定
    var reviewProcess = [];
    $('.single-review').each(function (i, element) {
      reviewProcess.push(reviewGetLoop($, appData, element));
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
 * iOSのレビュー情報を解析して、整形したレビューデータを返却する。
 */
function analyzeIosData($, appData, checkDate) {

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
      appData.name = result.feed.entry[0].title;   // TODO:あとでim:nameに変更
      appData.url = result.feed.entry[0].id[0]._;       // TODO:linkから取る
      
      // レビュー情報を設定
      for (var i=1; i < result.feed.entry.length; i++) {

        var entry = result.feed.entry[i];
        
        // チェック日よりも過去のレビューは表示しない
        if (checkDate != null && entry.updated != null
            && new Date(entry.updated) < checkDate) {
              continue;
        }
        
        var param = [];
        
        // Android側の制御にあわせて日付を文字列で保持する
        param.updated = formatDate(new Date(entry.updated[0]), "YYYY/MM/DD hh:mm:ss");
        param.reviewId = entry.id[0];
        param.title = entry.title[0];
        param.message = entry.content[0]._;
        
        var value;
        for (var key in entry) {
          if (key == 'im:contenttype') value = entry[key];
        }
        for (var key in value[0]) {
          if (key == 'im:rating') {
            param.rating = value[0][key][0];
          }
          else if (key == 'im:version') {
            param.version = value[0][key][0];
          }
        }

        var reviewData = new ReviewData(param);
        reviewDatas.push(reviewData);
      }
    });
    // 通知するレビュー情報があれば、次回チェックの起点となる時刻を更新する
    if (reviewDatas != null && reviewDatas.length > 0) {
      checkDate.setTime(Date.now());
    }
    
    resolve(reviewDatas);
  });
}


function getAppRawData(appData, url, appfunc, checkDate) {
  // アプリのレビューデータを取得
  var client = require('cheerio-httpcli');
  var param = {};
  client.fetch(url, param, function (err, $, res) {
    if (err) {
      console.log(Date.now() + " Error:", err);
      return;
    }
    
    appfunc($, appData, checkDate).then(function (reviewDatas) {
      
      if (config.slack.use) {
        slackNotification(appData, reviewDatas);
      }
      
      if (config.email.use) {
        emailNotification(appData, reviewDatas);
      }
    });
  });
}


function main(checkDate) {
  var ios_url;
  if (iosId != null) {
    ios_url = createIosUrl(iosId, 1);
    var iosApp = new AppData("iOS", iosId);
    
    // iOSアプリのデータ取得
    getAppRawData(iosApp, ios_url, analyzeIosData, checkDate);
  }
  
  var android_url;
  if (androidId != null) {
    android_url = createAndroidUrl(androidId);
    var androidApp = new AppData("Android", androidId);
    androidApp.url = android_url;
    
    // Androidアプリのデータ取得
    getAppRawData(androidApp, android_url, analyzeAndroidData, checkDate);
  }
}


var checkDate;
try {
  var CronJob = require('cron').CronJob;
  new CronJob(cronTime, function() {

    var configDate = config.checkDate;
    
    // 取得対象日が指定されていない場合は現在時刻からチェック開始
    if (checkDate == null && configDate == null) {
      checkDate = new Date();
    }
    // 取得対象日が指定されている場合はその時刻からチェック開始
    else if (checkDate == null && configDate != null) {
      checkDate = new Date(configDate);
    }

    main(checkDate);

    // 通知しない設定をオフにする
    firstTimeIgnore = false;
    
  }, null, true, timeZone);
} catch (ex) {
  console.log("cron pattern not valid");
}
