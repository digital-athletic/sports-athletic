import { loadTutorials } from "@/data/loadTutorials";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export type Tutorial = {
  id: string;
  title: string;
  video: string;
};

/** The technique videos in display order, titled in the current language. */
export const useTutorials = (): Tutorial[] => {
  const { i18n } = useTranslation();

  return useMemo(() => {
    const locale = i18n.language.startsWith("en") ? "en" : "default";
    return [...loadTutorials()]
      .sort((a, b) => a.ordering - b.ordering)
      .map((tutorial) => ({
        id: `${tutorial.ordering}`,
        title: tutorial.title[locale] || tutorial.title.default,
        video: tutorial.video,
      }));
  }, [i18n.language]);
};
