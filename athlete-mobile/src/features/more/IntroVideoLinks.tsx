import { externalLinks } from "@/config/externalLinks";
import { ListItem } from "@/features/more/ListItem";
import { Box } from "@/theme/Box";
import IconPlayerPlay from "@tabler/icons-react-native/IconPlayerPlay";
import { type FC } from "react";
import { useTranslation } from "react-i18next";

/** Links to the introduction video pages for trainers and players, shown above the video list. */
export const IntroVideoLinks: FC = () => {
  const { t } = useTranslation();

  const links = [
    {
      title: t("more.introVideosTrainers"),
      url: externalLinks.introVideosTrainers,
    },
    {
      title: t("more.introVideosPlayers"),
      url: externalLinks.introVideosPlayers,
    },
  ].filter((link) => link.url !== "");

  if (links.length === 0) return null;

  return (
    <Box backgroundColor="surfaceContainerLowest" paddingTop="s" marginBottom="s">
      {links.map((link, index) => (
        <ListItem
          key={link.url}
          title={link.title}
          externalUrl={link.url}
          icon={IconPlayerPlay}
          iconBackground="primary"
          isLast={index === links.length - 1}
        />
      ))}
    </Box>
  );
};
