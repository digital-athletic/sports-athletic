// @tabler/icons-react-native 3.50 maps the types of its per-icon entry points
// ("@tabler/icons-react-native/IconBarbell") to a folder it does not ship, so
// TypeScript finds no types there. Every per-icon entry point default-exports
// one icon component.
declare module "@tabler/icons-react-native/*" {
  import type { Icon } from "@tabler/icons-react-native";

  const icon: Icon;
  export default icon;
}
