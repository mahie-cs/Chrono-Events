<div align="center">

# 📓 [Chrono Events](https://mahie-cs.github.io/Chrono-Events/)

### a spiral-bound event tracker for the CSE department

*Saic Institute of Management &amp; Technology — SIMT Engineering College*

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/Vanilla_JS-F7DF1E?style=flat-square&logo=javascript&logoColor=black)

</div>

✂️ – – – – – – – – – – – – – – – – – – – – – – – – – – – – – – – – – – – – – – ✂️

## 🗒️ About this page

> Built for the BSc first year students of the **Department of Computer Science &amp; Engineering** at **SIMT Engineering College**, *Chrono Events* is a single page that keeps track of everything on the department calendar — exams, assignment deadlines, meetups, hackathons — sorted into **Ongoing**, **Upcoming**, and **Past**, so nobody has to dig through a WhatsApp group to find a due date.

The page itself is styled to look like a real notebook: spiral rings and a red margin rule run down the left edge, each event is a taped-on index card, dates are ink-stamped, and the footer is the notebook's back cover — cut along the dotted line and all.

✂️ – – – – – – – – – – – – – – – – – – – – – – – – – – – – – – – – – – – – – – ✂️

## 📌 Features

- 🗂️ **Three sections** — Ongoing, Upcoming, and Past, auto-sorted with the soonest upcoming date first
- 🃏 **Flip cards** — click a card to flip it and read the details on the back
- 🔍 **"Show more" modal** — longer details pop open into a full note instead of getting cut off
- 🖊️ **Handwritten notebook theme** — ruled paper, spiral rings, taped index cards, stamped dates, per-status ink colours
- 📱 **Responsive** — the binding folds away on narrow screens

✂️ – – – – – – – – – – – – – – – – – – – – – – – – – – – – – – – – – – – – – – ✂️

## 🧾 Project structure

```
chrono-events/
├── index.html    → page structure
├── styles.css    → the notebook look — ruled paper, rings, tape, ink
├── script.js     → fetches events.json, checks date, builds the cards, runs the modal
├── events.json   → the actual event data — edit this to update the page
└── README.md     → you are here
```

## ✏️ Editing events.json

Every event on the page comes from one entry in `events.json`:

```json
{
    "type": "exam",
    "name": "Social Science In-Course Exam",
    "date": "2026-09-01",
    "details": "A mandatory exam covering Organs of the Government..."
}
```

| field | notes |
|---|---|
| `type` | `"exam"`, `"assignment"`, or `"event"` — not case-sensitive, decides which section the card lands in |
| `name` | event title, shown on the front and back of the card |
| `date` | `YYYY-MM-DD`, shown as the stamped date |
| `details` | shown on the back of the card; past ~110 characters gets a "Show more" button that opens the full text in a modal |

Upcoming events are sorted automatically by date, soonest first — no need to keep the list in order by hand.

## ▶️ Running it locally

The page fetches `events.json`, which most browsers block when `index.html` is opened directly as a `file://` path. Serve the folder instead:

```bash
python3 -m http.server 8000
```

then open `http://localhost:8000` in your browser.

✂️ – – – – – – – – – – – – – – – – – – – – – – – – – – – – – – – – – – – – – – ✂️

<div align="center">

**Created by:** MD. Montasir Rahman Mahie
Department of CSE · SIMT Engineering College
📧 [mahie.edu@gmail.com](mailto:mahie.edu@gmail.com)

</div>
