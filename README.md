# Reviewet

ReviewetはiOSとAndroidのストアレビューを、SlackやEmailで通知するためのプログラムです。

Androidのストアレビューにはレビュー時のバージョン情報がないため、
通知されるAndroidレビューのバージョン情報は「-」になります。


# How to use

## Requirement

- Node.js v8.9.0+

or

- Docker


## Running commands

Reviewetを実行するためには、Node.jsとgitがインストールされた環境で、以下のコマンドを実施してください。

```
$ git clone https://github.com/seriwb/reviewet.git
$ cd reviewet
$ vi config/default.yml    # 変更方法はSetting Cofigurationsを参照
$ npm install
$ npm run build
$ npm run fstart
```

または、Docker環境下で以下のように実施してください。

```
$ git clone https://github.com/seriwb/reviewet.git
$ cd reviewet
$ vi config/default.yml    # 変更方法はSetting Cofigurationsを参照
$ docker build -t reviewet ./
$ docker run -v `pwd`:/reviewet -itd reviewet
```


### Maintenance commands

登録された以下のforeverコマンドを使って、Reviewetのメンテナンスを行うことができます。

| コマンド         | 用途               |
| :--------------- | :----------------- |
| npm run flist    | 稼動状況をチェック |
| npm run fstop    | Reviewetの停止     |
| npm run fstart   | Reviewetの起動     |
| npm run frestart | Reviewetの再起動   |


※一度実行後、データを初期状態に戻したい場合は、reviewetディレクトリ配下に作成される```reviewet.sqlite```を削除して再実行してください。



## Setting Configurations

Reviewetの動作設定は```config/default.yml```を編集することで変更が可能です。

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

**※現在、app.android.languageCodeに日本（ja）以外を指定した場合、AndroidアプリレビューのRatingが取得できません。**

#### 2. cron

本プログラムは1時間毎に定期実行されますが、実行タイミングをcron指定で変更することが可能です。
変更する場合は、cronの「time」にcronの記述方法で設定してください。
左から「秒(オプション)、分、時、日、月、週」になっています。  
「timeZone」には、本プログラムを実行する環境のタイムゾーンを指定してください。

#### 3. firstTimeIgnore

初回起動時に、存在するレビュー結果を無視するかどうかのオプションです。  
起動後の新着レビューだけの通知でよい場合は`true`に、
存在しているレビューを通知させたい場合は`false`にしてください。

#### 4. outputs

初回起動時に、存在するアプリレビューを何件表示するかのオプションです。  
未設定の場合は
※firstTimeIgnoreの値が`true`の場合、この設定値は無視されます。

#### 5. maxConnections

HTTPの同時接続数を制限するオプションです。
未設定の場合は制限されません。
VPSの仕様などで同時接続数に制限がある場合に設定してください。

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


## For Developer

Reviewetの実行コードは、`src/main`配下のコードをbabelでトランスパイルして`dist/main`配下に出力しています。

コード変更後は、以下のコマンドで実行コードを再生成してください。

```
$ npm run clean; npm run build
```

また動作確認には、`npm start`コマンドが利用できます。


### Docker build

以下のようにすることで、Dockerを利用して開発することができます。

```
$ docker build -t reviewet-local ./
$ docker run -v `pwd`:/reviewet -itd reviewet-local /bin/bash
$ docker attach コンテナID
```


## License

MIT License
