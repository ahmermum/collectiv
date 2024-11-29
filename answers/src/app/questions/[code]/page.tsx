'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';

interface Question {
  content: string;
  answers: string[];
  code: string;
}

// Add the renderers object
const renderers = {
  h1: (props: React.ComponentPropsWithoutRef<'h2'>) => (
    <h2 className="text-xl font-bold mt-8 mb-4 text-foreground/90 border-b pb-2" {...props} />
  ),
  h2: (props: React.ComponentPropsWithoutRef<'h3'>) => (
    <h3 className="text-lg font-semibold mt-6 mb-3 text-foreground/80" {...props} />
  ),
  p: (props: React.ComponentPropsWithoutRef<'p'>) => (
    <p className="mb-4 leading-relaxed" {...props} />
  ),
  ul: (props: React.ComponentPropsWithoutRef<'ul'>) => (
    <ul className="mb-4 ml-6 space-y-2 list-disc" {...props} />
  ),
  li: (props: React.ComponentPropsWithoutRef<'li'>) => (
    <li className="leading-relaxed" {...props} />
  ),
  strong: (props: React.ComponentPropsWithoutRef<'strong'>) => (
    <strong className="font-semibold text-foreground" {...props} />
  ),
  blockquote: (props: React.ComponentPropsWithoutRef<'blockquote'>) => (
    <blockquote className="border-l-4 border-foreground/20 pl-4 my-4 italic" {...props} />
  ),
};

// Add the formatSummary function
const formatSummary = (text: string) => {
  return text
    .replace(/\*\*\d+\.\s/g, '**')
    .replace(/(\*\*[^*]+\*\*)/g, '\n\n$1\n')
    .replace(/- ([^\n]+)/g, '\n- $1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

// Add this loading component
const LoadingSynthesis = () => (
  <div className="mt-8 p-8 border rounded-lg bg-background/5">
    <div className="flex items-center gap-3 text-foreground/70">
      <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-foreground/70" />
      <p>Generating synthesis...</p>
    </div>
    <div className="mt-4 space-y-3">
      <div className="h-4 bg-foreground/10 rounded animate-pulse" />
      <div className="h-4 bg-foreground/10 rounded animate-pulse w-[90%]" />
      <div className="h-4 bg-foreground/10 rounded animate-pulse w-[95%]" />
    </div>
  </div>
);

export default function QuestionPage() {
  const { code } = useParams();
  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState('');
  const [summary, setSummary] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answerCount, setAnswerCount] = useState<number>(0);
  const [isGeneratingSynthesis, setIsGeneratingSynthesis] = useState(false);

  useEffect(() => {
    fetchQuestion();
  }, [code]);

  const fetchQuestion = async () => {
    try {
      const response = await fetch(`/api/questions/${code}`);
      if (!response.ok) throw new Error('Question not found');
      const data = await response.json();
      setQuestion(data);
    } catch (error) {
      console.error('Error fetching question:', error);
      setError('Failed to load question');
    }
  };

  const validateAnswer = (text: string) => {
    const wordCount = text.trim().split(/\s+/).length;
    return wordCount >= 10;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validateAnswer(answer)) {
      setError('Please provide at least 10 words in your answer.');
      return;
    }

    try {
      const response = await fetch(`/api/questions/${code}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: answer }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit answer');
      }

      const updatedQuestion = await response.json();
      setAnswerCount(updatedQuestion.answers.length);
      setSubmitted(true);

      // Only fetch summary if there are at least 2 answers
      if (updatedQuestion.answers.length >= 2) {
        setIsGeneratingSynthesis(true);
        const summaryResponse = await fetch(`/api/questions/${code}/summary`);
        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();
          setSummary(summaryData.summary);
        }
        setIsGeneratingSynthesis(false);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit answer');
      setIsGeneratingSynthesis(false);
    }
  };

  if (!question) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">{question.content}</h1>
      
      {!submitted ? (
        <form onSubmit={handleSubmit} className="space-y-4 mb-8">
          <div>
            <label className="block mb-2">Your Answer (minimum 10 words):</label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="w-full h-32 p-2 border rounded-md bg-background text-foreground"
              required
            />
            {error && (
              <p className="text-red-500 mt-2">{error}</p>
            )}
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-foreground text-background rounded-md hover:opacity-90"
          >
            Submit Answer
          </button>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="p-4 border rounded-md bg-green-50 dark:bg-green-900/10">
            <h2 className="text-lg font-semibold text-green-700 dark:text-green-300">
              Thank you for your response!
            </h2>
            {answerCount < 2 ? (
              <div className="mt-2 space-y-2">
                <p className="text-green-600 dark:text-green-400">
                  You are the first to answer. Check back later to see a synthesis of responses once more people have answered.
                </p>
                <p className="text-green-600 dark:text-green-400">
                  Bookmark this link to view the synthesis later:{' '}
                  <a 
                    href={`/questions/${code}/synthesis`}
                    className="underline hover:text-green-700 dark:hover:text-green-300"
                  >
                    View Synthesis
                  </a>
                </p>
              </div>
            ) : (
              <p className="mt-2 text-green-600 dark:text-green-400">
                Below is a synthesis based on {answerCount} responses:
              </p>
            )}
          </div>
          
          {isGeneratingSynthesis ? (
            <LoadingSynthesis />
          ) : summary && (
            <div className="mt-8 p-8 border rounded-lg bg-background/5">
              <h2 className="text-xl font-bold mb-4">
                Synthesis of {answerCount} Responses
              </h2>
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <ReactMarkdown 
                  components={renderers}
                  className="space-y-6 leading-relaxed"
                >
                  {formatSummary(summary)}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 