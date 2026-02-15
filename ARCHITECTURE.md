# H-Town United Darts Platform – Architecture

## Vision
A mobile-first, production-grade darts ecosystem with modular bounded contexts and live synchronization.

## Core Stack
- **Backend**: Node.js + TypeScript + Fastify + Socket.IO + JWT + OpenAPI
- **Frontend**: React + TypeScript + Tailwind CSS + Framer Motion + Lucide
- **Architecture**: Clean Architecture + DDD + Event-Driven Domain Events

## Bounded Contexts
- IdentityContext
- ClubContext
- PlayerContext
- GameContext
- TournamentContext
- LeagueContext
- TrainingContext
- AnalyticsContext
- GlobalRankingContext
- MediaVisionContext
- NotificationContext

Each context contains: entities, value objects, aggregates, domain events, repositories, application services, DTOs.

## Mobile-first UX Rules
- Fixed bottom navigation: Dashboard, Players, New Game, Tournaments
- Safe area support for header and bottom navigation
- Pull-to-refresh dashboard
- Route slide transitions
- No text selection on interactive controls
- `overscroll-behavior: none`

## Delivered in this scaffold
- Complete folder structure for all bounded contexts
- Sample domain-rich GameContext
- JWT auth service and identity repository contracts
- ELO rating service
- Training recommendation service sample
- Camera detection service interface with confidence + manual correction contract
- Tournament bracket UI component
- Mobile-first navigation shell and route transitions
