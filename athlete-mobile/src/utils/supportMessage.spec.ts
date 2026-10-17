import { type TFunction } from "i18next";
import { supportMessage } from "./supportMessage";

describe("supportMessage", () => {
  const t = jest.fn((key: string, options?: { email?: string }) =>
    options?.email ? `${key} ${options.email}` : key,
  ) as unknown as TFunction;

  it("passes the email to the text when it is set", () => {
    expect(
      supportMessage(
        t,
        "onboarding.errorUnknownMsgRetry",
        "support@example.com",
      ),
    ).toBe("onboarding.errorUnknownMsgRetry support@example.com");
  });

  it("uses the NoEmail variant of the onboarding text when the email is empty", () => {
    expect(supportMessage(t, "onboarding.errorUnknownMsgRetry", "")).toBe(
      "onboarding.errorUnknownMsgRetryNoEmail",
    );
  });

  it("uses the NoEmail variant of the data missing text when the email is empty", () => {
    expect(supportMessage(t, "training.success.dataMissing", "")).toBe(
      "training.success.dataMissingNoEmail",
    );
  });
});
