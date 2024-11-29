'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewQuestion() {
  const [question, setQuestion] = useState('');
  const [questionUrl, setQuestionUrl] = useState<string | null>(null);
  const [isUrlCopied, setIsUrlCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: question }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Failed to create question:', data.error);
        return;
      }

      // Generate the shareable URL
      const url = `${window.location.origin}/questions/${data.code}`;
      setQuestionUrl(url);
      // Clear the form
      setQuestion('');
    } catch (error) {
      console.error('Error creating question:', error);
    }
  };

  const handleCopyUrl = async () => {
    if (questionUrl) {
      try {
        await navigator.clipboard.writeText(questionUrl);
        setIsUrlCopied(true);
        setTimeout(() => setIsUrlCopied(false), 2000); // Reset after 2 seconds
      } catch (err) {
        console.error('Failed to copy URL:', err);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create a New Question</h1>
      
      {!questionUrl ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2">Your Question:</label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full h-32 p-2 border rounded-md bg-background text-foreground"
              required
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-foreground text-background rounded-md hover:opacity-90"
          >
            Create Question
          </button>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="p-4 border rounded-md bg-green-50 dark:bg-green-900/10">
            <h2 className="text-lg font-semibold mb-2 text-green-700 dark:text-green-300">
              Question Created Successfully!
            </h2>
            <p className="text-sm text-green-600 dark:text-green-400 mb-4">
              Share this link with others to collect their answers:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={questionUrl}
                readOnly
                className="flex-1 p-2 border rounded-md bg-white dark:bg-gray-800"
              />
              <button
                onClick={handleCopyUrl}
                className={`px-4 py-2 rounded-md transition-colors ${
                  isUrlCopied 
                    ? 'bg-green-500 text-white' 
                    : 'bg-foreground text-background hover:opacity-90'
                }`}
              >
                {isUrlCopied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>
          
          <button
            onClick={() => {
              setQuestionUrl(null);
              setIsUrlCopied(false);
            }}
            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Create Another Question
          </button>
        </div>
      )}
    </div>
  );
} 