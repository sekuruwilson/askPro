# AskPro — Ask DHS Intelligence

Ask DHS Intelligence is a citation-first RAG (Retrieval-Augmented Generation) application built for the National Institute of Statistics of Rwanda (NISR) to search demographic, health, and agricultural reports.

---

## Prerequisites

Before running this project on another computer, ensure the following software is installed:

1. **Node.js**: Version 18.x or higher (tested on v24.x)
2. **PostgreSQL**: Version 12.x or higher (tested on v15.x)
3. **pgvector extension**: Required for database vector search support.
   - *Windows*: Download the latest binary from the [pgvector releases](https://github.com/pgvector/pgvector/releases) page or build it. Alternatively, pgvector is included in modern PostgreSQL installations using the Stack Builder or EnterpriseDB installers.
   - *macOS*: Install via Homebrew: `brew install pgvector`
   - *Linux (Ubuntu/Debian)*: Install via `sudo apt-get install postgresql-15-pgvector` (adjust version to match your PostgreSQL server)
4. **OpenAI API Key**: Required for document embeddings and question answering.

---

## Step-by-Step Setup

### 1. Database Setup
1. Launch PostgreSQL and log in using your preferred client (e.g. `psql` or `pgAdmin`).
2. Create a new database named `nisr_askPro`:
   ```sql
   CREATE DATABASE nisr_askPro;
   ```
3. Connect to the database and enable the `pgvector` extension:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
4. Run the schema script against the `nisr_askPro` database to initialize tables:
   ```bash
   # From the project root, using psql CLI:
   psql -U postgres -d nisr_askPro -f backend/db/schema.sql
   ```
   *(Or copy the SQL queries from `backend/db/schema.sql` and run them inside your SQL client).*

### 2. Backend Setup
1. Open a terminal and navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Install the Node dependencies:
   ```bash
   npm install
   ```
3. Configure the environment variables:
   - Copy `.env.example` to create a new `.env` file:
     ```bash
     cp .env.example .env
     ```
   - Open `.env` and fill in your details:
     - `OPENAI_API_KEY`: Paste your OpenAI API key.
     - `DATABASE_URL`: Adjust the connection string if your PostgreSQL username/password is different (e.g., `postgresql://postgres:YOUR_PASSWORD@localhost:5432/nisr_askPro`).

### 3. Frontend Setup
1. Open a new terminal and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```

---

## Running the Application

### 1. Start the Backend Server
From the `backend/` directory, run:
```bash
npm run dev
```
The server will start at `http://localhost:3001` and verify the PostgreSQL connection.

### 2. Start the Frontend Server
From the `frontend/` directory, run:
```bash
npm run dev
```
The client application will start at `http://localhost:5173`. Open this URL in your web browser.

---

## Project Structure
- **/backend**: Express API server, routes for documents and chats, schema, vector database configurations, and LLM orchestration.
- **/frontend**: React client built with Vite, Tailwind CSS, React Query, and Lucide React.
