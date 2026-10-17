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

const A11yMenuItems: FC = () => {
  const { t } = useTranslation();

  return (
    <>
      {featureFlags.a11yStatementEnabled && (
        <ListItem
          title={t("more.a11yStatement")}
          externalUrl={LINK_A11Y_STATEMENT}
          iconName="accessibility"
          iconBackground="darkGrey1"
        />
      )}
      {featureFlags.a11yFeedbackEnabled && (
        <ListItem
          title={t("more.a11yFeedback")}
          externalUrl={LINK_A11Y_FEEDBACK}
          iconName="chatbubble-ellipses"
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
          iconName="information-circle"
          iconBackground="darkGrey1"
        />
      )}
      {featureFlags.privacyEnabled && (
        <ListItem
          title={t("more.privacy")}
          externalUrl={LINK_PRIVACY}
          iconName="shield-checkmark"
          iconBackground="darkGrey1"
        />
      )}
      <ListItem
        title={t("more.notificationsSettings")}
        navPath="/(tabs)/(more)/notifications"
        iconName="settings"
        iconBackground="darkGrey1"
      />
      {featureFlags.contactEnabled && (
        <ListItem
          title={t("more.contact")}
          externalUrl={`mailto:${SUPPORT_EMAIL}`}
          iconName="mail"
          iconBackground="darkGrey1"
        />
      )}
      {featureFlags.imprintEnabled && (
        <ListItem
          title={t("more.imprint")}
          externalUrl={LINK_IMPRINT}
          iconName="document-text"
          iconBackground="darkGrey1"
        />
      )}
      <A11yMenuItems />
      <ListItem
        title={t("more.thirdPartyNotices.menuItem")}
        navPath="/(tabs)/(more)/third-party-notices"
        iconName="code-slash"
        iconBackground="darkGrey1"
      />
    </>
  );
};
