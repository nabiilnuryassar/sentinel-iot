# FN-007

Phase 4 of Sentinel-IoT: AI Agent via Laravel AI SDK (in-process).

Tasks P4.1–P4.26:
- composer require laravel/ai + vendor:publish + migrate.
- Add LLM provider keys to .env / .env.example.
- 8 tool classes under app/Ai/Tools/ (read-only, query Eloquent directly).
- 3 agent classes under app/Ai/Agents/: SentinelAgent (Conversational + HasTools + RemembersConversations), IncidentAnalyst (HasStructuredOutput), AuditAgent.
- LogAgentInteractions middleware writes audit rows to agent_messages.
- Wire AgentController@ask, IncidentController@generateReport, Api\AgentController@ask.
- Update agent/index.tsx to render via MarkdownView + sonner toasts.
- Pest unit tests per tool, Pest feature tests via SDK testing fakes.

Plan reference: thoughts/shared/plans/sentinel-iot-plan.md Phase 4.
Docs: https://laravel.com/docs/13.x/ai-sdk
