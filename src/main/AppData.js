// アプリのデータを保持するオブジェクト
// @param string kind ios or android
export default class AppData {
  constructor(kind, appId) {
    this.kind = kind;
    this.appId = appId;
    this.name = "";
    this.url = "";
    this.recentId = "";
  }
}
