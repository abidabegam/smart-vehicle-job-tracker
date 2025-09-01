cat > README.md <<'EOF'
# Smart Vehicle Job Tracker / Automotive Lab 🚗⚡

A full-stack automotive lab web app that makes core concepts **interactive & lightweight**.

## 🔧 Modules
1. **CAN Decoder** — Paste/upload CAN logs → decode signals like *VehicleSpeed* & *EngineRPM*.
2. **JD → Skills Map** — Paste a JD → auto-tags domains (ADAS, AUTOSAR, ISO 26262, CAN, HIL) + quick study plan.
3. **HIL Test Plan Generator** — Generates pre-conditions, steps, expected results (e.g., ACC).

## 🎯 Why it’s useful
- Learn automotive concepts **without costly tools** (CANoe, dSPACE).
- Acts as a **training/demo lab** for engineers & students.
- Bridges **software + automotive validation**.
- Foundation for **AI-driven test automation** & **cloud HIL/SIL**.

## 🛠️ Tech
- **Frontend:** React (Vite + TS), Tailwind, Framer Motion
- **Backend:** Django + DRF + JWT

## 🚀 Run locally
### Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
cd frontend

https://github.com/user-attachments/assets/6cac78ee-0ef7-420e-81fd-b38a29b894a5


npm install
npm run dev
Frontend: http://localhost:5173
API: http://0.0.0.0:8000

## 📹 Demo

![Automotive Lab Demo]
