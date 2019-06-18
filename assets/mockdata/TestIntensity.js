const TestIntensity = {
    SWR1: {
        weight: {
            startValue: {
                default: 65
            },
            targetValue: {
                default: {
                    beginner: 75,
                    advanced: 80,
                    professional: 90
                }
            },
            adjustment: 5
        },
        repetition: {
            startValue: {
                default: 12
            },
            targetValue: {
                default: 20
            },
            adjustment: {
                default: {
                    default: {
                        TOO_EASY: 2,
                        SUCCEEDED: 1,
                        TOO_HARD: -2
                    }
                },
                m: {
                    advanced: {
                        TOO_EASY: 3,
                        SUCCEEDED: 2,
                        TOO_HARD: -2
                    },
                    professional: {
                        TOO_EASY: 3,
                        SUCCEEDED: 2,
                        TOO_HARD: -2
                    }
                }
            }
        },
        duration: {
            startValue: {
                default: 50
            },
            targetValue: {
                default: 80
            },
            adjustment: {
                default: {
                    default: {
                        TOO_EASY: 10,
                        SUCCEEDED: 5,
                        TOO_HARD: -10
                    }
                },
                m: {
                    advanced: {
                        TOO_EASY: 15,
                        SUCCEEDED: 10,
                        TOO_HARD: -10
                    },
                    professional: {
                        TOO_EASY: 15,
                        SUCCEEDED: 10,
                        TOO_HARD: -10
                    }
                }
            }
        }
    },
    SWR1KG: {
        weight: {
            startValue: {
                default: {}
            },
            targetValue: {
                default: {}
            }
        },
        repetition: {
            startValue: {
                default: 6
            },
            targetValue: {
                default: 20
            },
            adjustment: {
                default: {
                    beginner: {
                        TOO_EASY: 2,
                        SUCCEEDED: 1,
                        TOO_HARD: -2
                    },
                    advanced: {
                        TOO_EASY: 3,
                        SUCCEEDED: 2,
                        TOO_HARD: -2
                    },
                    professional: {
                        TOO_EASY: 4,
                        SUCCEEDED: 2,
                        TOO_HARD: -2
                    }
                },
                k: {
                    default: {
                        TOO_EASY: 2,
                        SUCCEEDED: 1,
                        TOO_HARD: -3
                    }
                }
            }
        },
        duration: {
            startValue: {
                default: 25
            },
            targetValue: {
                default: 80
            },
            adjustment: {
                default: {
                    beginner: {
                        TOO_EASY: 10,
                        SUCCEEDED: 10,
                        TOO_HARD: -10
                    },
                    advanced: {
                        TOO_EASY: 15,
                        SUCCEEDED: 10,
                        TOO_HARD: -10
                    },
                    professional: {
                        TOO_EASY: 20,
                        SUCCEEDED: 10,
                        TOO_HARD: -10
                    }
                },
                k: {
                    default: {
                        TOO_EASY: 10,
                        SUCCEEDED: 5,
                        TOO_HARD: -15
                    }
                }
            }
        }
    },
    SWR2: {
        weight: {
            startValue: {
                default: 70
            },
            targetValue: {
                default: {
                    beginner: 75,
                    advanced: 80,
                    professional: 90
                }
            },
            adjustment: 5
        },
        repetition: {
            startValue: {
                default: 8
            },
            targetValue: {
                default: 12
            },
            adjustment: {
                default: {
                    beginner: {
                        TOO_EASY: 2,
                        SUCCEEDED: 1,
                        TOO_HARD: -1
                    },
                    advanced: {
                        TOO_EASY: 2,
                        SUCCEEDED: 1,
                        TOO_HARD: -2
                    }
                },
                m: {
                    professional: {
                        TOO_EASY: 4,
                        SUCCEEDED: 2,
                        TOO_HARD: -2
                    }
                },
                w: {
                    professional: {
                        TOO_EASY: 2,
                        SUCCEEDED: 1,
                        TOO_HARD: -2
                    }
                }
            }
        },
        duration: {
            startValue: {
                default: 30
            },
            targetValue: {
                default: 50
            },
            adjustment: {
                default: {
                    default: {
                        TOO_EASY: 10,
                        SUCCEEDED: 5,
                        TOO_HARD: -10
                    }
                },
                m: {
                    advanced: {
                        TOO_EASY: 15,
                        SUCCEEDED: 10,
                        TOO_HARD: -10
                    },
                    professional: {
                        TOO_EASY: 15,
                        SUCCEEDED: 10,
                        TOO_HARD: -10
                    }
                }
            }
        }
    },
    SWR2KG: {
        weight: {
            startValue: {
                default: {}
            },
            targetValue: {
                default: {}
            }
        },
        repetition: {
            startValue: {
                default: 6
            },
            targetValue: {
                default: 20
            },
            adjustment: {
                default: {
                    beginner: {
                        TOO_EASY: 2,
                        SUCCEEDED: 1,
                        TOO_HARD: -2
                    },
                    advanced: {
                        TOO_EASY: 3,
                        SUCCEEDED: 2,
                        TOO_HARD: -2
                    },
                    professional: {
                        TOO_EASY: 4,
                        SUCCEEDED: 2,
                        TOO_HARD: -2
                    }
                },
                k: {
                    default: {
                        TOO_EASY: 2,
                        SUCCEEDED: 1,
                        TOO_HARD: -3
                    }
                }
            }
        },
        duration: {
            startValue: {
                default: 25
            },
            targetValue: {
                default: 80
            },
            adjustment: {
                default: {
                    beginner: {
                        TOO_EASY: 10,
                        SUCCEEDED: 10,
                        TOO_HARD: -10
                    },
                    advanced: {
                        TOO_EASY: 15,
                        SUCCEEDED: 10,
                        TOO_HARD: -10
                    },
                    professional: {
                        TOO_EASY: 20,
                        SUCCEEDED: 10,
                        TOO_HARD: -10
                    }
                },
                k: {
                    default: {
                        TOO_EASY: 10,
                        SUCCEEDED: 5,
                        TOO_HARD: -15
                    }
                }
            }
        }
    }
};

export default TestIntensity;
