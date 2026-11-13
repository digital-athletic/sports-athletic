import { externalLinks } from "@/config/externalLinks";
import { featureFlags } from "@/config/featureFlags";
import {
  LINK_A11Y_FEEDBACK,
  LINK_A11Y_STATEMENT,
  LINK_AGB,
  LINK_IMPRINT,
  LINK_PRIVACY,
  SUPPORT_EMAIL,
} from "@/constants/AppConstants";
import { ListItem } from "@/features/more/ListItem";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import IconAccessible from "@tabler/icons-react-native/IconAccessible";
import IconBug from "@tabler/icons-react-native/IconBug";
import IconClipboard from "@tabler/icons-react-native/IconClipboard";
import IconCode from "@tabler/icons-react-native/IconCode";
import IconEdit from "@tabler/icons-react-native/IconEdit";
import IconFileText from "@tabler/icons-react-native/IconFileText";
import IconInfoCircle from "@tabler/icons-react-native/IconInfoCircle";
import IconMail from "@tabler/icons-react-native/IconMail";
import IconMessageDots from "@tabler/icons-react-native/IconMessageDots";
import IconSettings from "@tabler/icons-react-native/IconSettings";
import IconShieldCheck from "@tabler/icons-react-native/IconShieldCheck";

const FormMenuItems: FC = () => {
  const { t } = useTranslation();

  return (
    <>
      {externalLinks.consentU16 !== "" && (
        <ListItem
          title={t("more.consentU16")}
          externalUrl={externalLinks.consentU16}
          icon={IconEdit}
          iconBackground="onSurfaceVariant"
        />
      )}
      {externalLinks.feedbackReport !== "" && (
        <ListItem
          title={t("more.feedbackReport")}
          externalUrl={externalLinks.feedbackReport}
          icon={IconBug}
          iconBackground="onSurfaceVariant"
        />
      )}
      {externalLinks.survey !== "" && (
        <ListItem
          title={t("more.survey")}
          externalUrl={externalLinks.survey}
          icon={IconClipboard}
          iconBackground="onSurfaceVariant"
        />
      )}
    </>
  );
};

const A11yMenuItems: FC = () => {
  const { t } = useTranslation();

  return (
    <>
      {featureFlags.a11yStatementEnabled && (
        <ListItem
          title={t("more.a11yStatement")}
          externalUrl={LINK_A11Y_STATEMENT}
          icon={IconAccessible}
          iconBackground="onSurfaceVariant"
        />
      )}
      {featureFlags.a11yFeedbackEnabled && (
        <ListItem
          title={t("more.a11yFeedback")}
          externalUrl={LINK_A11Y_FEEDBACK}
          icon={IconMessageDots}
          iconBackground="onSurfaceVariant"
        />
      )}
    </>
  );
};

/** Online form, legal, settings and support entries of the More menu; several sit behind feature flags. */
export const InfoMenuItems: FC = () => {
  const { t } = useTranslation();

  return (
    <>
      <FormMenuItems />
      {featureFlags.termsEnabled && (
        <ListItem
          title={t("more.agb")}
          externalUrl={LINK_AGB}
          icon={IconInfoCircle}
          iconBackground="onSurfaceVariant"
        />
      )}
      {featureFlags.privacyEnabled && (
        <ListItem
          title={t("more.privacy")}
          externalUrl={LINK_PRIVACY}
          icon={IconShieldCheck}
          iconBackground="onSurfaceVariant"
        />
      )}
      <ListItem
        title={t("more.notificationsSettings")}
        navPath="/(tabs)/(more)/notifications"
        icon={IconSettings}
        iconBackground="onSurfaceVariant"
      />
      {featureFlags.contactEnabled && (
        <ListItem
          title={t("more.contact")}
          externalUrl={`mailto:${SUPPORT_EMAIL}`}
          icon={IconMail}
          iconBackground="onSurfaceVariant"
        />
      )}
      {featureFlags.imprintEnabled && (
        <ListItem
          title={t("more.imprint")}
          externalUrl={LINK_IMPRINT}
          icon={IconFileText}
          iconBackground="onSurfaceVariant"
        />
      )}
      <A11yMenuItems />
      <ListItem
        title={t("more.thirdPartyNotices.menuItem")}
        navPath="/(tabs)/(more)/third-party-notices"
        icon={IconCode}
        iconBackground="onSurfaceVariant"
      />
    </>
  );
};
