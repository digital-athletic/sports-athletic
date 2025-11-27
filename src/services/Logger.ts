/**
 * Stub Logger service - full implementation will follow in #70
 * @see: https://github.com/sports-athletics/sports-athletic/issues/70
 */
export class Logger {
  static logEvent = async (eventName: string, params = {}) => {
    if (__DEV__) console.log("Event log: ", eventName, params);
  };

  static logError = async (error: Error) => {
    if (__DEV__) console.log("Error log: ", error);
  };

  static logPurchase = async (
    eventName: string,
    price: number,
    params: {
      type: string;
      currency: string;
    }
  ) => {
    if (__DEV__)
      console.log("Purchase log: ", eventName, price, JSON.stringify(params));
  };
}
