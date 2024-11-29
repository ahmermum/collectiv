import { promises as fs } from 'fs';
import { NextResponse } from 'next/server';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data', 'questions');

export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const filePath = path.join(DATA_DIR, `${params.code}.json`);
    const data = await fs.readFile(filePath, 'utf8');
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const { content } = await request.json();
    const filePath = path.join(DATA_DIR, `${params.code}.json`);
    
    // Read existing data
    const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
    
    // Add new answer
    data.answers.push(content);
    
    // Write updated data
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));

    // Check if we need to generate a new summary
    if (data.answers.length % 5 === 0) {
      // Generate summary logic here
      // You might want to store summaries in a separate file
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to add answer:', error);
    return NextResponse.json({ error: 'Failed to add answer' }, { status: 500 });
  }
} 