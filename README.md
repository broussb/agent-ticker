# Five9 Off-Day Ticker

A simple, easily updated ticker to show which agents are off today.

Two ways to manage the list:

1) Local admin page (default)
- Supervisors visit /admin.html, enter a PIN, and update the names.
- Data is stored in the browser (localStorage) and shared for anyone viewing from the same machine/browser.
- For team-wide display from a shared screen, use the admin on that same machine.

2) Google Sheet (optional)
- Keep the off-day list in a Google Sheet that supervisors can edit.
- The ticker reads a published CSV URL from the sheet.
- Everyone will always see the latest names without using the admin page.

## Quick Start

1. Open `config.js` to set the admin PIN and optional Google Sheet URL.
2. Serve the folder with any static server (examples below).
3. Open `index.html` to show the ticker.
4. Supervisors open `admin.html` to update names (if using local admin).

## Configure

Edit `config.js`:

```
window.TICKER_CONFIG = {
  USE_GOOGLE_SHEET: false,
  GOOGLE_SHEET_CSV_URL: "",
  ADMIN_PIN: "1234",        // change this
  DATE_OVERRIDE: null,       // e.g. "2025-08-08" to fix the date
  TICKER_SPEED_S: 25,        // seconds per loop
};
```

### Google Sheet Setup (optional)
- Create a sheet with a single column (A) listing agent names, one per row.
- Optional: Put a header label in A1 (e.g., "Names").
- In Google Sheets: File → Share → Publish to web → Link → CSV → select the sheet → Publish.
- Copy the generated CSV URL into `GOOGLE_SHEET_CSV_URL`.
- Set `USE_GOOGLE_SHEET: true` in `config.js`.

## Running Locally

Any static server works. Examples:

- Python 3
  ```bash
  python3 -m http.server 8080
  ```
  Then open http://localhost:8080

- Node (serve)
  ```bash
  npx serve -l 8080
  ```

## Admin Page

- Navigate to `/admin.html`, enter the PIN, and manage the list.
- Enter names separated by commas or line breaks.
- Click Save to update the ticker data.

## Display

- `index.html` shows a smooth, continuous ticker: "Off Friday 8/8: Name1, Name2, ...".
- The date is based on your device timezone. Use `DATE_OVERRIDE` in `config.js` if you need to pin the date.

## Notes

- This is a static app; no backend required.
- If deploying for a team, consider hosting on Netlify or any static host and use the Google Sheet option for easy updates.
