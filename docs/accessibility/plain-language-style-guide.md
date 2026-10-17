# Plain language style guide for the app

This guide applies to all UI texts of the athlete app and the trainer web dashboard in German and English. It is the template for new and revised texts in the translation files of both apps:

- `athlete-mobile/src/i18n/locales/de.json` and `en.json`
- `trainer-web/src/i18n/locales/de.json` and `en.json`

The German examples are the texts the apps show. The English examples show the same rules for `en.json`.

## Goal

Every athlete understands every text on the first read. The texts follow WCAG 2.1 Level AA (criteria 3.3.1, 3.3.2, and 4.1.2) and the goal of avoiding technical terms.

## Rules

1. **Short sentences.** A sentence has about 15 words, at most 20. A sentence says one thing.
2. **Direct address.** The app addresses the athlete directly. German uses the informal "du", never "Sie". English uses "you".
3. **Active instead of passive.** A person or the app performs the action.
4. **Common words.** Everyday words beat technical terms. If a technical term stays, the glossary explains it.
5. **Buttons start with a verb.** The button names the action that follows.
6. **Errors state two things.** What happened? What can you do now?
7. **Visible labels.** Every input field has a visible label. A placeholder does not replace the label.
8. **Unit and format in the label.** The label or a hint names the unit (kg, cm, minutes) and the format (DD.MM.YYYY in German, MM/DD/YYYY in English).
9. **One name per thing.** A term keeps the same name everywhere. Switching between "plan" and "program" confuses.
10. **No abbreviations without explanation.** Exceptions: common units such as kg, cm, and min.
11. **Numbers as digits.** Write "3 sets", not "three sets".
12. **No chains of negation.** Write "You can start now", not "You cannot not start".

## Examples

| Rule | Bad (German) | Good (German) | Bad (English) | Good (English) |
|---|---|---|---|---|
| 1 Short sentences | Nachdem du die Anamnese abgeschlossen hast, wird auf Basis deiner Angaben ein individueller Plan erstellt, der sich anpasst. | Du beantwortest ein paar Fragen. Danach erstellt die App deinen Plan. | After you complete the intake, an individual plan that adapts is created based on your input. | You answer a few questions. Then the app creates your plan. |
| 2 Direct address | Bitte geben Sie Ihr Gewicht ein. | Gib dein Gewicht ein. | The user must enter their weight. | Enter your weight. |
| 3 Active | Dein Training wurde gespeichert. | Die App hat dein Training gespeichert. | Your workout was saved. | The app saved your workout. |
| 5 Verb first | Weiter zur Speicherung | Speichern | Proceed to storage | Save |
| 6 Errors | Fehler bei der Synchronisation. | Die App konnte deine Daten nicht senden. Prüfe deine Internetverbindung und versuche es noch einmal. | Synchronization error. | The app could not send your data. Check your internet connection and try again. |
| 7 Visible label | Feld mit dem Platzhalter "E-Mail" | Label "E-Mail-Adresse" über dem Feld | Field with the placeholder "Email" | Label "Email address" above the field |
| 8 Unit and format | Gewicht | Gewicht in kg | Weight | Weight in kg |
| 8 Unit and format | Geburtsdatum | Geburtsdatum (TT.MM.JJJJ) | Date of birth | Date of birth (MM/DD/YYYY) |

## Technical terms and plain replacements

The glossary of the app explains terms that must stay. Replace all other technical terms as follows:

| German term | German replacement | English term | English replacement |
|---|---|---|---|
| exzentrische Phase | langsam absenken | eccentric phase | lower slowly |
| konzentrische Phase | anheben, hochdrücken | concentric phase | lift, push up |
| Hypertrophie | Muskelaufbau | hypertrophy | muscle growth |
| Regeneration | Erholung | regeneration | recovery |
| Intensität | Anstrengung | intensity | effort |
| Volumen | Menge an Sätzen und Wiederholungen | volume | number of sets and reps |
| Progression | Steigerung | progression | increase |
| Frequenz | Anzahl der Trainings pro Woche | frequency | number of workouts per week |
| Mobilisation | Beweglichkeit verbessern | mobilization | improve flexibility |
| Kontraindikation | Grund, warum die Übung nicht passt | contraindication | reason the exercise does not fit |
| Synchronisation | Daten senden und abgleichen | synchronization | send and compare data |
| Authentifizierung | Anmeldung | authentication | sign in |
| Validierung | Prüfung | validation | check |

## Screen reader labels

A screen reader reads `accessibilityLabel` aloud. These rules apply to all labels:

1. **Translated.** Every label comes from `t()` and exists in `de.json` and `en.json`. English icon names such as "checkmark" or "mail" do not belong in the German app.
2. **Decorative icons are hidden.** An icon next to a text carries no information. It gets `accessibilityElementsHidden` and `importantForAccessibility="no-hide-descendants"`.
3. **Icons with a function have a label.** An icon that stands alone and triggers an action names the action ("Delete"), not the picture ("Trash can").
4. **The state lives in the value.** Switches and checkboxes use `accessibilityRole` and `accessibilityState`. The label names only the subject ("Accept privacy policy"), not "on" or "off".
5. **Charts have a text version.** A chart gets a label that states the key message ("Strength profile with 5 values").
6. **No double announcement.** The label and the visible text do not say the same thing twice in a row.

| Bad | Good |
|---|---|
| `accessibilityLabel="checkmark"` | Checkbox with the label "I agree to the terms" |
| `accessibilityLabel="mail"` on the icon in the email field | Icon hidden, the field carries the label "Email address" |
| `accessibilityLabel="Switch on"` | Label "Reminders", state through `accessibilityState` |

## Checklist before merge

- The text passes rules 1 to 12.
- Technical terms are replaced or appear in the glossary.
- The input field has a label, a unit, and a format.
- Error texts state what happened and what the person can do.
- New icons are marked as decorative or have a translated label.
- `de.json` and `en.json` have the same keys.
