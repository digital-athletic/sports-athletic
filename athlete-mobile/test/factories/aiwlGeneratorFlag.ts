const AIWL_GENERATOR_ENV = "EXPO_PUBLIC_AIWL_GENERATOR_ENABLED";

/**
 * Registers hooks that set the AIWL generator build flag for each test of the
 * enclosing describe block and restore the earlier env value afterwards (the
 * variable is deleted when it was unset before).
 *
 * describe.each([false, true])("flag %s", (enabled) => {
 *   setUpAiwlGeneratorFlag(enabled);
 * });
 * → process.env.EXPO_PUBLIC_AIWL_GENERATOR_ENABLED is "false" or "true" in each test
 */
export const setUpAiwlGeneratorFlag = (enabled: boolean): void => {
  let previousValue: string | undefined;
  beforeEach(() => {
    previousValue = process.env[AIWL_GENERATOR_ENV];
    process.env[AIWL_GENERATOR_ENV] = enabled ? "true" : "false";
  });
  afterEach(() => {
    if (previousValue === undefined) delete process.env[AIWL_GENERATOR_ENV];
    else process.env[AIWL_GENERATOR_ENV] = previousValue;
  });
};
