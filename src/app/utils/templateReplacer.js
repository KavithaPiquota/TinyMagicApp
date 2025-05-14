export function replacePlaceholders(template, data) {
  if (Array.isArray(template)) {
    return template.map(item => replacePlaceholders(item, data));
  }

  if (typeof template === 'object' && template !== null) {
    const replacedObject = {};
    for (const key in template) {
      replacedObject[key] = replacePlaceholders(template[key], data);
    }
    return replacedObject;
  }

  if (typeof template === 'string') {
    return template.replace(/{{(.*?)}}/g, (_, key) => data[key.trim()] ?? '');
  }

  return template;
}
