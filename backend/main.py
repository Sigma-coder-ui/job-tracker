import os
from datetime import date
from typing import Optional
from fastapi import Depends, FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

import models, schemas
from auth import create_token, get_current_user, hash_password, verify_password
from database import Base, engine, get_db

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Job Tracker API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("FRONTEND_URL", "http://localhost:3000").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def health():
    return {"status": "ok", "docs": "/docs"}


# ---------- Auth ----------
@app.post("/auth/register", response_model=schemas.Token, status_code=201)
def register(data: schemas.UserCreate, db: Session = Depends(get_db)):
    email = data.email.strip().lower()
    if db.query(models.User).filter_by(email=email).first():
        raise HTTPException(400, "This email is already registered.")
    user = models.User(email=email, hashed_password=hash_password(data.password))
    db.add(user)
    db.commit()
    return {"access_token": create_token(user.id)}


@app.post("/auth/login", response_model=schemas.Token)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter_by(email=form.username.strip().lower()).first()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(401, "Wrong email or password.")
    return {"access_token": create_token(user.id)}


# ---------- Jobs ----------
def own_job(job_id: int, db: Session, user: models.User) -> models.Job:
    job = db.query(models.Job).filter_by(id=job_id, owner_id=user.id).first()
    if not job:
        raise HTTPException(404, "Job not found.")
    return job


@app.get("/jobs", response_model=list[schemas.JobOut])
def list_jobs(
    q: Optional[str] = None,
    status: Optional[schemas.Status] = None,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    query = db.query(models.Job).filter_by(owner_id=user.id)
    if status:
        query = query.filter(models.Job.status == status)
    if q:
        like = f"%{q}%"
        query = query.filter(or_(models.Job.company.ilike(like), models.Job.role.ilike(like)))
    return query.order_by(models.Job.applied_date.desc(), models.Job.id.desc()).all()


@app.get("/jobs/stats")
def job_stats(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    rows = (
        db.query(models.Job.status, func.count())
        .filter_by(owner_id=user.id)
        .group_by(models.Job.status)
        .all()
    )
    stats = {"Applied": 0, "Interview": 0, "Offer": 0, "Rejected": 0}
    stats.update(dict(rows))
    stats["Total"] = sum(stats.values())
    return stats


@app.post("/jobs", response_model=schemas.JobOut, status_code=201)
def create_job(
    data: schemas.JobCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    values = data.model_dump()
    values["applied_date"] = values["applied_date"] or date.today()
    job = models.Job(**values, owner_id=user.id)
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


@app.put("/jobs/{job_id}", response_model=schemas.JobOut)
def update_job(
    job_id: int,
    data: schemas.JobUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    job = own_job(job_id, db, user)
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(job, key, value)
    db.commit()
    db.refresh(job)
    return job


@app.delete("/jobs/{job_id}", status_code=204)
def delete_job(
    job_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    db.delete(own_job(job_id, db, user))
    db.commit()
    return Response(status_code=204)
