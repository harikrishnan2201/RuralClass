# RuralClass — Multi-Grade Classroom Planning & Student Support

Educational planning assistant for multi-grade rural schools in India, featuring concept bridge mapping, adaptive weekly scheduling, student records with interactive marks editing, and low-cost village learning activities.

---

## 🚀 How to Run (Step-by-Step)

### Prerequisites
Make sure you have **Node.js** installed (version 18 or higher recommended) and use **npm**.
Check in your terminal:
```bash
node -v
npm -v
```
*(If not installed, download it from [nodejs.org](https://nodejs.org/))*

---

### Step 1: Open the Project
Open this project root folder (the folder containing `package.json`).

---

### Step 2: Install Dependencies
In the terminal, run:
```bash
npm install
```

---

### Step 3 (Optional): Setup Environment Variables
If you want to use live Gemini API calls, copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Open `.env` and configure your variables:
```env
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-2.5-flash"
PORT=3000
```
> **Note:** If you don't have an API key, don't worry! RuralClass includes built-in deterministic pedagogical fallback logic for all plans, check-ins, and recommendations.

---

### Step 4: Start the Development Server
In the terminal, run:
```bash
npm run dev
```

You should see:
```text
RuralClass full-stack server running on http://0.0.0.0:3000 [Model: gemini-2.5-flash]
```

Visit:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🛠️ Available Scripts

- `npm run dev` — Starts the development full-stack server with Vite middleware on `http://localhost:3000`
- `npm run build` — Builds both Vite client assets and bundles `server.ts` to `dist/server.js` via esbuild
- `npm start` — Runs the production server from `dist/server.js`
- `npm run lint` — Runs TypeScript type-checking (`tsc --noEmit`)
- `npm test` — Runs the automated Vitest test suite

---

## 🧭 Main Sections
1. **Overview Dashboard** (`/`) — Summary cards, weekly timetable, 5-minute check-in alert, teacher actions.
2. **Student Records** (`/students`) — Interactive marks editor, 5-minute morning check-in flags, cross-grade buddy pairings, and AI personalized micro-plans (with teacher approval flow).
3. **AI Planning Coach** (`/ai-assistant`) — Multi-turn conversational coach for multi-grade simultaneous classroom guidance with AI vs built-in indicator.
4. **Concept Bridge Map** (`/concept-bridge-map`) — Interactive SVG dependency graph tracing learning pathways across grades.
5. **Weekly Planner** (`/weekly-planner`) — Adaptive Mon–Fri schedule generator, duration meter, and A4 print export.
6. **Low-Cost Activities** (`/activities`) — Zero-cost village classroom activities matching school inventory (paper strips, pebbles, twigs, bottle caps).
7. **Settings** (`/settings`) — Teacher preferences, schedule defaults, and student privacy toggle for AI data sharing.
