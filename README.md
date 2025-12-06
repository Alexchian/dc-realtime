# DC Realtime Signaling Server

Простой HTTP-прокси для OpenAI Realtime API.  
Используется в голосовом ассистенте через WebRTC.

## Эндпоинт

`POST /offer` — принимает SDP-offer и возвращает SDP-answer.

## Деплой

Подходит для Render Free Tier.  
Build: `npm install`  
Start: `npm start`

## Переменные окружения

- `OPENAI_API_KEY` — ключ OpenAI
