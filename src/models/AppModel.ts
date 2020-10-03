/**
 * アプリのデータを保持するクラス
 * @param {string} kind iOs or android
 * @param {string} appId アプリID
 * @param {string} langCountryCode 言語/国コード
 */
export default class AppModel {
  name: string;
  url: string;
  kind: string;
  appId: string;
  langCountryCode: string;
  recentId: string;

  constructor(name: string, url: string, kind: string, appId: string, langCountryCode: string) {
    this.name = name;
    this.url = url;
    this.kind = kind;
    this.appId = appId;
    this.langCountryCode = langCountryCode;
    this.recentId = "";
  }
}
