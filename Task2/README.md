# FeedbackAI: Intelligent Feedback System

FeedbackAI is a full-stack web application designed to collect, analyze, and manage user feedback using the power of Google's Gemini 2.5 Flash Lite model.

It features a dual-interface system backed by a **Node.js/Express** server and **MongoDB** persistence:

1.  **User Dashboard**: For customers to submit ratings and reviews, receiving instant, AI-generated personalized responses.
2.  **Admin Dashboard**: For internal teams to view live analytics, sentiment analysis, AI summaries, and recommended actions.

---

## 🚀 Features

### Core AI Capabilities
*   **Instant Analysis**: Powered by Gemini 2.5 Flash Lite.
*   **Sentiment Detection**: Automatically classifies feedback as Positive, Neutral, or Negative.
*   **Summarization**: Compresses complex reviews into concise one-sentence summaries.
*   **Strategic Advice**: Generates 3 concrete, actionable steps for business improvement based on specific feedback.

### User Interface (Public)
*   **Interactive Rating**: 5-star rating system.
*   **Real-time Response**: Users get an immediate, empathetic AI-generated reply.
*   **Helpfulness Feedback**: Users can vote on whether the AI's response was useful.

### Admin Interface (Internal)
*   **Live Dashboard**: Real-time stats on average rating, total reviews, and sentiment distribution.
*   **Visual Analytics**: Interactive charts powered by Recharts.
*   **Data Management**: Search, filter, and export data to CSV.

### Architecture & Persistence
*   **Backend API**: A robust Node.js & Express REST API.
*   **Flexible Storage**: 
    *   **MongoDB**: For production-grade persistence.
    *   **In-Memory Fallback**: Automatically switches to temporary array storage if no database is connected
*   **Deployment Modes**: Configurable build modes to deploy just the User app, just the Admin app, or a Dev hybrid.

---

## 🛠 Prerequisites

Before running the project locally, ensure you have:

1.  **Node.js**: Version 18.0.0 or higher. [Download Node.js](https://nodejs.org/)
2.  **Google AI Studio API Key**: Required for Gemini features. [Get API Key](https://aistudio.google.com/)
3.  **MongoDB URI (Optional)**: If you want data to persist after restarting the server. You can use a free cluster from [MongoDB Atlas](https://www.mongodb.com/atlas).

---

## 💻 Installation & Setup

### 1. Install Dependencies
Open your terminal in the project directory and run:

```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# Required: Gemini API Key
API_KEY=your_actual_api_key_here

# MongoDB Connection String
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/feedback-app

# Optional: Deployment Mode
# Options: 'DEV' (Both dashboards), 'USER' (Only User view), 'ADMIN' (Only Admin view)
VITE_APP_MODE=DEV

# Backend Port (Default: 5000)
PORT=5000
```

### 3. Run the Application
Start the development environment. This runs both the **Vite Frontend** and **Express Backend** concurrently:

```bash
npm run dev
```

*   **Frontend**: http://localhost:5173
*   **Backend API**: http://localhost:5000

---

## 📂 Project Structure

```
├── components/           # React UI Components
│   ├── AdminDashboard.tsx  # Admin analytics & lists
│   ├── UserDashboard.tsx   # User submission form
│   └── ...
├── services/             # Logic layer
│   ├── geminiService.ts    # AI integration
│   └── storageService.ts   # API communication
├── server.js             # Express Backend Entry Point
├── App.tsx               # Routing & Layout Logic
├── vite.config.ts        # Frontend Build Config
└── package.json          # Dependencies & Scripts
```

---

## 🚀 Deployment Modes

You can control which interface is shown by setting `VITE_APP_MODE` in your environment (or build settings).

| Mode | Description | URL Path |
| :--- | :--- | :--- |
| `DEV` | Shows navigation bar to switch between User and Admin dashboards. | `/` & `/admin` |
| `USER` | Locks the app to the User Submission form. No Admin access. | `/*` -> User Dashboard |
| `ADMIN` | Locks the app to the Admin Dashboard. | `/*` -> Admin Dashboard |

To build for a specific mode:
```bash
# Example: Linux/Mac
VITE_APP_MODE=ADMIN npm run build

# Example: Windows (PowerShell)
$env:VITE_APP_MODE="ADMIN"; npm run build
```

---

## 📜 Technical Stack
*   **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts.
*   **Backend**: Node.js, Express.js.
*   **Database**: MongoDB (Mongoose) with In-Memory fallback.
*   **AI Model**: Google Gemini 2.5 Flash Lite.

---

## ⚙️ Troubleshooting

**"API Error: Failed to fetch"**
*   Ensure the backend server is running. `npm run dev` should start both.
*   Check if `VITE_API_URL` is set correctly in production, or left blank in development to use the proxy.

**Data disappears after restart**
*   Check your terminal output. If you see "⚠️ MONGODB_URI is not defined", the server is using in-memory storage. Add a valid MongoDB URI to `.env` to persist data.
