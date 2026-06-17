<div align="center">

<h1>HireSense - Smart Interview Preparation Platform</h1>

<p>An AI-powered mock interview platform with real-time voice analysis, resume review, adaptive question generation and detailed performance scoring.</p>

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

<img src="https://img.shields.io/badge/AI%20Powered-Groq%20%2B%20Llama%203.3%2070B-FF6B35?style=flat-square" />
<img src="https://img.shields.io/badge/Voice-Web%20Speech%20API-4285F4?style=flat-square&logo=google&logoColor=white" />

</div>

---

## ✨ Features

### 🎤 AI Interviewer
- Generates role-specific questions tailored to your resume and target position
- Adaptive difficulty - Beginner, Intermediate, Advanced
- 4 interview types: Technical, Behavioral, System Design, Mixed
- Dynamic follow-up questions powered by Groq + Llama 3.3 70B

### 🎙️ Voice Analysis
- Real-time speech-to-text via **Web Speech API**
- Measures speech rate (WPM), filler words, vocabulary diversity
- Confidence score combining text and acoustic features
- Acoustic analysis with **librosa** - pitch, energy, pause detection

### 📄 Resume Review
- Drag-and-drop PDF/DOCX upload
- AI-powered ATS compatibility scoring (0–100)
- Skills extraction, experience parsing, keyword gap analysis
- Personalized improvement recommendations

### 📊 Performance Scoring
- Per-answer scoring: Relevance, Completeness, Clarity, Technical Accuracy
- Session summary with radar chart across 5 dimensions
- Keywords covered vs. missing per answer
- Historical score trends and analytics dashboard

### 👤 Account Management
- Profile settings (name, role, experience)
- Password change with strength meter
- Forgot/reset password flow
- Account deletion

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Nginx (:80)                       │
│            Reverse Proxy + Load Balancer            │
└──────────────┬──────────────────┬───────────────────┘
               │                  │
      ┌────────▼───────┐ ┌───────▼────────┐
      │ FastAPI (:8000) │ │  React (:3000) │
      │  Backend API   │ │  Frontend SPA  │
      └────────┬───────┘ └────────────────┘
               │
    ┌──────────┼──────────────────┐
    │          │                  │
┌───▼───┐ ┌───▼────┐      ┌──────▼─────┐
│Postgres│ │ Redis  │      │   MinIO    │
│  :5432 │ │ :6379  │      │ :9000/9001 │
└────────┘ └───┬────┘      └────────────┘
               │
         ┌─────▼──────┐
         │   Celery   │
         │   Worker   │
         └────────────┘
```

### AI & ML Components

| Feature | Technology |
|---------|-----------|
| Question Generation | Groq API — `llama-3.3-70b-versatile` |
| Answer Evaluation | Groq API — `llama-3.3-70b-versatile` |
| Resume Analysis | Groq API — `llama-3.3-70b-versatile` |
| Speech-to-Text | Web Speech API (browser-native) |
| Voice Analysis | librosa + custom text metrics |
| Resume Parsing | PyMuPDF + python-docx |

---

## 🚀 Quick Start

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- A free **Groq API key** from [console.groq.com](https://console.groq.com)

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/hiresense.git
cd hiresense
```

### 2. Configure environment
```bash
cp .env.example .env
```

Open `.env` and set your Groq API key:
```env
GROQ_API_KEY=gsk_your_key_here
```

### 3. Launch with Docker
```bash
docker compose up --build
```

First build takes ~3–5 minutes. After that:

| Service | URL |
|---------|-----|
| 🌐 Frontend | http://localhost:3000 |
| 📡 Backend API | http://localhost:8000 |
| 📖 API Docs (Swagger) | http://localhost:8000/docs |
| 🗄️ MinIO Console | http://localhost:9001 |

### 4. Register and start practicing!

---

## 📁 Project Structure

```
hiresense/
├── docker-compose.yml
├── .env.example
├── .gitignore
├── .dockerignore
├── docker/
│   └── nginx.conf
│
├── backend/                          # FastAPI Python backend
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py                   # App entry point
│       ├── core/
│       │   ├── config.py             # Environment settings
│       │   ├── database.py           # Async SQLAlchemy
│       │   ├── security.py           # JWT + bcrypt
│       │   └── celery_app.py         # Task queue
│       ├── models/
│       │   └── user.py               # All DB models
│       ├── schemas/
│       │   └── schemas.py            # Pydantic schemas
│       ├── services/
│       │   ├── ai_service.py         # Groq AI integration
│       │   ├── audio_service.py      # Voice analysis
│       │   ├── resume_service.py     # PDF/DOCX parsing
│       │   └── storage_service.py    # MinIO file storage
│       └── api/routes/
│           ├── auth.py               # Register, login, password reset
│           ├── users.py              # Profile management
│           ├── interviews.py         # Session CRUD + AI scoring
│           ├── resume.py             # Upload + analysis
│           └── analytics.py          # Performance stats
│
└── frontend/                         # React 18 + TypeScript
    ├── Dockerfile
    ├── package.json
    └── src/
        ├── App.tsx                   # Router
        ├── pages/
        │   ├── LoginPage.tsx
        │   ├── RegisterPage.tsx
        │   ├── ForgotPasswordPage.tsx
        │   ├── ResetPasswordPage.tsx
        │   ├── DashboardPage.tsx
        │   ├── InterviewSetupPage.tsx
        │   ├── InterviewPage.tsx     # Live voice interview
        │   ├── ResultsPage.tsx       # AI report + radar chart
        │   ├── ResumePage.tsx        # Resume upload + ATS
        │   ├── AnalyticsPage.tsx     # Charts + trends
        │   └── SettingsPage.tsx      # Account settings
        ├── components/
        │   └── common/Layout.tsx     # Sidebar navigation
        ├── services/api.ts           # Axios API client
        ├── store/authStore.ts        # Zustand auth state
        └── hooks/useVoiceRecorder.ts # Web Speech API hook
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Create account | ❌ |
| POST | `/api/auth/login` | Login, get JWT | ❌ |
| POST | `/api/auth/forgot-password` | Generate reset token | ❌ |
| POST | `/api/auth/reset-password` | Reset with token | ❌ |
| GET | `/api/users/me` | Get profile | ✅ |
| PUT | `/api/users/me` | Update profile | ✅ |
| POST | `/api/users/change-password` | Change password | ✅ |
| DELETE | `/api/users/me` | Delete account | ✅ |
| POST | `/api/interviews/` | Create session + generate questions | ✅ |
| GET | `/api/interviews/` | List all sessions | ✅ |
| GET | `/api/interviews/{id}` | Get session details | ✅ |
| POST | `/api/interviews/{id}/start` | Start session timer | ✅ |
| POST | `/api/interviews/{id}/answers` | Submit + AI-score answer | ✅ |
| POST | `/api/interviews/{id}/complete` | Generate final report | ✅ |
| POST | `/api/resume/upload` | Upload + analyze resume | ✅ |
| GET | `/api/resume/` | List resumes | ✅ |
| GET | `/api/analytics/summary` | Performance analytics | ✅ |

Full interactive docs available at **http://localhost:8000/docs**

---

## ⚙️ Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | ✅ | Groq API key — get free at [console.groq.com](https://console.groq.com) |
| `SECRET_KEY` | ✅ | JWT signing secret (min 32 chars) |
| `POSTGRES_USER` | No | DB username (default: `interview_user`) |
| `POSTGRES_PASSWORD` | No | DB password (default: `interview_pass`) |
| `POSTGRES_DB` | No | DB name (default: `interview_db`) |
| `MINIO_ROOT_USER` | No | MinIO username (default: `minioadmin`) |
| `MINIO_ROOT_PASSWORD` | No | MinIO password (default: `minioadmin`) |
| `CORS_ORIGINS` | No | Allowed origins (default: `http://localhost:3000`) |

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|-----------|---------|
| **FastAPI** | Async Python web framework |
| **PostgreSQL** | Primary relational database |
| **SQLAlchemy (async)** | ORM with async support |
| **Redis** | Cache + Celery message broker |
| **Celery** | Async task queue |
| **MinIO** | S3-compatible file storage |
| **passlib + bcrypt** | Password hashing |
| **python-jose** | JWT token handling |

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 18** | UI library |
| **TypeScript** | Type safety |
| **Vite** | Build tool |
| **TailwindCSS v3** | Utility-first styling |
| **Zustand** | State management |
| **Recharts** | Charts and data visualization |
| **Axios** | HTTP client |
| **react-dropzone** | File upload |
| **react-hot-toast** | Toast notifications |

### AI / ML
| Technology | Purpose |
|-----------|---------|
| **Groq API** | LLM inference (Llama 3.3 70B) |
| **Web Speech API** | Browser speech-to-text |
| **librosa** | Audio feature extraction |
| **PyMuPDF** | PDF text extraction |
| **python-docx** | Word document parsing |

### Infrastructure
| Technology | Purpose |
|-----------|---------|
| **Docker Compose** | Multi-container orchestration |
| **Nginx** | Reverse proxy |

---

## 🧑‍💻 Development

### Run backend locally
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Run frontend locally
```bash
cd frontend
npm install
npm run dev
```

### Rebuild after code changes
```bash
docker compose up --build -d
```

### View logs
```bash
# All services
docker compose logs --follow

# Specific service
docker compose logs backend --follow
docker compose logs frontend --follow
```

### Access database
```bash
docker compose exec postgres psql -U interview_user -d interview_db
```

---

## 🗺️ Roadmap

- [ ] Email delivery for password reset (SMTP integration)
- [ ] OpenAI Whisper integration for audio transcription
- [ ] Video recording + facial expression analysis
- [ ] Interview scheduling and calendar integration
- [ ] Company-specific question banks
- [ ] Peer review and mock interview matching
- [ ] Mobile app (React Native)
- [ ] Export reports as PDF

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Ushani Saubhagya** - Software Engineering Student

---

<div align="center">

**[⭐ Star this repo if you found it helpful!](https://github.com/yourusername/hiresense)**

</div>
