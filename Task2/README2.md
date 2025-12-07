# FeedbackAI: Dual-Dashboard System

FeedbackAI is a full-stack MERN application powered by Google's Gemini 2.5 Flash. It collects user feedback and provides instant AI analysis.

This project is designed to be deployed as **two separate applications** (User Dashboard & Admin Dashboard) from the same codebase.

---

## 🚀 Deployment Guide (Free Tier)

To fulfill the requirement of **two different URLs** (one for users, one for admins) using free services, we will use:
1.  **MongoDB Atlas** (Database)
2.  **Render** (Backend API)
3.  **Vercel** (Frontend - Deployed twice)

### Phase 1: Database Setup (MongoDB Atlas)
1.  Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas).
2.  Create a **Cluster** (select the free "M0 Sandbox").
3.  In "Network Access", allow access from **Anywhere (0.0.0.0/0)**.
4.  In "Database Access", create a user (save username/password).
5.  Get your **Connection String** (Drivers > Node.js). It looks like:
    `mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/?retryWrites=true&w=majority`

### Phase 2: Backend Deployment (Render)
1.  Push your code to GitHub.
2.  Create a free account at [Render](https://render.com).
3.  Click **New +** -> **Web Service**.
4.  Connect your GitHub repository.
5.  **Settings**:
    *   **Runtime**: Node
    *   **Build Command**: `npm install`
    *   **Start Command**: `node server.js`
6.  **Environment Variables** (Scroll down to add these):
    *   `API_KEY`: Your Google Gemini API Key.
    *   `MONGODB_URI`: Your connection string from Phase 1.
    *   `PORT`: `10000` (Render's default port).
7.  Click **Create Web Service**.
8.  **Copy your Backend URL** once deployed (e.g., `https://feedback-api.onrender.com`).

### Phase 3: Frontend Deployment (Vercel)

We will deploy the frontend **twice** to create two distinct portals.

#### A. Deploy User Dashboard
1.  Go to [Vercel](https://vercel.com) and click **Add New Project**.
2.  Import your GitHub repository.
3.  **Environment Variables**:
    *   `VITE_API_URL`: Paste your Render Backend URL (e.g., `https://feedback-api.onrender.com`).
    *   `VITE_APP_MODE`: `USER`
4.  Click **Deploy**.
5.  **Result**: This URL is now your **Public Customer Feedback Portal**.

#### B. Deploy Admin Dashboard
1.  Go to Vercel dashboard and click **Add New Project** *again*.
2.  Import the **same** GitHub repository.
3.  **Environment Variables**:
    *   `VITE_API_URL`: Paste your Render Backend URL.
    *   `VITE_APP_MODE`: `ADMIN`
4.  Click **Deploy**.
5.  **Result**: This URL is now your **Internal Admin Analytics Portal**.

---

## 🛠 Local Development

### Prerequisites
*   Node.js v18+
*   Google API Key (Gemini)
*   MongoDB Connection String

### Setup
1.  Clone repo & install dependencies:
    ```bash
    npm install
    ```
2.  Create `.env` file:
    ```env
    API_KEY=your_gemini_key
    MONGODB_URI=your_mongo_url
    VITE_APP_MODE=DEV
    PORT=5000
    ```
3.  Run the app (Starts both Client & Server):
    ```bash
    npm run dev
    ```

*   **User View**: http://localhost:5173/
*   **Admin View**: http://localhost:5173/#/admin

---

## 📂 Project Architecture

### Backend (`server.js`)
*   **Role**: Handles data persistence and AI processing.
*   **AI Logic**: Interacts with `gemini-2.5-flash` to generate summaries, sentiment, and action items.
*   **Reliability**: Includes retry logic for API limits (429 errors).

### Frontend (React/Vite)
*   **Dual Mode**: The `VITE_APP_MODE` environment variable determines which UI components are rendered at build time.
    *   `USER`: Renders only `UserDashboard.tsx`.
    *   `ADMIN`: Renders only `AdminDashboard.tsx`.
    *   `DEV`: Renders navigation to switch between both.

---

## 📜 Technical Stack
*   **Frontend**: React 19, TypeScript, Tailwind CSS, Recharts.
*   **Backend**: Express.js, Node.js.
*   **AI**: Google Gemini 2.5 Flash via `@google/genai`.
*   **Database**: MongoDB.
