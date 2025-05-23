import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { replacePlaceholders } from '../../utils/templateReplacer';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const systemContent = searchParams.get('systemContent') || '';
  const promptText = searchParams.get('promptText') || '';
  const llmProvider = searchParams.get('llmProvider') || 'default';

  return await handleTemplate({ systemContent, promptText }, llmProvider);
}

export async function POST(req) {
  const body = await req.json();
  const systemContent = body.systemContent || '';
  const promptText = body.promptText || '';
  const llmProvider = body.llmProvider || 'default';

  return await handleTemplate({ systemContent, promptText }, llmProvider);
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

    return NextResponse.json(finalOutput);
  } catch (error) {
    console.error('Error processing template:', error);
    return NextResponse.json({ error: 'Failed to process template' }, { status: 500 });
  }
}
