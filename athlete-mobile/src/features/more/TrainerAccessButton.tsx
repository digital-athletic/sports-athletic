import { externalLinks } from "@/config/externalLinks";
import { useOpenExternalUrl } from "@/features/more/useOpenExternalUrl";
import { Button } from "@/theme/Button";
import { type FC } from "react";
import { useTranslation } from "react-i18next";

/** Opens the trainer area in the browser; hidden when its link variable is unset. */
export const TrainerAccessButton: FC = () => {
  const { t } = useTranslation();
  const openExternalUrl = useOpenExternalUrl();

  if (externalLinks.trainerArea === "") return null;

  return (
    <Button
      variant="secondary"
      marginTop="m"
      role="link"
      onPress={() => openExternalUrl(externalLinks.trainerArea)}
    >
      {t("more.joinTeam.trainerAccess")}
    </Button>
  );
};
