# Reviewet

ReviewetはiOSとAndroidのストアレビューを、SlackやEmailで通知するためのプログラムです。

# How to use

## Requirement

- node.js v6+


## Running Command

```
$ git clone git@github.com:seriwb/reviewet.git
$ cd reviewet
$ vi config/default.yml    # 変更方法はSetting Cofigurationsを参照
$ npm install
$ node app.js
```

※一度実行後、データを初期状態に戻したい場合は、reviewetディレクトリ配下に作成される```reviewet.sqlite```を削除してから```node app.js```コマンドを実行してください。


## Setting Configurations

Reviewetの動作設定は```config/default.yml```を編集することで変更が可能です。

以下の内容が変更可能です。

- レビューを取得するiOSアプリ
- レビューを取得するAndroidアプリ
- アプリレビューを取得する対象の言語
- cron指定による定期実行のタイミング制御（デフォルト1時間置きに実行）
- 初回の通知対象とするレビューをいつからのものにするか（iOSのみ）
- 初回の通知対象に取得できたレビューをすべて含めるか（Androidのみ）
- Slack通知の利用設定
- Email通知の利用設定

### Points of the changes

```yaml
appId:
  iOS: 490217893
  android: com.google.android.googlequicksearchbox
acceptLanguage: ja
cron:
  time: '* * */1 * * *'
  timeZone: Asia/Tokyo
checkDate: '2016-06-01T12:00:00+09:00'
firstTimeIgnore: false
```

#### 1. appId  

レビューを取得するアプリのIDを、iOSの場合はappIdの「iOS」に、Androidの場合は「android」に設定してください。（デフォルト値はサンプルです）

レビュー情報取得を利用しない場合は、対象のOSのappIdの値を空にしてください。  
（例えばGoogle Playからの情報を取得しない場合は```andorid: ```としてください）

#### 2. acceptLanguage

レビューを取得するストアの言語を国別コードで指定してください。

**※現在、acceptLanguageに日本（ja）以外を指定した場合、AndroidアプリレビューのRatingが取得できません。**

#### 3. cron

本プログラムは1時間毎に定期実行されますが、実行タイミングをcron指定で変更することが可能です。
変更する場合は、cronの「time」にcronの記述方法で設定してください。
左から「秒、分、時、日、月、週」になっています。  
「timeZone」には、本プログラムを実行する環境のタイムゾーンを指定してください。

#### 4. checkDate

「checkDate」は、プログラムが初回に通知対象とするレビューを、いつに投稿されたものからかを指定するため項目です。
設定しなかった場合は、取得可能なレビュー全てが通知対象となります。

**※現在、App StoreのレビューはRSSの1ページ分までしか取得できません。**

#### 5. firstTimeIgnore

初回起動時に、存在するAndroidのレビュー結果を無視するかどうかのオプションです。  
起動後の新着レビューだけの通知でよい場合は、trueにしてください。


### to use Slack notification

```yaml
slack:
  use: true
  webhook: https://xxxxxxxxxxxxxxxxxxx
  channel: channelname
```

slackの「use」をtrueにすると、Slack通知機能が有効になります。（無効にする場合はfalse）

有効にした場合は、「webhook」にSlackのIncoming WebHooks IntegrationのWebhook URLを設定して、
結果を出力するチャンネル名を#を除いて「channel」に設定してください。


### to use Email sending

```yaml
email:
  use: true
  smtp:
    host: smtp.gmail.com
    port: 465
    ssl: true
    auth:
      user: 'username@gmail.com'
      pass: 'userpassword'
  from: 'sendFrom@mail.com'
  to: 'sendTo@mail.com'
```

emailの「use」をtrueにすると、メール通知機能が有効になります。（無効にする場合はfalse。デフォルトはfalse）

有効にした場合は、「smtp」の各項目にメールを送信するSMTPサーバの情報を入力してください。

※Gmailで送信する場合は、対象アカウントの「安全性の低いアプリの許可」を有効にする必要があります。詳細は以下を参照してください。

> To use Gmail you may need to configure ["Allow Less Secure Apps"](https://www.google.com/settings/security/lesssecureapps) in your Gmail account unless you are using 2FA in which case you would have to create an [Application Specific](https://security.google.com/settings/security/apppasswords) password. You also may need to unlock your account with ["Allow access to your Google account"](https://accounts.google.com/DisplayUnlockCaptcha) to use SMTP.

- https://github.com/nodemailer/nodemailer#tldr-usage-example


## MIT License
