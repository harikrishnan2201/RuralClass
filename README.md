# RuralClass — Multi-Grade Classroom Planning & Student Support

Educational planning assistant for multi-grade rural schools in India, featuring concept bridge mapping, adaptive weekly scheduling, student records with interactive marks editing, and low-cost village learning activities.

---

## 🚀 How to Run in VS Code (Step-by-Step)

### Prerequisites
Make sure you have **Node.js** installed (version 18 or higher recommended).
Check in your terminal:
```bash
node -v
npm -v
```
*(If not installed, download it from [nodejs.org](https://nodejs.org/))*

---

### Step 1: Open the Project in VS Code
1. Open **Visual Studio Code**.
2. Click **File > Open Folder...** (or `Cmd + O` / `Ctrl + K Ctrl + O`).
3. Select this project root folder (the folder containing `package.json`).

---

### Step 2: Open the Integrated Terminal
In VS Code, press:
- **Windows / Linux:** `Ctrl + ` ` (backtick)
- **Mac:** `Cmd + ` ` (backtick)
- Or click top menu: **Terminal > New Terminal**

---

### Step 3: Install Dependencies
In the VS Code terminal, run:
```bash
npm install
```

---

### Step 4 (Optional): Setup Environment Variables
If you want to use live Gemini API calls, copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Open `.env` and add your Gemini API key:
```env
GEMINI_API_KEY="your-gemini-api-key"
PORT=3000
```
> **Note:** If you don't have an API key, don't worry! RuralClass includes built-in deterministic fallback logic for all plans, check-ins, and recommendations.

---

### Step 5: Start the Development Server
In the VS Code terminal, run:
```bash
npm run dev
```

You should see:
```text
RuralClass full-stack server running on http://0.0.0.0:3000
```

---

### Step 6: Open the Application in Your Browser
Visit:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🛠️ Available Scripts

- `npm run dev` — Starts the full-stack server (Express + Vite) on `http://localhost:3000`
- `npm run build` — Builds the production bundle
- `npm run lint` — Runs TypeScript type-checking (`tsc --noEmit`)

---

## 🧭 Main Sections to Explore
1. **Overview Dashboard** (`/`) — Summary cards, week timetable, 5-min check-in alert, teacher actions.
2. **Student Records** (`/students`) — Interactive marks editor, 5-minute morning check-in flags, cross-grade buddy pairings, and AI personalized micro-plans.
3. **AI Planning Coach** (`/ai-assistant`) — Interactive conversational assistant for multi-grade simultaneous classroom guidance.
4. **Concept Bridge Map** (`/concept-bridge-map`) — Interactive SVG dependency graph tracing learning pathways across Classes 3, 4, and 5.
5. **Weekly Planner** (`/weekly-planner`) — Adaptive Mon–Fri schedule generator, duration meter, and A4 print export.
6. **Low-Cost Activities** (`/activities`) — Zero-cost village classroom activities matching school inventory (paper strips, pebbles, twigs, bottle caps).
