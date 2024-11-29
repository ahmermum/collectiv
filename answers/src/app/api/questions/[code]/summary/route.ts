import { promises as fs } from 'fs';
import { NextResponse } from 'next/server';
import path from 'path';
import OpenAI from 'openai';

const DATA_DIR = path.join(process.cwd(), 'data', 'questions');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    // Read the question data from file instead of KV store
    const filePath = path.join(DATA_DIR, `${params.code}.json`);
    const questionData = JSON.parse(await fs.readFile(filePath, 'utf8'));

    if (!questionData || questionData.answers.length < 2) {
      return NextResponse.json({ summary: null });
    }

    const prompt = `You are analyzing a collection of anonymous responses to the question: "${questionData.content}"

Analyze these responses and provide a comprehensive yet concise report structured as follows:

1. CORE SYNTHESIS (2-3 paragraphs)
- Distill the essential message emerging from all responses
- Highlight the primary consensus (if any)
- Note significant divergent viewpoints
- Capture the overall emotional tone

2. PATTERN RECOGNITION
- List the main themes (ordered by frequency)
- Identify recurring keywords or phrases
- Note any surprising or unique perspectives
- Point out any notable gaps in the feedback

3. SENTIMENT BREAKDOWN
- Provide an approximate distribution of sentiments (positive/neutral/negative)
- Include representative quotes (while maintaining anonymity)
- Highlight emotional undertones and intensity levels

4. ACTIONABLE INSIGHTS
- Extract key takeaways
- Identify potential areas for improvement or action
- List specific recommendations based on the feedback

5. META ANALYSIS
- Comment on the quality and depth of the responses
- Note any potential biases or limitations in the feedback
- Suggest follow-up questions if needed

FORMAT GUIDELINES:
- Keep sections clearly labeled
- Use bullet points for clarity
- Include specific examples while maintaining anonymity
- Quantify findings where possible (e.g., "approximately 70% mentioned...")
- Bold key findings and important conclusions

Important notes for analysis:
- Maintain complete anonymity - never include identifying details
- Weight all responses equally unless explicitly noted otherwise
- Acknowledge uncertainty where appropriate
- Focus on patterns rather than individual responses
- Consider both what is said and what is notably absent

The collected responses are:
${questionData.answers.map((a: string) => `- ${a}`).join('\n')}

End your analysis with a single sentence that captures the most important insight or takeaway from all the responses.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert analyst skilled at synthesizing qualitative data and providing structured insights while maintaining anonymity."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    });

    const summary = completion.choices[0].message.content;
    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Failed to generate summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
} 