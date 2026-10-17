import { type TFunction } from "i18next";

type SupportMessageKey =
  | "onboarding.errorUnknownMsgRetry"
  | "training.success.dataMissing";

/** Returns the text with the support email, or the `NoEmail` variant when none is set. */
export const supportMessage = (
  t: TFunction,
  key: SupportMessageKey,
  email: string,
): string => (email ? t(key, { email }) : t(`${key}NoEmail` as const));
