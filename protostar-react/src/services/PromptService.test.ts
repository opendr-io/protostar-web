import { describe, it, expect } from 'vitest';
import PromptService, { FormatEntityTable, FormatColumnTable } from './PromptService';
import detailsPromptTpl from '../prompts/details-prompt.txt?raw';
import detailsSummaryPromptTpl from '../prompts/details-summary-prompt.txt?raw';
import threatStatusSummaryPromptTpl from '../prompts/threat-status-summary-prompt.txt?raw';
import threatStatusPromptTpl from '../prompts/threat-status-prompt.txt?raw';
import alertSummaryPromptTpl from '../prompts/alert-summary-prompt.txt?raw';
import alertPromptTpl from '../prompts/alert-prompt.txt?raw';
import summaryOfThreatStatusSummaryPromptTpl from '../prompts/summary-of-threat-status-summary-prompt.txt?raw';
import {
  entityDetails,
  highLevelDataList,
  HIGH_LEVEL_FIELD_NAMES,
  alert,
  question,
  priorOutput,
  entityFieldNames,
  entityColumns,
} from './__fixtures__/promptFixtures';

const ps = new PromptService();

// Rendered with the shapes the pages actually pass. Details.tsx stringifies before
// calling; Home/Summary/Alerts pass their structures raw.
const rendered: [string, string][] = [
  ['DetailsPrompt', ps.DetailsPrompt(question, JSON.stringify(entityDetails))],
  ['DetailsSummaryPrompt', ps.DetailsSummaryPrompt(JSON.stringify(entityDetails))],
  ['ThreatStatusSummaryPrompt', ps.ThreatStatusSummaryPrompt(FormatEntityTable(highLevelDataList))],
  ['ThreatStatusPrompt', ps.ThreatStatusPrompt(question, FormatEntityTable(highLevelDataList))],
  ['AlertSummaryPrompt', ps.AlertSummaryPrompt(alert)],
  ['AlertPrompt', ps.AlertPrompt(question, alert)],
  ['SummaryOfThreatStatusSummaryPrompt', ps.SummaryOfThreatStatusSummaryPrompt(priorOutput)],
];

const templates: [string, string][] = [
  ['DetailsPrompt', detailsPromptTpl],
  ['DetailsSummaryPrompt', detailsSummaryPromptTpl],
  ['ThreatStatusSummaryPrompt', threatStatusSummaryPromptTpl],
  ['ThreatStatusPrompt', threatStatusPromptTpl],
  ['AlertSummaryPrompt', alertSummaryPromptTpl],
  ['AlertPrompt', alertPromptTpl],
  ['SummaryOfThreatStatusSummaryPrompt', summaryOfThreatStatusSummaryPromptTpl],
];

describe('prompt hygiene', () =>
{
  it.each(rendered)('%s has no object stringification artifacts', (_name, prompt) =>
  {
    expect(prompt).not.toMatch(/\[object Object\]/);
  });

  it.each(rendered)('%s substitutes every placeholder', (_name, prompt) =>
  {
    // a surviving ${ means the template literal was written as a plain quoted string
    expect(prompt).not.toMatch(/\$\{/);
  });

  it.each(rendered)('%s interpolates no undefined or null values', (_name, prompt) =>
  {
    expect(prompt).not.toMatch(/\bundefined\b/);
    expect(prompt).not.toMatch(/\bnull\b/);
  });

  it.each(rendered)('%s carries no leftover editing debris', (_name, prompt) =>
  {
    // ".       ." was left behind when the non-prod marker sentences were stripped
    expect(prompt).not.toMatch(/\.\s{3,}\./);
    // a gap AFTER sentence punctuation is a deletion seam (the original artifact was
    // ".       . As mentioned"). Aligned glossary columns and trailing spaces are not.
    expect(prompt).not.toMatch(/[.!?] {3,}\S/);
  });

  it.each(templates)('%s ends on a complete instruction', (_name, template) =>
  {
    // checked against the template, not the rendered prompt: a template may end with
    // its data placeholder (the payload then trails, which is right for caching).
    // What it must never do is end on an instruction whose referent never arrives,
    // e.g. a trailing "place the following message:" or "using this data:".
    expect(template.trimEnd()).toMatch(/([.!?"]|\}\})$/);
  });
});

describe('quote balance', () =>
{
  // Rendered with quote-free scalars so every quote counted comes from the template
  // itself rather than from JSON payloads.
  const S = 'SENTINEL_DATA';
  const Q = 'SENTINEL_QUESTION';
  const templateOnly: [string, string][] = [
    ['DetailsPrompt', ps.DetailsPrompt(Q, S)],
    ['DetailsSummaryPrompt', ps.DetailsSummaryPrompt(S)],
    ['ThreatStatusSummaryPrompt', ps.ThreatStatusSummaryPrompt(S)],
    ['ThreatStatusPrompt', ps.ThreatStatusPrompt(Q, S)],
    ['AlertSummaryPrompt', ps.AlertSummaryPrompt(S)],
    ['AlertPrompt', ps.AlertPrompt(Q, S)],
    ['SummaryOfThreatStatusSummaryPrompt', ps.SummaryOfThreatStatusSummaryPrompt(S)],
  ];

  it.each(templateOnly)('%s closes every quote it opens', (_name, prompt) =>
  {
    const quotes = (prompt.match(/"/g) || []).length;
    expect(quotes % 2).toBe(0);
  });
});

describe('data presence', () =>
{
  it('DetailsPrompt includes both the question and the entity data', () =>
  {
    const prompt = ps.DetailsPrompt(question, JSON.stringify(entityDetails));
    expect(prompt).toContain(question);
    expect(prompt).toContain('workstation-42');
    expect(prompt).toContain('10.4.9.201');
  });

  it('DetailsSummaryPrompt includes the entity data', () =>
  {
    expect(ps.DetailsSummaryPrompt(JSON.stringify(entityDetails))).toContain('workstation-42');
  });

  it('ThreatStatusPrompt includes both the question and the data', () =>
  {
    const prompt = ps.ThreatStatusPrompt(question, FormatEntityTable(highLevelDataList));
    expect(prompt).toContain(question);
    expect(prompt).toContain('workstation-42');
  });

  it('AlertSummaryPrompt includes the specific alert', () =>
  {
    const prompt = ps.AlertSummaryPrompt(alert);
    expect(prompt).toContain(alert.guid);
    expect(prompt).toContain('203.0.113.44');
  });

  it('AlertPrompt includes the question and the selected alert', () =>
  {
    const prompt = ps.AlertPrompt(question, alert);
    expect(prompt).toContain(question);
    expect(prompt).toContain(alert.guid);
    expect(prompt).toContain('203.0.113.44');
  });

  it('SummaryOfThreatStatusSummaryPrompt includes the prior output', () =>
  {
    expect(ps.SummaryOfThreatStatusSummaryPrompt(priorOutput)).toContain(priorOutput);
  });
});

describe('data contract', () =>
{
  // These prompts instruct the model to "identify fields you recognize" and
  // "explain each field". That is only answerable if the payload labels its
  // fields and delimits its records.
  it('ThreatStatusSummaryPrompt payload labels its fields', () =>
  {
    const prompt = ps.ThreatStatusSummaryPrompt(FormatEntityTable(highLevelDataList));
    for(const field of HIGH_LEVEL_FIELD_NAMES)
    {
      expect(prompt).toContain(field);
    }
  });

  it('ThreatStatusSummaryPrompt payload keeps records distinguishable', () =>
  {
    const prompt = ps.ThreatStatusSummaryPrompt(FormatEntityTable(highLevelDataList));
    // a raw array-of-arrays flattens to one undelimited comma run, so the boundary
    // between the last field of one entity and the first of the next disappears
    expect(prompt).not.toContain('272,db-prod-03');
  });
});

describe('rendered snapshots', () =>
{
  // Prompt edits are invisible in review as template-literal diffs. These snapshots
  // surface the fully rendered text instead.
  it.each(rendered)('%s', (_name, prompt) =>
  {
    expect(prompt).toMatchSnapshot();
  });
});

describe('FormatColumnTable', () =>
{
  const table = FormatColumnTable(entityFieldNames, entityColumns);

  it('puts the real column names in the header row', () =>
  {
    expect(table.split('\n')[0]).toBe('detection_type,severity,mitre_tactic,category,username');
  });

  it('transposes columns into one line per record', () =>
  {
    const lines = table.split('\n');
    expect(lines).toHaveLength(4);                                  // header + 3 records
    expect(lines[1]).toBe('CLOUD_ALERT,,,AssumeRoleWithWebIdentity,svc-dataset-worker');
    expect(lines[3]).toBe('K8_ML,,,linux,svc-dataset-worker');
  });

  it('keeps every row aligned to the header width', () =>
  {
    for(const line of table.split('\n'))
    {
      expect(line.split(',')).toHaveLength(entityFieldNames.length);
    }
  });

  it('returns empty string for no data rather than a bare header', () =>
  {
    expect(FormatColumnTable(entityFieldNames, [])).toBe('');
  });
});
