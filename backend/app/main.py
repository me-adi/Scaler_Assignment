"""FastAPI application entrypoint.

Feature routers are registered under `/api/v1` as they get built out
(see `app/routers/`). For now only the health check is wired up.
"""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import bookings, listings, reviews, users, wishlist

API_V1_PREFIX = "/api/v1"

# Comma-separated in production (e.g. a Vercel deployment + its preview
# URLs); defaults to the local Next.js dev server so nothing needs to
# change for local development. See README's deployment checklist.
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get("CORS_ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]

app = FastAPI(
    title="Airbnb Clone API",
    version="0.1.0",
    docs_url="/docs",
    openapi_url=f"{API_V1_PREFIX}/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root() -> dict[str, str]:
    return {"service": "airbnb-clone-api", "docs": "/docs"}


@app.get(f"{API_V1_PREFIX}/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(listings.router, prefix=API_V1_PREFIX)
app.include_router(listings.amenities_router, prefix=API_V1_PREFIX)
app.include_router(bookings.router, prefix=API_V1_PREFIX)
app.include_router(reviews.router, prefix=API_V1_PREFIX)
app.include_router(wishlist.router, prefix=API_V1_PREFIX)
app.include_router(users.router, prefix=API_V1_PREFIX)
