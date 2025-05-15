import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { loadAndProcessPromptTemplate } from '../../utils/templateReplacer';
import { withCors, handleOptions } from '../../utils/cors';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const llmProvider = searchParams.get('llmProvider') || 'default';
  const promptText = searchParams.get('promptText') || '';

  const result = await handleTemplate(promptText, llmProvider);
  return withCors(result);
}

export async function POST(req) {
  const body = await req.json();
  const llmProvider = body.llmProvider || 'default';
  const promptText = body.promptText || '';

  const result = await handleTemplate(promptText, llmProvider);
  return withCors(result);
}

async function handleTemplate(promptText, llmProvider) {
  try {
    const configPath = path.join(process.cwd(), 'src/app/data', 'llmConfigs.json');
    const llmConfigs = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    const modelConfig = llmConfigs[llmProvider.toLowerCase()] || llmConfigs.default;

    const replacedPrompt = loadAndProcessPromptTemplate({ promptText });
    const finalOutput = [...replacedPrompt, modelConfig];

    return new NextResponse(JSON.stringify(finalOutput), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing template:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to process template' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
