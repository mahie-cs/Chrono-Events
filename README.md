# [Momentum](https://chrono-events.vercel.app/)

<div align="center">

### a clean minimalist event tracker for the CSE department

*Saic Institute of Management &amp; Technology — SIMT Engineering College*

![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=flat-square&logo=framer&logoColor=white)
![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue?style=flat-square)

</div>

---

## About this page

> Built for the BSc first year students of the **Department of Computer Science &amp; Engineering** at **SIMT Engineering College**, *Momentum* is a single page that keeps track of everything on the department calendar — exams, assignment deadlines, meetups, hackathons — sorted into **Upcoming**, **Ongoing**, and **Past**, so nobody has to dig through a WhatsApp group to find a due date.

It is made to feel like a real app on your phone: smooth, quiet, and easy to use with one thumb.

---

## Using the page

| you want to… | do this |
|---|---|
| **switch between Exams, Assignments and Events** | tap the tabs at the bottom, or **swipe left and right** anywhere on the page. The page follows your finger, and a quick flick is enough |
| **read the details of an event** | tap its card. It flips over to show what you need to know |
| **read a long note in full** | tap **Show more** on the back of the card. A sheet slides up with the whole text. Pull it down, tap outside it or press `Esc` to close it |
| **switch between light and dark** | tap the sun / moon button at the top right. The page starts in light mode and remembers your choice |
| **send someone a direct link to a tab** | copy the address after you open it, for example `…/#assignments` |

---

## What the labels mean

| label | meaning |
|---|---|
| **Upcoming** | hasn't started yet, soonest date first |
| **Ongoing** | happening right now, including events that run over several days |
| **Past** | already finished, most recent first. Cancelled events are also listed here, last, greyed out with a *Cancelled* tag |
| **Postponed** | the event is still happening, but the new date isn't known yet. It stays under Upcoming with an orange *Postponed* tag |
| **Cancelled** *(tag)* | the event is off. It moves to Past and keeps a grey *Cancelled* tag |
| **Upcoming** *(tag, no date)* | the event is confirmed but the date hasn't been announced yet |

All dates follow **Bangladesh time**, so a deadline never flips early or late because of your phone's settings.

---

## Features

-  **Three tabs** — Exams, Assignments and Events, each sorted automatically into Upcoming, Ongoing and Past
-  **Swipe to navigate** — drag the page sideways and the tab bar moves with it
-  **Flip cards** — tap a card to flip it and read the details on the back
-  **"Show more" sheet** — long details open in a bottom sheet that you can drag away
-  **Light and dark mode** — light by default, remembered between visits
-  **Postponed and cancelled events** — clearly tagged, never mixed up with the rest
-  **Minimalist theme** — a clean font, clean background and soft glass touches
-  **Responsive** — the page adjusts itself to any screen, and fully works with a keyboard
-  **Respects your settings** — reduced motion, reduced transparency and high contrast are all supported

---

## Something wrong or missing?

Every event comes from one file, `events.json`. If a date is wrong, an exam is missing or something has been postponed, you can suggest the fix yourself:

1. Fork this repository and edit `events.json`
2. Open a pull request with a short note on what changed
3. Wait for it to be reviewed. Once it's merged, the website updates

The exact format, including how to mark an event as postponed or cancelled, is in **[CONTRIBUTING.md](CONTRIBUTING.md)**. Not comfortable with GitHub? Just email the details to the address below.

---

## Running it on your own computer

You need [Node.js](https://nodejs.org/) 18.18 or newer.

```bash
npm install
npm run dev
```

then open `http://localhost:3000` in your browser.

---

## License

Momentum is free, open-source software, released under the **[GNU General Public License v3.0](LICENSE.md)** (or, at your option, any later version).

In short: you can use it, study it, change it and share it — even for your own department or college — as long as your copy stays open source under the same license and keeps the original credit. Please read [LICENSE.md](LICENSE.md) for the full terms, and [TERMS_OF_SERVICE.md](TERMS_OF_SERVICE.md) for how the hosted site and app are used.

Copyright © 2026 MD. Montasir Rahman Mahie

---

<div align="center">

**Created by:** MD. Montasir Rahman Mahie
Department of CSE · SIMT Engineering College
[mahie.edu@gmail.com](mailto:mahie.edu@gmail.com)

</div>
