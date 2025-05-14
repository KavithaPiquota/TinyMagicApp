import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { replacePlaceholders } from '../../utils/templateReplacer';
import { corsHeaders, withCors, handleOptions } from '../../utils/cors';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const systemContent = searchParams.get('systemContent') || '';
  const promptText = searchParams.get('promptText') || '';
  const llmProvider = searchParams.get('llmProvider') || 'default';

  const result = await handleTemplate({ systemContent, promptText }, llmProvider);
  return withCors(result);
}

export async function POST(req) {
  const body = await req.json();
  const systemContent = body.systemContent || '';
  const promptText = body.promptText || '';
  const llmProvider = body.llmProvider || 'default';

  const result = await handleTemplate({ systemContent, promptText }, llmProvider);
  return withCors(result);
}

async function handleTemplate(replacements, llmProvider) {
  try {
    const promptPath = path.join(process.cwd(), 'src/app/data', 'promptTemplate.json');
    const configPath = path.join(process.cwd(), 'src/app/data', 'llmConfigs.json');

    const promptData = JSON.parse(fs.readFileSync(promptPath, 'utf8'));
    const llmConfigs = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    const replacedPrompt = replacePlaceholders(promptData, replacements);
    const modelConfig = llmConfigs[llmProvider.toLowerCase()] || llmConfigs.default;

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
