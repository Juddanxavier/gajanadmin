
/**
 * Simple template engine to replace {{variable}} placeholders
 */
export function renderTemplate(template: string, variables: Record<string, any>): string {
  let rendered = template;
  
  // Replace all {{variable}} placeholders
  Object.keys(variables).forEach(key => {
    const value = variables[key] || '';
    const regex = new RegExp(`{{${key}}}`, 'g');
    rendered = rendered.replace(regex, value);
  });
  
  // Handle conditional blocks {{#if variable}}...{{/if}}
  rendered = rendered.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, varName, content) => {
    return variables[varName] ? content : '';
  });
  
  return rendered;
}
