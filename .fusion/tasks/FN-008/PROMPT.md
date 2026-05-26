# FN-008

Phase 5 of Sentinel-IoT: Telegram Bot.

Tasks P5.1–P5.8:
- python-telegram-bot v21+ long polling.
- Allowlist middleware on TELEGRAM_ADMIN_CHAT_ID.
- Handlers: /start, /status, /devices, /incidents, /audit, /help, free text.
- Calls Laravel REST API and Api/AgentController.
- Persists every command to agent_messages with source='telegram' via Api/AgentController@logMessage.
- Wire into docker-compose.yml.

Plan reference: thoughts/shared/plans/sentinel-iot-plan.md Phase 5.
