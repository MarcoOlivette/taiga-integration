"""
Integration test for Favorites SQLite functionality
Tests: Add favorites -> Verify in DB -> Retrieve from API -> Delete -> Verify removal
"""
import pytest
import os
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.database import get_db, FavoriteProject, FavoriteUserStory, SessionLocal
from main import app


@pytest.fixture(scope="module")
def client():
    """Create test client"""
    return TestClient(app)


@pytest.fixture(scope="function")
def db_session():
    """Create database session for direct DB verification"""
    db = SessionLocal()
    yield db
    db.close()


class TestFavoritesIntegration:
    """Test SQLite favorites persistence and API"""
    
    def test_01_add_favorite_project(self, client, db_session):
        """Test adding a project to favorites"""
        response = client.post(
            "/api/favorites/projects",
            json={
                "project_id": 367,
                "project_name": "Test Project",
                "project_slug": "test-project"
            }
        )
        
        assert response.status_code == 200, f"Failed to add favorite: {response.text}"
        data = response.json()
        
        assert data["project_id"] == 367
        assert data["project_name"] == "Test Project"
        assert data["project_slug"] == "test-project"
        assert data["id"] is not None
        
        # Verify in database directly
        db_favorite = db_session.query(FavoriteProject).filter(
            FavoriteProject.project_id == 367
        ).first()
        
        assert db_favorite is not None, "Favorite project not found in database"
        assert db_favorite.project_name == "Test Project"
        
        # Store for next tests
        pytest.favorite_project_id = data["id"]
        
        print(f"\n✅ Added favorite project (ID: {pytest.favorite_project_id})")
        print(f"   Verified in SQLite database")
    
    def test_02_get_favorite_projects(self, client):
        """Test retrieving favorite projects from API"""
        response = client.get("/api/favorites/projects")
        
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list), "Should return a list"
        assert len(data) > 0, "Should have at least one favorite"
        
        # Find our test project
        test_project = next((p for p in data if p["project_id"] == 367), None)
        assert test_project is not None, "Test project not found in favorites list"
        assert test_project["project_name"] == "Test Project"
        
        print(f"\n✅ Retrieved {len(data)} favorite project(s) from API")
        print(f"   Found test project in list")
    
    def test_03_add_favorite_user_story(self, client, db_session):
        """Test adding a user story to favorites"""
        response = client.post(
            "/api/favorites/userstories",
            json={
                "user_story_id": 99999,
                "user_story_ref": 1234,
                "user_story_subject": "Test User Story for Favorites",
                "project_id": 367
            }
        )
        
        assert response.status_code == 200, f"Failed to add favorite: {response.text}"
        data = response.json()
        
        assert data["user_story_id"] == 99999
        assert data["user_story_ref"] == 1234
        assert data["user_story_subject"] == "Test User Story for Favorites"
        assert data["project_id"] == 367
        
        # Verify in database directly
        db_favorite = db_session.query(FavoriteUserStory).filter(
            FavoriteUserStory.user_story_id == 99999
        ).first()
        
        assert db_favorite is not None, "Favorite user story not found in database"
        assert db_favorite.user_story_subject == "Test User Story for Favorites"
        
        # Store for next tests
        pytest.favorite_us_id = data["id"]
        
        print(f"\n✅ Added favorite user story (ID: {pytest.favorite_us_id})")
        print(f"   Verified in SQLite database")
    
    def test_04_get_favorite_user_stories_all(self, client):
        """Test retrieving all favorite user stories"""
        response = client.get("/api/favorites/userstories")
        
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list), "Should return a list"
        assert len(data) > 0, "Should have at least one favorite"
        
        # Find our test user story
        test_us = next((us for us in data if us["user_story_id"] == 99999), None)
        assert test_us is not None, "Test user story not found in favorites list"
        assert test_us["user_story_subject"] == "Test User Story for Favorites"
        
        print(f"\n✅ Retrieved {len(data)} favorite user stor(ies) from API")
    
    def test_05_get_favorite_user_stories_filtered(self, client):
        """Test retrieving favorite user stories filtered by project"""
        response = client.get("/api/favorites/userstories?project_id=367")
        
        assert response.status_code == 200
        data = response.json()
        
        # All returned stories should be from project 367
        for us in data:
            assert us["project_id"] == 367, f"Found US from wrong project: {us['project_id']}"
        
        print(f"\n✅ Retrieved {len(data)} favorite(s) for project 367")
    
    def test_06_prevent_duplicate_project(self, client):
        """Test that adding duplicate project returns error"""
        response = client.post(
            "/api/favorites/projects",
            json={
                "project_id": 367,
                "project_name": "Test Project",
                "project_slug": "test-project"
            }
        )
        
        assert response.status_code == 400, "Should prevent duplicate favorites"
        assert "already in favorites" in response.json()["detail"].lower()
        
        print(f"\n✅ Correctly prevented duplicate project favorite")
    
    def test_07_prevent_duplicate_user_story(self, client):
        """Test that adding duplicate user story returns error"""
        response = client.post(
            "/api/favorites/userstories",
            json={
                "user_story_id": 99999,
                "user_story_ref": 1234,
                "user_story_subject": "Test User Story for Favorites",
                "project_id": 367
            }
        )
        
        assert response.status_code == 400, "Should prevent duplicate favorites"
        assert "already in favorites" in response.json()["detail"].lower()
        
        print(f"\n✅ Correctly prevented duplicate user story favorite")
    
    def test_08_remove_favorite_user_story(self, client, db_session):
        """Test removing a user story from favorites"""
        assert hasattr(pytest, 'favorite_us_id'), "User story favorite must exist"
        
        response = client.delete(f"/api/favorites/userstories/99999")
        
        assert response.status_code == 200
        assert response.json()["success"] is True
        
        # Verify removed from database
        db_favorite = db_session.query(FavoriteUserStory).filter(
            FavoriteUserStory.user_story_id == 99999
        ).first()
        
        assert db_favorite is None, "Favorite should be removed from database"
        
        print(f"\n✅ Removed favorite user story")
        print(f"   Verified removal from SQLite database")
    
    def test_09_remove_favorite_project(self, client, db_session):
        """Test removing a project from favorites"""
        assert hasattr(pytest, 'favorite_project_id'), "Project favorite must exist"
        
        response = client.delete(f"/api/favorites/projects/367")
        
        assert response.status_code == 200
        assert response.json()["success"] is True
        
        # Verify removed from database
        db_favorite = db_session.query(FavoriteProject).filter(
            FavoriteProject.project_id == 367
        ).first()
        
        assert db_favorite is None, "Favorite should be removed from database"
        
        print(f"\n✅ Removed favorite project")
        print(f"   Verified removal from SQLite database")
    
    def test_10_verify_persistence_after_restart(self, client, db_session):
        """Test that favorites persist after simulated restart"""
        # Add a new favorite
        client.post(
            "/api/favorites/projects",
            json={
                "project_id": 999,
                "project_name": "Persistence Test",
                "project_slug": "persistence-test"
            }
        )
        
        # Simulate "restart" by creating a new database session
        new_db = SessionLocal()
        
        # Check if favorite still exists in database
        favorite = new_db.query(FavoriteProject).filter(
            FavoriteProject.project_id == 999
        ).first()
        
        assert favorite is not None, "Favorite should persist across sessions"
        assert favorite.project_name == "Persistence Test"
        
        # Cleanup
        client.delete("/api/favorites/projects/999")
        new_db.close()
        
        print(f"\n✅ Verified persistence across database sessions")
        print(f"\n🎉 ALL FAVORITES TESTS COMPLETED SUCCESSFULLY!")
