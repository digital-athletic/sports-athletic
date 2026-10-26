import { RegionType } from "@/bodyParts/types";
import translations from "@/i18n/locales/en.json";
import { TFunction } from "i18next";
import { GeneratorError } from "./GeneratorError";

type EquipmentItemKey = keyof typeof translations.equipment.items;

/**
 *  builds message to show in generator error message
 *
 * @param e - error to build message for
 * @returns string
 */
export const buildGeneratorErrorMessage = (
  e: GeneratorError,
  t: TFunction,
): string => {
  let message = "";

  switch (e.type) {
    case "NO_EXERCISES":
      message = t("training.generator.errorTitleNoExercisesSubtypeX", {
        subtype: t(`training.generator.errorSubtype.${e.subtype}`),
      });
      if (e.params.length === 0) {
        break;
      }
      message +=
        "\n" +
        t("training.generator.errorTitleNoExercisesParamsX", {
          params:
            e.subtype === "EQUIPMENT"
              ? e.params
                  .map((p) => t(`equipment.items.${p as EquipmentItemKey}`))
                  .join(", ")
              : e.params.join(),
        });
      break;
    case "TOO_MUCH_SORENESS":
      if (e.subtype === "TEST_WORKOUT") {
        message = t("training.generator.errorTitleTooMuchSorenessTestWorkout");
      } else {
        message = t("training.generator.errorTitleTooMuchSorenessSubtypeX", {
          subtype: t(`training.generator.errorSubtype.${e.subtype}`),
        });
        message +=
          "\n" +
          t("training.generator.errorTitleTooMuchSorenessParamsX", {
            params: e.params.reduce((acc, entry) => {
              let result = acc;
              if (result.length === 0) {
                result += t(`region.${entry as RegionType}`);
              } else {
                result += ", " + t(`region.${entry as RegionType}`);
              }
              return result;
            }, ""),
          });
      }
      break;
    case "NO_ANAMNESIS": {
      message += t("training.generator.errorTitleNoAnamnesisParamsX", {
        params: e.params.join(),
      });
      break;
    }
    case "OTHER":
    default:
      message =
        t("training.generator.errorMsgOther") + "\n" + JSON.stringify(e);
      break;
  }
  return message;
};
