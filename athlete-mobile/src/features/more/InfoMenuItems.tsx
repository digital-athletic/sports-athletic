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

const FormMenuItems: FC = () => {
  const { t } = useTranslation();

  return (
    <>
      {externalLinks.consentU16 !== "" && (
        <ListItem
          title={t("more.consentU16")}
          externalUrl={externalLinks.consentU16}
          icon="create"
          iconBackground="darkGrey1"
        />
      )}
      {externalLinks.feedbackReport !== "" && (
        <ListItem
          title={t("more.feedbackReport")}
          externalUrl={externalLinks.feedbackReport}
          icon="bug"
          iconBackground="darkGrey1"
        />
      )}
      {externalLinks.survey !== "" && (
        <ListItem
          title={t("more.survey")}
          externalUrl={externalLinks.survey}
          icon="clipboard"
          iconBackground="darkGrey1"
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
          icon="accessibility"
          iconBackground="darkGrey1"
        />
      )}
      {featureFlags.a11yFeedbackEnabled && (
        <ListItem
          title={t("more.a11yFeedback")}
          externalUrl={LINK_A11Y_FEEDBACK}
          icon="chatbubble-ellipses"
          iconBackground="darkGrey1"
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
          icon="information-circle"
          iconBackground="darkGrey1"
        />
      )}
      {featureFlags.privacyEnabled && (
        <ListItem
          title={t("more.privacy")}
          externalUrl={LINK_PRIVACY}
          icon="shield-checkmark"
          iconBackground="darkGrey1"
        />
      )}
      <ListItem
        title={t("more.notificationsSettings")}
        navPath="/(tabs)/(more)/notifications"
        icon="settings"
        iconBackground="darkGrey1"
      />
      {featureFlags.contactEnabled && (
        <ListItem
          title={t("more.contact")}
          externalUrl={`mailto:${SUPPORT_EMAIL}`}
          icon="mail"
          iconBackground="darkGrey1"
        />
      )}
      {featureFlags.imprintEnabled && (
        <ListItem
          title={t("more.imprint")}
          externalUrl={LINK_IMPRINT}
          icon="document-text"
          iconBackground="darkGrey1"
        />
      )}
      <A11yMenuItems />
      <ListItem
        title={t("more.thirdPartyNotices.menuItem")}
        navPath="/(tabs)/(more)/third-party-notices"
        icon="code-slash"
        iconBackground="darkGrey1"
      />
    </>
  );
};
