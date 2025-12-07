import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { GoogleGenAI, Type } from "@google/genai";
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Prevent server from crashing on unhandled errors (like 429s bubbling up)
process.on('uncaughtException', (err) => {
  console.error('⚠️ CRITICAL: Uncaught Exception:', err.message);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ CRITICAL: Unhandled Rejection:', reason);
});

// Middleware
app.use(cors());
app.use(express.json());

// AI Configuration
// Using standard flash model for better stability
const MODEL_NAME = "gemini-2.5-flash-lite"; 
let genAI = null;
if (process.env.API_KEY) {
  genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
} else {
  console.warn("⚠️ API_KEY is missing. AI features will be disabled.");
}

// Storage Configuration
let useMongo = false;
let feedbackMemory = []; 

const MONGODB_URI = process.env.MONGODB_URI;

if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(() => {
      console.log("✅ Connected to MongoDB");
      useMongo = true;
    })
    .catch(err => {
      console.error("❌ MongoDB connection error:", err);
      console.log("⚠️ Falling back to in-memory storage");
    });
} else {
  console.log("⚠️ MONGODB_URI is not defined. Using in-memory storage.");
}

// Mongoose Schema
const feedbackSchema = new mongoose.Schema({
  id: String,
  rating: Number,
  reviewText: String,
  timestamp: Number,
  aiAnalysis: {
    userResponse: String,
    summary: String,
    recommendedActions: [String],
    sentiment: String
  },
  helpfulResponse: { type: Boolean, default: null }
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

// Helper: Generate AI Content with Retry Logic
async function generateContentWithRetry(prompt, retries = 3, initialDelay = 1000) {
  if (!genAI) return null;

  for (let i = 0; i < retries; i++) {
    try {
      const response = await genAI.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              userResponse: { type: Type.STRING, description: "Response to the user" },
              summary: { type: Type.STRING, description: "Brief summary for admin" },
              recommendedActions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of recommended actions",
              },
              sentiment: {
                type: Type.STRING,
                enum: ["Positive", "Neutral", "Negative"],
                description: "Sentiment of the review",
              },
            },
            required: ["userResponse", "summary", "recommendedActions", "sentiment"],
          },
        },
      });
      return response;
    } catch (error) {
      // Retry on 429 (Too Many Requests) or 503 (Service Unavailable)
      const isTransient = error.status === 429 || error.status === 503 || error.message?.includes('429');
      if (isTransient && i < retries - 1) {
        const delay = initialDelay * Math.pow(2, i); // Exponential backoff: 1s, 2s, 4s...
        console.log(`⚠️ AI Busy (Status ${error.status}). Retrying in ${delay}ms...`);
        await new Promise(res => setTimeout(res, delay));
      } else {
        console.error(`❌ AI Generation Failed (Attempt ${i + 1}):`, error.message);
        if (i === retries - 1) throw error; // Throw only on final attempt
      }
    }
  }
}

// API Routes

// GET all submissions
app.get('/api/feedback', async (req, res) => {
  try {
    if (useMongo) {
      const feedback = await Feedback.find().sort({ timestamp: -1 });
      res.json(feedback);
    } else {
      res.json(feedbackMemory.sort((a, b) => b.timestamp - a.timestamp));
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST new submission
app.post('/api/feedback', async (req, res) => {
  try {
    const { rating, reviewText } = req.body;
    let aiAnalysis = req.body.aiAnalysis;

    // Generate AI Analysis on Server if not provided
    if (!aiAnalysis) {
      try {
        const prompt = `
          You are an AI feedback assistant for a customer feedback system.
          A user has submitted a review with the following details:
          Rating: ${rating} / 5 stars
          Review: "${reviewText}"

          Please perform the following tasks:
          1. Write a polite, empathetic, and personalized response to the user (max 50 words).
          2. Summarize the review for the admin in one concise sentence.
          3. Suggest 3 concrete, actionable steps the business should take based on this specific feedback.
          4. Determine the sentiment (Positive, Neutral, or Negative).
        `;

        const response = await generateContentWithRetry(prompt);

        if (response && response.text) {
          aiAnalysis = JSON.parse(response.text);
        }
      } catch (error) {
        console.error("⚠️ AI completely failed after retries. Using fallback.");
        // We do NOT crash the request here. We proceed with fallback data.
      }

      // Fallback if AI failed
      if (!aiAnalysis) {
        aiAnalysis = {
          userResponse: "Thank you for your feedback! We appreciate you taking the time to share your thoughts.",
          summary: "AI analysis unavailable at this moment.",
          recommendedActions: ["Check API Quota/Connection", "Review logs manually"],
          sentiment: "Neutral",
        };
      }
    }

    const newSubmission = {
      id: uuidv4(),
      rating,
      reviewText,
      timestamp: Date.now(),
      aiAnalysis,
      helpfulResponse: null
    };

    if (useMongo) {
      const newFeedback = new Feedback(newSubmission);
      await newFeedback.save();
      res.status(201).json(newFeedback);
    } else {
      feedbackMemory.push(newSubmission);
      res.status(201).json(newSubmission);
    }
  } catch (error) {
    console.error("Submission Error:", error);
    res.status(400).json({ message: error.message });
  }
});

// PATCH update submission (e.g., helpful status)
app.patch('/api/feedback/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (useMongo) {
      const updatedFeedback = await Feedback.findOneAndUpdate(
        { id: id },
        { $set: req.body },
        { new: true }
      );
      res.json(updatedFeedback);
    } else {
      const index = feedbackMemory.findIndex(f => f.id === id);
      if (index !== -1) {
        feedbackMemory[index] = { ...feedbackMemory[index], ...req.body };
        res.json(feedbackMemory[index]);
      } else {
        res.status(404).json({ message: "Not found" });
      }
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});