# Reviewet

ReviewetはiOSとAndroidのストアレビューを、SlackやEmailで通知するためのプログラムです。

Androidのストアレビューにはレビュー時のバージョン情報がないため、
通知されるAndroidレビューのバージョン情報は「-」になります。


# How to use

## Requirement

- Docker Compose


## Running commands

Reviewetを実行するためには、本リポジトリのデータが配置されたディレクトリ配下で、以下のコマンドを実施してください。

```
$ vi config/default.yml    # 変更方法はSetting Cofigurationsを参照
$ cp .env .env.local
$ vi .env.local            # 環境変数値を設定
$ sudo docker-compose up -d
$ sudo docker-compose exec app yarn start
```

DBのMySQLを別途用意する場合は、`infra/mysql/sql/init.sql`のDDLを対象のDBで実行してください。

### Maintenance

一度実行後、データを初期状態に戻したい場合は、MySQLのreviewetデータベースのreviewテーブルのデータを削除してください。

Docker Composeで起動している場合の手順は以下になります。

```
ホスト側
$ docker-compose exec mysql bash

コンテナ側
# mysql -uadmin -padmin -h mysql reviewet

MySQLコンソール側
> truncate table review;
```


## Setting Configurations

Reviewetの動作設定は、設定ファイルと環境変数値を利用して行います。

### 環境変数

実行環境で以下の環境変数を指定してください。
Docker Composeを利用する場合は、.env.localが利用できます。

SLACK、EMAILは通知を行わない場合、入力不要です。

| 環境変数 | 説明 |
| --- | --- |
| MYSQL_URI | MySQLへの接続URI |
| SLACK_WEBHOOK | Slack通知で利用するWebhook URL |
| SLACK_CHANNEL | Slackの通知先チャンネル名 |
| EMAIL_SMTP_HOST | メール通知に使うSMTPサーバ名 |
| EMAIL_SMTP_PORT | メール通知に使うSMTPのポート |
| EMAIL_SMTP_SSL | SMTPでSSLを有効にする場合はtrue |
| EMAIL_SMTP_USER | SMTPのユーザ |
| EMAIL_SMTP_PASSWORD | SMTPユーザのパスワード |
| EMAIL_FROM | メールの送り元 |
| EMAIL_TO | メールの送信先 |


### 設定ファイル

レビュー通知対象に関しての設定は、```config/default.yml```で行います。

以下の内容が変更可能です。

- レビューを取得するiOSアプリ：app.iOS
- レビューを取得するAndroidアプリ：app.android
- アプリレビューを取得する対象の言語：app.iOS.countryCode, app.android.languageCode
- cron指定による定期実行のタイミング制御（デフォルト1時間置きに実行）：cron
- 初回の通知対象に取得できたレビューをすべて含めるか：firstTimeIgnore
- 初回表示で何件表示するか（未設定の場合は全件）：outputs
  - iOSは最新から、Androidはレビューの表示順からカウント
- HTTP同時接続数の制限：maxConnections
- Slack通知の利用設定：slack
- Email通知の利用設定：email


### Points of the changes

```yaml
app:
  iOS:
    id: 490217893
    countryCode: jp
  android:
    id: com.google.android.googlequicksearchbox
    languageCode: ja
cron:
  time: '0 * * * *'
  timeZone: Asia/Tokyo

firstTimeIgnore: true
outputs: 3
maxConnections: 1
```

#### 1. app

レビューを取得するアプリのIDを、iOSの場合はappの「iOS」に、Androidの場合は「android」に設定してください。（デフォルト値はサンプルです）
OS毎に複数のアプリ、複数の国（iOS）・国（android）のレビュー取得をすることも可能です。以下のようにリスト形式で指定してください。

```yaml
app:
  iOS:
    - id: 490217893
      countryCode: jp
    - id: 544007664
      countryCode:
        - jp
        - us
  android:
    - id: com.google.android.googlequicksearchbox
      languageCode: ja
    - id: com.apple.android.music
      languageCode:
        - fr
        - it
```

レビュー情報取得を利用しない場合は、対象のOSのappの値を空にしてください。
（例えばGoogle Playからの情報を取得しない場合は```andorid: ```としてください）

#### 2. cron

本プログラムは1時間毎に定期実行されますが、実行タイミングをcron指定で変更することが可能です。

変更する場合は、cronの「time」にcronの記述方法で設定してください。  
左から「秒(オプション)、分、時、日、月、週」になっています。

「timeZone」には、本プログラムを実行する環境のタイムゾーンを指定してください。

#### 3. firstTimeIgnore

初回起動時に、存在するレビュー結果を通知するかどうかのオプションです。  
起動後の新着レビューだけの通知でよい場合は`true`に、
存在しているレビューを通知させたい場合は`false`にしてください。

#### 4. outputs

初回起動時に、存在するアプリレビューを何件表示するかのオプションです。  
未設定の場合は全件表示されます。

**※firstTimeIgnoreの値が`true`の場合、この設定値は無視されます。**

#### 5. maxConnections

HTTPの同時接続数を制限するオプションです。
未設定の場合は制限されません。
VPSの仕様などで同時接続数に制限がある場合に設定してください。

### to use Slack notification

```yaml
slack:
  use: true
```

slackの「use」をtrueにすると、Slack通知機能が有効になります。（無効にする場合はfalse）


### to use Email sending

```yaml
email:
  use: true
```

emailの「use」をtrueにすると、メール通知機能が有効になります。（無効にする場合はfalse。デフォルトはfalse）

有効にした場合は、環境変数のSMTP関連の各項目にメールを送信するSMTPサーバの情報を入力してください。

※Gmailで送信する場合は、対象アカウントの「安全性の低いアプリの許可」を有効にする必要があります。詳細は以下を参照してください。

> To use Gmail you may need to configure ["Allow Less Secure Apps"](https://www.google.com/settings/security/lesssecureapps) in your Gmail account unless you are using 2FA in which case you would have to create an [Application Specific](https://security.google.com/settings/security/apppasswords) password. You also may need to unlock your account with ["Allow access to your Google account"](https://accounts.google.com/DisplayUnlockCaptcha) to use SMTP.

- https://github.com/nodemailer/nodemailer#tldr-usage-example


## For Developer

Reviewetの実行コードは、`src`配下のコードをwebpackでトランスパイルして`dist/main`配下に出力しています。

コード変更後は、以下のコマンドで実行コードを再生成してください。

```
$ yarn run clean; yarn build
```

また動作確認には、`yarn start`コマンドが利用できます。



## License

MIT License
