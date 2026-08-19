# LLM Prompt Map

Where every LLM prompt lives and which page consumes it.

## Two prompt services

There are **two** `PromptService` classes with overlapping prompts:


| File                                                                                                              | Status                                                                                                                      |
| ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `[protostar-react/src/services/PromptService.ts](../protostar-react/src/services/PromptService.ts)`               | **Live.** All page-facing prompts. Built client-side, posted to `/askllm` as a raw `question` string.                       |
| `[protostar-ai-dev-flask-api/services/promptservice.py](../protostar-ai-dev-flask-api/services/promptservice.py)` | **Mostly dead.** Only the two `agent_case_`* methods are called; the other seven are a stale duplicate of the React copies. |


Flow for page prompts: React builds the full prompt text → `LLMService.AskLLM()` posts it to `/askllm` → `llmservice.ask_claude()` passes it straight through to the model. Flask never touches its own copies of those seven.

## React prompts — by method


| Prompt method                        | Line | Used by               | Call site                                          | Trigger                                                  |
| ------------------------------------ | ---- | --------------------- | -------------------------------------------------- | -------------------------------------------------------- |
| `DetailsPrompt`                      | 5    | Details               | `Details.tsx:298`                                  | User types a question about an entity                    |
| `DetailsSummaryPrompt`               | 13   | Details               | `Details.tsx:125`                                  | Auto-summary of the entity                               |
| `ThreatStatusSummaryPrompt`          | 21   | **Home**, **Summary** | `Home.tsx:66`, `Summary.tsx:95`, `Summary.tsx:195` | Dashboard load; Summary auto-summary; per-entity summary |
| `ThreatStatusPrompt`                 | 30   | Summary               | `Summary.tsx:359`                                  | User types a question on Summary                         |
| `AlertSummaryPrompt`                 | 39   | Alerts                | `Alerts.tsx:179`                                   | Summarize one alert against visible alerts               |
| `AlertPrompt`                        | 47   | —                     | —                                                  | **Never called**                                         |
| `SummaryOfThreatStatusSummaryPrompt` | 57   | **Home**, **Summary** | `Home.tsx:74`, `Summary.tsx:101`                   | Second pass condensing the first summary                 |




## React prompts — by page


| Page                            | Prompts used                                                                               |
| ------------------------------- | ------------------------------------------------------------------------------------------ |
| `Home.tsx`                      | `ThreatStatusSummaryPrompt` → `SummaryOfThreatStatusSummaryPrompt` (chained)               |
| `Summary.tsx`                   | `ThreatStatusSummaryPrompt` ×2, `SummaryOfThreatStatusSummaryPrompt`, `ThreatStatusPrompt` |
| `Details.tsx`                   | `DetailsSummaryPrompt`, `DetailsPrompt`                                                    |
| `Alerts.tsx`                    | `AlertSummaryPrompt` only                                                                  |
| `Cases.tsx` / `CaseDetails.tsx` | None from this file — server-side `agent_case_*` prompts instead                           |




## What each argument actually holds

The parameter names in `PromptService` are local labels only — `details: any` accepts
anything, and the calling page decides what it means. The same name carries four
different kinds of payload:

| Call site | What lands in `details` / `specificDetails` |
|---|---|
| `Home.tsx:65` | CSV table of **all** entities (via `FormatEntityTable`) |
| `Home.tsx:73` | **Prior LLM prose** — not data at all |
| `Summary.tsx:94`, `Summary.tsx:194` | CSV table of all entities |
| `Summary.tsx:100` | Prior LLM prose |
| `Summary.tsx:358` | Question + CSV table of all entities |
| `Details.tsx:125`, `Details.tsx:298` | JSON of **one** entity's roll-up (values only, keys stripped) |
| `Alerts.tsx:179` | The **selected alert** object |

Nothing enforces this. The prompt's own English text is the only thing asserting what
the payload is, so a prompt edit can silently contradict what the page passes — which
is how the Alerts prompt came to describe a page of alerts as "the overall entity".
The `data presence` tests in `PromptService.test.ts` are the guard: they assert fixture
content actually reaches each prompt, using fixtures shaped like the real payloads.

## Flask prompts


| Prompt                                    | Route                                                | Page              | Status                                         |
| ----------------------------------------- | ---------------------------------------------------- | ----------------- | ---------------------------------------------- |
| `agent_case_comment_prompt`               | `/createcase`, backfill worker (`appservice.py:121`) | `Cases.tsx`       | **Live** — auto-comment when a case is created |
| `agent_case_question_prompt`              | `/postcasecomment`                                   | `CaseDetails.tsx` | **Live** — reply to an `@agent` comment        |
| `details_prompt`                          | —                                                    | —                 | Dead                                           |
| `details_summary_prompt`                  | —                                                    | —                 | Dead                                           |
| `threat_status_summary`                   | —                                                    | —                 | Dead                                           |
| `threat_status_prompt`                    | —                                                    | —                 | Dead                                           |
| `alert_summary_prompt`                    | —                                                    | —                 | Dead                                           |
| `alert_prompt`                            | —                                                    | —                 | Dead                                           |
| `summary_of_threat_status_summary_prompt` | —                                                    | —                 | Dead                                           |




