# Textprüfung: Fehlertexte und Einwilligung

Diese Prüfung bewertet Texte Schlüssel für Schlüssel. Sie gehört zur Barrierefreiheitsprüfung nach BFSG. Ein Text besteht ("Ja"), wenn er den [Leitfaden für einfache Sprache](../../../docs/accessibility/plain-language-style-guide.md) einhält. Fehlertexte nennen, was passiert ist und was die Person tun kann (WCAG 3.3.1). Einwilligungstexte sagen klar, wozu die Person zustimmt (DSGVO Art. 7). Schlüssel mit "unverändert" hat die Prüfung bestanden und bleibt, wie er ist.

Die englischen Texte in `en.json` tragen die gleiche Bedeutung in einfachem Englisch.

| Schlüssel | Kriterium | Vorher (de) | Nachher (de) | Besteht |
|---|---|---|---|---|
| `common.error` | WCAG 3.3.1 | Ein unerwarteter Fehler ist aufgetreten. | Die App konnte das nicht abschließen. Versuche es noch einmal. | Ja |
| `common.videoLoadError` | WCAG 3.3.1 | Video konnte nicht geladen werden | Die App konnte das Video nicht laden. Prüfe deine Internetverbindung und versuche es noch einmal. | Ja |
| `common.bodyParts.selectHurtingParts` | Du-Form (Regel 2) | Bitte wählen Sie die Bereiche, die Ihnen weh tun | Wähle die Bereiche, die dir weh tun | Ja |
| `more.deleteFailed` | WCAG 3.3.1 | Löschen fehlgeschlagen | Die App konnte dein Konto nicht löschen. Prüfe deine Internetverbindung und versuche es noch einmal. | Ja |
| `more.logoutFailed` | WCAG 3.3.1 | Abmelden fehlgeschlagen | Die App konnte dich nicht abmelden. Versuche es noch einmal. | Ja |
| `more.joinTeam.errorInvalidCode` | WCAG 3.3.1 | Ungültiger Einladungscode. | Den Einladungscode gibt es nicht. Prüfe den Code und gib ihn noch einmal ein. | Ja |
| `more.joinTeam.errorAlreadyMember` | WCAG 3.3.1 | Du bist bereits Mitglied dieses Teams. | unverändert | Ja |
| `more.joinTeam.errorExpired` | WCAG 3.3.1 | Dieser Einladungscode ist abgelaufen. | Der Einladungscode ist abgelaufen. Bitte die Person, die dich eingeladen hat, um einen neuen Code. | Ja |
| `more.joinTeam.errorInactive` | WCAG 3.3.1 | Dieser Einladungscode ist nicht mehr aktiv. | Der Einladungscode gilt nicht mehr. Bitte die Person, die dich eingeladen hat, um einen neuen Code. | Ja |
| `more.joinTeam.errorMaxUses` | WCAG 3.3.1 | Dieser Einladungscode hat die maximale Anzahl an Verwendungen erreicht. | Zu viele Personen haben den Einladungscode schon benutzt. Bitte die Person, die dich eingeladen hat, um einen neuen Code. | Ja |
| `more.joinTeam.errorGeneric` | WCAG 3.3.1 | Etwas ist schiefgelaufen. Bitte versuche es erneut. | Die App konnte das nicht abschließen. Versuche es noch einmal. | Ja |
| `more.joinTeam.leaveErrorNotMember` | WCAG 3.3.1 | Du bist kein Mitglied dieses Teams. | unverändert | Ja |
| `more.joinTeam.leaveErrorNotFound` | WCAG 3.3.1 | Team nicht gefunden. | Die App hat dieses Team nicht gefunden. Versuche es später noch einmal. | Ja |
| `more.joinTeam.leaveErrorOwner` | WCAG 3.3.1 | Der Teaminhaber kann das Team nicht verlassen. | Du bist Inhaber dieses Teams. Inhaber können ein Team nicht verlassen. | Ja |
| `onboarding.alertErrorTitle` | WCAG 3.3.1 | Fehler | Das hat nicht geklappt | Ja |
| `onboarding.alertAnErrorOccuredTitle` | WCAG 3.3.1 | Ein Fehler ist aufgetreten. | Die App konnte das nicht abschließen. Versuche es noch einmal. | Ja |
| `onboarding.errorInvalidMailAdressTitle` | WCAG 3.3.1 | Ungültige E-Mail Adresse | E-Mail-Adresse ungültig | Ja |
| `onboarding.errorInvalidMailAdressMsg` | WCAG 3.3.1 | Bitte gib eine valide E-Mail Adresse an. | Die E-Mail-Adresse ist ungültig. Prüfe sie auf Tippfehler und gib sie noch einmal ein. | Ja |
| `onboarding.invalidEmail` | WCAG 3.3.1 | Bitte gib eine gültige E-Mail Adresse an! | Die E-Mail-Adresse ist ungültig. Prüfe sie auf Tippfehler. | Ja |
| `onboarding.invalidVerificationCode` | WCAG 3.3.1 | Der eingegebene Code ist ungültig oder abgelaufen. Bitte versuche es erneut oder fordere einen neuen Code an. | Der Code ist falsch oder abgelaufen. Gib ihn noch einmal ein oder fordere einen neuen Code an. | Ja |
| `onboarding.errorMessageTooManyRequests` | WCAG 3.3.1 | Zu viele Anfragen. Bitte warte einen Moment und versuche es erneut. | Du hast zu oft hintereinander angefragt. Warte einen Moment und versuche es dann noch einmal. | Ja |
| `onboarding.errorMessageNoInternetConnection` | WCAG 3.3.1 | Für die Registrierung benötigst du eine stabile Internetverbindung. (sichtbares \n\n) | Die App hat keine Internetverbindung. Du brauchst sie für die Registrierung. (Absatz) Verbinde dich mit dem Internet und versuche es noch einmal. | Ja |
| `onboarding.errorUnknownMsgRetry` | WCAG 3.3.1 | Bitte versuche es noch einmal oder kontaktiere uns unter service@sports-athletic.com. (sichtbares \n\n) Vielen Dank | Die Registrierung hat nicht geklappt. Versuche es noch einmal. (Absatz) Hilft das nicht, schreibe uns an service@sports-athletic.com. Du kannst auch die App neu installieren. | Ja |
| `onboarding.errorTitleAcceptPrivacyInfo` | WCAG 3.3.1 | AGBs akzeptieren | Zustimmung fehlt | Ja |
| `onboarding.errorMessageAcceptPrivacyInfo` | WCAG 3.3.1 | Bitte akzeptiere unsere AGBs und Datenschutzbestimmungen. | Ohne Zustimmung kannst du nicht weitermachen. Setze den Haken bei der Zustimmung zu den Bedingungen. | Ja |
| `onboarding.errorMessageAcceptHealth` | WCAG 3.3.1 | Bitte erlaube uns, deine Gesundheitsdaten für personalisierte Trainingspläne zu verarbeiten. | Ohne Zustimmung kann die App keinen Trainingsplan für dich erstellen. Setze den Haken bei den Gesundheitsdaten. | Ja |
| `onboarding.errorMessageAcceptAnalytics` | WCAG 3.3.1 | Bitte stimme zu, durch das Teilen von Nutzungsdaten zur Verbesserung der App beizutragen. | Ohne Zustimmung kannst du nicht weitermachen. Setze den Haken bei den Nutzungsdaten. | Ja |
| `onboarding.errorMessageConsentSaveFailed` | WCAG 3.3.1 | Deine Einwilligung konnte nicht gespeichert werden. Bitte prüfe deine Verbindung und versuche es erneut. | Die App konnte deine Zustimmung nicht speichern. Prüfe deine Internetverbindung und versuche es noch einmal. | Ja |
| `onboarding.consentTitle` | DSGVO Art. 7 | Datenschutz | unverändert | Ja |
| `onboarding.consentSubtitle` | DSGVO Art. 7 | Um die App weiter zu nutzen, akzeptiere bitte unsere Datenschutzbestimmungen. | Bevor du die App weiter nutzt, musst du den Datenschutzbestimmungen zustimmen. | Ja |
| `onboarding.privacyFull` | DSGVO Art. 7 | Mit der Anmeldung erkläre ich mich mit den AGB und Datenschutzbestimmungen von Sports Athletic einverstanden. | Ich stimme den Allgemeinen Geschäftsbedingungen (AGB) und den Datenschutzbestimmungen von Sports Athletic zu. | Ja |
| `onboarding.privacySimple` | DSGVO Art. 7 | Mit der Anmeldung erkläre ich mich mit den Datenschutzbestimmungen einverstanden. | Ich stimme den Datenschutzbestimmungen von Sports Athletic zu. | Ja |
| `onboarding.anonymisedDataUse` | DSGVO Art. 7 | Ich bin damit einverstanden, durch das Teilen von Nutzungsdaten zur Verbesserung der App beizutragen. | Ich stimme zu, dass die App anonymisierte Nutzungsdaten teilt. Damit wird die App besser. | Ja |
| `onboarding.healthConsent` | DSGVO Art. 9 | Ich bin damit einverstanden, dass für die Erstellung persönlicher Trainingspläne meine Gesundheitsdaten verarbeitet werden. | Ich stimme zu, dass die App meine Gesundheitsdaten verarbeitet. Damit erstellt sie meine persönlichen Trainingspläne. | Ja |
| `onboarding.consentAccept` | WCAG 2.4.6 (Button beginnt mit Verb) | Weiter | Zustimmen und weiter | Ja |
| `onboarding.checkboxAnonymisedDataUse` | WCAG 4.1.2 | Nutzungsdaten zur Verbesserung der App teilen | Zustimmen: anonymisierte Nutzungsdaten teilen | Ja |
| `onboarding.checkboxPrivacyFull` | WCAG 4.1.2 | AGB und Datenschutzbestimmungen akzeptieren | Zustimmen: AGB und Datenschutzbestimmungen | Ja |
| `onboarding.checkboxPrivacySimple` | WCAG 4.1.2 | Datenschutzbestimmungen akzeptieren | Zustimmen: Datenschutzbestimmungen | Ja |
| `screens.generating.errorTitle` | WCAG 3.3.1 | Ein Fehler ist aufgetreten | Plan nicht erstellt | Ja |
| `screens.generating.errorMessage` | WCAG 3.3.1 | Mit diesen Daten konnten wir leider keinen passenden Trainingsplan erzeugen. Unsere Entwickler wurden informiert. | Die App konnte mit deinen Angaben keinen Trainingsplan erstellen. Unsere Entwickler wissen Bescheid. Tippe auf OK und versuche es später noch einmal. | Ja |
| `training.active.syncIndicator.failed` | WCAG 3.3.1, Fachwort Synchronisation | Synchronisierung fehlgeschlagen | Daten nicht gesendet | Ja |
| `training.active.syncIndicator.failedTitle` | WCAG 3.3.1, Fachwort Synchronisation | Synchronisierungsfehler | Daten nicht gesendet | Ja |
| `training.active.syncIndicator.failedMessage` | Du-Form (Regel 2), WCAG 3.3.1 | Die Synchronisierung konnte nicht abgeschlossen werden. Bitte versuchen Sie es erneut. | Die App konnte deine Daten nicht senden. Prüfe deine Internetverbindung und versuche es noch einmal. | Ja |
| `training.generator.errorMsgOther` | WCAG 3.3.1 | Ein unerwarteter Fehler ist aufgetreten. | Die App konnte das Training nicht erstellen. Versuche es noch einmal. | Ja |
| `training.generator.errorTitleGenerator` | WCAG 3.3.1 | Es konnte kein Training erstellt werden | Die App konnte kein Training erstellen | Ja |
| `training.generator.errorTitleNoExercisesParamsX` | WCAG 3.3.1 | Folgende Probleme traten auf: {{params}} | Betroffen: {{params}} | Ja |
| `training.generator.errorTitleNoExercisesSubtypeX` | WCAG 3.3.1 | Aus folgendem Grund konnten keine Übungen gefunden werden: {{subtype}} | Die App hat keine passenden Übungen gefunden. Grund: {{subtype}} | Ja |
| `training.generator.errorTitleTooMuchSorenessParamsX` | Fachwort Regeneration | Folgende Bereiche benötigen noch Regeneration: {{params}} (Zeilenumbruch) Du kannst stattdessen ein Fokus- oder Präventionstraining für die anderen Bereiche machen. | Diese Bereiche brauchen noch Erholung: {{params}} (Zeilenumbruch) Du kannst stattdessen ein Fokus-Training oder Präventionstraining für die anderen Bereiche machen. | Ja |
| `training.generator.errorTitleTooMuchSorenessSubtypeX` | WCAG 3.3.1 | Momentan solltest du deinen Körper nicht belasten: {{subtype}} | Dein Körper braucht jetzt Erholung. Grund: {{subtype}} | Ja |
| `training.generator.errorTitleTooMuchSorenessTestWorkout` | Fachwort regenerativ | Mit Muskelkater kannst du den Krafttest nicht machen. Absolviere stattdessen einen regenerativen Lauf oder ein Fokus-Training. | Mit Muskelkater kannst du den Krafttest nicht machen. Mache stattdessen einen lockeren Lauf oder ein Fokus-Training. | Ja |
| `training.generator.errorTitleNoAnamnesisParamsX` | Fachwort Anamnese | Keine Anamnesedaten: {{params}} | Es fehlen Angaben aus den Fragen am Anfang: {{params}} | Ja |
| `training.generator.failedToLoadExerciseList` | WCAG 3.3.1 | Laden der Übungsliste fehlgeschlagen | Die App konnte die Übungsliste nicht laden. Versuche es noch einmal. | Ja |
| `training.generator.errorSubtype.SKILL_TREE` | Fachwort Skillbaum | Skillbaum | Übungsauswahl | Ja |
| `training.generator.errorSubtype.OTHER` | Verständlichkeit | Anderer | Sonstiges | Ja |
| `training.generator.errorSubtype.*` (übrige Kategorien) | Verständlichkeit | Muskelkater, Beschwerden, Ausrüstung, Alter, Geschlecht, Krafttest und weitere | unverändert | Ja |
| `training.manualStrengthTest.validationError` | WCAG 3.3.1, 3.3.3 | Bitte gib mindestens eine vollständige Übung ein (Gewicht und Wiederholungen) | Du hast keine Übung vollständig ausgefüllt. Gib bei mindestens einer Übung Gewicht in kg und Wiederholungen ein. Beide Zahlen müssen größer als 0 sein. | Ja |
| `training.manualStrengthTest.incompleteError` | WCAG 3.3.1, 3.3.3 | Bitte fülle für jede Übung sowohl Gewicht als auch Wiederholungen aus | Bei einer Übung fehlt das Gewicht oder die Wiederholungen. Gib bei jeder Übung beides ein oder lasse beide Felder leer. | Ja |
| `training.success.dataMissing` | WCAG 3.3.1 | Deine Trainingsdaten konnten leider nicht korrekt erfasst werden. Unsere Entwickler wurden darüber informiert. (Absatz) Sollte der Fehler weiterhin auftreten, melde dich bitte über den Punkt "Kontakt" im "Profil" Bereich bei uns. | Die App hat deine Trainingsdaten nicht vollständig erfasst. Unsere Entwickler wissen Bescheid. (Absatz) Tritt das Problem wieder auf, melde dich bei uns. Du findest den Punkt "Kontakt" im Bereich "Profil". | Ja |
