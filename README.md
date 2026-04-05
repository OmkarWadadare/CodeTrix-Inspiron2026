# AI Translation Studio

# TEAM ID: 260103

# TEAM NAME: CODETRIX

# MEMBERS: OMKAR WADADARE   |   TEJASWINI BISTA   |   ARWA SALUJIWALA
> An intelligent, enterprise-grade translation platform that validates source quality, leverages RAG-based translation memory, enforces glossaries and style via LLMs, and continuously learns from every approved translation.

---

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Bonus Features](#bonus-features)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Organizations operating across multilingual markets struggle with fragmented, inefficient translation workflows. Linguists re-translate identical content due to the absence of centralized translation memory. Source documents propagate spelling errors, inconsistent formatting, and punctuation issues into every target language.

**Translation Studio** solves this by combining:
- AI-powered source quality validation
- RAG-based Translation Memory (TM) for segment reuse
- LLM translation with glossary and style enforcement
- Structured proofreading, approval workflows, and a continuous learning loop

---

## Problem Statement

| Problem | Impact |
|---|---|
| Inconsistent Terminology | `"PM"` vs `"P.M."` vs `"p.m."` causes compliance risk and confusion |
| No Translation Reuse | Linguists re-translate approved content, wasting time and introducing variation |
| Source Quality Issues | Errors in source documents multiply across every target language |
| Disconnected Workflows | Translation, proofreading, approval, and dictionary updates exist in separate tools with no unified audit trail |
| No Continuous Learning | Translation models and glossaries remain static |

---

## Key Features

### 1. Document Upload & Parsing
- Accept **PDF** and **DOCX** files
- Extract translatable content while preserving structure: headings, tables, lists, footnotes
- Segment source text at sentence and phrase level for TM alignment

### 2. Source Quality Validation Engine
- **Spell Check**: Context-aware, domain-specific terminology support
- **Consistency Analysis**: Flag terminology and formatting variations within the same document
- **Punctuation & Grammar Validation**: Missing spaces, double spaces, inconsistent comma usage
- **Formatting Checks**: Date formats, number formats, capitalization patterns
- **Visual Issue Dashboard**: Severity classification (`Critical`, `Warning`, `Info`) with batch AI-fix suggestions

### 3. Translation Memory (TM) & RAG Pipeline
- Stores every approved source–target pair at sentence and phrase level
- **Vector similarity search** for:
  - **Exact Match (100%)**: Auto-fill without LLM call
  - **Fuzzy Match (75–99%)**: Surface suggestions with context-aware adaptation
  - **New Segment (<75%)**: Route to LLM for translation
- Customizable match thresholds per project
- TM versioning with rollback support

### 4. LLM-Powered Translation
- Translate new segments using a Large Language Model
- Supported target languages include: **Spanish, French, German, Japanese**, and more
- Glossary and style profile constraints injected into every prompt
- Structured outputs for reliable segment-level results

### 5. Glossary & Terminology Management
- Language-pair glossaries: source term, target term, context notes
- **Import/Export**: Standard TBX format for CAT tool interoperability
- Glossary enforcement during translation with grammatical context adaptation
- Conflict detection and auto-suggest from approved translations

### 6. Style Rules & Tone Profiles
- **Tone options**: `Formal`, `Official`, `Conversational`, `Technical`, `Social`, `Friendly`, `Diplomatic`
- **Style rules**: Predefined (punctuation, capitalization, numbers) and custom free-text rules
- **Style profiles**: Bundle glossaries, style rules, and TMs into reusable configurations per team or project
- AI-generated style rules from sample brand text

### 7. Proofreading & Approval Workflow
- **Side-by-side editor**: Source vs. AI translation, with per-segment `Accept` / `Edit` / `Reject` actions
- Multi-level approval workflow (linguist → senior reviewer → project manager)
- Full audit trail with timestamped change history

### 8. Continuous Learning Loop
- On segment approval:
  - TM updated with new source–target pair
  - Glossary enriched from accepted terminology
  - Corrections batched for incremental LLM fine-tuning
- **Bulk Training**: Import existing bilingual document pairs to seed TM and fine-tune the LLM

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Web UI                           │
│  Upload │ Validate │ Review │ Glossary │ Style │ Train  │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                    API Gateway / Backend                 │
│                                                         │
│  ┌──────────────┐   ┌──────────────┐  ┌─────────────┐  │
│  │  Doc Parser  │   │  Validator   │  │  TM Engine  │  │
│  │ (PDF/DOCX)   │   │  (QA Rules)  │  │  (RAG/Vec)  │  │
│  └──────────────┘   └──────────────┘  └──────┬──────┘  │
│                                              │          │
│  ┌──────────────┐   ┌──────────────┐  ┌──────▼──────┐  │
│  │  Glossary &  │   │  Style/Tone  │  │     LLM     │  │
│  │  Term Mgmt   │──▶│   Profiles   │─▶│  Translator │  │
│  └──────────────┘   └──────────────┘  └──────┬──────┘  │
│                                              │          │
│  ┌──────────────────────────────────────────▼──────┐   │
│  │          Proofreading & Approval Engine          │   │
│  │    Accept / Edit / Reject → TM Update → Learn   │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
         │                    │                  │
   ┌─────▼────┐        ┌──────▼─────┐    ┌──────▼──────┐
   │ Vector DB │        │  Relational│    │  Object     │
   │(Embeddings│        │    DB      │    │  Storage    │
   │   / TM)  │        │(Glossary,  │    │ (Docs,      │
   └──────────┘        │ Audit Log) │    │  Exports)   │
                       └────────────┘    └─────────────┘
```

### RAG Pipeline Flow

```
Source Document
      │
      ▼
Segmentation (sentence/phrase)
      │
      ▼
Embedding Generation
      │
      ▼
Vector Search → TM
      │
      ├── Exact Match (100%) ──────────────▶ Auto-fill
      │
      ├── Fuzzy Match (75–99%) ────────────▶ Suggest + Adapt
      │
      └── New Segment (<75%) ─────────────▶ LLM Translation
                                                  │
                                        Glossary + Style Profile
                                        injected into prompt
```

---

## Tech Stack

> Recommendations only — not mandatory. Swap components as needed.

| Layer | Recommended Options |
|---|---|
| **Frontend** | React / Next.js, TailwindCSS |
| **Backend** | FastAPI (Python) or Node.js (Express / NestJS) |
| **LLM** | Anthropic Claude API, OpenAI, or self-hosted (Ollama) |
| **Vector DB** | Pinecone, Weaviate, Qdrant, or pgvector |
| **Relational DB** | PostgreSQL |
| **Object Storage** | AWS S3, GCS, or MinIO |
| **Embeddings** | OpenAI `text-embedding-3-small`, Cohere, or local models |
| **Document Parsing** | `pdfplumber` / `PyMuPDF` for PDF; `python-docx` for DOCX |
| **Glossary Format** | TBX (TermBase eXchange) |
| **CAT Interop** | TMX, XLIFF, TBX import/export |

---

## Getting Started

### Prerequisites

- Node.js ≥ 18 or Python ≥ 3.10
- PostgreSQL ≥ 14
- A running vector database instance (e.g., Qdrant, Pinecone)
- LLM API key (Anthropic, OpenAI, etc.)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/translation-studio.git
cd translation-studio

# Backend setup
cd backend
pip install -r requirements.txt
cp .env.example .env  # Fill in your configuration

# Frontend setup
cd ../frontend
npm install
cp .env.example .env.local
```

### Running Locally

```bash
# Start backend
cd backend
uvicorn main:app --reload --port 8000

# Start frontend
cd frontend
npm run dev
```

The UI will be available at `http://localhost:3000`.

---

## Configuration

All configuration is managed via environment variables.

```env
# LLM
LLM_PROVIDER=anthropic              # anthropic | openai | ollama
LLM_API_KEY=your_api_key
LLM_MODEL=claude-sonnet-4-20250514

# Embeddings
EMBEDDING_PROVIDER=openai
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_API_KEY=your_key

# Vector DB
VECTOR_DB_PROVIDER=qdrant           # qdrant | pinecone | weaviate | pgvector
VECTOR_DB_URL=http://localhost:6333
VECTOR_DB_COLLECTION=translation_memory

# Relational DB
DATABASE_URL=postgresql://user:password@localhost:5432/translation_studio

# Object Storage
STORAGE_PROVIDER=s3                 # s3 | gcs | minio
STORAGE_BUCKET=translation-studio-docs
STORAGE_REGION=us-east-1

# Translation Memory
TM_EXACT_MATCH_THRESHOLD=1.0
TM_FUZZY_MATCH_THRESHOLD=0.75
```

---

## Usage

### 1. Upload a Document

Navigate to **Projects → New Project → Upload Document**. Supported formats: `.pdf`, `.docx`.

### 2. Run Source Validation

The validation engine will automatically scan the uploaded document and present:
- A severity-classified issue dashboard
- One-click AI-assisted batch fixes
- Manual override for each flagged segment

### 3. Configure Style & Glossary

Before translation:
- Select or create a **Tone Profile** (e.g., `Technical`, `Formal`)
- Assign or create a **Glossary** for the target language pair
- Optionally bundle both into a reusable **Style Profile**

### 4. Translate

Click **Translate**. The RAG pipeline will:
1. Match segments against the TM
2. Auto-fill exact matches
3. Surface fuzzy suggestions
4. Send unmatched segments to the LLM with your glossary and style constraints

### 5. Proofread & Approve

Open the **Review Editor** for a side-by-side view:
- **Accept**: Approve the AI translation and update TM
- **Edit**: Modify the translation, then accept
- **Reject**: Flag for re-translation or escalation

### 6. Export

Export the translated document in the original format (PDF/DOCX) with layout preserved.

---

## API Reference

All endpoints are available under `/api/v1/`.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/documents/upload` | Upload a source document |
| `POST` | `/documents/{id}/validate` | Run source quality validation |
| `POST` | `/documents/{id}/translate` | Trigger RAG + LLM translation pipeline |
| `GET` | `/documents/{id}/segments` | Retrieve all segments with TM match status |
| `PATCH` | `/segments/{id}/approve` | Approve a segment (updates TM) |
| `PATCH` | `/segments/{id}/edit` | Edit and approve a segment |
| `GET` | `/glossary` | List glossary entries |
| `POST` | `/glossary` | Create a new glossary entry |
| `POST` | `/glossary/import` | Import glossary from TBX file |
| `GET` | `/glossary/export` | Export glossary as TBX |
| `GET` | `/style-profiles` | List style profiles |
| `POST` | `/style-profiles` | Create a style profile |
| `GET` | `/tm/search` | Search translation memory |
| `POST` | `/tm/import` | Bulk-import bilingual pairs to TM |
| `GET` | `/analytics` | Retrieve TM leverage, productivity, cost metrics |

Full OpenAPI spec available at `http://localhost:8000/docs` when running locally.

---

## Bonus Features

| Feature | Description |
|---|---|
| **Source Document Improvement** | AI grammar correction, paraphrasing, and clarity enhancement before translation |
| **Format-Preserved Export** | Translated PDF/DOCX with original layout intact |
| **Real-Time Collaboration** | Multiple linguists working on the same document simultaneously |
| **CAT Tool Interoperability** | Import/export TMX, XLIFF, and TBX files |
| **Post-Translation QA** | Tag consistency, number accuracy, length validation, cross-document consistency |
| **Analytics Dashboard** | TM leverage rate, linguist productivity, quality trends, cost savings estimator |
| **Back-Translation Verification** | Translate output back to source for quick quality check |
| **REST API / CI-CD Integration** | Automate translation workflows in your deployment pipeline |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m "feat: describe your change"`
4. Push and open a Pull Request

Please follow [Conventional Commits](https://www.conventionalcommits.org/) and ensure all tests pass before submitting.

---

## License

This project is licensed under the [MIT License](LICENSE).
