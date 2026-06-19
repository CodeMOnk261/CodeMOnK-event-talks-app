# BigQuery Release Notes Explorer 🚀

A modern, responsive, and visually stunning dashboard designed to fetch, parse, cache, and filter Google Cloud BigQuery release notes. Built with a Python Flask backend and a clean vanilla HTML/CSS/JS frontend styled with premium glassmorphism.

---

## ✨ Features

*   **🌗 Premium Sliding Theme Switch**: An elegant, glassmorphic toggle switch in the header that swaps the color scheme between Dark and Light mode by dynamically overriding CSS root variables. Theme selections are saved to `localStorage`.
*   **📄 Copy Card Updates**: Next to the permalink icon on each card, a new copy button extracts and formats the full plain-text list of release items for that specific date, making it easy to copy to the clipboard.
*   **📊 Export to CSV**: Located next to the sorting dropdown in the control panel. Exports the *currently filtered* list of release notes (including Date, Type, Link, and plain-text Description) directly into a CSV file, respecting active search and type filters.
*   **⭐ Bookmark / Saved Updates**: Save specific release items locally (using the browser's `localStorage`). Starred items are persisted across sessions, and a new **★ Saved** filter badge allows you to view *only* your bookmarked updates grouped by date.
*   **⚡ Real-Time Search & Highlight**: Search through dates, types, or content. Keywords are highlighted dynamically in the text.
*   **🏷️ Categorized Release Badges**: Clean, color-coded badges classifying updates into:
    *   `Feature` (Green)
    *   `Issue` (Red)
    *   `Announcement` (Blue)
    *   `Deprecation` (Yellow)
    *   `General` (Grey)
*   **🔄 Force Refresh**: A built-in refresh button in the header that bypasses the 15-minute backend caching layer to pull updates live from Google Cloud.
*   **🐦 X (Twitter) Sharing**: Instantly share any specific update card to Twitter/X with auto-formatted date, category details, description snippets, and hashtags.
*   **🔗 Deep Linking**: Copy permalinks to specific date cards for quick reference and collaboration.

---

## 🛠️ Tech Stack

*   **Backend**: Python, Flask, requests, BeautifulSoup4
*   **Frontend**: Vanilla HTML5, CSS3 (Glassmorphic variables design system), ES6+ JavaScript
*   **Data Source**: Google Cloud BigQuery XML feed

---

## 🚀 Getting Started

Follow these steps to run the application locally.

### Prerequisites

Ensure you have **Python 3.8+** installed on your system.

### Installation

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/CodeMonk261/CodeMOnK-event-talks-app.git
    cd CodeMOnK-event-talks-app
    ```

2.  **Create and Activate Virtual Environment**:
    *   **PowerShell** (Windows):
        ```powershell
        python -m venv venv
        .\venv\Scripts\Activate.ps1
        ```
    *   **CMD** (Windows):
        ```cmd
        python -m venv venv
        venv\Scripts\activate.bat
        ```
    *   **Bash** (macOS/Linux):
        ```bash
        python3 -m venv venv
        source venv/bin/activate
        ```

3.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

4.  **Run the Server**:
    ```bash
    python app.py
    ```

5.  **Open in Browser**:
    Navigate to [http://127.0.0.1:5000](http://127.0.0.1:5000)

---

## 📂 Project Structure

```text
├── static/
│   ├── app.js         # State management, search, filtering, bookmarks, CSV exports, copy, theme
│   └── style.css      # Glassmorphic layout, themes, animations, badges, switch, buttons
├── templates/
│   └── index.html     # HTML structure and main dashboard view
├── app.py             # Flask app serving templates, fetching, and caching RSS feeds
├── requirements.txt   # Backend requirements list
└── README.md          # Project documentation
```

---

## 📄 License & Source

*   **Feed Source**: [Google Cloud Release Notes RSS Feed](https://docs.cloud.google.com/feeds/bigquery-release-notes.xml)
*   *This project is for educational and presentation purposes.*