"""
Database models for favorites
"""
from sqlalchemy import Column, Integer, String, DateTime, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

# Database setup
DATABASE_PATH = os.path.join(os.path.dirname(__file__), "..", "favorites.db")
DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class FavoriteProject(Base):
    """Favorite projects table"""
    __tablename__ = "favorite_projects"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, unique=True, nullable=False, index=True)
    project_name = Column(String, nullable=False)
    project_slug = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class FavoriteUserStory(Base):
    """Favorite user stories table"""
    __tablename__ = "favorite_user_stories"

    id = Column(Integer, primary_key=True, index=True)
    user_story_id = Column(Integer, unique=True, nullable=False, index=True)
    user_story_ref = Column(Integer, nullable=False)
    user_story_subject = Column(String, nullable=False)
    project_id = Column(Integer, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)


def init_db():
    """Initialize database and create tables"""
    Base.metadata.create_all(bind=engine)


def get_db():
    """Database session dependency"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
