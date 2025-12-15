"""
Integration test for Favorites SQLite functionality
Tests against running server at http://localhost:3000
"""
import requests
import pytest


BASE_URL = "http://localhost:3000/api"


class TestFavoritesIntegration:
    """Test SQLite favorites persistence and API"""
    
    def test_01_add_favorite_project(self):
        """Test adding a project to favorites"""
        response = requests.post(
            f"{BASE_URL}/favorites/projects",
            json={
                "project_id": 367,
                "project_name": "Test Project",
                "project_slug": "test-project"
            }
        )
        
        # Clean up first if it exists
        if response.status_code == 400:
            requests.delete(f"{BASE_URL}/favorites/projects/367")
            response = requests.post(
                f"{BASE_URL}/favorites/projects",
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
        
        print(f"\n✅ Added favorite project (ID: {data['id']})")
    
    def test_02_get_favorite_projects(self):
        """Test retrieving favorite projects from API"""
        response = requests.get(f"{BASE_URL}/favorites/projects")
        
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list), "Should return a list"
        assert len(data) > 0, "Should have at least one favorite"
        
        # Find our test project
        test_project = next((p for p in data if p["project_id"] == 367), None)
        assert test_project is not None, "Test project not found in favorites list"
        assert test_project["project_name"] == "Test Project"
        
        print(f"\n✅ Retrieved {len(data)} favorite project(s) from API")
    
    def test_03_add_favorite_user_story(self):
        """Test adding a user story to favorites"""
        response = requests.post(
            f"{BASE_URL}/favorites/userstories",
            json={
                "user_story_id": 99999,
                "user_story_ref": 1234,
                "user_story_subject": "Test User Story for Favorites",
                "project_id": 367
            }
        )
        
        # Clean up first if it exists
        if response.status_code == 400:
            requests.delete(f"{BASE_URL}/favorites/userstories/99999")
            response = requests.post(
                f"{BASE_URL}/favorites/userstories",
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
        
        print(f"\n✅ Added favorite user story (ID: {data['id']})")
    
    def test_04_get_favorite_user_stories(self):
        """Test retrieving all favorite user stories"""
        response = requests.get(f"{BASE_URL}/favorites/userstories")
        
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        test_us = next((us for us in data if us["user_story_id"] == 99999), None)
        assert test_us is not None
        
        print(f"\n✅ Retrieved {len(data)} favorite user stor(ies)")
    
    def test_05_get_favorites_filtered_by_project(self):
        """Test retrieving favorites filtered by project"""
        response = requests.get(f"{BASE_URL}/favorites/userstories?project_id=367")
        
        assert response.status_code == 200
        data = response.json()
        
        for us in data:
            assert us["project_id"] == 367
        
        print(f"\n✅ Retrieved {len(data)} favorite(s) for project 367")
    
    def test_06_prevent_duplicate_project(self):
        """Test that adding duplicate project returns error"""
        response = requests.post(
            f"{BASE_URL}/favorites/projects",
            json={
                "project_id": 367,
                "project_name": "Test Project",
                "project_slug": "test-project"
            }
        )
        
        assert response.status_code == 400
        assert "already in favorites" in response.json()["detail"].lower()
        
        print(f"\n✅ Correctly prevented duplicate project")
    
    def test_07_prevent_duplicate_user_story(self):
        """Test that adding duplicate user story returns error"""
        response = requests.post(
            f"{BASE_URL}/favorites/userstories",
            json={
                "user_story_id": 99999,
                "user_story_ref": 1234,
                "user_story_subject": "Test User Story",
                "project_id": 367
            }
        )
        
        assert response.status_code == 400
        assert "already in favorites" in response.json()["detail"].lower()
        
        print(f"\n✅ Correctly prevented duplicate user story")
    
    def test_08_remove_favorite_user_story(self):
        """Test removing user story from favorites"""
        response = requests.delete(f"{BASE_URL}/favorites/userstories/99999")
        
        assert response.status_code == 200
        assert response.json()["success"] is True
        
        # Verify removed
        verify = requests.get(f"{BASE_URL}/favorites/userstories")
        data = verify.json()
        test_us = next((us for us in data if us["user_story_id"] == 99999), None)
        assert test_us is None, "User story should be removed"
        
        print(f"\n✅ Removed favorite user story")
    
    def test_09_remove_favorite_project(self):
        """Test removing project from favorites"""
        response = requests.delete(f"{BASE_URL}/favorites/projects/367")
        
        assert response.status_code == 200
        assert response.json()["success"] is True
        
        # Verify removed
        verify = requests.get(f"{BASE_URL}/favorites/projects")
        data = verify.json()
        test_proj = next((p for p in data if p["project_id"] == 367), None)
        assert test_proj is None, "Project should be removed"
        
        print(f"\n✅ Removed favorite project")
        print(f"\n🎉 ALL FAVORITES TESTS COMPLETED SUCCESSFULLY!")
