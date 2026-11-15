import { Logger } from "./Logger";

describe("Logger: logWarning", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("writes the message to the console warnings in development", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

    Logger.logWarning("WU: the generator ignores order");

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith("WU: the generator ignores order");
  });

  it("writes nothing outside development", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const development = __DEV__;
    Object.assign(globalThis, { __DEV__: false });

    try {
      Logger.logWarning("WU: the generator ignores order");
    } finally {
      Object.assign(globalThis, { __DEV__: development });
    }

    expect(warn).not.toHaveBeenCalled();
  });
});
