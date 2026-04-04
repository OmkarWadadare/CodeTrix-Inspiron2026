from fastapi import FastAPI
from app.api.routes import router as api_router
from app.db.database import init_db
from dotenv import load_dotenv

load_dotenv()
init_db()

app = FastAPI(title="AI Translation Studio")
app.include_router(api_router, prefix="/api")

@app.get("/")
def home():
    return {"message": "Translation Engine Online"}