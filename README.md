# Vibe Bookmarks Manager

A full-stack, local-first Bookmark Manager application built with Electron, React, and SQLite.

## 🚀 Features

*   **Manage Bookmarks**: Create, read, update, and delete bookmarks with ease.
*   **Tagging System**: Organize bookmarks with custom tags (max 5 per bookmark).
*   **Smart Search**: Real-time filtering by title or URL.
*   **Tag Filtering**: Click on tags to filter your view.
*   **Dark Mode**: Built-in dark/light theme toggle.
*   **Offline First**:
    *   **Desktop App**: Uses SQLite (`better-sqlite3`) for robust, local data storage.
    *   **Web Preview**: Gracefully falls back to LocalStorage when not running inside Electron.
*   **Clean UI**: Modern, responsive interface using CSS-in-JS.

## 🛠 Technologies

*   **Frontend**: React
*   **Desktop Runtime**: Electron
*   **Database**: SQLite (via `better-sqlite3`)
*   **IPC**: Secure Context Bridge for communication between React and Electron.

## 📦 Installation & Usage

To run this application locally as a desktop app:

1.  **Initialize Project**
    ```bash
    npm init -y
    ```

2.  **Install Dependencies**
    ```bash
    npm install electron better-sqlite3
    ```

3.  **Configure Package**
    Update your `package.json` to point to the main process file:
    ```json
    {
      "main": "main.js",
      "scripts": {
        "start": "electron ."
      }
    }
    ```

4.  **Run**
    ```bash
    npm start
    ```

## 📂 Project Structure

*   **`main.js`**: Electron main process. Handles the window creation and direct SQLite database operations.
*   **`preload.js`**: Security script that creates a bridge between the Electron backend and the React frontend.
*   **`index.tsx`**: The React application source code containing the UI, state management, and logic.
*   **`index.html`**: The HTML entry point for the application.
