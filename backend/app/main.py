from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session

from app.api.main import api_router
from app.core.config import settings
from app.core.db import init_db
from app.core.db import engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    with Session(engine) as session:
        init_db(session=session)
    yield


app = FastAPI(title="Task Manager", lifespan=lifespan)

if settings.cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins(),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_router, prefix="/api/v1")
