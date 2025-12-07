import { FeedbackSubmission } from '../types';

const API_URL = process.env.VITE_API_URL || ''; 
const ENDPOINT = `${API_URL}/api/feedback`;

// Accept just rating and review, and return the full created object
export const saveSubmission = async (submission: Pick<FeedbackSubmission, 'rating' | 'reviewText'>): Promise<FeedbackSubmission> => {
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submission),
    });
    
    if (!response.ok) {
      throw new Error('Failed to save submission');
    }

    const data = await response.json();
    return data as FeedbackSubmission;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

export const updateSubmission = async (id: string, updates: Partial<FeedbackSubmission>): Promise<void> => {
  try {
    const response = await fetch(`${ENDPOINT}/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Failed to update submission');
    }
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

export const getSubmissions = async (): Promise<FeedbackSubmission[]> => {
  try {
    const response = await fetch(ENDPOINT);
    if (!response.ok) {
      throw new Error('Failed to fetch submissions');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API Error:", error);
    return [];
  }
};

export const clearSubmissions = async (): Promise<void> => {
  console.warn("Bulk delete not supported via client API");
};