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
        """Step 2: Create two tasks WITHOUT description"""
        assert hasattr(pytest, 'test_us_id'), "User story must be created first"
        
        # Create tasks WITHOUT description initially
        task1 = authenticated_service.create_task(
            project_id=test_project_id,
            subject="[TEST] Task 1 - Integration Test",
            description="",  # Empty description
            user_story=pytest.test_us_id
        )
        
        task2 = authenticated_service.create_task(
            project_id=test_project_id,
            subject="[TEST] Task 2 - Integration Test",
            description="",  # Empty description
            user_story=pytest.test_us_id
        )
        
        assert task1["id"] is not None
        assert task2["id"] is not None
        assert task1["user_story"] == pytest.test_us_id
        assert task2["user_story"] == pytest.test_us_id
        
        # Store for next tests
        pytest.test_task1_id = task1["id"]
        pytest.test_task2_id = task2["id"]
        
        print(f"\n✅ Created Task #{task1['ref']} (ID: {pytest.test_task1_id}) WITHOUT description")
        print(f"✅ Created Task #{task2['ref']} (ID: {pytest.test_task2_id}) WITHOUT description")
    
    def test_03_add_descriptions(self, authenticated_service):
        """Step 3: NOW add descriptions via edit (critical test setup)"""
        assert hasattr(pytest, 'test_task1_id'), "Tasks must be created first"
        
        DESCRIPTION_TASK1 = "CRITICAL TEST: This description must be preserved after status change!"
        DESCRIPTION_TASK2 = "IMPORTANT: This text validates our bug fix is working!"
        
        # Add descriptions via update
        updated_task1 = authenticated_service.update_task(
            pytest.test_task1_id,
            description=DESCRIPTION_TASK1
        )
        
        updated_task2 = authenticated_service.update_task(
            pytest.test_task2_id,
            description=DESCRIPTION_TASK2
        )
        
        assert updated_task1["description"] == DESCRIPTION_TASK1
        assert updated_task2["description"] == DESCRIPTION_TASK2
        
        # Store descriptions for later verification
        pytest.test_task1_description = DESCRIPTION_TASK1
        pytest.test_task2_description = DESCRIPTION_TASK2
        
        print(f"\n✅ Added description to Task 1: '{DESCRIPTION_TASK1[:50]}...'")
        print(f"✅ Added description to Task 2: '{DESCRIPTION_TASK2[:50]}...'")
    
    def test_04_verify_descriptions_before_status_change(self, authenticated_service):
        """Step 4: Verify descriptions are saved correctly"""
        assert hasattr(pytest, 'test_task1_id'), "Tasks must be created first"
        
        # Fetch tasks again to verify descriptions were saved
        task1 = authenticated_service.get_task(pytest.test_task1_id)
        task2 = authenticated_service.get_task(pytest.test_task2_id)
        
        assert task1["description"] == pytest.test_task1_description
        assert task2["description"] == pytest.test_task2_description
        
        print(f"\n✅ VERIFIED: Descriptions are correctly saved before status change")
    
    def test_05_change_assignment(self, authenticated_service, test_project_id):
        """Step 5: Assign tasks to current user"""
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
    
    def test_06_change_status_and_verify_description(self, authenticated_service, test_project_id):
        """Step 6: CRITICAL TEST - Change status using partial PATCH and verify description is preserved"""
        assert hasattr(pytest, 'test_task1_id'), "Tasks must be created first"
        
        # Get task statuses for the project
        statuses = authenticated_service.get_task_statuses(test_project_id)
        
        # Find 'Done' or 'Closed' status
        done_status = None
        for status in statuses:
            if 'done' in status['name'].lower() or 'fechad' in status['name'].lower() or 'concl' in status['name'].lower():
                done_status = status
                break
        
        # If not found, use the last status
        if not done_status and statuses:
            done_status = statuses[-1]
        
        assert done_status is not None, "No status found for marking as done"
        
        print(f"\n🔄 Changing status using PARTIAL PATCH (only status + version)...")
        
        # Update both tasks - send ONLY status and version (partial PATCH)
        # This mimics what the frontend does: {"status": X, "version": Y}
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
        
        print(f"✅ Status changed to '{done_status['name']}' (sent only status + version)")
        
        # ⚠️ CRITICAL TEST: Verify descriptions were preserved by Taiga's partial PATCH
        print(f"\n🔍 CRITICAL TEST: Verifying Taiga preserved descriptions with partial PATCH...")
        
        # Fetch tasks again
        task1 = authenticated_service.get_task(pytest.test_task1_id)
        task2 = authenticated_service.get_task(pytest.test_task2_id)
        
        # This is the critical assertion - Taiga should preserve description with partial PATCH
        if task1["description"] != pytest.test_task1_description:
            print(f"❌ FAILURE: Task 1 description was NOT preserved!")
            print(f"   Expected: '{pytest.test_task1_description}'")
            print(f"   Got: '{task1['description']}'")
            print(f"   This means Taiga's partial PATCH is NOT working as expected!")
            assert False, "Taiga did not preserve description with partial PATCH (status only)!"
        
        if task2["description"] != pytest.test_task2_description:
            print(f"❌ FAILURE: Task 2 description was NOT preserved!")
            print(f"   Expected: '{pytest.test_task2_description}'")
            print(f"   Got: '{task2['description']}'")
            print(f"   This means Taiga's partial PATCH is NOT working as expected!")
            assert False, "Taiga did not preserve description with partial PATCH (status only)!"
        
        print(f"✅✅✅ SUCCESS: Taiga's partial PATCH preserved descriptions!")
        print(f"   Task 1: '{task1['description'][:50]}...'")
        print(f"   Task 2: '{task2['description'][:50]}...'")
        print(f"\n🎉 VALIDATED: Sending only 'status + version' preserves description!")
    
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
