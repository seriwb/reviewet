/**
 * アプリのデータを保持するクラス
 * @param {string} kind iOs or android
 * @param {string} appId アプリID
 * @param {string} langCountryCode 言語/国コード
 */
export default class AppData {
  constructor(kind, appId, langCountryCode) {
    this.kind = kind;
    this.appId = appId;
    this.langCountryCode = langCountryCode;
    this.name = "";
    this.url = "";
    this.recentId = "";
  }
}
