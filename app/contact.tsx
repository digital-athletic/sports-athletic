import { Box, Button, Text } from "@/components";
import { Link } from "expo-router";
import { ScrollView, TextInput } from "react-native";

/**
 * Contact Screen (Modal)
 *
 * Contact form/support modal.
 * Legacy: Contact (modal route in root navigator)
 */
export default function ContactScreen() {
  return (
    <ScrollView>
      <Box flexGrow={1} padding="l" backgroundColor="mainBackground">
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
              borderColor: "#e0e0e0",
              borderRadius: 8,
              padding: 12,
              fontSize: 16,
              marginBottom: 20,
              backgroundColor: "#f9f9f9",
            }}
            placeholder="Your name"
            placeholderTextColor="#999"
          />

          <Text variant="label" marginBottom="xs">
            Email
          </Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: "#e0e0e0",
              borderRadius: 8,
              padding: 12,
              fontSize: 16,
              marginBottom: 20,
              backgroundColor: "#f9f9f9",
            }}
            placeholder="your.email@example.com"
            placeholderTextColor="#999"
            keyboardType="email-address"
          />

          <Text variant="label" marginBottom="xs">
            Message
          </Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: "#e0e0e0",
              borderRadius: 8,
              padding: 12,
              fontSize: 16,
              marginBottom: 20,
              backgroundColor: "#f9f9f9",
              height: 120,
              textAlignVertical: "top",
            }}
            placeholder="How can we help you?"
            placeholderTextColor="#999"
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
