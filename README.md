# PolicyPal

Upload policy documents (HR, health, life, term, car insurance and more) and get answers that
cite the document and page they came from.

**Status: work in progress.** Accounts, document upload to Google Cloud Storage, and text
extraction work today. Chunking, embeddings, search and the chat itself are still being built.

## What works today

- Register, log in, and view your profile (JWT bearer tokens)
- Upload PDF, Word (.docx), text (.txt) and Markdown (.md) files, each kept private to its owner
- Background text extraction page by page; status moves `uploaded` -> `processing` -> `ready` or `failed`
- Documents page with live status, delete, and a collapsible sidebar

## What you need installed

| Tool | Version | Used for |
|---|---|---|
| Python | 3.15 (developed on 3.15.2) | Backend |
| Node.js | 22 or newer | Frontend |
| PostgreSQL | 16 | Database (Docker or Homebrew, see step 3) |
| Git | any recent | |
| A Google Cloud project | free tier is enough | File storage (step 4) |

## 1. Get the code

```bash
git clone git@github.com:indharsh/PolicyPal.git
cd PolicyPal
```

## 2. Backend: Python environment

```bash
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Always activate the venv before running backend commands.

## 3. Database

Pick one.

**Option A: Docker (recommended)**

```bash
docker run -d --name policypal-db \
  -e POSTGRES_USER=policypal \
  -e POSTGRES_PASSWORD=choose-a-password \
  -e POSTGRES_DB=policypal \
  -p 5432:5432 \
  -v policypal_pgdata:/var/lib/postgresql/data \
  postgres:16
```

Later: `docker stop policypal-db` and `docker start policypal-db`. Your data lives in the
`policypal_pgdata` volume and survives restarts.

**Option B: Homebrew (macOS)**

```bash
brew install postgresql@16
brew services start postgresql@16
psql postgres -c "CREATE USER policypal WITH PASSWORD 'choose-a-password';"
createdb -O policypal policypal
```

The database name must be lowercase (`policypal`), because Postgres lowercases unquoted names.

## 4. Google Cloud Storage (your own bucket)

Uploaded files are stored in Google Cloud Storage, not on disk. Each developer should use their
own bucket so test uploads and deletes never touch each other.

1. In the Google Cloud console, create a bucket, for example `policypal-dev-<yourname>`.
2. Create a service account named `policypal-app`.
3. On the bucket's Permissions tab, grant that service account the **Storage Object User** role.
   Grant it on the bucket only, not the whole project.
4. In the service account's Keys tab, create a JSON key. Save it **outside** the project, for
   example `~/.gcp/policypal-sa.json`. Never commit it and never send it over chat or email.

## 5. Backend settings

Create a file named `.env` in the project root (it is git-ignored):

```env
DATABASE_URL=postgresql://policypal:choose-a-password@localhost:5432/policypal
SECRET_KEY=<generate one, see below>
GCS_BUCKET_NAME=policypal-dev-<yourname>
GCP_PROJECT_ID=<your google cloud project id>
GOOGLE_CREDENTIALS_FILE=~/.gcp/policypal-sa.json
```

Generate a secret key:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

If your database password contains special characters, URL-encode them in `DATABASE_URL`
(for example `@` becomes `%40`).

The app refuses to start if a required setting is missing or the bucket cannot be reached.

## 6. Create the tables

```bash
alembic upgrade head
```

This applies every migration in `alembic/versions/` to your empty database.

## 7. Run the backend

```bash
uvicorn app.main:app --reload
```

- API docs: http://localhost:8000/docs
- Database check: http://localhost:8000/health/db

## 8. Run the frontend

In a second terminal:

```bash
cd frontend
npm install
echo "VITE_API_URL=http://localhost:8000/api/v1" > .env
npm run dev
```

Open http://localhost:5173

## 9. Check that it works

1. Register a new account on the sign-up page, then log in.
2. Open **Documents**, choose a category and upload a PDF or Word file.
3. The status should change from Uploaded to Processing to Ready within a few seconds.
4. The file should appear in your Cloud Storage bucket under `<user_id>/`.

## Project layout

```
app/
  main.py          FastAPI app, CORS, startup storage check
  core/            config, database, security (hashing, JWT), auth dependency, file types, storage
  models/          SQLAlchemy tables: users, user_document, document_page
  schemas/         Pydantic request/response models
  routes/          auth.py and documents.py endpoints
  services/        extractors.py (read each file type), pipeline.py (background processing)
alembic/           database migrations
frontend/src/      React app (pages, components, API helpers, auth and documents context)
```

## Common problems

| Symptom | Cause and fix |
|---|---|
| `database "..." does not exist` | The name in `DATABASE_URL` must match the lowercase database you created |
| `password authentication failed` or a URL parsing error | Special characters in the password must be URL-encoded |
| `ModuleNotFoundError: No module named 'exceptions'` | The wrong `docx` package is installed. Run `pip uninstall -y docx python-docx` then `pip install python-docx` |
| `Cannot access bucket ...` on startup | Check `GCS_BUCKET_NAME`, `GCP_PROJECT_ID`, the key path, and that the service account has Storage Object User on that bucket |
| Table or column missing | Run `alembic upgrade head` again |
| Browser shows "Cannot reach the server" | The backend is not running, or `VITE_API_URL` is wrong |

## Working together

- Never commit `.env`, key files, or real customer documents. `.gitignore` covers the usual
  cases, but check `git status` before every commit.
- Work on a branch and open a pull request instead of pushing to `main`.
- If two people each create an Alembic migration from the same starting point, Alembic ends up
  with two heads and `alembic upgrade head` fails. Fix it with `alembic merge`. Tell each other
  before changing a database model.
- Share secrets (keys, API tokens) through a password manager, not through git or chat.
