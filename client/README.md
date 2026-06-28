# WDIS Client Frontend

This directory contains the student dashboard application, built with Next.js and Tailwind CSS, which displays placement process timelines and candidate statuses in a Kanban-style interface.

## System Architecture

The client dashboard is designed to provide real-time updates of active processes. The visualization is synchronized with the backend database via Server-Sent Events, with an adaptive HTTP polling fallback.

```mermaid
graph TD
    subgraph UI [Student Interface]
        LandingPage[Process Discovery: index.jsx]
        DashboardPage[Kanban Board: [processName].jsx]
    end

    subgraph Sync [Data Sync & Caching]
        QueryClient[React Query Data Cache]
        ZustandStore[Zustand Filter State]
        SSEConnection[SSE Connection / Polling Fallback]
    end

    subgraph API [Backend Server]
        PublicAPI[Public REST API]
    end

    LandingPage -->|Navigates to| DashboardPage
    DashboardPage -->|Queries| QueryClient
    QueryClient -->|Fetch Data| PublicAPI
    
    SSEConnection -->|processUpdated Event| QueryClient
    ZustandStore -->|Applies Filter Criteria| DashboardPage
    QueryClient -.->|Refreshes Board UI| DashboardPage
```

## Pages and Routes

### Landing Page (pages/index.jsx)
The entry point for the application where users discover and navigate to recruitment processes.
- Process discovery and selection interface.
- Recently accessed processes quick access.
- Real-time active processes list fetching.
- Input validation and normalization.
- Auto-focus on load.

### Dashboard Page (pages/dashboard/[processName].jsx)
The main view displaying recruitment process workflows with student status data.
- Kanban-style board visualization.
- SAP ID-based candidate search modal.
- Filters by round and status.
- Real-time data synchronization indicators.
- Full-height desktop layout with internal column scrolling.

## Component Architecture

### Page-Level Components
- **LandingPage**: Manages process input, dropdown suggestions, validation, and navigation. Hydrates recently accessed processes from local storage.
- **Dashboard**: Coordinates dashboard layouts, search, filter modals, and synchronization health indicators.

### Content Components
- **KanbanBoard**: Layout container for columns that handles empty states when no rounds are configured.
- **KanbanColumn**: Individual stage column showing student cards, status counters, and type badges. Implements entrance transitions.
- **StudentCard**: Card rendering for individual candidates showing name, roll number, and status metadata.

### Feature Components
- **SearchBar**: Accessible search bar interface.
- **FilterPanel**: Dual-filter options for filtering candidates by round and status.
- **WaitingRoomModal**: Details modal displaying student contact info and status logs.
- **LoadingSpinner**: Configurable status indicator.

### Reusable UI Components
- **Button**: Reusable button supporting primary, secondary, and ghost variants.
- **Input**: Reusable text input with styled states.

## Design System

### Color Palette
- Canvas Background: #051119
- Panel Background: #0e2230
- Panel Soft Overlay: #163246
- Primary Text: #f3fbff
- Muted Text: #a8c7d8
- Accent (Teal): #2dd4bf
- Success (Emerald): #34d399
- Warning (Amber): #fbbf24
- Danger (Rose): #fb7185

### Typography
- Sora: Display font used for headers and titles.
- Space Grotesk: Default body font.
- IBM Plex Mono: Monospace font for roll numbers and identifiers.

### Animations
- **pulseSoft**: Opacity modulation used for status indicators.
- **floatIn**: Translation animation used for student card entry.

## Styling and UI Implementation

### Responsive Design
- Mobile: Single column layout with stacked cards.
- Medium: Two-column filter panels.
- Extra Large: Full width desktop layout with horizontal Kanban scroll.

### Color Coding
- Status colors: Qualified (Emerald), In Progress (Amber), Scheduled (Cyan), Rejected (Rose), On Hold (Rose-light), Not Started (Slate).
- Round Type colors: Group Discussion (Amber), Technical Interview (Cyan), HR Interview (Cyan), Pool (Slate).

## Design Decisions

- **Dark Theme First**: Implemented exclusively to reduce eye strain, match contemporary placement dashboards, and provide a premium aesthetic.
- **Glassmorphism Panels**: Semi-transparent panels overlaying canvas gradients create depth and visual hierarchy.
- **Kanban Board Layout**: Restructures stages horizontally on desktop to mirror pipelines, adapting to vertical lists on mobile devices.
- **Polled Updates Fallback**: If the SSE connection drops, the app uses polling with adaptive backoff to prevent backend overhead while maintaining data updates.
- **Status-First Filtering**: Separates round and status filters to prevent confusing empty states and keep filtering predictable.
- **Student Card Minimalism**: Hides excessive metadata on cards to keep the grid lightweight and readable.
- **Local Storage Cache**: Caches recently selected processes to improve performance on subsequent visits.

## Technology Stack

- **Framework**: Next.js 14.2, React 18.3.
- **Styling**: Tailwind CSS 3.4, PostCSS 8.4, Autoprefixer.
- **Animation**: Framer Motion 11.15, clsx 2.1.
- **Data Management**: React Query 5.66, Zustand 5.0.
- **HTTP Client**: Axios 1.7.

## State Management

### Zustand Global Store (store/processStore.js)
Manages filter state, search queries, and recent processes list:
- `processName`: Current active process.
- `recentProcesses`: List of recently loaded processes.
- `searchTerm`: Selected search query.
- `statusFilter` / `roundFilter`: Selected display filters.

### React Query Caching
Caches active processes and process-specific details. Integrates window focus refetching and retry options with exponential backoff.

## Data Flow and Real-time Updates

- **Data Fetching**: Resolves the process details on page load and hooks into the Server-Sent Events listener. Updates invalidate the React Query cache and trigger UI refetches.
- **Visual Feedback**: Badges show synchronization health, and cards float in animatedly when their data updates.

## Code Organization Philosophy

- **Layered Components**: Structured into pages, features, UI atomic elements, hooks, helper utilities, and global stores.
- **Styling Convention**: Utilizes Tailwind utility classes, custom CSS presets, and CSS variables for central theme configurations.
