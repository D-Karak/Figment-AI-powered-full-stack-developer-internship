# Vibe Bookmarks

A modern, full-stack bookmark manager application built with React, Node.js, and SQLite. This application allows users to save, organize, and search for their favorite websites with a clean and responsive user interface.

## 🚀 Technologies Used

### Frontend
*   **React (v19)**: Component-based UI library.
*   **Vite**: Fast build tool and development server.
*   **TypeScript**: Static typing for better code quality and developer experience.
*   **Vanilla CSS**: Custom styling using CSS variables for theming (Dark/Light mode).

### Backend
*   **Node.js & Express**: Lightweight REST API server.
*   **SQLite (better-sqlite3)**: Serverless, zero-configuration SQL database engine for robust local storage.
*   **Concurrently**: Utility to run both frontend and backend servers with a single command.

## 🛠️ Setup Instructions

### Prerequisites
*   **Node.js** (v18 or higher recommended)
*   **npm** (comes with Node.js)

### Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd <project-folder>
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```
    This will install both frontend and backend dependencies including `express`, `cors`, `better-sqlite3`, and `vite`.

## ▶️ Running the Application

To start the application, simply run:

```bash
npm run dev
```

This command uses `concurrently` to start:
*   **Backend API** on `http://localhost:3000`
*   **Frontend App** on `http://localhost:5173`

Open your browser and navigate to `http://localhost:5173` to use the app.

## 📐 Design Choices

### 1. Client-Server Architecture
The project is split into two distinct logical parts:
*   **Frontend**: Handles UI, user state, and interactions. It interacts with the backend purely via HTTP requests (REST API).
*   **Backend**: Manages the SQLite database and business logic. It exposes a JSON API.

This separation ensures that the frontend is decoupled from the database implementation, allowing for easier future upgrades or migration to a different backend if needed.

### 2. SQLite for Data Persistence
SQLite was chosen for its zero-configuration nature. It requires no separate database server process, making the application easy to run locally while providing full SQL capabilities (Relational data, Transactions, Foreign Keys).
*   **WAL Mode**: The database uses Write-Ahead Logging for better concurrency and performance.
*   **Data Integrity**: Foreign keys are enforced to ensure that deleting a bookmark also cleans up its associated tags.

### 3. CSS-in-JS (Portable Styling)
Styles are defined within `App.tsx` using template literals and injected dynamically.
*   **Why?**: This keeps the component self-contained and portable for this specific project scale.
*   **Theming**: CSS variables (`var(--bg-primary)`, `var(--accent)`) are used to implement a seamless Dark/Light mode toggle.

### 4. Direct API Calls (Fetch)
Instead of using a heavy data fetching library, native `fetch` with `async/await` is used. This keeps the bundle size small and logic transparent.

## 🔌 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/bookmarks` | Retrieve all bookmarks. Supports `?tag=name` filtering. |
| `POST` | `/bookmarks` | Create a new bookmark. Payload: `{ url, title, description, tags[] }` |
| `PUT` | `/bookmarks/:id` | Update a bookmark. |
| `DELETE` | `/bookmarks/:id` | Delete a bookmark permanently. |

## 📂 Project Structure

```
├── App.tsx             # Main React component and UI logic
├── index.tsx           # React entry point
├── server.js           # Express backend server & Database logic
├── bookmarks.db        # SQLite database file (auto-generated)
├── vite.config.ts      # Vite configuration
├── package.json        # Dependencies and scripts
└── public/             # Static assets
```
