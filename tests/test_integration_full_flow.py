"""
Integration test for complete task workflow
Tests: Create US -> Create Tasks -> Edit Tasks -> Change Assignment -> Mark as Done -> Delete Tasks -> Delete US
Uses project 367 (test project)
"""
import pytest
import os
from app.taiga_service import taiga_service


@pytest.fixture(scope="module")
def authenticated_service():
    """Authenticate with Taiga before tests"""
    username = os.getenv("TAIGA_USERNAME")
    password = os.getenv("TAIGA_PASSWORD")
    
    if not username or not password:
        pytest.skip("TAIGA_USERNAME and TAIGA_PASSWORD environment variables required")
    
    taiga_service.login(username, password)
    yield taiga_service


@pytest.fixture(scope="module")
def test_project_id():
    """Project ID 367 - test project"""
    return 367


class TestFullWorkflow:
    """Test complete workflow: US -> Tasks -> Edit -> Delete"""
    
    def test_01_create_user_story(self, authenticated_service, test_project_id):
        """Step 1: Create a user story"""
        import requests
        
        api_url = f"{authenticated_service.host}/api/v1"
        
        # Create user story
        response = requests.post(
            f"{api_url}/userstories",
            headers={
                "Authorization": f"Bearer {authenticated_service.api.token}",
                "Content-Type": "application/json"
            },
            json={
                "project": test_project_id,
                "subject": "[TEST] Integration Test User Story - Auto Delete",
                "description": "This is a test user story created by automated integration test. Safe to delete."
            }
        )
        
        assert response.status_code in [200, 201], f"Failed to create user story: {response.text}"
        
        us_data = response.json()
        assert us_data["id"] is not None
        assert us_data["subject"] == "[TEST] Integration Test User Story - Auto Delete"
        
        # Store for next tests
        pytest.test_us_id = us_data["id"]
        pytest.test_us_ref = us_data["ref"]
        print(f"\n✅ Created User Story #{pytest.test_us_ref} (ID: {pytest.test_us_id})")
    
    def test_02_create_two_tasks(self, authenticated_service, test_project_id):
        """Step 2: Create two tasks in the user story"""
        assert hasattr(pytest, 'test_us_id'), "User story must be created first"
        
        task1 = authenticated_service.create_task(
            project_id=test_project_id,
            subject="[TEST] Task 1 - Integration Test",
            description="First test task - safe to delete",
            user_story=pytest.test_us_id
        )
        
        task2 = authenticated_service.create_task(
            project_id=test_project_id,
            subject="[TEST] Task 2 - Integration Test",
            description="Second test task - safe to delete",
            user_story=pytest.test_us_id
        )
        
        assert task1["id"] is not None
        assert task2["id"] is not None
        assert task1["user_story"] == pytest.test_us_id
        assert task2["user_story"] == pytest.test_us_id
        
        # Store for next tests
        pytest.test_task1_id = task1["id"]
        pytest.test_task2_id = task2["id"]
        
        print(f"\n✅ Created Task #{task1['ref']} (ID: {pytest.test_task1_id})")
        print(f"✅ Created Task #{task2['ref']} (ID: {pytest.test_task2_id})")
    
    def test_03_edit_tasks_description(self, authenticated_service):
        """Step 3: Edit both tasks - update descriptions"""
        assert hasattr(pytest, 'test_task1_id'), "Tasks must be created first"
        
        # Update task 1
        updated_task1 = authenticated_service.update_task(
            pytest.test_task1_id,
            description="UPDATED: This description was modified by integration test"
        )
        
        # Update task 2
        updated_task2 = authenticated_service.update_task(
            pytest.test_task2_id,
            description="UPDATED: This is also updated by integration test"
        )
        
        assert "UPDATED" in updated_task1["description"]
        assert "UPDATED" in updated_task2["description"]
        
        print(f"\n✅ Updated descriptions for both tasks")
    
    def test_04_change_assignment(self, authenticated_service, test_project_id):
        """Step 4: Assign tasks to current user"""
        assert hasattr(pytest, 'test_task1_id'), "Tasks must be created first"
        
        # Get current user ID
        current_user_id = authenticated_service.current_user.id
        
        # Assign task 1
        updated_task1 = authenticated_service.update_task(
            pytest.test_task1_id,
            assigned_to=current_user_id
        )
        
        # Assign task 2
        updated_task2 = authenticated_service.update_task(
            pytest.test_task2_id,
            assigned_to=current_user_id
        )
        
        assert updated_task1["assigned_to"] == current_user_id
        assert updated_task2["assigned_to"] == current_user_id
        
        print(f"\n✅ Assigned both tasks to user ID {current_user_id}")
    
    def test_05_mark_as_done(self, authenticated_service, test_project_id):
        """Step 5: Change status to 'Done' or 'Closed'"""
        assert hasattr(pytest, 'test_task1_id'), "Tasks must be created first"
        
        # Get task statuses for the project
        statuses = authenticated_service.get_task_statuses(test_project_id)
        
        # Find 'Done' or 'Closed' status (usually the last one or has 'fechado'/'done' in name)
        done_status = None
        for status in statuses:
            if 'done' in status['name'].lower() or 'fechad' in status['name'].lower() or 'concl' in status['name'].lower():
                done_status = status
                break
        
        # If not found, use the last status
        if not done_status and statuses:
            done_status = statuses[-1]
        
        assert done_status is not None, "No status found for marking as done"
        
        # Update both tasks
        updated_task1 = authenticated_service.update_task(
            pytest.test_task1_id,
            status=done_status['id']
        )
        
        updated_task2 = authenticated_service.update_task(
            pytest.test_task2_id,
            status=done_status['id']
        )
        
        assert updated_task1["status"] == done_status['id']
        assert updated_task2["status"] == done_status['id']
        
        print(f"\n✅ Marked both tasks as '{done_status['name']}'")
    
    def test_06_verify_descriptions_preserved(self, authenticated_service):
        """Step 6: Verify that descriptions were preserved during all edits"""
        assert hasattr(pytest, 'test_task1_id'), "Tasks must be created first"
        
        # Fetch tasks again to verify descriptions weren't overwritten
        task1 = authenticated_service.get_task(pytest.test_task1_id)
        task2 = authenticated_service.get_task(pytest.test_task2_id)
        
        # Critical test: descriptions should still contain "UPDATED"
        assert "UPDATED" in task1["description"], \
            f"Task 1 description was overwritten! Got: {task1['description']}"
        assert "UPDATED" in task2["description"], \
            f"Task 2 description was overwritten! Got: {task2['description']}"
        
        print(f"\n✅ VERIFIED: Descriptions were preserved through all updates!")
        print(f"   Task 1 desc: {task1['description'][:50]}...")
        print(f"   Task 2 desc: {task2['description'][:50]}...")
    
    def test_07_delete_tasks(self, authenticated_service):
        """Step 7: Delete both tasks"""
        assert hasattr(pytest, 'test_task1_id'), "Tasks must be created first"
        
        authenticated_service.delete_task(pytest.test_task1_id)
        authenticated_service.delete_task(pytest.test_task2_id)
        
        # Verify they're deleted
        import requests
        api_url = f"{authenticated_service.host}/api/v1"
        
        response1 = requests.get(
            f"{api_url}/tasks/{pytest.test_task1_id}",
            headers={"Authorization": f"Bearer {authenticated_service.api.token}"}
        )
        
        response2 = requests.get(
            f"{api_url}/tasks/{pytest.test_task2_id}",
            headers={"Authorization": f"Bearer {authenticated_service.api.token}"}
        )
        
        assert response1.status_code == 404, "Task 1 should be deleted"
        assert response2.status_code == 404, "Task 2 should be deleted"
        
        print(f"\n✅ Deleted both tasks")
    
    def test_08_delete_user_story(self, authenticated_service):
        """Step 8: Delete the user story"""
        assert hasattr(pytest, 'test_us_id'), "User story must be created first"
        
        import requests
        api_url = f"{authenticated_service.host}/api/v1"
        
        # Delete user story
        response = requests.delete(
            f"{api_url}/userstories/{pytest.test_us_id}",
            headers={"Authorization": f"Bearer {authenticated_service.api.token}"}
        )
        
        assert response.status_code in [200, 204], f"Failed to delete user story: {response.text}"
        
        # Verify it's deleted
        verify_response = requests.get(
            f"{api_url}/userstories/{pytest.test_us_id}",
            headers={"Authorization": f"Bearer {authenticated_service.api.token}"}
        )
        
        assert verify_response.status_code == 404, "User story should be deleted"
        
        print(f"\n✅ Deleted User Story #{pytest.test_us_ref} (ID: {pytest.test_us_id})")
        print(f"\n🎉 FULL WORKFLOW TEST COMPLETED SUCCESSFULLY!")
