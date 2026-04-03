# State University AI Tutor — Development Guide

## Overview
This is a generic white-label demo tutoring site for sales to universities and schools. It is a 1:1 feature-complete clone of the UW Tutor with "State University" branding.

## Architecture
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Voice Pipeline**: AssemblyAI STT → Claude LLM → ElevenLabs TTS

## Key Rules
1. DO NOT modify voice pipeline files (custom-voice-ws.ts, ai-service.ts, tts-service.ts, etc.)
2. DO NOT change the database schema (shared/schema.ts)
3. DO NOT change tutoring logic, prompts, or personality configurations
4. Keep the cardinal red (#C5050C) color scheme
5. "Powered by JIE Mastery.ai" in the footer is the ONLY JIE branding in the UI
6. All changes push directly to main — no dev branch

## Branding
- University: "State University"
- Product: "State University AI Tutor"
- Domain placeholder: stateuniversity-tutor.ai
- Colors: Cardinal red (#C5050C), dark gray (#282728), charcoal (#333333), white
