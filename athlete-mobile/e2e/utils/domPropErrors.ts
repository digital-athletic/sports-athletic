import { type Page } from "@playwright/test";

// React's warnings for React Native props that reach a DOM element, e.g.
// "Unknown event handler property `onStartShouldSetResponder`" or
// "React does not recognize the `translateX` prop on a DOM element".
const DOM_PROP_ERROR =
  /Unknown event handler property|React does not recognize the|for a non-boolean attribute/;

/**
 * Collects the React DOM prop errors the page logs from now on. Expo web shows
 * each of them as a red error message, so a screen must log none.
 */
export function collectDomPropErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && DOM_PROP_ERROR.test(message.text())) {
      errors.push(message.text());
    }
  });
  return errors;
}
