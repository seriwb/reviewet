declare module "application" {
  export type IosApp = {
    id: string,
    countryCode: string | string[]
  };

  export type AndroidApp = {
    id: string,
    languageCode: string | string[]
  };
}