'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';

interface Question {
  content: string;
  answers: string[];
  code: string;
}

export default function SynthesisPage() {
  const { code } = useParams();
  const [question, setQuestion] = useState<Question | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuestionAndSynthesis();
  }, [code]);

  const fetchQuestionAndSynthesis = async () => {
    try {
      // Fetch question
      const questionResponse = await fetch(`/api/questions/${code}`);
      if (!questionResponse.ok) throw new Error('Question not found');
      const questionData = await questionResponse.json();
      setQuestion(questionData);

      // Only fetch synthesis if there are enough answers
      if (questionData.answers.length >= 2) {
        const summaryResponse = await fetch(`/api/questions/${code}/summary`);
        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();
          setSummary(summaryData.summary);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  // Custom renderer components for ReactMarkdown
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

  const formatSummary = (text: string) => {
    return text
      .replace(/\*\*\d+\.\s/g, '**') // Remove numbered sections
      .replace(/(\*\*[^*]+\*\*)/g, '\n\n$1\n') // Add line breaks around headers
      .replace(/- ([^\n]+)/g, '\n- $1') // Add line breaks before bullet points
      .replace(/\n{3,}/g, '\n\n') // Remove excess line breaks
      .trim();
  };

  if (loading) return <div className="max-w-2xl mx-auto p-6">Loading...</div>;
  if (error) return <div className="max-w-2xl mx-auto p-6 text-red-500">{error}</div>;
  if (!question) return <div className="max-w-2xl mx-auto p-6">Question not found</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-8 text-center">{question.content}</h1>
      
      {question.answers.length < 2 ? (
        <div className="p-4 border rounded-md bg-yellow-50 dark:bg-yellow-900/10">
          <p className="text-yellow-700 dark:text-yellow-300">
            Not enough responses yet to generate a synthesis. Please check back later when more people have answered.
          </p>
          <p className="mt-2 text-yellow-600 dark:text-yellow-400">
            Current responses: {question.answers.length}
          </p>
        </div>
      ) : (
        <div className="p-8 border rounded-lg bg-background/5 shadow-sm">
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <div className="mb-6 text-sm text-foreground/60">
              Analysis based on {question.answers.length} responses
            </div>
            <ReactMarkdown 
              components={renderers}
              className="space-y-6 leading-relaxed"
            >
              {formatSummary(summary || '')}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
} 