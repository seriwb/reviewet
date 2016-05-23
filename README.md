# Reviewet

ReviewetはiOSとAndroidのストアレビューを、SlackやEmailで通知するためのプログラムです。

## How to use

### Requirement

- node.js v5+

### Running Command

```
$ git clone git@github.com:seriwb/reviewet.git
$ cd reviewet
$ vi config/default.yml    # 変更方法はSetting Cofigurationsを参照
$ npm install
$ node app.js
```

### Setting Configurations

Reviewetの動作設定は```config/default.yml```を編集することで変更が可能です。

以下の内容が変更可能です。

- レビューを取得するiOSアプリ
- レビューを取得するAndroidアプリ
- アプリの対象言語
- Slack通知の利用設定
- Email通知の利用設定


#### to use Slack notification

#### to use Email sending

## MIT License
