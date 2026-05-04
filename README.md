# FinLit Q&A 📄🤖

A RAG-based (Retrieval-Augmented Generation) web application that enables users to upload financial documents and query them in plain English — breaking down complex financial language into simple, accessible answers.

---

## 🎯 Problem Statement

Financial documents like loan agreements, tax forms, and insurance policies are often filled with complex legal and financial jargon that is difficult for the average person to understand. FinLit Q&A bridges this gap by allowing users to ask plain-language questions and get accurate, cited answers directly from their documents.

---

## 🚀 Features

- 📤 **PDF Upload** — Upload any financial document (loan agreements, tax forms, insurance policies)
- 🔍 **Semantic Search** — Finds the most relevant sections using vector embeddings
- 🤖 **AI-Powered Answers** — Generates plain English responses using Gemini 2.5 Flash
- 📌 **Source Citations** — Every answer includes the exact document chunks it was derived from
- 🛡️ **Hallucination Prevention** — RAG architecture ensures answers are grounded in the uploaded document
- 💬 **Multi-turn Chat** — Ask multiple questions about the same document in one session

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite, Axios |
| Backend | Python, Flask, Flask-CORS |
| AI/LLM | LangChain, Gemini 2.5 Flash |
| Embeddings | Google Generative AI Embeddings (`gemini-embedding-001`) |
| Vector DB | ChromaDB |
| PDF Parsing | pypdf |

---

## 🏗️ Architecture

```
User uploads PDF
      ↓
pypdf extracts text
      ↓
LangChain splits into 500-token chunks (50-token overlap)
      ↓
Gemini Embeddings vectorizes chunks
      ↓
ChromaDB stores vectors on disk
      
         ↑ stored once per upload

User asks a question
      ↓
Gemini Embeddings vectorizes question
      ↓
ChromaDB retrieves 3 most relevant chunks
      ↓
LangChain assembles prompt (chunks + question)
      ↓
Gemini 2.5 Flash generates plain English answer
      ↓
Flask API → React UI → User
```

---

## 📁 Project Structure

```
finlit-qa/
├── backend/
│   ├── app.py              # Flask API endpoints
│   ├── rag.py              # LangChain RAG pipeline
│   ├── .env                # API keys (not committed)
│   ├── requirements.txt    # Python dependencies
│   └── check_models.py     # Checks for recent models
├── frontend/
│   ├── src/
│   │   └── App.jsx         # Main React component
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Python 3.11+
- Node.js 18+
- Google Gemini API Key ([Get one here](https://aistudio.google.com))

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/shishirdhasmana/FinLit.git
cd finlit-qa/backend

# Create and activate virtual environment
python -m venv .venv

# Windows
.venv\Scripts\activate
# Mac/Linux
source .venv/bin/activate

# Install dependencies
python -m pip install -r requirements.txt

# Create .env file
echo GOOGLE_API_KEY=your_api_key_here > .env

# Run the Flask server
python app.py
```

Backend runs at `http://localhost:5000`

### Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

Frontend runs at `http://localhost:5173`

---

## 🔌 API Endpoints

### `POST /upload`
Upload a PDF document for processing.

**Request:** `multipart/form-data` with `file` field

**Response:**
```json
{
  "message": "Document uploaded and processed successfully",
  "session_id": "uuid-here",
  "chunks": 42
}
```

---

### `POST /ask`
Ask a question about an uploaded document.

**Request:**
```json
{
  "session_id": "uuid-here",
  "question": "What is the interest rate on this loan?"
}
```

**Response:**
```json
{
  "answer": "The interest rate on this loan is 8.5% per annum...",
  "sources": [
    "The borrower agrees to pay interest at the rate of 8.5% per annum...",
    "Interest shall be calculated on a monthly reducing balance..."
  ]
}
```

---

### `GET /health`
Health check endpoint.

**Response:**
```json
{ "status": "ok" }
```

---

## 🧪 Testing

Upload any of the following document types to test:
- Loan agreements
- Tax forms
- Insurance policies
- Bank statements

Example questions to try:
- *"What is the interest rate?"*
- *"What happens if I miss a payment?"*
- *"What are the terms of this agreement?"*
- *"What is the total repayment amount?"*

---

## 🔮 Future Improvements

- [ ] Multi-document support per session
- [ ] Support for scanned PDFs via OCR
- [ ] Hindi and regional language support for wider accessibility
- [ ] Export answers as PDF summary report
- [ ] User authentication and document history

---

🔗 **Live Demo:** https://fin-lit-kappa.vercel.app/
🔗 **Backend API:** https://finlit-backend-l1f4.onrender.com

## 👨‍💻 Author

**Shishir Dhasmana**  
B.Tech Computer Science | Graphic Era University  
[GitHub](https://github.com/shishirdhasmana) • [LinkedIn](https://linkedin.com/in/shishirdhasmana)

---

## 📄 License

MIT License — feel free to use and modify.