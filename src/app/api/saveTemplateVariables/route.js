import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path'; 
import { withCors, handleOptions } from '../../utils/cors';

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { username, promptType, variables } = body;

    if (!username || !promptType || typeof variables !== 'object') {
      return NextResponse.json({ error: 'Missing or invalid input' }, { status: 400 });
    }

    const userDir = path.join(process.cwd(), 'src/app/data/userTemplates', username);
    const filePath = path.join(userDir, `${promptType}.txt`);

    // Ensure directory exists
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    // Format the JSON nicely (just like templatevalue.txt)
    const fileContent = JSON.stringify(variables, null, 2);

    // Write (overwrite) the file
    fs.writeFileSync(filePath, fileContent, 'utf-8');

    return withCors(
      new NextResponse(JSON.stringify({ success: true, message: 'Template saved.' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  } catch (err) {
    console.error('Error saving template variables:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
