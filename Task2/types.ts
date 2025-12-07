export interface FeedbackSubmission {
  id: string;
  rating: number;
  reviewText: string;
  timestamp: number;
  aiAnalysis: AiAnalysisResult;
  helpfulResponse?: boolean | null; 
}

export interface AiAnalysisResult {
  userResponse: string;
  summary: string;
  recommendedActions: string[];
  sentiment: 'Positive' | 'Neutral' | 'Negative';
}

export interface FeedbackStats {
  averageRating: number;
  totalReviews: number;
  sentimentDistribution: {
    name: string;
    value: number;
    color: string;
  }[];
  ratingDistribution: {
    rating: number;
    count: number;
  }[];
}
