/**
 * アプリのデータを保持するクラス
 * @param {string} kind iOs or android
 * @param {string} appId アプリID
 * @param {string} langCountryCode 言語/国コード
 */
export default class AppData {
  kind: string;
  appId: string;
  langCountryCode: string;
  name: string;
  url: string;
  recentId: string;

  constructor(kind: string, appId: string, langCountryCode: string) {
    this.kind = kind;
    this.appId = appId;
    this.langCountryCode = langCountryCode;
    this.name = "";
    this.url = "";
    this.recentId = "";
  }
}
