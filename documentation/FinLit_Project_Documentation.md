# FinLit Q&A — Project Documentation

> **Version:** 1.0  
> **Author:** Shishir Dhasmana  
> **Last Updated:** April 2026  
> **Live Demo:** https://fin-lit-kappa.vercel.app  
> **Backend API:** https://finlit-backend-l1f4.onrender.com

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Problem Statement & Motivation](#2-problem-statement--motivation)
3. [Architecture & System Design](#3-architecture--system-design)
4. [Technology Stack](#4-technology-stack)
5. [Project Structure](#5-project-structure)
6. [Backend Deep Dive](#6-backend-deep-dive)
7. [Frontend Deep Dive](#7-frontend-deep-dive)
8. [API Reference](#8-api-reference)
9. [Data Flow & RAG Pipeline](#9-data-flow--rag-pipeline)
10. [Deployment](#10-deployment)
11. [Environment Variables](#11-environment-variables)
12. [Development Setup](#12-development-setup)
13. [Git History & Evolution](#13-git-history--evolution)
14. [Known Limitations & Future Improvements](#14-known-limitations--future-improvements)

---

## 1. Project Overview

**FinLit Q&A** is a full-stack, RAG-based (Retrieval-Augmented Generation) web application that enables users to upload financial documents (PDFs) and ask questions about them in plain English. The system extracts text from uploaded PDFs, creates semantic vector embeddings, stores them in a vector database, and uses Google's Gemini 2.5 Flash LLM to generate accurate, cited answers grounded in the document content.

### Key Capabilities

| Capability | Description |
|---|---|
| **PDF Upload & Processing** | Accepts any text-based PDF, extracts content, and chunks it for semantic indexing |
| **Semantic Search** | Uses `gemini-embedding-001` embeddings to find the most relevant document sections for any question |
| **AI-Powered Answers** | Generates clear, plain-English answers using `Gemini 2.5 Flash` with structured formatting |
| **Source Citations** | Every answer includes the exact document chunks it was derived from, ensuring transparency |
| **Hallucination Prevention** | The RAG architecture constrains the LLM to only answer from the uploaded document's content |
| **Multi-turn Chat** | Users can ask multiple follow-up questions about the same document in a single session |
| **Session Isolation** | Each uploaded document gets a unique session ID, ensuring data isolation between users |

---

## 2. Problem Statement & Motivation

Financial documents — loan agreements, tax forms, insurance policies, bank statements — are dense with legal and financial jargon that is inaccessible to most people. Misunderstanding these documents can lead to:

- Accepting unfavorable loan terms
- Missing tax deductions or obligations
- Not understanding insurance coverage limitations
- Overlooking important clauses and conditions

**FinLit Q&A** democratizes access to financial understanding by letting anyone upload a document and ask questions in their own words, receiving clear, accurate answers backed by direct citations.

---

## 3. Architecture & System Design

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                    React + Vite (Vercel)                          │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────────────┐ │
│  │ Upload   │  │ Chat         │  │ Markdown Renderer          │ │
│  │ (Drag &  │  │ Interface    │  │ (ReactMarkdown +           │ │
│  │  Drop)   │  │ (Multi-turn) │  │  Source Viewer)            │ │
│  └────┬─────┘  └──────┬───────┘  └────────────────────────────┘ │
│       │               │                                          │
└───────┼───────────────┼──────────────────────────────────────────┘
        │  HTTP/REST    │
        ▼               ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
│                 Python Flask (Render)                             │
│  ┌────────────┐  ┌────────────────────────────────────────────┐ │
│  │ app.py     │  │ rag.py (RAG Pipeline)                      │ │
│  │ Flask API  │  │  ┌──────────────┐  ┌────────────────────┐  │ │
│  │ Routes:    │  │  │ PDF Parser   │  │ Text Chunker       │  │ │
│  │ /upload    ├──┤  │ (pypdf)      │  │ (LangChain         │  │ │
│  │ /ask       │  │  │              │  │  500char / 50 ovlp) │  │ │
│  │ /health    │  │  └──────┬───────┘  └────────┬───────────┘  │ │
│  └────────────┘  │         │                   │              │ │
│                  │         ▼                   ▼              │ │
│                  │  ┌──────────────────────────────────────┐  │ │
│                  │  │ Embedding & Vector Store             │  │ │
│                  │  │ (Gemini Embeddings → ChromaDB)       │  │ │
│                  │  └──────────────┬───────────────────────┘  │ │
│                  │                 │                          │ │
│                  │                 ▼                          │ │
│                  │  ┌──────────────────────────────────────┐  │ │
│                  │  │ QA Chain                             │  │ │
│                  │  │ (LangChain Retrieval Chain           │  │ │
│                  │  │  + Gemini 2.5 Flash LLM)             │  │ │
│                  │  └──────────────────────────────────────┘  │ │
│                  └────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────┐     ┌──────────────────────────────────┐
│    ChromaDB      │     │    Google Gemini API              │
│ (Disk-persisted  │     │  • gemini-embedding-001           │
│  Vector Store)   │     │  • gemini-2.5-flash               │
└──────────────────┘     └──────────────────────────────────┘
```

### Request Flow

1. **Upload Flow**: `Frontend → POST /upload → app.py → rag.process_document() → (parse PDF → chunk → embed → store in ChromaDB) → return session_id`
2. **Query Flow**: `Frontend → POST /ask → app.py → rag.answer_question() → (load ChromaDB → retrieve top-3 chunks → LLM generates answer) → return answer + sources`

---

## 4. Technology Stack

### Backend

| Technology | Purpose | Version/Details |
|---|---|---|
| **Python** | Core backend language | 3.11+ |
| **Flask** | Lightweight REST API framework | Latest |
| **Flask-CORS** | Cross-Origin Resource Sharing middleware | All origins enabled |
| **LangChain** | LLM orchestration framework | Core + Classic + Google GenAI |
| **LangChain Classic** | `create_retrieval_chain`, `create_stuff_documents_chain` | For chain composition |
| **Google Generative AI** | Embeddings + LLM | `gemini-embedding-001`, `gemini-2.5-flash` |
| **ChromaDB** | Vector database for similarity search | Disk-persisted per session |
| **pypdf** | PDF text extraction | Latest |
| **python-dotenv** | Environment variable management | Loads `.env` file |

### Frontend

| Technology | Purpose | Version |
|---|---|---|
| **React** | UI component library | 19.2.4 |
| **Vite** | Build tool and dev server | 8.0.1 |
| **Axios** | HTTP client for API calls | 1.13.6 |
| **ReactMarkdown** | Renders Markdown-formatted AI responses | 10.1.0 |
| **Google Fonts** | Typography (Instrument Serif + DM Sans) | CDN |

### Infrastructure

| Service | Purpose |
|---|---|
| **Vercel** | Frontend hosting and deployment |
| **Render** | Backend hosting (Python Flask service) |

---

## 5. Project Structure

```
FinLiy/
├── .git/                             # Git version control
├── .gitignore                        # Excludes venv, node_modules, .env, db/, uploads/
├── README.md                         # Project overview and setup guide
├── documentation/                    # Project documentation (this file)
│
├── backend/
│   ├── .env                          # API keys (GOOGLE_API_KEY) — not committed
│   ├── app.py                        # Flask API server (79 lines)
│   │                                   Routes: /upload, /ask, /health
│   ├── rag.py                        # RAG pipeline logic (121 lines)
│   │                                   PDF parsing, chunking, embedding, QA chain
│   ├── check_models.py               # Utility to list available Gemini models (17 lines)
│   ├── requirements.txt              # Python dependencies (11 packages)
│   ├── db/                           # ChromaDB vector stores (per session, gitignored)
│   ├── uploads/                      # Uploaded PDFs (per session, gitignored)
│   └── venv/                         # Python virtual environment (gitignored)
│
└── frontend/
    ├── .gitignore                    # Excludes node_modules, dist
    ├── README.md                     # Vite boilerplate readme
    ├── index.html                    # HTML entry point
    ├── package.json                  # NPM dependencies and scripts
    ├── package-lock.json             # NPM lock file
    ├── vite.config.js                # Vite configuration (React plugin)
    ├── eslint.config.js              # ESLint rules for React
    ├── public/
    │   ├── favicon.svg               # Browser tab icon
    │   └── icons.svg                 # Icon sprite sheet
    ├── src/
    │   ├── main.jsx                  # React app entry point (11 lines)
    │   ├── App.jsx                   # Main application component (669 lines)
    │   │                               All UI logic, styling, and state management
    │   ├── App.css                   # (Empty/minimal — styles are inline in App.jsx)
    │   ├── index.css                 # Global CSS reset
    │   └── assets/
    │       ├── hero.png              # Hero image asset
    │       ├── react.svg             # React logo
    │       └── vite.svg              # Vite logo
    └── node_modules/                 # NPM packages (gitignored)
```

---

## 6. Backend Deep Dive

### 6.1 `app.py` — Flask API Server

The API server is a minimal Flask application with three endpoints and CORS enabled for all origins.

#### Key Design Decisions

- **Session-based isolation**: Each uploaded document is assigned a `uuid4` session ID. The PDF is saved as `{session_id}.pdf` and its vector store is created at `./db/{session_id}/`. This ensures complete isolation between different users and documents.
- **File validation**: Only `.pdf` files are accepted. Empty uploads and missing files return `400` errors.
- **Error handling**: The upload endpoint distinguishes between `ValueError` (e.g., scanned PDFs with no extractable text) and generic exceptions, returning appropriate HTTP status codes.
- **Production-ready binding**: Binds to `0.0.0.0:5000` for container compatibility.

#### Endpoint Summary

| Endpoint | Method | Purpose | Input | Output |
|---|---|---|---|---|
| `/upload` | POST | Upload and process a PDF | `multipart/form-data` with `file` | `{ message, session_id, chunks }` |
| `/ask` | POST | Ask a question about a document | `{ session_id, question }` | `{ answer, sources }` |
| `/health` | GET | Health check | None | `{ status: "ok" }` |

### 6.2 `rag.py` — RAG Pipeline

This is the core intelligence of the application. It implements a 7-step pipeline:

#### Step 1: `parse_pdf(file_path)`
- Uses `pypdf.PdfReader` to extract text from every page
- Concatenates all page text into a single string 
- Raises `ValueError` if no extractable text is found (e.g., scanned/image-only PDFs)

#### Step 2: `chunk_text(text)`
- Uses LangChain's `RecursiveCharacterTextSplitter`
- **Chunk size**: 500 characters 
- **Chunk overlap**: 50 characters (ensures context continuity across chunk boundaries)
- Returns a list of LangChain `Document` objects

#### Step 3: `create_vectorstore(chunks, session_id)`
- Creates embeddings using `GoogleGenerativeAIEmbeddings` with model `gemini-embedding-001`
- Stores vectors in ChromaDB with `persist_directory=./db/{session_id}`
- ChromaDB automatically persists to disk

#### Step 4: `load_vectorstore(session_id)`
- Reloads a previously created ChromaDB vector store from disk using the session ID
- Used during the question-answering flow

#### Step 5: `get_qa_chain(vectorstore)`
- Creates a `ChatGoogleGenerativeAI` instance with `gemini-2.5-flash` at `temperature=0.3`
- Defines a structured prompt template that instructs the LLM to:
  - Act as a "financial document assistant"
  - Answer in plain English
  - Format responses with a header, key points, and document citations
  - Admit when information is not found
- Assembles a LangChain retrieval chain that:
  - Retrieves the **top 3** most relevant chunks (`k=3`)
  - Stuffs them into the prompt context
  - Sends the full prompt to Gemini for generation

#### Step 6: `process_document(file_path, session_id)`
- Orchestrates the full document ingestion: `parse → chunk → embed/store`
- Returns the number of chunks created (used for user feedback)

#### Step 7: `answer_question(session_id, question)`
- Orchestrates the query flow: `load vectorstore → build chain → invoke → extract answer + sources`
- Extracts the first 150 characters of each source chunk for the citation preview
- Returns `{ answer, sources }` dict

### 6.3 `check_models.py` — Utility Script

A diagnostic script that lists all available Gemini embedding and chat models. Useful for debugging model availability issues.

---

## 7. Frontend Deep Dive

### 7.1 Application Structure

The entire frontend is a **single-component application** (`App.jsx` — 669 lines) that includes:
- All component logic and state management
- CSS-in-JS via inline `<style>` block
- A child `MessageBubble` component for rendering chat messages

### 7.2 State Management

| State Variable | Type | Purpose |
|---|---|---|
| `file` | `File \| null` | The selected PDF file |
| `dragging` | `boolean` | Whether a file is being dragged over the drop zone |
| `sessionId` | `string \| null` | Session ID returned by the backend after upload |
| `question` | `string` | Current question input text |
| `messages` | `Array` | Chat history (system, user, and assistant messages) |
| `uploading` | `boolean` | Whether a file upload is in progress |
| `uploadSuccess` | `boolean` | Whether the upload completed successfully |
| `loading` | `boolean` | Whether an AI response is being generated |
| `uploadProgress` | `number` | Upload progress percentage (0–100) |

### 7.3 UI Screens

The app has two main screens, toggled by the `uploadSuccess` state:

#### Screen 1: Upload Screen
- **Hero section**: "Your financial documents, finally explained."
- **Drag & drop zone**: Accepts PDF files via drag-and-drop or file browser
- **Upload button**: Triggers the `POST /upload` call with progress bar
- **File info display**: Shows file name and size when selected

#### Screen 2: Chat Screen
- **Document badge**: Shows the active document name with a green checkmark
- **Message list**: Scrollable chat history with auto-scroll to latest
- **Message types**:
  - **System**: Initial welcome message with chunk count
  - **User**: Right-aligned user questions
  - **Assistant**: Left-aligned AI answers rendered as Markdown
- **Source viewer**: Expandable toggle per message to view cited document chunks
- **Typing indicator**: Animated bouncing dots while waiting for AI response
- **Input area**: Auto-resizing textarea with Enter-to-send and Shift+Enter for newlines

### 7.4 Design System

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#0a0a0f` | Page background (dark) |
| `--surface` | `#111118` | Card/container backgrounds |
| `--surface2` | `#16161f` | Nested surface (source items) |
| `--accent` | `#6c63ff` | Primary purple accent |
| `--accent2` | `#a78bfa` | Secondary lavender accent |
| `--text` | `#e8e8f0` | Primary text color |
| `--text-muted` | `#6b6b80` | Secondary text |
| `--user-bg` | `#1e1b4b` | User message bubble background |
| `--success` | `#10b981` | Success states (green) |

#### Typography
- **Headers**: `Instrument Serif` (serif, elegant)
- **Body**: `DM Sans` (sans-serif, clean, weight 300–600)

#### Animations
- `fadeUp`: Elements fade in from bottom on mount
- `pulse`: Status dot pulsing animation
- `bounce`: Typing indicator dots bouncing

#### Responsive Design
- Max width: `860px` centered
- Mobile breakpoint at `600px`:
  - Reduced padding
  - Wider chat bubbles (90%)
  - Hidden status pill
  - Smaller typography

### 7.5 API Integration

All API calls use Axios pointed to the production backend URL:
```
const API = "https://finlit-backend-l1f4.onrender.com";
```

| Action | Endpoint | Method | Features |
|---|---|---|---|
| Upload | `/upload` | POST | Upload progress tracking via `onUploadProgress` |
| Ask | `/ask` | POST | Session-based, loading state with typing indicator |

---

## 8. API Reference

### `POST /upload`

Upload a PDF document for processing.

**Request:**
- Content-Type: `multipart/form-data`
- Body: `file` field containing the PDF

**Success Response (200):**
```json
{
  "message": "Document uploaded successfully",
  "session_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "chunks": 42
}
```

**Error Responses:**
| Code | Condition | Body |
|---|---|---|
| `400` | No file provided | `{ "error": "No file provided" }` |
| `400` | Empty filename | `{ "error": "No file selected" }` |
| `400` | Non-PDF file | `{ "error": "Only PDF files are supported" }` |
| `400` | Scanned/no-text PDF | `{ "error": "Could not extract text. PDF may be scanned." }` |
| `500` | Processing failure | `{ "error": "Failed to process document" }` |

---

### `POST /ask`

Ask a question about an uploaded document.

**Request:**
- Content-Type: `application/json`
- Body:
```json
{
  "session_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "question": "What is the interest rate on this loan?"
}
```

**Success Response (200):**
```json
{
  "answer": "### Interest Rate\nThe interest rate on this loan is 8.5% per annum.\n\n**Key Points:**\n• ...",
  "sources": [
    "The borrower agrees to pay interest at the rate of 8.5%...",
    "Interest shall be calculated on a monthly reducing balance..."
  ]
}
```

**Error Responses:**
| Code | Condition | Body |
|---|---|---|
| `400` | Missing session_id or question | `{ "error": "session_id and question are required" }` |
| `400` | Empty question | `{ "error": "Question cannot be empty" }` |
| `500` | Processing failure | `{ "error": "Failed to answer question" }` |

---

### `GET /health`

Health check endpoint.

**Response (200):**
```json
{ "status": "ok" }
```

---

## 9. Data Flow & RAG Pipeline

### Document Ingestion Pipeline

```
PDF File
  │
  ▼
┌──────────────────────────────────────────────┐
│ 1. TEXT EXTRACTION (pypdf)                   │
│    PdfReader reads each page                 │
│    Concatenates all text into single string   │
│    Validates non-empty text                  │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────┐
│ 2. TEXT CHUNKING (LangChain)                 │
│    RecursiveCharacterTextSplitter             │
│    Chunk size: 500 characters                │
│    Overlap: 50 characters                    │
│    Output: List of Document objects           │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────┐
│ 3. VECTOR EMBEDDING (Gemini)                 │
│    Model: gemini-embedding-001               │
│    Each chunk → dense vector representation  │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────┐
│ 4. VECTOR STORAGE (ChromaDB)                 │
│    Directory: ./db/{session_id}/              │
│    Persisted to disk                         │
│    Indexed for similarity search             │
└──────────────────────────────────────────────┘
```

### Question-Answering Pipeline

```
User Question
  │
  ▼
┌──────────────────────────────────────────────┐
│ 1. QUESTION EMBEDDING (Gemini)               │
│    Same model: gemini-embedding-001          │
│    Question → vector representation          │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────┐
│ 2. SIMILARITY SEARCH (ChromaDB)              │
│    Retrieves top-3 most similar chunks       │
│    Cosine similarity on vector space         │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────┐
│ 3. PROMPT ASSEMBLY (LangChain)               │
│    System prompt + retrieved chunks +        │
│    user question → structured prompt         │
│                                              │
│    System instructions:                      │
│    • Answer in plain English                 │
│    • Structure: Header → Key Points → Cite   │
│    • Admit when info not found               │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────┐
│ 4. ANSWER GENERATION (Gemini 2.5 Flash)      │
│    Temperature: 0.3 (low, for accuracy)      │
│    Generates Markdown-formatted response     │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────┐
│ 5. RESPONSE FORMATTING                       │
│    Answer: full Markdown text                │
│    Sources: first 150 chars of each chunk    │
│    Sent back as JSON                         │
└──────────────────────────────────────────────┘
```

### Why RAG?

| Traditional LLM | RAG (FinLit Approach) |
|---|---|
| Relies on training data | Grounded in the actual document |
| Prone to hallucination | Answers only from uploaded content |
| Cannot access private docs | Processes user-uploaded files |
| General knowledge responses | Document-specific, cited answers |

---

## 10. Deployment

### Frontend — Vercel

- **URL:** https://fin-lit-kappa.vercel.app
- **Framework:** Vite + React
- **Build command:** `npm run build` (produces `dist/` directory)
- **Auto-deploys:** From Git repository on push

### Backend — Render

- **URL:** https://finlit-backend-l1f4.onrender.com
- **Runtime:** Python 3
- **Start command:** `python app.py`
- **Disk:** ChromaDB vectors and uploaded PDFs are stored on Render's ephemeral filesystem (data is not persisted across redeployments)
- **CORS:** All origins enabled (open API)

### Deployment Notes

> ⚠️ **Important**: The backend on Render uses ephemeral storage. This means:
> - Uploaded PDFs and ChromaDB vector stores are lost when the service restarts or redeploys
> - Each session is temporary — users need to re-upload documents after service restarts
> - For production use, consider a persistent storage solution (e.g., Render Disk, cloud object storage + managed vector DB)

---

## 11. Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_API_KEY` | ✅ | Google Gemini API key for embeddings and LLM |

### Frontend

No environment variables required. The API URL is hardcoded in `App.jsx`:
```javascript
const API = "https://finlit-backend-l1f4.onrender.com";
```

For local development, change this to:
```javascript
const API = "http://localhost:5000";
```

---

## 12. Development Setup

### Prerequisites

- Python 3.11 or higher
- Node.js 18 or higher
- A Google Gemini API key ([Get one here](https://aistudio.google.com))

### Backend

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate
# Activate (Mac/Linux)
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with your API key
echo GOOGLE_API_KEY=your_key_here > .env

# Run the Flask server (starts on http://localhost:5000)
python app.py
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server (starts on http://localhost:5173)
npm run dev
```

### Available Scripts

| Script | Command | Purpose |
|---|---|---|
| Backend Start | `python app.py` | Start Flask API server on port 5000 |
| Frontend Dev | `npm run dev` | Start Vite dev server with HMR on port 5173 |
| Frontend Build | `npm run build` | Build production bundle to `dist/` |
| Frontend Preview | `npm run preview` | Preview production build locally |
| Frontend Lint | `npm run lint` | Run ESLint for code quality checks |
| Check Models | `python check_models.py` | List available Gemini models |

---

## 13. Git History & Evolution

The project evolved through 8 commits:

| # | Commit | Description |
|---|---|---|
| 1 | `8f3e17f` | **RAG Pipeline Completed** — Initial working backend with PDF parsing, chunking, embedding, and QA chain |
| 2 | `cfa612d` | **Refined frontend** — Polished the React UI with dark theme, chat interface, and drag-and-drop |
| 3 | `8ac3fed` | **Changed backend for Render** — Adapted Flask app for Render deployment (host binding, etc.) |
| 4 | `c17fb2e` | **Removed fixed versions from requirements.txt** — Unpinned dependency versions for broader compatibility |
| 5 | `0cb1b8e` | **Updated API URL for production** — Pointed frontend to the deployed Render backend URL |
| 6 | `9d4b6bb` | **Updated README.md** — Comprehensive project documentation in the README |
| 7 | `b4d5a7d` | **Fixed CORS again** — Further CORS configuration adjustments |
| 8 | `7e4cb98` | **Fixed CORS** — Final CORS fix to allow cross-origin requests |

---

## 14. Known Limitations & Future Improvements

### Current Limitations

| Limitation | Impact | Potential Solution |
|---|---|---|
| **No OCR support** | Scanned/image-only PDFs cannot be processed | Integrate Tesseract OCR or cloud OCR services |
| **Single document per session** | Users can only query one document at a time | Implement multi-document sessions with document switching |
| **Ephemeral storage on Render** | Vector stores and uploads lost on redeploy | Use persistent disk or managed vector DB (Pinecone, Weaviate) |
| **No authentication** | No user accounts or document history | Add user auth (OAuth/JWT) and document management |
| **Hardcoded API URL** | Frontend requires code change to switch environments | Use environment variables via Vite's `import.meta.env` |
| **No rate limiting** | API is open and could be abused | Add Flask rate limiting middleware |
| **English-only responses** | Not accessible to non-English speakers | Add multi-language support (Hindi and regional languages) |
| **No export functionality** | Users cannot save or share answers | Add PDF/text export of chat sessions |

### Planned Future Improvements

- [ ] Multi-document support per session
- [ ] OCR for scanned PDFs
- [ ] Hindi and regional language support
- [ ] Export answers as PDF summary report
- [ ] User authentication and document history
- [ ] Persistent vector storage solution
- [ ] Chat history persistence
- [ ] Document comparison feature (compare two financial documents)

---

## Appendix A: Dependency List

### Python Dependencies (`requirements.txt`)

| Package | Purpose |
|---|---|
| `langchain` | Core LLM orchestration framework |
| `langchain-classic` | Legacy chain types (retrieval chain, stuff documents) |
| `langchain-google-genai` | Google Gemini LLM and embeddings integration |
| `langchain-chroma` | ChromaDB vector store adapter for LangChain |
| `langchain-text-splitters` | Text chunking utilities |
| `langchain-core` | Core abstractions (prompts, documents, etc.) |
| `chromadb` | Vector database for embedding storage and retrieval |
| `pypdf` | PDF text extraction library |
| `flask` | Lightweight Python web framework |
| `flask-cors` | CORS middleware for Flask |
| `python-dotenv` | Load environment variables from `.env` files |

### Node.js Dependencies (`package.json`)

**Runtime:**

| Package | Version | Purpose |
|---|---|---|
| `react` | 19.2.4 | UI component library |
| `react-dom` | 19.2.4 | React DOM renderer |
| `axios` | 1.13.6 | HTTP client |
| `react-markdown` | 10.1.0 | Markdown rendering |

**Dev:**

| Package | Version | Purpose |
|---|---|---|
| `vite` | 8.0.1 | Build tool and dev server |
| `@vitejs/plugin-react` | 6.0.1 | React support for Vite |
| `eslint` | 9.39.4 | JavaScript linter |
| `@eslint/js` | 9.39.4 | ESLint core rules |
| `eslint-plugin-react-hooks` | 7.0.1 | React Hooks linting rules |
| `eslint-plugin-react-refresh` | 0.5.2 | React Fast Refresh linting |
| `globals` | 17.4.0 | Global variable definitions |
| `@types/react` | 19.2.14 | React type definitions |
| `@types/react-dom` | 19.2.3 | ReactDOM type definitions |

---

## Appendix B: LLM Prompt Template

The system prompt used to instruct Gemini 2.5 Flash:

```
You are a financial document assistant helping users understand 
complex financial documents in plain English.

Use the following context from the document to answer the question.
If the answer is not in the context, say 'I could not find this information 
in the uploaded document.'

Always structure your response like this:

### [Short Answer Header]
A one-line direct answer to the question.

**Key Points:**
• Point one
• Point two
• Point three (only include points that are relevant)

**From the Document:**
Cite the specific section or clause where you found this information.

Keep answers clear, concise and in plain English. Avoid legal jargon.

Context: {context}
```

---

*This documentation was generated from a complete analysis of the FinLit Q&A codebase.*
