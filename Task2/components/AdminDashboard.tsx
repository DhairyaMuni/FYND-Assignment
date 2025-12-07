import React, { useEffect, useState, useMemo, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { LayoutDashboard, TrendingUp, RefreshCw, Download, User, Search, Filter, ThumbsUp, ThumbsDown, Bell, Info } from 'lucide-react';
import StarRating from './StarRating';
import { getSubmissions } from '../services/storageService';
import { FeedbackSubmission, FeedbackStats } from '../types';

const AdminDashboard: React.FC = () => {
  const [submissions, setSubmissions] = useState<FeedbackSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [notification, setNotification] = useState<string | null>(null);
  
  // Refs for tracking updates
  const isFirstLoad = useRef(true);
  const prevCountRef = useRef(0);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState<'all' | number>('all');
  const [sentimentFilter, setSentimentFilter] = useState<'all' | string>('all');

  // Stats State
  const [stats, setStats] = useState<FeedbackStats | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
        const data = await getSubmissions();
        // Sort by newest first
        data.sort((a, b) => b.timestamp - a.timestamp);
        
        // Handle Notification Logic
        if (isFirstLoad.current) {
            isFirstLoad.current = false;
        } else if (data.length > prevCountRef.current) {
            setNotification("New feedback received!");
            setTimeout(() => setNotification(null), 4000);
        }
        prevCountRef.current = data.length;

        setSubmissions(data);
        setLastUpdated(new Date());
    } catch (error) {
        console.error("Failed to load data", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 10 seconds for live updates from DB
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
      calculateStats(submissions);
  }, [submissions]);

  const calculateStats = (data: FeedbackSubmission[]) => {
    if (data.length === 0) {
      setStats(null);
      return;
    }

    const total = data.length;
    const avgRating = data.reduce((acc, curr) => acc + curr.rating, 0) / total;
    
    const sentiments: Record<string, number> = { Positive: 0, Neutral: 0, Negative: 0 };
    const ratingsCount = [0, 0, 0, 0, 0, 0]; // 0-5 index (ignore 0)

    data.forEach(s => {
      const sent = s.aiAnalysis.sentiment;
      if (sent in sentiments) sentiments[sent]++;
      if (s.rating >= 1 && s.rating <= 5) ratingsCount[s.rating]++;
    });

    const sentimentData = [
      { name: 'Positive', value: sentiments.Positive, color: '#22c55e' }, // Green
      { name: 'Neutral', value: sentiments.Neutral, color: '#94a3b8' },  // Gray
      { name: 'Negative', value: sentiments.Negative, color: '#ef4444' }, // Red
    ];

    const ratingData = [1, 2, 3, 4, 5].map(r => ({
        rating: r,
        count: ratingsCount[r]
    }));

    setStats({
      averageRating: parseFloat(avgRating.toFixed(1)),
      totalReviews: total,
      sentimentDistribution: sentimentData,
      ratingDistribution: ratingData
    });
  };

  const handleExportCSV = () => {
    if (submissions.length === 0) {
        alert("No data to export.");
        return;
    }

    // Explicitly aligned headers
    const headers = [
        "ID", 
        "Date", 
        "Rating", 
        "Review", 
        "Sentiment", 
        "Summary", 
        "Recommended Actions", 
        "Helpful Response?"
    ];

    const rows = submissions.map(s => [
        s.id,
        new Date(s.timestamp).toLocaleString().replace(/,/g, ' '), // Remove commas from date just in case
        s.rating,
        `"${s.reviewText.replace(/"/g, '""')}"`, // Quote and escape review text
        s.aiAnalysis.sentiment,
        `"${s.aiAnalysis.summary.replace(/"/g, '""')}"`, // Quote and escape summary
        `"${s.aiAnalysis.recommendedActions.join('; ').replace(/"/g, '""')}"`,
        s.helpfulResponse === true ? "Yes" : s.helpfulResponse === false ? "No" : "N/A"
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n" 
        + rows.map(e => e.join(",")).join("\n");
        
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `feedback_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to generate integer ticks for charts (avoiding 0, 1.5, 3...)
  const getIntegerTicks = (data: any[], key: string) => {
      const max = Math.max(...data.map(d => d[key]));
      if (max <= 10) {
          return Array.from({length: max + 1}, (_, i) => i);
      }
      return undefined; 
  };

  const filteredSubmissions = useMemo(() => {
    return submissions.filter(sub => {
        const matchesSearch = sub.reviewText.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              sub.aiAnalysis.summary.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRating = ratingFilter === 'all' || sub.rating === ratingFilter;
        const matchesSentiment = sentimentFilter === 'all' || sub.aiAnalysis.sentiment === sentimentFilter;
        
        return matchesSearch && matchesRating && matchesSentiment;
    });
  }, [submissions, searchTerm, ratingFilter, sentimentFilter]);

  // Custom Tooltip Component for better visibility
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 border border-gray-700 p-2 rounded-lg shadow-lg text-xs text-white z-50">
          <p className="font-semibold mb-1">{label || payload[0].payload.name}</p>
          <p className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].color || payload[0].fill }}></span>
            Count: <span className="font-bold">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 relative">
      
      {/* Toast Notification */}
      {notification && (
          <div className="fixed top-20 right-4 sm:right-10 bg-indigo-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-top-5 duration-300 z-50">
              <Bell className="w-5 h-5 animate-bounce" />
              <span className="font-medium">{notification}</span>
          </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 pt-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <LayoutDashboard className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            Admin Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
            Live overview • Last updated: {lastUpdated.toLocaleTimeString()}
            {loading && <RefreshCw className="w-3 h-3 animate-spin" />}
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchData}
            title="Refresh data from server"
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm focus:ring-2 focus:ring-indigo-500"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button 
            onClick={handleExportCSV}
            title="Download all feedback as CSV"
            className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors shadow-sm focus:ring-2 focus:ring-green-500"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Reviews */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between h-48">
          <div className="flex justify-between items-start">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wider">Total Feedback</h3>
            <div title="Total number of submissions received">
              <Info className="w-4 h-4 text-gray-400" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-4xl font-bold text-gray-900 dark:text-white">{stats?.totalReviews || 0}</span>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">All time submissions</p>
          </div>
        </div>

        {/* Average Rating */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between h-48">
          <div className="flex justify-between items-start">
             <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wider">Avg. Rating</h3>
             <div title="Average star rating across all reviews">
                <Info className="w-4 h-4 text-gray-400" />
             </div>
          </div>
          <div className="mt-4">
             <div className="flex items-center gap-2">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">{stats?.averageRating || 0}</span>
                <span className="text-gray-400 text-xl">/ 5</span>
             </div>
             <div className="mt-2">
                <StarRating rating={Math.round(stats?.averageRating || 0)} setRating={() => {}} editable={false} size={20} />
             </div>
          </div>
        </div>

        {/* Rating Distribution Chart */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-48 flex flex-col">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider">Rating Breakup</h3>
                <div title="Distribution of star ratings">
                  <Info className="w-3 h-3 text-gray-400" />
                </div>
            </div>
            <div className="flex-1 w-full min-h-0">
            {stats && (
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.ratingDistribution} margin={{ top: 5, right: 5, bottom: 0, left: -25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.3} />
                    <XAxis dataKey="rating" tick={{fill: '#9ca3af', fontSize: 10}} axisLine={false} tickLine={false} />
                    <YAxis 
                        tick={{fill: '#9ca3af', fontSize: 10}} 
                        axisLine={false} 
                        tickLine={false} 
                        allowDecimals={false}
                        ticks={getIntegerTicks(stats.ratingDistribution, 'count')}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(99, 102, 241, 0.1)'}} />
                    <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
                </ResponsiveContainer>
            )}
            {!stats && <div className="h-full flex items-center justify-center text-gray-400 text-xs">No data</div>}
            </div>
        </div>

        {/* Sentiment Bar Chart */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-48 flex flex-col relative">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider">Sentiment Analysis</h3>
            <div title="AI-determined sentiment of reviews">
              <Info className="w-3 h-3 text-gray-400" />
            </div>
          </div>
          <div className="flex-1 w-full min-h-0">
            {stats && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.sentimentDistribution} margin={{ top: 5, right: 5, bottom: 0, left: -25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.3} />
                    <XAxis dataKey="name" tick={{fill: '#9ca3af', fontSize: 10}} axisLine={false} tickLine={false} />
                    <YAxis 
                        tick={{fill: '#9ca3af', fontSize: 10}} 
                        axisLine={false} 
                        tickLine={false} 
                        allowDecimals={false}
                        ticks={getIntegerTicks(stats.sentimentDistribution, 'value')}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255, 255, 255, 0.05)'}} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={30}>
                        {stats.sentimentDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
            {!stats && <div className="h-full flex items-center justify-center text-gray-400 text-xs">No data</div>}
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full" title="Filter results by keyword">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
                type="text" 
                placeholder="Search reviews or summaries..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
        </div>
        <div className="flex gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2" title="Filter by Star Rating">
                <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <select 
                    value={ratingFilter}
                    onChange={(e) => setRatingFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                    <option value="all">All Ratings</option>
                    <option value="5">5 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="2">2 Stars</option>
                    <option value="1">1 Star</option>
                </select>
            </div>
            <div title="Filter by Sentiment">
                <select 
                    value={sentimentFilter}
                    onChange={(e) => setSentimentFilter(e.target.value)}
                    className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                    <option value="all">All Sentiments</option>
                    <option value="Positive">Positive</option>
                    <option value="Neutral">Neutral</option>
                    <option value="Negative">Negative</option>
                </select>
            </div>
        </div>
      </div>

      {/* Submissions List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 dark:text-gray-200">
            Submission History <span className="text-gray-400 font-normal text-sm ml-2">({filteredSubmissions.length})</span>
          </h2>
        </div>
        
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredSubmissions.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              {searchTerm || ratingFilter !== 'all' || sentimentFilter !== 'all' 
                ? 'No matching results found.'
                : 'No reviews submitted yet.'}
            </div>
          ) : (
            filteredSubmissions.map((submission) => (
              <div key={submission.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Left Column: User Content */}
                  <div className="md:w-1/3 flex-shrink-0">
                    <div className="flex items-center gap-3 mb-2">
                       <div className="bg-gray-200 dark:bg-gray-700 p-2 rounded-full">
                         <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                       </div>
                       <div>
                         <div className="text-sm text-gray-500 dark:text-gray-400">
                           {new Date(submission.timestamp).toLocaleDateString()} at {new Date(submission.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                         </div>
                         <div className="flex items-center gap-2 mt-1">
                           <StarRating rating={submission.rating} setRating={() => {}} editable={false} size={14} />
                           <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">({submission.rating}/5)</span>
                         </div>
                       </div>
                    </div>
                    <blockquote className="text-gray-700 dark:text-gray-300 italic border-l-4 border-gray-300 dark:border-gray-600 pl-4 py-1 mt-3">
                      "{submission.reviewText}"
                    </blockquote>
                    
                    {/* Helpful Status Indicator */}
                    {submission.helpfulResponse !== undefined && submission.helpfulResponse !== null && (
                      <div className="mt-4 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400" title="Did the user find the AI response helpful?">
                        <span>User found AI response helpful?</span>
                        {submission.helpfulResponse ? (
                           <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium"><ThumbsUp className="w-3 h-3" /> Yes</span>
                        ) : (
                           <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-medium"><ThumbsDown className="w-3 h-3" /> No</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Column: AI Insights */}
                  <div className="md:w-2/3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 border border-indigo-100 dark:border-indigo-800">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-1 rounded text-xs font-bold uppercase tracking-wider bg-white dark:bg-gray-800 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300">
                        AI Analysis
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider text-white ${
                        submission.aiAnalysis.sentiment === 'Positive' ? 'bg-green-500' : 
                        submission.aiAnalysis.sentiment === 'Negative' ? 'bg-red-500' : 'bg-gray-500'
                      }`}>
                        {submission.aiAnalysis.sentiment}
                      </span>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Summary</h4>
                      <p className="text-gray-800 dark:text-gray-200 text-sm font-medium">
                        {submission.aiAnalysis.summary}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> Recommended Actions
                      </h4>
                      <ul className="space-y-1">
                        {submission.aiAnalysis.recommendedActions.map((action, idx) => (
                          <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                            <span className="text-indigo-500 dark:text-indigo-400 mt-1">•</span>
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;