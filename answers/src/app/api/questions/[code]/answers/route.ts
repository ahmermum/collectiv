import { promises as fs } from 'fs';
import { NextResponse } from 'next/server';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data', 'questions');

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const { content } = await request.json();
    const filePath = path.join(DATA_DIR, `${params.code}.json`);
    
    // Read the existing question data
    const questionData = JSON.parse(await fs.readFile(filePath, 'utf8'));
    
    // Add the new answer
    questionData.answers.push(content);
    
    // Write the updated data back to the file
    await fs.writeFile(
      filePath,
      JSON.stringify(questionData, null, 2)
    );

    return NextResponse.json(questionData);
  } catch (error) {
    console.error('Failed to add answer:', error);
    return NextResponse.json(
      { error: 'Failed to add answer' },
      { status: 500 }
    );
  }
} 