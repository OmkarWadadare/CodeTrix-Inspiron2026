from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router as api_router
from app.db.database import init_db, ensure_org_tables
from dotenv import load_dotenv

load_dotenv()
init_db()
ensure_org_tables()

app = FastAPI(title="AI Translation Studio")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router, prefix="/api")

@app.get("/")
def home():
    return {"message": "Translation Engine Online"}