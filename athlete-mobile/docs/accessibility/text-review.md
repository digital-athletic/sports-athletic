# Text review: error texts and consent

This review rates texts key by key. It belongs to the accessibility assessment under the BFSG. A text passes ("Yes") when it follows the [plain language style guide](../../../docs/accessibility/plain-language-style-guide.md). Error texts state what happened and what the person can do (WCAG 3.3.1). Consent texts state clearly what the person agrees to (GDPR Art. 7). A key marked "unchanged" passed the review and stays as it is.

The German strings in the "Before (de)" and "After (de)" columns come from `src/i18n/locales/de.json`. The English texts in `en.json` carry the same meaning in plain English.

| Key | Criterion | Before (de) | After (de) | Passes |
|---|---|---|---|---|
| `common.error` | WCAG 3.3.1 | Ein unerwarteter Fehler ist aufgetreten. | Die App konnte das nicht abschließen. Versuche es noch einmal. | Yes |
| `common.videoLoadError` | WCAG 3.3.1 | Video konnte nicht geladen werden | Die App konnte das Video nicht laden. Prüfe deine Internetverbindung und versuche es noch einmal. | Yes |
| `common.bodyParts.selectHurtingParts` | Direct address (rule 2) | Bitte wählen Sie die Bereiche, die Ihnen weh tun | Wähle die Bereiche, die dir weh tun | Yes |
| `more.deleteFailed` | WCAG 3.3.1 | Löschen fehlgeschlagen | Die App konnte dein Konto nicht löschen. Prüfe deine Internetverbindung und versuche es noch einmal. | Yes |
| `more.logoutFailed` | WCAG 3.3.1 | Abmelden fehlgeschlagen | Die App konnte dich nicht abmelden. Versuche es noch einmal. | Yes |
| `more.joinTeam.errorInvalidCode` | WCAG 3.3.1 | Ungültiger Einladungscode. | Den Einladungscode gibt es nicht. Prüfe den Code und gib ihn noch einmal ein. | Yes |
| `more.joinTeam.errorAlreadyMember` | WCAG 3.3.1 | Du bist bereits Mitglied dieses Teams. | unchanged | Yes |
| `more.joinTeam.errorExpired` | WCAG 3.3.1 | Dieser Einladungscode ist abgelaufen. | Der Einladungscode ist abgelaufen. Bitte die Person, die dich eingeladen hat, um einen neuen Code. | Yes |
| `more.joinTeam.errorInactive` | WCAG 3.3.1 | Dieser Einladungscode ist nicht mehr aktiv. | Der Einladungscode gilt nicht mehr. Bitte die Person, die dich eingeladen hat, um einen neuen Code. | Yes |
| `more.joinTeam.errorMaxUses` | WCAG 3.3.1 | Dieser Einladungscode hat die maximale Anzahl an Verwendungen erreicht. | Zu viele Personen haben den Einladungscode schon benutzt. Bitte die Person, die dich eingeladen hat, um einen neuen Code. | Yes |
| `more.joinTeam.errorGeneric` | WCAG 3.3.1 | Etwas ist schiefgelaufen. Bitte versuche es erneut. | Die App konnte das nicht abschließen. Versuche es noch einmal. | Yes |
| `more.joinTeam.leaveErrorNotMember` | WCAG 3.3.1 | Du bist kein Mitglied dieses Teams. | unchanged | Yes |
| `more.joinTeam.leaveErrorNotFound` | WCAG 3.3.1 | Team nicht gefunden. | Die App hat dieses Team nicht gefunden. Versuche es später noch einmal. | Yes |
| `more.joinTeam.leaveErrorOwner` | WCAG 3.3.1 | Der Teaminhaber kann das Team nicht verlassen. | Du bist Inhaber dieses Teams. Inhaber können ein Team nicht verlassen. | Yes |
| `onboarding.alertErrorTitle` | WCAG 3.3.1 | Fehler | Das hat nicht geklappt | Yes |
| `onboarding.alertAnErrorOccuredTitle` | WCAG 3.3.1 | Ein Fehler ist aufgetreten. | Die App konnte das nicht abschließen. Versuche es noch einmal. | Yes |
| `onboarding.errorInvalidMailAdressTitle` | WCAG 3.3.1 | Ungültige E-Mail Adresse | E-Mail-Adresse ungültig | Yes |
| `onboarding.errorInvalidMailAdressMsg` | WCAG 3.3.1 | Bitte gib eine valide E-Mail Adresse an. | Die E-Mail-Adresse ist ungültig. Prüfe sie auf Tippfehler und gib sie noch einmal ein. | Yes |
| `onboarding.invalidEmail` | WCAG 3.3.1 | Bitte gib eine gültige E-Mail Adresse an! | Die E-Mail-Adresse ist ungültig. Prüfe sie auf Tippfehler. | Yes |
| `onboarding.invalidVerificationCode` | WCAG 3.3.1 | Der eingegebene Code ist ungültig oder abgelaufen. Bitte versuche es erneut oder fordere einen neuen Code an. | Der Code ist falsch oder abgelaufen. Gib ihn noch einmal ein oder fordere einen neuen Code an. | Yes |
| `onboarding.errorMessageTooManyRequests` | WCAG 3.3.1 | Zu viele Anfragen. Bitte warte einen Moment und versuche es erneut. | Du hast es zu oft hintereinander versucht. Warte einen Moment und versuche es dann noch einmal. | Yes |
| `onboarding.errorMessageNoInternetConnection` | WCAG 3.3.1 | Für die Registrierung benötigst du eine stabile Internetverbindung. (visible \n\n) | Die App hat keine Internetverbindung. Du brauchst sie für die Registrierung. (paragraph) Verbinde dich mit dem Internet und versuche es noch einmal. | Yes |
| `onboarding.errorUnknownMsgRetry` | WCAG 3.3.1 | Bitte versuche es noch einmal oder kontaktiere uns unter [[E-Mail-Adresse für Kontakt]]. (visible \n\n) Vielen Dank | Die Registrierung hat nicht geklappt. Versuche es noch einmal. (paragraph) Hilft das nicht, schreibe uns an [[E-Mail-Adresse für Kontakt]]. Du kannst auch die App neu installieren. | Yes |
| `onboarding.errorTitleAcceptPrivacyInfo` | WCAG 3.3.1 | AGBs akzeptieren | Zustimmung fehlt | Yes |
| `onboarding.errorMessageAcceptPrivacyInfo` | WCAG 3.3.1 | Bitte akzeptiere unsere AGBs und Datenschutzbestimmungen. | Ohne Zustimmung kannst du nicht weitermachen. Setze den Haken bei der Zustimmung zu den Bedingungen. | Yes |
| `onboarding.errorMessageAcceptHealth` | WCAG 3.3.1 | Bitte erlaube uns, deine Gesundheitsdaten für personalisierte Trainingspläne zu verarbeiten. | Ohne Zustimmung kann die App keinen Trainingsplan für dich erstellen. Setze den Haken bei den Gesundheitsdaten. | Yes |
| `onboarding.errorMessageAcceptAnalytics` | WCAG 3.3.1 | Bitte stimme zu, durch das Teilen von Nutzungsdaten zur Verbesserung der App beizutragen. | Ohne Zustimmung kannst du nicht weitermachen. Setze den Haken bei den Nutzungsdaten. | Yes |
| `onboarding.errorMessageConsentSaveFailed` | WCAG 3.3.1 | Deine Einwilligung konnte nicht gespeichert werden. Bitte prüfe deine Verbindung und versuche es erneut. | Die App konnte deine Zustimmung nicht speichern. Prüfe deine Internetverbindung und versuche es noch einmal. | Yes |
| `onboarding.consentTitle` | GDPR Art. 7 | Datenschutz | unchanged | Yes |
| `onboarding.consentSubtitle` | GDPR Art. 7 | Um die App weiter zu nutzen, akzeptiere bitte unsere Datenschutzbestimmungen. | Bevor du die App weiter nutzt, musst du den Datenschutzbestimmungen zustimmen. | Yes |
| `onboarding.privacyFull` | GDPR Art. 7 | Mit der Anmeldung erkläre ich mich mit den AGB und Datenschutzbestimmungen von Sports Athletic einverstanden. | Ich stimme den Allgemeinen Geschäftsbedingungen (AGB) und den Datenschutzbestimmungen von Sports Athletic zu. | Yes |
| `onboarding.privacySimple` | GDPR Art. 7 | Mit der Anmeldung erkläre ich mich mit den Datenschutzbestimmungen einverstanden. | Ich stimme den Datenschutzbestimmungen von Sports Athletic zu. | Yes |
| `onboarding.anonymisedDataUse` | GDPR Art. 7 | Ich bin damit einverstanden, durch das Teilen von Nutzungsdaten zur Verbesserung der App beizutragen. | Ich stimme zu, dass ich Nutzungsdaten teile, um die App zu verbessern. | Yes |
| `onboarding.healthConsent` | GDPR Art. 9 | Ich bin damit einverstanden, dass für die Erstellung persönlicher Trainingspläne meine Gesundheitsdaten verarbeitet werden. | Ich stimme zu, dass die App meine Gesundheitsdaten verarbeitet, um meine persönlichen Trainingspläne zu erstellen. | Yes |
| `onboarding.consentAccept` | WCAG 2.4.6 (button starts with a verb) | Weiter | unchanged | Yes |
| `onboarding.checkboxAnonymisedDataUse` | WCAG 4.1.2 | Nutzungsdaten zur Verbesserung der App teilen | Zustimmen: Nutzungsdaten teilen, um die App zu verbessern | Yes |
| `onboarding.checkboxPrivacyFull` | WCAG 4.1.2 | AGB und Datenschutzbestimmungen akzeptieren | Zustimmen: AGB und Datenschutzbestimmungen | Yes |
| `onboarding.checkboxPrivacySimple` | WCAG 4.1.2 | Datenschutzbestimmungen akzeptieren | Zustimmen: Datenschutzbestimmungen | Yes |
| `screens.generating.errorTitle` | WCAG 3.3.1 | Ein Fehler ist aufgetreten | Plan nicht erstellt | Yes |
| `screens.generating.errorMessage` | WCAG 3.3.1 | Mit diesen Daten konnten wir leider keinen passenden Trainingsplan erzeugen. Unsere Entwickler wurden informiert. | Die App konnte mit deinen Angaben keinen Trainingsplan erstellen. Unsere Entwickler wissen Bescheid. Tippe auf OK und versuche es später noch einmal. | Yes |
| `training.active.syncIndicator.failed` | WCAG 3.3.1, technical term "Synchronisation" | Synchronisierung fehlgeschlagen | Daten nicht gesendet | Yes |
| `training.active.syncIndicator.failedTitle` | WCAG 3.3.1, technical term "Synchronisation" | Synchronisierungsfehler | Daten nicht gesendet | Yes |
| `training.active.syncIndicator.failedMessage` | Direct address (rule 2), WCAG 3.3.1 | Die Synchronisierung konnte nicht abgeschlossen werden. Bitte versuchen Sie es erneut. | Die App konnte deine Daten nicht senden. Prüfe deine Internetverbindung und versuche es noch einmal. | Yes |
| `training.generator.errorMsgOther` | WCAG 3.3.1 | Ein unerwarteter Fehler ist aufgetreten. | Die App konnte das Training nicht erstellen. Versuche es noch einmal. | Yes |
| `training.generator.errorTitleGenerator` | WCAG 3.3.1 | Es konnte kein Training erstellt werden | Die App konnte kein Training erstellen | Yes |
| `training.generator.errorTitleNoExercisesParamsX` | WCAG 3.3.1 | Folgende Probleme traten auf: {{params}} | Betroffen: {{params}} (line break) Ändere unter Profil deine Ausrüstung oder deine Beschwerden, oder wähle ein anderes Training. | Yes |
| `training.generator.errorTitleNoExercisesSubtypeX` | WCAG 3.3.1 | Aus folgendem Grund konnten keine Übungen gefunden werden: {{subtype}} | Die App hat keine passenden Übungen gefunden. Grund: {{subtype}} | Yes |
| `training.generator.errorTitleTooMuchSorenessParamsX` | Technical term "Regeneration" | Folgende Bereiche benötigen noch Regeneration: {{params}} (line break) Du kannst stattdessen ein Fokus- oder Präventionstraining für die anderen Bereiche machen. | Diese Bereiche brauchen noch Erholung: {{params}} (line break) Du kannst stattdessen ein Fokus-Training oder Präventionstraining für die anderen Bereiche machen. | Yes |
| `training.generator.errorTitleTooMuchSorenessSubtypeX` | WCAG 3.3.1 | Momentan solltest du deinen Körper nicht belasten: {{subtype}} | Dein Körper braucht jetzt Erholung. Grund: {{subtype}} | Yes |
| `training.generator.errorTitleTooMuchSorenessTestWorkout` | Technical term "regenerativ" | Mit Muskelkater kannst du den Krafttest nicht machen. Absolviere stattdessen einen regenerativen Lauf oder ein Fokus-Training. | Mit Muskelkater kannst du den Krafttest nicht machen. Mache stattdessen einen lockeren Lauf oder ein Fokus-Training. | Yes |
| `training.generator.errorTitleNoAnamnesisParamsX` | Technical term "Anamnese" | Keine Anamnesedaten: {{params}} | Es fehlen Angaben aus den Fragen am Anfang: {{params}} (line break) Beantworte sie unter Profil bei 'Mein Profil'. | Yes |
| `training.generator.failedToLoadExerciseList` | WCAG 3.3.1 | Laden der Übungsliste fehlgeschlagen | Die App konnte die Übungsliste nicht laden. Versuche es noch einmal. | Yes |
| `training.generator.errorSubtype.SKILL_TREE` | Technical term "Skillbaum" | Skillbaum | Übungsauswahl | Yes |
| `training.generator.errorSubtype.OTHER` | Comprehensibility | Anderer | Sonstiges | Yes |
| `training.generator.errorSubtype.*` (other categories) | Comprehensibility | Muskelkater, Beschwerden, Ausrüstung, Alter, Geschlecht, Krafttest und weitere | unchanged | Yes |
| `training.manualStrengthTest.validationError` | WCAG 3.3.1, 3.3.3 | Bitte gib mindestens eine vollständige Übung ein (Gewicht und Wiederholungen) | Du hast keine Übung vollständig ausgefüllt. Gib bei mindestens einer Übung Gewicht in kg und Wiederholungen ein. Beide Zahlen müssen größer als 0 sein. | Yes |
| `training.manualStrengthTest.incompleteError` | WCAG 3.3.1, 3.3.3 | Bitte fülle für jede Übung sowohl Gewicht als auch Wiederholungen aus | Bei einer Übung fehlt das Gewicht oder die Wiederholungen. Gib bei jeder Übung beides ein oder lasse beide Felder leer. | Yes |
| `training.success.dataMissing` | WCAG 3.3.1 | Deine Trainingsdaten konnten leider nicht korrekt erfasst werden. Unsere Entwickler wurden darüber informiert. (paragraph) Sollte der Fehler weiterhin auftreten, melde dich bitte über den Punkt "Kontakt" im "Profil" Bereich bei uns. | Die App hat deine Trainingsdaten nicht vollständig erfasst. Unsere Entwickler wissen Bescheid. (paragraph) Tritt das Problem wieder auf, melde dich bei uns. Du findest den Punkt "Kontakt" im Bereich "Profil". | Yes |
