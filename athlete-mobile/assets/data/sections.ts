import { SectionPrefix } from "@/features/training/models/SectionPrefix";

type WithDefaultLocale<T> = { default: T } & Record<string, T>;

type LocalizedTargetData = {
    normal: string[];
    highlight: string[];
};

type SectionData = {
    target: WithDefaultLocale<LocalizedTargetData>;
    speed: {
        values: WithDefaultLocale<string[]>;
        description: WithDefaultLocale<string>;
    };
};

// Warning: Normal and Highlight arrays must have the same length
export const SECTIONS_DATA: Record<SectionPrefix, SectionData> = {
    SWR: {
        target: {
            default: {
                normal: [
                    "",
                    " des Körpers als notwendige Voraussetzung für die nachfolgenden Trainings-Schwerpunkte."
                ],
                highlight: ["Erhöhung der Belastbarkeit", ""]
            },
            en: {
                normal: ["Improve the ", " of handball to ", "."],
                highlight: ["basic skills", "play better"]
            }
        },
        speed: {
            values: {
                default: ["3 Sek.", "0 Sek.", "1 Sek."],
                en: ["3 sec", "0 sec", "1 sec"]
            },
            description: {
                default: ""
            }
        }
    },
    MAX: {
        target: {
            default: {
                normal: [
                    "",
                    " als entscheidende Basis für Schnellkraft und Schnellkraftausdauer."
                ],
                highlight: ["Kraftaufbau", ""]
            },
            en: {
                normal: [
                    "Increase your basic ",
                    " to be ",
                    " and ",
                    " in all athletic challenges."
                ],
                highlight: ["power potential", "faster", "stronger"]
            }
        },
        speed: {
            values: {
                default: ["4 Sek.", "0 Sek.", "explosiv"],
                en: ["4 sec", "0 sec", "explosive"]
            },
            description: {
                default: ""
            }
        }
    },
    SA: {
        target: {
            default: {
                normal: [
                    "",
                    " bei wiederkehrenden Belastungen wie ",
                    ", Bewegungen in der ",
                    " oder "
                ],
                highlight: [
                    "Konstante Leistungsfähigkeit",
                    "Sprints",
                    "Abwehr",
                    "Würfen."
                ]
            },
            en: {
                normal: ["", " the time you can hold up your ", "."],
                highlight: ["Increase", "maximum speed"]
            }
        },
        speed: {
            values: {
                default: ["explosiv", "0 Sek.", "explosiv"],
                en: ["explosive", "0 sec", "explosive"]
            },
            description: {
                default: ""
            }
        }
    },
    SK: {
        target: {
            default: {
                normal: [
                    "Erreichung eines möglichst hohen Kraftausstoßes in kürzester Zeit für ",
                    ", ",
                    " und "
                ],
                highlight: [
                    "härtere Würfe",
                    "schnellere Antritte",
                    "höhere Sprünge."
                ]
            },
            en: {
                normal: [
                    "Create the highest power output in the shortest time to ",
                    ", ",
                    " or "
                ],
                highlight: ["throw harder", "release faster", "jump higher"]
            }
        },
        speed: {
            values: {
                default: ["1-2 Sek.", "2 Sek.", "explosiv"],
                en: ["1-2 sec", "2 sec", "explosive"]
            },
            description: {
                default: "Kurze Pause zwischen den Wh.",
                en: "Short breaks between reps"
            }
        }
    }
};

type SectionVideoData = {
    picture: string;
    video: string;
    title: string;
};

export const SECTIONS_VIDEOS: Record<SectionPrefix, SectionVideoData> = {
    SWR: {
        picture: "tutorialPictures/ErklaerungSWR2.jpg",
        video: "tutorialVideos/ErklaerungSWR2.mp4",
        title: "INFO_FOR_MUSCLE_BUILDUP"
    },
    MAX: {
        picture: "tutorialPictures/ErklaerungMaxKraft.jpg",
        video: "tutorialVideos/ErklaerungMaxKraft.mp4",
        title: "INFO_FOR_MAX_FORCE"
    },
    SK: {
        picture: "tutorialPictures/ErklaerungSK.jpg",
        video: "tutorialVideos/ErklaerungSK.mp4",
        title: "INFO_FOR_EXPLOSIVE_POWER"
    },
    SA: {
        picture: "tutorialPictures/ErklaerungSA.jpg",
        video: "tutorialVideos/ErklaerungSA.mp4",
        title: "INFO_FOR_SPEED_ENDURANCE"
    }
};
