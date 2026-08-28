# AI Image Quality & Defect Detection — Frontend

A single-page web application frontend for an AI-powered Image Quality & Defect Detection tool built with **React 18**, **TypeScript**, **Vite**, **Tailwind CSS**, **Framer Motion**, and **Recharts**.

## Features

- **Futuristic Dark Design System**: Built with near-black `#0a0a0f` background, cyan accent highlights, and glassmorphic cards.
- **Analyze View**: Drag-and-drop image upload, animated border glow, quality score gauge (0–100), quality label pill badges (`ACCEPTABLE`, `DEGRADED`, `DEFECTIVE`), issue list with severity badges & confidence bars, technical stats readout panel, and optional heatmap overlay toggle.
- **History View**: Responsive grid of past analyses with thumbnail cards, quality badges, timestamps, detail drill-down, and empty state.
- **System Health Monitor**: Live pulsing status dot in header polling `/api/health`.
- **Standalone Mock Mode**: Automatically falls back to realistic mock data when the backend API is not running.
- **Accessibility & UX**: Keyboard-navigable upload zone, visible focus states, toast notifications, loading skeletons, and error handling with retry.

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure API Base URL (optional):
   Create or edit `.env` in the `frontend/` root:
   ```env
   VITE_API_BASE_URL=http://localhost:8000
   ```
   *Note: If the backend at `VITE_API_BASE_URL` is unreachable, the application automatically uses realistic mock data for easy testing and demonstration.*

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Build for Production

To create a type-checked production build:

```bash
npm run build
```

To preview the built app:

```bash
npm run preview
```

---

## API Contract Summary

- `POST /api/analyze` (multipart/form-data `image`) → Returns full `AnalysisResult`
- `GET /api/history` → Returns `AnalysisSummary[]`
- `GET /api/analysis/:id` → Returns `AnalysisResult` by ID
- `GET /api/health` → Returns `{ status: "ok" | "degraded" | "down" }`
