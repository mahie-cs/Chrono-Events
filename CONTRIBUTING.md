# Contributing to Momentum

Thanks for helping keep the department calendar accurate. Anyone can suggest a change by opening a pull request. Every pull request is reviewed in the same way, and no one gets a shortcut.

---

## How to propose a change

1. **Fork** this repository.
2. Edit `events.json` in your fork. This is the only file you need to touch to add, change, postpone, cancel, or remove an event.
3. **Open a pull request** to `main` with a short description of what changed and why.
4. Wait for review. The maintainer may ask for corrections or a source for the date.

Once your pull request is merged, the website updates and the Android app picks up the change on its next refresh.

---

## Entry format

Every event is one entry in the `events.json` list:

```json
{
    "type": "exam",
    "name": "Social Science In-Course Exam",
    "date": "2026-09-01",
    "details": "A mandatory exam covering Organs of the Government..."
}
```

| field | required | rules |
|---|---|---|
| `type` | yes | `"exam"`, `"assignment"`, or `"event"` (not case-sensitive) |
| `name` | yes | the title shown on the card; keep it short and clear |
| `date` | yes | a date in `YYYY-MM-DD` format, or one of the special values below; always write it in quotes |
| `endDate` | no | `YYYY-MM-DD`, for events that last several days; must be later than `date`, otherwise it is ignored |
| `details` | yes | what students need to know: syllabus, room, time, submission method |

Notes:

- You don't need to keep the list in order. Entries are sorted by date automatically.
- Details longer than about 110 characters get a "Show more" button, so longer text is fine.
- Past, ongoing and upcoming are worked out in Bangladesh time.

---

## The `date` field

The `date` value decides where the card appears and what its label says.

| `date` value | meaning | where it appears | label on the card |
|---|---|---|---|
| `"2026-09-01"` | a confirmed date | Upcoming, Ongoing or Past, depending on today's date | the date |
| `""` (empty) | date not announced yet | Upcoming, after the dated events | **Upcoming** |
| `"-1"` | postponed | Ongoing, after the dated events | **Postponed** |
| `"0"` | cancelled | Cancelled | **Cancelled** |
| anything else | a mistake: typo, wrong format, or an impossible date like `2026-02-30` | Upcoming, last | **Date TBA** |

Examples:

```json
{ "type": "exam", "name": "Physics In-Course Exam", "date": "", "details": "Date will be announced." }
{ "type": "exam", "name": "Physics In-Course Exam", "date": "-1", "details": "Postponed. The new date will be announced." }
{ "type": "exam", "name": "Physics In-Course Exam", "date": "0", "details": "Cancelled by the department." }
```

A few things to know:

- There is no separate Postponed section. Postponed events appear in **Ongoing** with a **Postponed** label.
- The **Cancelled** section only shows up when at least one event is in it.
- If you see **Date TBA** on a card, something in the date is wrong. Fix it before you open the pull request.
- To postpone or cancel an existing event, **change its `date`** and update `details` to say why and, if known, what happens next. Don't delete the entry.
- When a postponed event gets a new date, replace `"-1"` with that date.

---

## Before you open the pull request

- **Check your JSON is valid.** One missing comma or quote can break the file for everyone. You can test it with:
  ```bash
  python3 -m json.tool events.json > /dev/null
  ```
  No output means the file is valid.
- **Use the exact date format**, with leading zeros: `2026-09-01`, not `2026-9-1` or `01/09/2026`.
- **Don't rename an existing event** unless you mean to. The app treats a changed name as a brand-new event.
- **Remember that people get notified.** Android app users receive a notification for new and changed entries once your pull request is merged. Make sure the date and details are correct first, and combine related edits into one pull request.
- **Only include confirmed information.** If a date isn't official yet, leave `date` empty and mention in your pull request where the event information came from.

---

## What gets a pull request accepted

- The change is correct and comes from a reliable source.
- Only `events.json` is changed, unless you are fixing a bug or improving something else on purpose.
- The description explains what you changed.

Pull requests with wrong dates, broken JSON, or unrelated edits will be sent back or closed.

---

## Changing the website or the app

Code changes are welcome too, but this project is **all rights reserved** (see `LICENSE.md`). For anything beyond `events.json`, such as design, features, or the Android app, email **mahie.edu@gmail.com** first so we can agree on it before you spend time on it.

---

<div align="center">

**Maintained by:** MD. Montasir Rahman Mahie
Department of CSE · SIMT Engineering College
📧 [mahie.edu@gmail.com](mailto:mahie.edu@gmail.com)

</div>
