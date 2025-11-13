import {
  RenderOptions,
  render as rnRender,
} from "@testing-library/react-native";
import { AppThemeProvider } from "../theme/AppThemeProvider";

const customRender = <T>(
  component: React.ReactElement<T>,
  options?: RenderOptions
) => {
  return rnRender(component, { wrapper: AppThemeProvider, ...options });
};

export * from "@testing-library/react-native";
export { customRender as render };
