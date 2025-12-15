"""
Favorites API Routes
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db, FavoriteProject, FavoriteUserStory


router = APIRouter()


class FavoriteProjectCreate(BaseModel):
    project_id: int
    project_name: str
    project_slug: str


class FavoriteProjectResponse(BaseModel):
    id: int
    project_id: int
    project_name: str
    project_slug: str

    class Config:
        from_attributes = True


class FavoriteUserStoryCreate(BaseModel):
    user_story_id: int
    user_story_ref: int
    user_story_subject: str
    project_id: int


class FavoriteUserStoryResponse(BaseModel):
    id: int
    user_story_id: int
    user_story_ref: int
    user_story_subject: str
    project_id: int

    class Config:
        from_attributes = True


# Project favorites
@router.get("/favorites/projects", response_model=List[FavoriteProjectResponse])
def get_favorite_projects(db: Session = Depends(get_db)):
    """Get all favorite projects"""
    favorites = db.query(FavoriteProject).order_by(FavoriteProject.created_at.desc()).all()
    return favorites


@router.post("/favorites/projects", response_model=FavoriteProjectResponse)
def add_favorite_project(favorite: FavoriteProjectCreate, db: Session = Depends(get_db)):
    """Add a project to favorites"""
    # Check if already exists
    existing = db.query(FavoriteProject).filter(
        FavoriteProject.project_id == favorite.project_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Project already in favorites")
    
    db_favorite = FavoriteProject(
        project_id=favorite.project_id,
        project_name=favorite.project_name,
        project_slug=favorite.project_slug
    )
    db.add(db_favorite)
    db.commit()
    db.refresh(db_favorite)
    return db_favorite


@router.delete("/favorites/projects/{project_id}")
def remove_favorite_project(project_id: int, db: Session = Depends(get_db)):
    """Remove a project from favorites"""
    favorite = db.query(FavoriteProject).filter(
        FavoriteProject.project_id == project_id
    ).first()
    
    if not favorite:
        raise HTTPException(status_code=404, detail="Project not in favorites")
    
    db.delete(favorite)
    db.commit()
    return {"success": True, "message": "Project removed from favorites"}


# User story favorites
@router.get("/favorites/userstories", response_model=List[FavoriteUserStoryResponse])
def get_favorite_user_stories(project_id: int = None, db: Session = Depends(get_db)):
    """Get all favorite user stories, optionally filtered by project"""
    query = db.query(FavoriteUserStory)
    
    if project_id:
        query = query.filter(FavoriteUserStory.project_id == project_id)
    
    favorites = query.order_by(FavoriteUserStory.created_at.desc()).all()
    return favorites


@router.post("/favorites/userstories", response_model=FavoriteUserStoryResponse)
def add_favorite_user_story(favorite: FavoriteUserStoryCreate, db: Session = Depends(get_db)):
    """Add a user story to favorites"""
    # Check if already exists
    existing = db.query(FavoriteUserStory).filter(
        FavoriteUserStory.user_story_id == favorite.user_story_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="User story already in favorites")
    
    db_favorite = FavoriteUserStory(
        user_story_id=favorite.user_story_id,
        user_story_ref=favorite.user_story_ref,
        user_story_subject=favorite.user_story_subject,
        project_id=favorite.project_id
    )
    db.add(db_favorite)
    db.commit()
    db.refresh(db_favorite)
    return db_favorite


@router.delete("/favorites/userstories/{user_story_id}")
def remove_favorite_user_story(user_story_id: int, db: Session = Depends(get_db)):
    """Remove a user story from favorites"""
    favorite = db.query(FavoriteUserStory).filter(
        FavoriteUserStory.user_story_id == user_story_id
    ).first()
    
    if not favorite:
        raise HTTPException(status_code=404, detail="User story not in favorites")
    
    db.delete(favorite)
    db.commit()
    return {"success": True, "message": "User story removed from favorites"}
