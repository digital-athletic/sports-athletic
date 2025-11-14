import { ThemeProvider } from "@shopify/restyle";
import {
  RenderOptions,
  render as rnRender,
} from "@testing-library/react-native";
import { FC, PropsWithChildren } from "react";
import "../i18n";
import { theme } from "../theme/theme";

const RootProvider: FC<PropsWithChildren> = ({ children }) => {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

const customRender = <T,>(
  component: React.ReactElement<T>,
  options?: RenderOptions
) => {
  return rnRender(component, { wrapper: RootProvider, ...options });
};

export * from "@testing-library/react-native";
export { customRender as render };
