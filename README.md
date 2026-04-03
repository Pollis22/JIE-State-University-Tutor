# State University AI Tutor — Demo Deployment

A generic white-label AI tutoring platform demo for university and school sales presentations.

## Overview
This is a feature-complete AI tutoring platform that demonstrates voice-first, Socratic method-based tutoring with Student Relationship Management (SRM) capabilities. It is designed as a generic demo site — no school-specific branding — that can be shown to prospective university and K-12 school partners.

## Key Features
- **Voice Tutoring Pipeline**: AssemblyAI STT → Claude LLM → ElevenLabs TTS with Silero VAD and barge-in
- **Student Relationship Management (SRM)**: Syllabus upload, AI date extraction, academic calendar, auto-generated study tasks, engagement scoring (0-100), admin tracker with intervention alerts
- **Visual System**: 113 voice-triggered visual aids
- **25-Language Support**: Multi-language voice and UI
- **Admin Dashboard**: User management, session tracking, SRM admin tracker
- **LSIS**: Longitudinal Student Intelligence System — persistent learner profiles
- **AI Personas**: Doctor Morgan (College/Adult band)
- **Authentication**: Email/password with access codes (institutional deployment model)
- **Content Moderation**: Safety detection and content violations tracking

## Deployment
This site deploys on Railway as a separate service with its own database.

### Environment Variables
Same as the main tutor deployment. See Railway dashboard for required variables.

## Branch Strategy
All changes push directly to `main` — no dev branch.

## Internal Note
This repository is maintained by JIE Mastery AI, Inc. for sales demonstration purposes. The "Powered by JIE Mastery.ai" footer is the only JIE branding visible to end users.
