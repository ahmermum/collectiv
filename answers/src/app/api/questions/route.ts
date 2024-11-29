import { promises as fs } from 'fs';
import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data', 'questions');

// Ensure the data directory exists
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

export async function POST(request: Request) {
  try {
    const { content } = await request.json();
    
    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    await ensureDataDir();
    
    const code = nanoid(10);
    const questionData = {
      id: code,
      code,
      content,
      answers: [],
      createdAt: new Date().toISOString()
    };

    await fs.writeFile(
      path.join(DATA_DIR, `${code}.json`),
      JSON.stringify(questionData, null, 2)
    );

    return NextResponse.json(questionData);
  } catch (error) {
    console.error('Failed to create question:', error);
    return NextResponse.json(
      { error: 'Failed to create question' },
      { status: 500 }
    );
  }
} 