# PaisaTrack — Expense Tracker

A fresh, browser-based personal finance tracker inspired by the general idea and core workflow of the supplied Expense Tracker App repository. This is a separately written project and is intended for learning and college demonstration.

## Features

- Record income and expenses with title, amount, date, category, and optional note
- Edit or delete transactions
- Dashboard cards for balance, income, expenses, and savings rate
- Category-wise expense breakdown
- Month selector, search, and category/type filters
- Export the currently filtered transactions as CSV
- Browser `localStorage` persistence — no account or backend required
- Responsive desktop, tablet, and mobile layout
- Indian rupee formatting

## Run the project

1. Extract the project folder if it was downloaded as a ZIP.
2. Open `index.html` in a modern browser (Chrome, Edge, Firefox, etc.).
3. Click **Add transaction** to begin.

No Node.js, package installation, or build step is required. An internet connection is only needed for the optional Google Fonts import; the app itself works without it.

## Project structure

```text
expense-tracker-new/
├── index.html   # Page structure and transaction form
├── style.css    # Layout, styling, and responsive rules
├── app.js       # Transactions, dashboard, filters, local storage, CSV export
└── README.md    # Setup and project notes
```

## Data and privacy

Transactions are stored in the current browser's local storage on the device. They are not synced to the cloud. Clearing browser site data may erase them. Use **Export CSV** periodically if you need a backup.

## College project summary

**Objective:** To create a simple personal finance application that helps users record and review income and expenses.

**Technologies:** HTML5, CSS3, JavaScript, browser local storage, and CSV export through the browser APIs.

**How it works:** The user submits a transaction through a form. JavaScript validates the values, saves the transaction in local storage, and recalculates dashboard totals, category breakdown, recent activity, and the transaction table. Filters let the user narrow the displayed transactions by month, type, category, or search text.
