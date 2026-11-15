/**
 * Registers hooks that set the env flag for each test of the enclosing
 * describe block and restore the earlier env value afterwards (the variable
 * is deleted when it was unset before). An undefined value unsets the flag.
 *
 * setUpEnvFlag("EXPO_PUBLIC_PLAN_GENERATOR_ENABLED", "TRUE");
 * → process.env.EXPO_PUBLIC_PLAN_GENERATOR_ENABLED is "TRUE" in each test
 */
const setUpEnvFlag = (name: string, value: string | undefined): void => {
  let previousValue: string | undefined;
  beforeEach(() => {
    previousValue = process.env[name];
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  });
  afterEach(() => {
    if (previousValue === undefined) delete process.env[name];
    else process.env[name] = previousValue;
  });
};

/**
 * Sets the plan generator build flag to the raw env value for each test of
 * the enclosing describe block; undefined unsets it.
 *
 * setUpPlanGeneratorFlag("true");
 * → process.env.EXPO_PUBLIC_PLAN_GENERATOR_ENABLED is "true" in each test
 */
export const setUpPlanGeneratorFlag = (value: string | undefined): void =>
  setUpEnvFlag("EXPO_PUBLIC_PLAN_GENERATOR_ENABLED", value);
