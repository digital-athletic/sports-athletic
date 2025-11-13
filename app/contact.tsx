import { Box, Button, Text } from "@/components";
import { useAppTheme } from "@/theme";
import { Link } from "expo-router";
import { ScrollView, TextInput } from "react-native";

/**
 * Contact Screen (Modal)
 *
 * Contact form/support modal.
 * Legacy: Contact (modal route in root navigator)
 */
export default function ContactScreen() {
  const { colors } = useAppTheme();
  return (
    <ScrollView>
      <Box flexGrow={1} padding="l" backgroundColor="white">
        <Text variant="title" marginTop="l" marginBottom="s">
          Contact Support
        </Text>
        <Text variant="description">Get in touch with our support team</Text>

        <Box marginBottom="xl">
          <Text variant="label" marginBottom="xs">
            Name
          </Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: colors.lightGrey2,
              borderRadius: 8,
              padding: 12,
              fontSize: 16,
              marginBottom: 20,
              backgroundColor: colors.lightGrey1,
            }}
            placeholder="Your name"
            placeholderTextColor={colors.darkGrey2}
          />

          <Text variant="label" marginBottom="xs">
            Email
          </Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: colors.lightGrey2,
              borderRadius: 8,
              padding: 12,
              fontSize: 16,
              marginBottom: 20,
              backgroundColor: colors.lightGrey1,
            }}
            placeholder="your.email@example.com"
            placeholderTextColor={colors.darkGrey2}
            keyboardType="email-address"
          />

          <Text variant="label" marginBottom="xs">
            Message
          </Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: colors.lightGrey2,
              borderRadius: 8,
              padding: 12,
              fontSize: 16,
              marginBottom: 20,
              backgroundColor: colors.lightGrey1,
              height: 120,
              textAlignVertical: "top",
            }}
            placeholder="How can we help you?"
            placeholderTextColor={colors.darkGrey2}
            multiline
            numberOfLines={6}
          />
        </Box>

        <Box gap="m">
          <Link href="../" asChild>
            <Button>Send Message</Button>
          </Link>

          <Link href="../" asChild>
            <Button variant="secondary">Cancel</Button>
          </Link>
        </Box>
      </Box>
    </ScrollView>
  );
}
