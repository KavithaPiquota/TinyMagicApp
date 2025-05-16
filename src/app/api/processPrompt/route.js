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
        const { username, promptType, llmProvider = 'default', userInput = '' } = body;
        const baseDir = path.join(process.cwd(), 'src/app/data');
console.log('Base Directory:', baseDir);  

        const promptTemplatePath = path.join(baseDir, 'promptTemplate.json');
        console.log('Prompt Template Path:', promptTemplatePath); 
        if (!fs.existsSync(promptTemplatePath)) {
            return NextResponse.json({ error: `'promptTemplate.json' not found.` }, { status: 404 });
        }
        const promptTemplate = JSON.parse(fs.readFileSync(promptTemplatePath, 'utf8'));

        let userDataPath = path.join(baseDir, 'userTemplates', username, `${promptType}.txt`);
        let userVariables;

        if (fs.existsSync(userDataPath)) {
            userVariables = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
        } else {
            console.warn(`User-specific template not found at ${userDataPath}. Falling back to defaultTemplateValues.txt.`);

            const defaultTemplatePath = path.join(baseDir, 'defaultTemplateValues.txt');
            if (!fs.existsSync(defaultTemplatePath)) {
                return NextResponse.json({
                    error: `Default template values not found at '${defaultTemplatePath}'.`
                }, { status: 404 });
            }
            userVariables = JSON.parse(fs.readFileSync(defaultTemplatePath, 'utf8'));
        }

        let systemContentPath;
        if (promptType === 'conceptMentor') {
            systemContentPath = path.join(baseDir, 'conceptmentor.txt');
        } else if (promptType === 'assessmentPrompt') {
            systemContentPath = path.join(baseDir, 'assessmentPrompt.txt');
        } else {
            return NextResponse.json({ error: `'${promptType}.txt' file not found for system content.` }, { status: 404 });
        }

        if (!fs.existsSync(systemContentPath)) {
            return NextResponse.json({ error: `'${systemContentPath}' not found.` }, { status: 404 });
        }
        const systemContentTemplate = fs.readFileSync(systemContentPath, 'utf8');

        const systemContent = replacePlaceholders(systemContentTemplate, userVariables);

        const llmConfigPath = path.join(baseDir, 'llmConfigs.json');
        if (!fs.existsSync(llmConfigPath)) {
            return NextResponse.json({ error: `LLM config 'llmConfigs.json' not found.` }, { status: 404 });
        }
        const llmConfigs = JSON.parse(fs.readFileSync(llmConfigPath, 'utf8'));
        const llmConfig = llmConfigs[llmProvider.toLowerCase()] || llmConfigs.default;

        const finalMessages = promptTemplate.map(item => {
            if (item.role === 'system') {
                return { role: item.role, content: systemContent };
            }
            if (item.role === 'user') {
                return { role: item.role, content: userInput };
            }
            return item;
        });

        // Add CORS headers to the response using withCors
        return withCors(NextResponse.json({
            messages: finalMessages,
            llmConfig
        }));

    } catch (err) {
        console.error('Error processing prompt:', err);
        return NextResponse.json({ error: 'Server error processing prompt' }, { status: 500 });
    }
}

// Helper function to replace placeholders in text with values from the user data
function replacePlaceholders(text, data) {
    return text.replace(/{{(.*?)}}/g, (_, key) => data[key.trim()] ?? '');
}
