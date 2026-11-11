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
import IconCode from "@tabler/icons-react-native/IconCode";
import IconFileText from "@tabler/icons-react-native/IconFileText";
import IconInfoCircle from "@tabler/icons-react-native/IconInfoCircle";
import IconMail from "@tabler/icons-react-native/IconMail";
import IconMessageDots from "@tabler/icons-react-native/IconMessageDots";
import IconSettings from "@tabler/icons-react-native/IconSettings";
import IconShieldCheck from "@tabler/icons-react-native/IconShieldCheck";

const A11yMenuItems: FC = () => {
  const { t } = useTranslation();

  return (
    <>
      {featureFlags.a11yStatementEnabled && (
        <ListItem
          title={t("more.a11yStatement")}
          externalUrl={LINK_A11Y_STATEMENT}
          icon={IconAccessible}
          iconBackground="darkGrey1"
        />
      )}
      {featureFlags.a11yFeedbackEnabled && (
        <ListItem
          title={t("more.a11yFeedback")}
          externalUrl={LINK_A11Y_FEEDBACK}
          icon={IconMessageDots}
          iconBackground="darkGrey1"
        />
      )}
    </>
  );
};

/** Legal, settings and support entries of the More menu; several sit behind feature flags. */
export const InfoMenuItems: FC = () => {
  const { t } = useTranslation();

  return (
    <>
      {featureFlags.termsEnabled && (
        <ListItem
          title={t("more.agb")}
          externalUrl={LINK_AGB}
          icon={IconInfoCircle}
          iconBackground="darkGrey1"
        />
      )}
      {featureFlags.privacyEnabled && (
        <ListItem
          title={t("more.privacy")}
          externalUrl={LINK_PRIVACY}
          icon={IconShieldCheck}
          iconBackground="darkGrey1"
        />
      )}
      <ListItem
        title={t("more.notificationsSettings")}
        navPath="/(tabs)/(more)/notifications"
        icon={IconSettings}
        iconBackground="darkGrey1"
      />
      {featureFlags.contactEnabled && (
        <ListItem
          title={t("more.contact")}
          externalUrl={`mailto:${SUPPORT_EMAIL}`}
          icon={IconMail}
          iconBackground="darkGrey1"
        />
      )}
      {featureFlags.imprintEnabled && (
        <ListItem
          title={t("more.imprint")}
          externalUrl={LINK_IMPRINT}
          icon={IconFileText}
          iconBackground="darkGrey1"
        />
      )}
      <A11yMenuItems />
      <ListItem
        title={t("more.thirdPartyNotices.menuItem")}
        navPath="/(tabs)/(more)/third-party-notices"
        icon={IconCode}
        iconBackground="darkGrey1"
      />
    </>
  );
};
