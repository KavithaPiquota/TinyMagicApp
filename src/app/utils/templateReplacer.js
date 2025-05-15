const fs = require('fs');
const path = require('path');

function extractPlaceholders(text) {
  const regex = /{{(.*?)}}/g;
  const matches = new Set();
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.add(match[1].trim());
  }
  return Array.from(matches);
}

function replacePlaceholders(template, data) {
  if (Array.isArray(template)) {
    return template.map(item => replacePlaceholders(item, data));
  }

  if (typeof template === 'object' && template !== null) {
    const replaced = {};
    for (const key in template) {
      replaced[key] = replacePlaceholders(template[key], data);
    }
    return replaced;
  }

  if (typeof template === 'string') {
    return template.replace(/{{(.*?)}}/g, (_, key) => data[key.trim()] ?? '');
  }

  return template;
}

export function loadAndProcessPromptTemplate(overrides = {}) {
  const baseDir = path.join(process.cwd(), 'src/app/data');

  const promptTemplatePath = path.join(baseDir, 'promptTemplate.json');
  const valuesPath = path.join(baseDir, 'templateValues.txt'); 
  const sampleTextPath = path.join(baseDir, 'promptSample.txt');

  const promptTemplate = JSON.parse(fs.readFileSync(promptTemplatePath, 'utf8'));
  const templateValues = JSON.parse(fs.readFileSync(valuesPath, 'utf8'));
  const promptSampleText = fs.readFileSync(sampleTextPath, 'utf8');

  // Replace placeholders inside the sample system prompt
  const resolvedSystemPrompt = replacePlaceholders(promptSampleText, templateValues);

  const mergedValues = {
    ...templateValues,
    ...overrides,
    systemContent: resolvedSystemPrompt,
  };

  return replacePlaceholders(promptTemplate, mergedValues);
}
