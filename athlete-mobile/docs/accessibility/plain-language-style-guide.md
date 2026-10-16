# Leitfaden für einfache Sprache in der App

Dieser Leitfaden gilt für alle Texte der Athleten-App auf Deutsch. Er ist die Vorlage für neue und überarbeitete Texte in `src/i18n/locales/de.json`.

## Ziel

Jede Athletin und jeder Athlet versteht jeden Text beim ersten Lesen. Die Texte folgen WCAG 2.1 Level AA (Kriterien 3.3.1, 3.3.2 und 4.1.2) und dem Ziel, Fachwörter zu vermeiden.

## Regeln

1. **Kurze Sätze.** Ein Satz hat etwa 15 Wörter, höchstens 20. Ein Satz sagt eine Sache.
2. **Du-Form.** Die App spricht die Athletin oder den Athleten mit "du" an. Nie "Sie".
3. **Aktiv statt Passiv.** Eine Person oder die App führt die Handlung aus.
4. **Gängige Wörter.** Alltagswörter schlagen Fachwörter. Bleibt ein Fachwort, erklärt das Glossar es.
5. **Buttons beginnen mit einem Verb.** Der Button nennt die Handlung, die danach passiert.
6. **Fehler nennen zwei Dinge.** Was ist passiert? Was kannst du jetzt tun?
7. **Sichtbare Beschriftungen.** Jedes Eingabefeld hat ein sichtbares Label. Ein Platzhalter ersetzt das Label nicht.
8. **Einheit und Format im Label.** Das Label oder ein Hinweis nennt die Einheit (kg, cm, Minuten) und das Format (TT.MM.JJJJ).
9. **Eine Bezeichnung pro Sache.** Ein Begriff behält überall den gleichen Namen. Ein Wechsel zwischen "Plan" und "Programm" verwirrt.
10. **Keine Abkürzungen ohne Erklärung.** Ausnahmen: allgemein bekannte Kürzel wie kg, cm und min.
11. **Zahlen als Ziffern.** Schreibe "3 Sätze", nicht "drei Sätze".
12. **Keine Verneinungsketten.** Schreibe "Du kannst jetzt starten", nicht "Du kannst nicht nicht starten".

## Beispiele

| Regel | Schlecht | Gut |
|---|---|---|
| 1 Kurze Sätze | Nachdem du die Anamnese abgeschlossen hast, wird auf Basis deiner Angaben ein individueller Plan erstellt, der sich anpasst. | Du beantwortest ein paar Fragen. Danach erstellt die App deinen Plan. |
| 2 Du-Form | Bitte geben Sie Ihr Gewicht ein. | Gib dein Gewicht ein. |
| 3 Aktiv | Dein Training wurde gespeichert. | Die App hat dein Training gespeichert. |
| 5 Verb zuerst | Weiter zur Speicherung | Speichern |
| 6 Fehler | Fehler bei der Synchronisation. | Die App konnte deine Daten nicht senden. Prüfe deine Internetverbindung und versuche es noch einmal. |
| 7 Sichtbares Label | Feld mit dem Platzhalter "E-Mail" | Label "E-Mail-Adresse" über dem Feld |
| 8 Einheit und Format | Gewicht | Gewicht in kg |
| 8 Einheit und Format | Geburtsdatum | Geburtsdatum (TT.MM.JJJJ) |

## Fachwörter und einfache Ersatzwörter

Das Glossar der App erklärt Begriffe, die bleiben müssen. Alle anderen Fachwörter ersetzt du so:

| Fachwort | Einfaches Wort |
|---|---|
| exzentrische Phase | langsam absenken |
| konzentrische Phase | anheben, hochdrücken |
| Hypertrophie | Muskelaufbau |
| Regeneration | Erholung |
| Intensität | Anstrengung |
| Volumen | Menge an Sätzen und Wiederholungen |
| Progression | Steigerung |
| Frequenz | Anzahl der Trainings pro Woche |
| Mobilisation | Beweglichkeit verbessern |
| Kontraindikation | Grund, warum die Übung nicht passt |
| Synchronisation | Daten senden und abgleichen |
| Authentifizierung | Anmeldung |
| Validierung | Prüfung |

## Screenreader-Beschriftungen

Ein Screenreader liest `accessibilityLabel` laut vor. Diese Regeln gelten für alle Beschriftungen:

1. **Übersetzt.** Jede Beschriftung kommt aus `t()` und steht in `de.json` und `en.json`. Englische Icon-Namen wie "checkmark" oder "mail" gehören nicht in die deutsche App.
2. **Dekorative Icons sind versteckt.** Ein Icon neben einem Text trägt keine Information. Es erhält `accessibilityElementsHidden` und `importantForAccessibility="no-hide-descendants"`.
3. **Icons mit Funktion haben eine Beschriftung.** Ein Icon, das allein steht und etwas auslöst, nennt die Handlung ("Löschen"), nicht das Bild ("Mülleimer").
4. **Der Zustand steckt im Wert.** Schalter und Checkboxen nutzen `accessibilityRole` und `accessibilityState`. Die Beschriftung nennt nur den Gegenstand ("Datenschutz akzeptieren"), nicht "an" oder "aus".
5. **Diagramme haben eine Textfassung.** Ein Diagramm erhält ein Label, das die Kernaussage nennt ("Kraftprofil mit 5 Werten").
6. **Keine doppelte Ansage.** Label und sichtbarer Text sagen nicht das Gleiche zweimal hintereinander.

| Schlecht | Gut |
|---|---|
| `accessibilityLabel="checkmark"` | Checkbox mit Label "Ich stimme den AGB zu" |
| `accessibilityLabel="mail"` am Icon im E-Mail-Feld | Icon versteckt, das Feld trägt das Label "E-Mail-Adresse" |
| `accessibilityLabel="Schalter an"` | Label "Erinnerungen", Zustand über `accessibilityState` |

## Prüfliste vor dem Merge

- Der Text besteht Regel 1 bis 12.
- Fachwörter sind ersetzt oder stehen im Glossar.
- Das Eingabefeld hat Label, Einheit und Format.
- Fehlertexte nennen, was passiert ist und was die Person tun kann.
- Neue Icons sind dekorativ markiert oder haben eine übersetzte Beschriftung.
- `de.json` und `en.json` haben die gleichen Schlüssel.
