# Text to Schedule

Turn a pasted class schedule, a PDF, or a screenshot into a clean weekly timetable, then export it as a PNG or import it straight into your calendar app. Everything runs in the browser: no server, no account, and nothing is uploaded.

## Features

- **Plain-text parsing**: paste lines such as `CS 101 Intro to Computing MWF 8:30-10:00 AM Room 204`. Day tokens (`MWF`, `TTH`, `Sat`), 12- and 24-hour times, and room names are recognized. Lines that can't be parsed are listed so nothing is dropped silently.
- **PDF and screenshot ingestion**: drop in a PDF (text is extracted with `pdf.js`) or an image (OCR with `tesseract.js`). The OCR engine, worker and English data are bundled under `public/ocr`, so it works offline with no CDN calls.
- **2D grid matrix reconstruction**: registrar-style tables with times down the side and days across the top are rebuilt into individual course blocks, including room cells and subject/room column pairs.
- **Conflict detection**: overlapping classes are flagged on the timetable and summarized in a banner, with the day and overlapping time range.
- **Editable course list**: fix a code, title, time or room, or delete a course, and the timetable updates immediately.
- **PNG export**: download the timetable as a high-resolution image.
- **`.ics` export**: download a standards-compliant iCalendar file (RFC 5545) that imports into Google Calendar, Apple Calendar and Outlook. Each course becomes a weekly recurring event covering a 16-week semester that starts the next Monday, in your local time zone.
- **Light and dark themes.**

## Tech stack

React 19 · TypeScript · Vite · Tailwind CSS 4 · Vitest · `pdfjs-dist` · `tesseract.js` · `html-to-image` · `lucide-react`

## Local setup

Requires Node.js 20 or newer.

```bash
npm install
npm run dev      # start the dev server
npm test         # run the unit tests
npm run build    # type-check and build for production
```

`npm run dev` and `npm run build` first copy the OCR assets from `node_modules` into `public/ocr`. Those files are committed, so a deployment (Vercel, GitHub Pages and similar) works without extra steps.

## Project layout

```
src/
  components/   UI: toolbar, input panel, timetable, course list, conflict banner
  hooks/        schedule state, theme, file ingestion
  ingest/       PDF text extraction, OCR, token-to-text layout
  utils/        line parser, grid matrix parser, conflict detector, .ics exporter
public/ocr/     bundled tesseract worker, WASM cores and English data
```

## Notes on `.ics` export

Events use floating local times, so they land in the importing user's own time zone. A recurrence rule counts occurrences rather than weeks, so a course that meets on two days gets `COUNT=32` to cover 16 weeks.
