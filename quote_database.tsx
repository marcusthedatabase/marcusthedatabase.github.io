import React, { useState, useEffect } from 'react';
import { Search, Plus, X, ExternalLink, AlertCircle } from 'lucide-react';

export default function QuoteDatabase() {
  const [quotes, setQuotes] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    quote: '',
    context: '',
    origin: '',
    extraInfo: ''
  });

  // Load quotes on mount
  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      const keys = await window.storage.list('quote:', true);
      if (keys && keys.keys) {
        const loadedQuotes = [];
        for (const key of keys.keys) {
          try {
            const result = await window.storage.get(key, true);
            if (result) {
              loadedQuotes.push(JSON.parse(result.value));
            }
          } catch (err) {
            console.log('Quote not found:', key);
          }
        }
        setQuotes(loadedQuotes.sort((a, b) => b.timestamp - a.timestamp));
      }
    } catch (err) {
      console.error('Error loading quotes:', err);
    } finally {
      setLoading(false);
    }
  };

  const containsInappropriateContent = (text) => {
    const inappropriatePatterns = [
      /\b(fuck|shit|ass|bitch|damn|hell|crap|piss|cock|dick|pussy|cunt|bastard|whore|slut)\b/i,
      /\b(kill yourself|kys|suicide|die)\b/i,
      /\b(n[i1]gg[ae]r|f[a4]gg[o0]t|r[e3]t[a4]rd)\b/i,
      /(xxx|porn|sex|nude)/i
    ];
    
    return inappropriatePatterns.some(pattern => pattern.test(text));
  };

  const handleSubmit = async () => {
    setError('');

    if (!formData.quote.trim()) {
      setError('Quote text is required');
      return;
    }

    // Content moderation
    const textToCheck = `${formData.quote} ${formData.context} ${formData.extraInfo}`;
    if (containsInappropriateContent(textToCheck)) {
      setError('Your submission contains inappropriate content. Please revise and try again.');
      return;
    }

    // Validate URL if provided
    if (formData.origin && !isValidUrl(formData.origin)) {
      setError('Please provide a valid URL for the origin');
      return;
    }

    const newQuote = {
      id: `quote:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      quote: formData.quote.trim(),
      context: formData.context.trim(),
      origin: formData.origin.trim(),
      extraInfo: formData.extraInfo.trim(),
      timestamp: Date.now()
    };

    try {
      await window.storage.set(newQuote.id, JSON.stringify(newQuote), true);
      setQuotes([newQuote, ...quotes]);
      setFormData({ quote: '', context: '', origin: '', extraInfo: '' });
      setShowAddForm(false);
    } catch (err) {
      setError('Failed to save quote. Please try again.');
    }
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const filteredQuotes = quotes.filter(q => 
    q.quote.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.context.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Community Quotes</h1>
          <p className="text-gray-600">Share and discover inspiring quotes from around the web</p>
        </div>

        {/* Add Quote Button */}
        <div className="mb-6 flex justify-center">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 shadow-lg"
          >
            {showAddForm ? <X size={20} /> : <Plus size={20} />}
            {showAddForm ? 'Cancel' : 'Add Quote'}
          </button>
        </div>

        {/* Add Quote Form */}
        {showAddForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Submit a Quote</h2>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-start gap-2">
                <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quote <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.quote}
                  onChange={(e) => setFormData({...formData, quote: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows="3"
                  placeholder="Enter the quote..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Context</label>
                <textarea
                  value={formData.context}
                  onChange={(e) => setFormData({...formData, context: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows="2"
                  placeholder="Who said it? When? Where?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Origin (URL)</label>
                <input
                  type="url"
                  value={formData.origin}
                  onChange={(e) => setFormData({...formData, origin: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="https://example.com/source"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Extra Information</label>
                <textarea
                  value={formData.extraInfo}
                  onChange={(e) => setFormData({...formData, extraInfo: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows="3"
                  placeholder="Additional notes, analysis, or context..."
                />
              </div>

              <button
                onClick={handleSubmit}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-medium"
              >
                Submit Quote
              </button>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search quotes..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white shadow-sm"
            />
          </div>
        </div>

        {/* Quotes List */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading quotes...</div>
        ) : filteredQuotes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchTerm ? 'No quotes found matching your search.' : 'No quotes yet. Be the first to add one!'}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredQuotes.map((q) => (
              <div
                key={q.id}
                onClick={() => setSelectedQuote(selectedQuote?.id === q.id ? null : q)}
                className="bg-white rounded-xl shadow-md p-6 cursor-pointer hover:shadow-lg transition border border-gray-200"
              >
                <div className="text-lg text-gray-800 font-medium mb-2">"{q.quote}"</div>
                {q.context && (
                  <div className="text-sm text-gray-600 mb-3">— {q.context}</div>
                )}
                
                {selectedQuote?.id === q.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                    {q.extraInfo && (
                      <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Extra Information</div>
                        <div className="text-sm text-gray-700">{q.extraInfo}</div>
                      </div>
                    )}
                    {q.origin && (
                      <div>
                        <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Origin</div>
                        <a
                          href={q.origin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {q.origin}
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="text-xs text-gray-400 mt-3">
                  {new Date(q.timestamp).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Note */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>All quotes are publicly visible and stored using shared storage.</p>
          <p className="mt-1">Inappropriate content will be rejected automatically.</p>
        </div>
      </div>
    </div>
  );
}