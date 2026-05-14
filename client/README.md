# WDIS Client - Frontend Documentation

A modern, responsive recruitment process visualization dashboard built with Next.js and Tailwind CSS, designed to display recruitment workflows through an intuitive Kanban-style interface.

## Table of Contents

- [Pages & Routes](#pages--routes)
- [Component Architecture](#component-architecture)
- [Design System](#design-system)
- [Styling & UI Implementation](#styling--ui-implementation)
- [Design Decisions](#design-decisions)
- [Technology Stack](#technology-stack)
- [State Management](#state-management)
- [Data Flow & Real-time Updates](#data-flow--real-time-updates)

---

## Pages & Routes

### 1. **Landing Page** (`/` - `pages/index.jsx`)
The entry point for the application where users discover and navigate to recruitment processes.

**Key Features:**
- Process discovery and selection interface
- Recently accessed processes quick access
- Real-time active processes list fetching
- Input validation and error handling
- Auto-focus on load for seamless UX

**Components Used:** `LandingPage`, `Input`, `Button`, `LoadingSpinner`

### 2. **Dashboard Page** (`/dashboard/[processName]` - `pages/dashboard/[processName].jsx`)
The main application view displaying recruitment process workflows with real-time student data.

**Key Features:**
- Kanban-style recruitment board visualization
- SAP ID-based search (via icon-triggered modal)
- Filters in a modal (by round and status)
- Real-time data synchronization with visual status indicators
- Full-height desktop layout with internal column scrolling

**Dynamic Elements:**
- Sync status indicator with visual feedback (badges with color coding)
- Live update counters showing sync health
- Floor selector for multi-venue processes

**Components Used:** `KanbanBoard`, `LoadingSpinner`, `Button`, `Input`

---

## Component Architecture

### Page-Level Components

#### **LandingPage** (`components/LandingPage.jsx`)
- Manages process input and navigation
- Hydrates recent processes from local storage
- Fetches available processes with polling
- Validates and normalizes process names
- Implements auto-suggest dropdown based on activity

#### **Dashboard** (Page component in `pages/dashboard/[processName].jsx`)
- Orchestrates all dashboard features
- Manages SAP ID search and filter modals
- Coordinates with backend for real-time data
- Handles sync status visualization
- Enforces SAP-only view

### Content Components

#### **KanbanBoard** (`components/KanbanBoard.jsx`)
- Container component for Kanban columns
- Ensures board shape consistency
- Handles empty state when no rounds configured
- Supports flexible column count

#### **KanbanColumn** (`components/KanbanColumn.jsx`)
- Individual recruitment stage (round)
- Displays student cards in context
- Shows round metadata (name, type, order, count)
- Animated card entrance with Framer Motion
- Color-coded round type badges
- Responsive sizing (adaptive on mobile, fixed width on desktop)

#### **StudentCard** (`components/StudentCard.jsx`)
- Beautiful card display for individual student
- Key information display: Name, SAP ID, Branch
- Memoized for performance optimization
- Animated entry with floatIn animation

### Feature Components

#### **SearchBar** (`components/SearchBar.jsx`)
- Legacy component (dashboard now uses SAP ID modal search)
- Glass-panel styled container
- Clear placeholder text and labeling
- Accessible with proper ARIA labels

#### **FilterPanel** (`components/FilterPanel.jsx`)
- Dual-filter system (Round + Status)
- Glass-panel styling consistent with design
- Reset functionality
- Accessible form controls with proper labels

#### **WaitingRoomModal** (`components/WaitingRoomModal.jsx`)
- Legacy component (not shown in current dashboard UX)
- Smooth Framer Motion animations
- Evaluation state indicators
- Student contact information display
- Max-height scrollable content
- Proper modal focus management

#### **LoadingSpinner** (`components/LoadingSpinner.jsx`)
- Configurable size (sm/md)
- Loading label text
- Accessible with role="status"
- Animated spin using CSS

### UI Components (Reusable)

#### **Button** (`components/ui/button.jsx`)
**Variants:**
- `primary`: Teal accent with hover/disabled states
- `secondary`: Subtle panel color variation
- `ghost`: Transparent with text-only styling

**Features:**
- Focus ring accessibility (custom ring with offset)
- Smooth transitions on hover
- Consistent padding and sizing
- Optional additional className for customization

#### **Input** (`components/ui/input.jsx`)
**Features:**
- Consistent border styling matching theme
- Focus ring support
- Placeholder text in muted color
- Responsive padding
- Forwarded ref for external control

---

## Design System

### **Color Palette**
All colors use CSS custom properties for maintainability and dark mode consistency.

| Property | Hex Value | Usage |
|----------|-----------|-------|
| `--color-canvas` | `#051119` | Page background |
| `--color-panel` | `#0e2230` | Component backgrounds |
| `--color-panel-soft` | `#163246` | Softer panel overlays |
| `--color-text-primary` | `#f3fbff` | Primary text |
| `--color-text-muted` | `#a8c7d8` | Secondary text, labels |
| `--color-accent` | `#2dd4bf` | Primary action color (Teal) |
| `--color-accent-soft` | `#7eead9` | Softer accent variant |
| `--color-success` | `#34d399` | Success states (Emerald) |
| `--color-warning` | `#fbbf24` | Warning states (Amber) |
| `--color-danger` | `#fb7185` | Danger/error states (Rose) |

### **Typography**
Three carefully selected font families with specific weights:

| Font | Family | Usage | Weights |
|------|--------|-------|---------|
| **Sora** | `font-display` | Headers, titles, emphasis | 400, 600, 700 |
| **Space Grotesk** | `font-body` | Body text, default | 400, 500, 700 |
| **IBM Plex Mono** | `font-mono` | Roll numbers, IDs, code | 400, 500 |

**Font Sizes:**
- `text-xs`: 12px (labels, badges)
- `text-sm`: 14px (body, descriptions)
- `text-base`: 16px (content, card titles)
- `text-lg`: 18px (section headers)
- `text-xl`: 20px (modal headers)

### **Animations**

#### **pulseSoft**
```
0%, 100% → opacity: 1
50% → opacity: 0.7
Duration: 2s, infinite
```
Used for subtle emphasis on status indicators.

#### **floatIn**
```
0% → opacity: 0, translateY(14px)
100% → opacity: 1, translateY(0)
Duration: 0.45s, ease-out
```
Used when student cards enter a column for smooth visual feedback.

### **Shadows & Effects**

#### **panel** shadow
```
0 20px 45px rgba(0, 0, 0, 0.35)
```
Depth effect for floating panels.

#### **glass-panel** effect
```
Background: rgba(14, 34, 48, 0.72) with backdrop blur
Border: 1px rgba(126, 234, 217, 0.18)
Backdrop Filter: blur(12px)
```
Creates frosted glass effect for all panels (KanbanColumn, EditPanel, SearchBar, WaitingRoom).

---

## Styling & UI Implementation

### **Tailwind CSS Configuration**

**Customizations:**
- Color palette extended with CSS variables
- Font families mapped to custom names
- Custom keyframe animations
- Shadow preset for panels
- Focus ring pattern for accessibility

**Key Tailwind Classes Used:**
- `glass-panel`: Frosted glass effect (defined in globals.css)
- `muted-grid`: Subtle grid background pattern
- `focus-ring`: Accessibility focus states
- `animate-pulseSoft`: Subtle pulsing animation
- `animate-floatIn`: Card entrance animation
- `theme-dark`: Root container class for dark mode

### **Responsive Design**

**Breakpoints Applied:**
- **Mobile (default)**: Single column layouts, stacked cards
- **md (768px)**: Two-column filter panels
- **xl (1280px)**: Horizontal kanban scroll, full desktop experience

**Key Responsive Patterns:**
```jsx
// Dashboard layout
<div className="grid gap-4 xl:grid-cols-[auto_1fr]">
  <aside>Filter/Search</aside>
  <main>Kanban Board</main>
</div>

// Kanban board
<div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:overflow-x-auto">
  {/* Columns with fixed width on desktop, full-width on mobile */}
  <section className="w-full xl:min-w-[330px] xl:max-w-[380px]">
    {/* Column content */}
  </section>
</div>
```

### **Status-Based Color Coding**

Student statuses are visually encoded with consistent colors across components:

| Status | Color | Hex |
|--------|-------|-----|
| **qualified** | Emerald | `#10b981` |
| **inprogress** | Amber | `#f59e0b` |
| **scheduled** | Cyan | `#06b6d4` |
| **rejected** | Rose | `#e11d48` |
| **onhold** | Rose (lighter) | `#f43f5e` |
| **notstarted** | Slate | `#64748b` |

**Round Type Color Coding:**

| Type | Color | Theme |
|------|-------|-------|
| **groupdiscussion** | Amber | Discussion phase |
| **technicalinterview** | Cyan | Technical assessment |
| **hrinterview** | Cyan | HR discussion |
| **pool** | Slate | Waiting/Pool |
| **Other** | Emerald | Custom rounds |

---

## Design Decisions

### 1. **Dark Theme First**
**Decision:** Implement dark-themed interface exclusively.

**Rationale:**
- Reduced eye strain during extended use
- Modern, professional appearance
- Better for technical/recruitment contexts
- Performance benefits on OLED displays
- Consistent with contemporary web design trends

**Implementation:** CSS custom properties ensure easy theme adaptation if needed.

### 2. **Glass-Morphism for Panels**
**Decision:** Use frosted glass effect for all panel components.

**Rationale:**
- Creates visual hierarchy through depth
- Modern aesthetic without being dated
- Clear distinction between canvas and interactive elements
- Improved readability with semi-transparent backgrounds
- Maintains dark theme while providing contrast

### 3. **Kanban Board Layout**
**Decision:** Horizontal scrolling Kanban columns on desktop, vertical stacking on mobile.

**Rationale:**
- Mimics familiar recruiting software (Jira, Trello)
- Shows recruitment pipeline progression intuitively
- Scalable to any number of rounds
- Efficient use of screen space
- Natural left-to-right flow matching recruitment progression

### 4. **Polled Real-time Updates**
**Decision:** Use polling instead of WebSockets for real-time data.

**Rationale:**
- Simpler backend implementation
- Works reliably across network conditions
- Easier debugging and monitoring
- Exponential backoff on connectivity loss
- Cost-effective for modest user base

**Implementation:**
- Default interval: 2.5 seconds
- Max interval: 15 seconds
- Adaptive backoff: 2^backoffLevel multiplier
- Managed through `usePolling` hook

### 5. **Status-First Filtering**
**Decision:** Provide separate Round and Status filters rather than cross-filtering.

**Rationale:**
- Simple, predictable filtering behavior
- Users can understand results immediately
- No confusing empty states
- Easy to reset to base state
- Reduces decision paralysis

### 6. **Student Card Minimalism**
**Decision:** Display only essential information on student cards.

**Rationale:**
- Keeps cards lightweight and scannable
- Reduces cognitive load
- Consistent mobile rendering
- Room for future stats/badges without crowding
- Fast perceptual scanning of key information (name, status, roll)

### 7. **Entrance Animations**
**Decision:** Subtle animations on student card entry (floatIn) but minimal elsewhere.

**Rationale:**
- Provides visual feedback of data changes
- Not distracting for frequent updates
- Helps users notice when columns update
- Improves perceived performance
- Disables on color-blind friendly consideration

### 8. **Local Storage Persistence**
**Decision:** Cache process name and recent process list in localStorage.

**Rationale:**
- Reduces repeated server calls
- Improves perceived performance on return visits
- No manual URL entry needed
- Quick access to recently-used processes
- Graceful degradation if localStorage unavailable

### 9. **Process Normalization**
**Decision:** Normalize process names (lowercase, trims) for matching.

**Rationale:**
- User-friendly input (accepts various capitalizations)
- Prevents duplicate process entries
- URL-safe values
- Consistent database lookups

### 10. **Mono Font for Roll Numbers**
**Decision:** Use monospace font specifically for roll numbers and IDs.

**Rationale:**
- Ensures character alignment for easier visual scanning
- Distinguishes structured data from user-entered names
- Traditional in student information systems
- Prevents confusion with similar characters (O vs 0)

---

## Technology Stack

### **Core Framework**
- **Next.js 14.2**: React framework with file-based routing, SSR support
- **React 18.3**: UI component library with hooks

### **Styling**
- **Tailwind CSS 3.4**: Utility-first CSS framework
- **PostCSS 8.4**: CSS processing and plugin system
- **Autoprefixer**: Browser vendor prefixing

### **UI & Animation**
- **Framer Motion 11.15**: Advanced React animation library
  - Used for: Kanban card entrance, modal transitions, modal backdrop fades
- **clsx 2.1**: ClassName utility for conditional styling

### **Data Management**
- **TanStack React Query 5.66**: Server state management
  - Automatic caching and stale time management
  - Retry logic with exponential backoff
  - Refetch on focus/reconnect
- **Zustand 5.0**: Lightweight state management
  - Process selection state
  - Filter state persistence
  - Recent processes list

### **HTTP Client**
- **Axios 1.7**: HTTP request library
  - Used for all API calls to backend
  - Centralized in `utils/api.js`

---

## State Management

### **Zustand Store** (`store/processStore.js`)

**Global State:**
```javascript
{
  hydrated: boolean,              // SSR safety flag
  processName: string,            // Current process identifier
  recentProcesses: string[],      // Array of recent process names (max 8)
  searchTerm: string,             // Current search query
  statusFilter: string,           // Active status filter ('all' or specific)
  roundFilter: string,            // Active round filter ('all' or specific)
}
```

**Key Methods:**
- `hydrateFromStorage()`: Load persisted state on mount
- `setProcessName()`: Update current process
- `addRecentProcess()`: Add to recent list (max 8, no duplicates)
- `setSearchTerm()`: Update search query
- `setStatusFilter()`: Update status filter
- `setRoundFilter()`: Update round filter
- `reset()`: Clear all state

**Persistence:**
- `wdis:last-process`: Last accessed process name
- `wdis:recent-processes`: Array of recent processes

### **React Query** (`pages/dashboard/[processName].jsx`)

**Query Keys:**
- `['active-processes']`: List of available processes (stale after 60s)
- `[processName]`: Current process data with real-time polling

**Query Configuration:**
- Refetch on window focus and reconnect
- 3 retry attempts with exponential backoff
- 1-second default stale time
- Polling interval managed by `usePolling` hook

---

## Data Flow & Real-time Updates

### **Process Data Fetching**

**Landing Page Flow:**
1. User enters process name
2. Input validated and normalized
3. Navigation to `/dashboard/[processName]`
4. Process added to recent processes in Zustand

**Dashboard Flow:**
1. Fetch initial process data (with students, rounds, etc.)
2. Start polling with 2.5s interval
3. Data refreshes automatically in background
4. React Query handles cache invalidation
5. Components re-render with updated student positions

### **Real-time Update Indicators**

**Sync Status Display:**
- Last sync timestamp shown in waiting room
- Visual badge indicating connection health
- Exponential backoff message if offline/slow

**UI Feedback:**
- Student cards float in when added
- Counter badges update in real-time
- Filter results refresh immediately
- Waiting room students update automatically

### **Hooks for Data Management**

- **`useProcessData`**: Fetches and manages process-specific data
- **`useProcessStore`**: Access global process state
- **`useSyncStatus`**: Monitor data sync health
- **`usePolling`**: Calculate adaptive poll interval based on connectivity

---

## Future Enhancement Opportunities

### **UI/UX Improvements**
- [ ] Dark/light theme toggle
- [ ] Customizable column width and layout
- [ ] Drag-and-drop student movement between rounds (if backend supports)
- [ ] Student detail modal/drawer view
- [ ] Export candidate information (PDF, CSV)
- [ ] Candidate notes/comments section
- [ ] Timeline view in addition to Kanban
- [ ] Bulk actions (move multiple students, add tags)

### **Performance Optimizations**
- [ ] Virtual scrolling for large student lists (react-window)
- [ ] Image optimization for candidate photos (if added)
- [ ] Service worker for offline support
- [ ] Code splitting by route
- [ ] Lazy load modals/components

### **Accessibility & Inclusivity**
- [ ] WCAG 2.1 AA compliance audit
- [ ] Keyboard navigation improvements
- [ ] Screen reader optimization
- [ ] Colorblind-friendly status indicators (patterns + colors)
- [ ] Reduced motion preferences respect
- [ ] High contrast mode support

### **Analytics & Monitoring**
- [ ] Page load performance metrics
- [ ] User interaction tracking
- [ ] Error/crash reporting
- [ ] Real-time performance dashboard
- [ ] Sync success rate monitoring

### **Mobile Experience**
- [ ] Touch-optimized interactions
- [ ] Swipe to navigate between rounds
- [ ] Mobile-specific layout for filters
- [ ] Offline queue for potential future actions
- [ ] PWA installation support

---

## Code Organization Philosophy

**Layered Components:**
1. **Pages** (`pages/`): Route handlers and page composition
2. **Components** (`components/`): Feature and content components
3. **UI Components** (`components/ui/`): Reusable atomic elements
4. **Hooks** (`hooks/`): Custom React hooks for logic
5. **Utils** (`utils/`): Pure functions and helpers
6. **Store** (`store/`): Global state management
7. **Styles** (`styles/`): Global CSS and design tokens

**Component Naming:**
- Components use PascalCase
- Descriptive names indicating purpose
- Feature-first organization in directory structure

**Styling Convention:**
- Tailwind classes for layout and styling
- Custom classes for effects (glass-panel, muted-grid, focus-ring)
- Inline className strings for component-specific styling
- CSS custom properties for theme colors

---

## Contact & Support

For questions about this frontend architecture or design decisions, refer to the main project README or contact the development team.
