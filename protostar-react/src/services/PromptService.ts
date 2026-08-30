import detailsPromptTpl from '../prompts/details-prompt.txt?raw';
import detailsSummaryPromptTpl from '../prompts/details-summary-prompt.txt?raw';
import threatStatusSummaryPromptTpl from '../prompts/threat-status-summary-prompt.txt?raw';
import threatStatusPromptTpl from '../prompts/threat-status-prompt.txt?raw';
import alertSummaryPromptTpl from '../prompts/alert-summary-prompt.txt?raw';
import alertPromptTpl from '../prompts/alert-prompt.txt?raw';
import summaryOfThreatStatusSummaryPromptTpl from '../prompts/summary-of-threat-status-summary-prompt.txt?raw';

// Replaces {{name}} with the supplied value. An unknown placeholder is left in
// place so a typo shows up in the prompt rather than silently emptying it.
function render(template: string, values: Record<string, any>)
{
  // trim so a trailing newline in the file never reaches the model
  return template.trim().replace(/\{\{(\w+)\}\}/g, (match, key) => key in values ? String(values[key]) : match);
}
// Column order of the high-level entity rows built by Home and Summary.
export const HIGH_LEVEL_FIELD_NAMES = ['Entity', 'Entity Type', 'Ip', 'Atomic Weight', 'Atomic Mass'];

// Renders entity rows as a labelled table. Interpolating the raw array flattens it
// to one undelimited comma run, which strips the field names and the record
// boundaries the prompts ask the model to reason about.
export function FormatEntityTable(rows: any[][], fieldNames: string[] = HIGH_LEVEL_FIELD_NAMES)
{
  if(!Array.isArray(rows) || !rows.length)
  {
    return '';
  }
  let lines = [fieldNames.join(',')];
  for(const row of rows)
  {
    lines.push((Array.isArray(row) ? row : [row]).map(cell => String(cell ?? '-')).join(','));
  }
  return lines.join('\n');
}

// Transposes column-major data into labelled CSV rows. The entity details endpoint
// returns a dataframe serialised as {column: {rowIndex: value}}; interpolating its
// values directly strips the column names the prompts ask the model to reason about.
export function FormatColumnTable(fieldNames: string[], columns: any[])
{
  if(!Array.isArray(columns) || !columns.length)
  {
    return '';
  }
  const rowKeys = Object.keys(columns[0] ?? {});
  const rows = rowKeys.map(key => columns.map(column => column?.[key] ?? ''));
  return FormatEntityTable(rows, fieldNames);
}

export default class PromptService
{
  constructor() {}

// Details.tsx page question
  public DetailsPrompt(question: string, details: any)
  {
    let finalPrompt = render(detailsPromptTpl, { details, question });
    return finalPrompt; 
  }
// Details.tsx page entity summary
  public DetailsSummaryPrompt(details: any)
  {
    let finalPrompt = render(detailsSummaryPromptTpl, { details });
    return finalPrompt; 
  }
// Summary generator for Summary.tsx page
  public ThreatStatusSummaryPrompt(details: any)
  {
    let finalPrompt = render(threatStatusSummaryPromptTpl, { details });
    return finalPrompt;
  }
// Summary.tsx page question 
  public ThreatStatusPrompt(question: string, details: any)
  {
    let finalPrompt = render(threatStatusPromptTpl, { details, question });
    return finalPrompt;
  }
// Alerts.tsx explainer 
  public AlertSummaryPrompt(specificDetails: any)
  {
    let finalPrompt = render(alertSummaryPromptTpl, { specificDetails: JSON.stringify(specificDetails) });
    return finalPrompt;
  }
// Alert question prompt (not currently wired)
  public AlertPrompt(question: string, details: any)
  {
    let finalPrompt = render(alertPromptTpl, { question, details: JSON.stringify(details) });
    return finalPrompt;
  }
//  Home.tsx summary generator
  public SummaryOfThreatStatusSummaryPrompt(details: any)
  {
    let finalPrompt = render(summaryOfThreatStatusSummaryPromptTpl, { details });
    return finalPrompt;
  }
}