const AIWL_GENERATOR_ENV = "EXPO_PUBLIC_AIWL_GENERATOR_ENABLED";

/**
 * Registers hooks that set the AIWL generator build flag for each test of the
 * enclosing describe block and clear it afterwards.
 *
 * describe.each([false, true])("flag %s", (enabled) => {
 *   setUpAiwlGeneratorFlag(enabled);
 * });
 * → process.env.EXPO_PUBLIC_AIWL_GENERATOR_ENABLED is "false" or "true" in each test
 */
export const setUpAiwlGeneratorFlag = (enabled: boolean): void => {
  beforeEach(() => {
    process.env[AIWL_GENERATOR_ENV] = enabled ? "true" : "false";
  });
  afterEach(() => {
    delete process.env[AIWL_GENERATOR_ENV];
  });
};
