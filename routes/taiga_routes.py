"""
Taiga API Routes
"""
from fastapi import APIRouter, HTTPException, Body
from typing import Optional, List, Dict
from pydantic import BaseModel
from app.taiga_service import taiga_service

router = APIRouter()


class LoginRequest(BaseModel):
    username: str
    password: str
    taiga_url: Optional[str] = None


class TaskCreate(BaseModel):
    subject: str
    description: Optional[str] = None
    project: int
    user_story: Optional[int] = None
    status: Optional[int] = None
    assigned_to: Optional[int] = None


class TaskUpdate(BaseModel):
    subject: Optional[str] = None
    description: Optional[str] = None
    status: Optional[int] = None
    assigned_to: Optional[int] = None


class BulkTaskCreate(BaseModel):
    tasks: List[TaskCreate]


class SimpleBulkTaskCreate(BaseModel):
    """Simplified model for creating multiple tasks with same project and user story"""
    project_id: int
    user_story_id: Optional[int] = None
    tasks: List[Dict[str, str]]  # List of {subject: str, description: str}
    status_id: Optional[int] = None
    assigned_to_id: Optional[int] = None


@router.post("/auth/login")
async def login(credentials: LoginRequest):
    """Authenticate with Taiga"""
    try:
        result = taiga_service.login(
            credentials.username,
            credentials.password,
            credentials.taiga_url
        )
        return {
            "success": True,
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.get("/auth/me")
async def get_current_user():
    """Get current authenticated user"""
    try:
        if not taiga_service.current_user:
            raise Exception("Not authenticated")
        return {"success": True, "data": taiga_service.current_user}
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.get("/projects")
def get_projects():
    """Get all projects"""
    try:
        projects = taiga_service.get_projects()
        return {"success": True, "data": projects}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/projects/{project_id}")
def get_project(project_id: int):
    """Get project by ID"""
    try:
        project = taiga_service.get_project(project_id)
        return {"success": True, "data": project}
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/projects/{project_id}/userstories")
def get_user_stories(project_id: int):
    """Get user stories for a project"""
    try:
        stories = taiga_service.get_user_stories(project_id)
        return {"success": True, "data": stories}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/projects/{project_id}/userstories/search")
def search_user_stories(
    project_id: int,
    q: str = "",
    milestone: str = "null",
    page: int = 1,
    page_size: int = 100
):
    """
    Search user stories with pagination and filters
    
    Parameters:
    - q: Search query (searches in subject/description)
    - milestone: Filter by milestone ("null" for backlog)
    - page: Page number (default: 1)
    - page_size: Items per page (default: 100)
    """
    try:
        result = taiga_service.search_user_stories(
            project_id=project_id,
            query=q,
            milestone=milestone,
            page=page,
            page_size=page_size
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/userstories/{story_id}")
def get_user_story(story_id: int):
    """Get user story by ID"""
    try:
        story = taiga_service.get_user_story(story_id)
        return {"success": True, "data": story}
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/projects/{project_id}/epics")
def get_epics(project_id: int):
    """Get epics for a project"""
    try:
        epics = taiga_service.get_epics(project_id)
        return {"success": True, "data": epics}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/epics/{epic_id}")
def get_epic(epic_id: int):
    """Get epic by ID"""
    try:
        epic = taiga_service.get_epic(epic_id)
        return {"success": True, "data": epic}
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/projects/{project_id}/tasks")
def get_tasks(project_id: int, user_story_id: Optional[int] = None):
    """Get tasks for a project or user story"""
    try:
        tasks = taiga_service.get_tasks(project_id, user_story_id)
        return {"success": True, "data": tasks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tasks/{task_id}")
def get_task(task_id: int):
    """Get task by ID"""
    try:
        task = taiga_service.get_task(task_id)
        return {"success": True, "data": task}
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/tasks")
def create_task(task: TaskCreate):
    """Create a new task"""
    try:
        created_task = taiga_service.create_task(task.project, task.subject, **task.dict(exclude={'project', 'subject'}, exclude_none=True))
        return {"success": True, "data": created_task}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/tasks/{task_id}")
def update_task(task_id: int, task: TaskUpdate):
    """Update a task"""
    try:
        updated_task = taiga_service.update_task(task_id, **task.dict(exclude_none=True))
        return {"success": True, "data": updated_task}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/tasks/{task_id}")
def delete_task(task_id: int):
    """Delete a task"""
    try:
        taiga_service.delete_task(task_id)
        return {"success": True, "message": "Task deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tasks/bulk")
def bulk_create_tasks(bulk_data: BulkTaskCreate):
    """Create multiple tasks"""
    try:
        # Assume all tasks are for the same project
        if not bulk_data.tasks:
            raise Exception("No tasks provided")
        
        project_id = bulk_data.tasks[0].project
        tasks_data = [task.dict(exclude={'project'}, exclude_none=True) for task in bulk_data.tasks]
        created_tasks = taiga_service.bulk_create_tasks(project_id, tasks_data)
        return {"success": True, "data": created_tasks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/projects/{project_id}/userstories/{user_story_id}/tasks/bulk")
def create_tasks_for_user_story(
    project_id: int,
    user_story_id: int,
    tasks: List[Dict[str, str]] = Body(..., examples=[
        {
            "summary": "Example tasks list",
            "value": [
                {"subject": "Tarefa A", "description": "Descrição da tarefa A"},
                {"subject": "Tarefa B", "description": "Descrição da tarefa B"},
                {"subject": "Tarefa C", "description": "Descrição da tarefa C"}
            ]
        }
    ]),
    status_id: Optional[int] = None,
    assigned_to_id: Optional[int] = None
):
    """
    Create multiple tasks for a specific user story
    
    Example usage:
    ```
    POST /api/projects/133/userstories/5258/tasks/bulk
    {
        "tasks": [
            {"subject": "Tarefa A", "description": "Descrição A"},
            {"subject": "Tarefa B", "description": "Descrição B"},
            {"subject": "Tarefa C"}
        ],
        "status_id": 123,  # Optional
        "assigned_to_id": 456  # Optional
    }
    ```
    """
    try:
        # Build tasks data
        tasks_data = []
        for task in tasks:
            task_data = {
                "subject": task.get("subject"),
                "description": task.get("description", ""),
                "user_story": user_story_id
            }
            
            if status_id:
                task_data["status"] = status_id
            if assigned_to_id:
                task_data["assigned_to"] = assigned_to_id
                
            tasks_data.append(task_data)
        
        created_tasks = taiga_service.bulk_create_tasks(project_id, tasks_data)
        
        return {
            "success": True,
            "message": f"{len(created_tasks)} tasks created successfully",
            "data": created_tasks
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/projects/{project_id}/task-statuses")
def get_task_statuses(project_id: int):
    """Get task statuses for a project"""
    try:
        statuses = taiga_service.get_task_statuses(project_id)
        return {"success": True, "data": statuses}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/projects/{project_id}/members")
def get_project_members(project_id: int, slug: str = None):
    """Get project members"""
    try:
        members = taiga_service.get_project_members(project_id, slug)
        return {"success": True, "data": members}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

