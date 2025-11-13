// import the original type declarations
import "i18next";
// namespaces
import translations from "@/i18n/locales/en.json";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translations";
    resources: {
      translations: typeof translations;
    };
  }
}
