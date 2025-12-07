import React, { useState } from 'react';
import { Send, Loader2, CheckCircle2, MessageSquare, ThumbsUp, ThumbsDown, Sparkles } from 'lucide-react';
import StarRating from './StarRating';
import { saveSubmission, updateSubmission } from '../services/storageService';
import { FeedbackSubmission } from '../types';

const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />
);

const UserDashboard: React.FC = () => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<FeedbackSubmission | null>(null);
  const [helpfulStatus, setHelpfulStatus] = useState<'yes' | 'no' | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      alert("Please select a star rating.");
      return;
    }
    if (!review.trim()) {
      alert("Please write a review.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Send rating and review to server. 
      // Server handles AI analysis and ID generation.
      const response = await saveSubmission({
        rating,
        reviewText: review
      });

      setSubmittedData(response);
      setHelpfulStatus(null);
      
    } catch (error) {
      console.error("Submission failed", error);
      alert("Something went wrong. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHelpfulFeedback = async (isHelpful: boolean) => {
    if (!submittedData) return;
    
    try {
        await updateSubmission(submittedData.id, { helpfulResponse: isHelpful });
        setHelpfulStatus(isHelpful ? 'yes' : 'no');
    } catch (error) {
        console.error("Failed to update status", error);
    }
  };

  const handleReset = () => {
    setRating(0);
    setReview('');
    setSubmittedData(null);
    setHelpfulStatus(null);
  };

  // Render Submitted State
  if (submittedData) {
    return (
      <div className="max-w-2xl mx-auto px-4 mt-6 sm:mt-10">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-green-100 dark:border-green-900/30 p-8 animate-in fade-in zoom-in duration-500">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Thank You!</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">We received your feedback.</p>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl w-full text-left border border-blue-100 dark:border-blue-800/50">
              <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-1 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">Our Response:</p>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {submittedData.aiAnalysis.userResponse}
                  </p>
                </div>
              </div>
            </div>

            {/* Helpful Feedback Mechanism */}
            <div className="mt-6 flex flex-col items-center gap-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">Was this response helpful?</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => handleHelpfulFeedback(true)}
                  disabled={helpfulStatus !== null}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    helpfulStatus === 'yes' 
                      ? 'bg-green-100 text-green-700 border border-green-200 dark:bg-green-900 dark:text-green-300' 
                      : helpfulStatus === 'no'
                      ? 'opacity-50 cursor-not-allowed text-gray-400'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" /> Yes
                </button>
                <button 
                  onClick={() => handleHelpfulFeedback(false)}
                  disabled={helpfulStatus !== null}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    helpfulStatus === 'no' 
                      ? 'bg-red-100 text-red-700 border border-red-200 dark:bg-red-900 dark:text-red-300' 
                      : helpfulStatus === 'yes'
                      ? 'opacity-50 cursor-not-allowed text-gray-400'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  <ThumbsDown className="w-4 h-4" /> No
                </button>
              </div>
            </div>

            <button 
              onClick={handleReset}
              className="mt-8 px-6 py-2 text-gray-600 dark:text-gray-400 font-medium hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Submit another review
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Form or Loading Skeleton
  return (
    <div className="max-w-xl mx-auto px-4">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">We value your opinion</h1>
        <p className="text-gray-600 dark:text-gray-400">Please rate your experience and let us know how we can improve.</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700 relative overflow-hidden">
        
        {isSubmitting && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/90 z-10 flex flex-col items-center justify-center p-8 backdrop-blur-sm">
             <div className="w-full max-w-sm space-y-6">
                <div className="flex flex-col items-center gap-3 mb-8">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-full animate-pulse">
                    <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Analyzing your feedback...</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
                    <div className="space-y-2 w-full">
                       <Skeleton className="h-4 w-3/4" />
                       <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                  <Skeleton className="h-24 w-full rounded-xl" />
                  <div className="flex justify-end">
                    <Skeleton className="h-8 w-24 rounded-lg" />
                  </div>
                </div>
             </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center space-y-4">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Your Rating
            </label>
            <StarRating rating={rating} setRating={setRating} size={40} />
            <p className="text-sm text-gray-500 dark:text-gray-400 h-1">
              {rating > 0 ? ['Terrible', 'Bad', 'Okay', 'Good', 'Excellent'][rating - 1] : ''}
            </p>
          </div>

          <div className="space-y-3">
            <label htmlFor="review" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Your Review
            </label>
            <textarea
              id="review"
              rows={5}
              className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 outline-none transition-all resize-none text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="Tell us what you liked or what we can do better..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-6 rounded-xl flex items-center justify-center gap-2 text-white font-semibold text-lg shadow-lg transition-all bg-blue-600 hover:bg-blue-700 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed"
          >
             Submit Feedback <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserDashboard;