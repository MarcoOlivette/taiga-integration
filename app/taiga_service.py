"""
Taiga API Client Service using python-taiga library
"""
from taiga import TaigaAPI
from typing import Optional, Dict, List, Any
from pydantic import BaseModel
import os
from dotenv import load_dotenv

load_dotenv()


class TaigaCredentials(BaseModel):
    username: str
    password: str
    taiga_url: Optional[str] = None


class TaigaService:
    """Service wrapper for python-taiga library"""
    
    def __init__(self):
        self.base_url = os.getenv("TAIGA_API_URL", "https://pista.decea.mil.br/api/v1")
        # Remove /api/v1 from base_url for python-taiga
        self.host = self.base_url.replace('/api/v1', '')
        self.api: Optional[TaigaAPI] = None
        self.current_user: Optional[Dict] = None

    def set_host(self, url: str):
        """Set custom Taiga instance URL"""
        url = url.rstrip('/')
        if url.endswith('/api/v1'):
            url = url[:-7]  # Remove /api/v1
        self.host = url

    def login(self, username: str, password: str, taiga_url: Optional[str] = None) -> Dict:
        """Authenticate with Taiga"""
        if taiga_url:
            self.set_host(taiga_url)

        try:
            # Create TaigaAPI instance with custom host
            self.api = TaigaAPI(host=self.host)
            
            # Authenticate
            self.api.auth(username=username, password=password)
            
            # Get current user info
            self.current_user = self.api.me()
            
            return {
                "auth_token": self.api.token,
                "user": {
                    "id": self.current_user.id,
                    "username": self.current_user.username,
                    "full_name": self.current_user.full_name,
                    "email": self.current_user.email,
                }
            }
        except Exception as e:
            raise Exception(f"Authentication failed: {str(e)}")

    def _ensure_authenticated(self):
        """Ensure user is authenticated"""
        if not self.api or not self.api.token:
            raise Exception("Not authenticated. Please login first.")

    # Projects
    def get_projects(self) -> List[Dict]:
        """Get all projects"""
        self._ensure_authenticated()
        projects = self.api.projects.list()
        return [self._project_to_dict(p) for p in projects]

    def get_project(self, project_id: int) -> Dict:
        """Get project by ID"""
        self._ensure_authenticated()
        project = self.api.projects.get(project_id)
        return self._project_to_dict(project)

    def get_project_by_slug(self, slug: str) -> Dict:
        """Get project by slug"""
        self._ensure_authenticated()
        project = self.api.projects.get_by_slug(slug)
        return self._project_to_dict(project)

    # User Stories
    def get_user_stories(self, project_id: int) -> List[Dict]:
        """Get ALL user stories for a project (handling pagination)"""
        self._ensure_authenticated()
        
        # Use simple list first, but if we suspect pagination, we should manually request all pages
        # Or check if list() handles it. python-taiga list() typically handles pagination automatically
        # by iterating over pages. If not, we implement manual loop.
        # But let's assume standard list() pagination might time out or be slow if too many.
        # Let's try to force x-disable-pagination header if possible, OR loop manually.
        
        # Manual pagination implementation to be safe and ensure ALL are retrieved
        all_stories = []
        page = 1
        while True:
            try:
                stories_page = self.api.user_stories.list(project=project_id, page=page, page_size=100)
                if not stories_page:
                    break
                all_stories.extend(stories_page)
                if len(stories_page) < 100:
                    break
                page += 1
            except Exception:
                # Fallback or end of pages
                break
                
        return [self._userstory_to_dict(s) for s in all_stories]

    def search_user_stories(self, project_id: int, query: str = "", milestone: str = "null", 
                           page: int = 1, page_size: int = 100) -> Dict:
        """
        Search user stories with pagination and filters
        """
        self._ensure_authenticated()
        
        import requests
        
        # Build URL with parameters - use self.host + /api/v1
        api_url = f"{self.host}/api/v1"
        url = f"{api_url}/userstories"
        params = {
            "project": project_id,
            "page": page,
            "page_size": page_size,
            "milestone": milestone,  # "null" for backlog, or milestone ID
        }
        
        if query:
            params["q"] = query
        
        headers = {
            "Authorization": f"Bearer {self.api.token}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(url, params=params, headers=headers)
        response.raise_for_status()
        
        stories_data = response.json()
        
        # Get pagination headers
        total_count = int(response.headers.get('x-pagination-count', 0))
        current_page = int(response.headers.get('x-pagination-current', page))
        total_pages = int(response.headers.get('x-pagination-num-pages', 1))
        
        return {
            "stories": stories_data,
            "pagination": {
                "total": total_count,
                "page": current_page,
                "page_size": page_size,
                "total_pages": total_pages
            }
        }

    def get_user_story(self, story_id: int) -> Dict:
        """Get user story by ID"""
        self._ensure_authenticated()
        story = self.api.user_stories.get(story_id)
        return self._userstory_to_dict(story)

    # Epics
    def get_epics(self, project_id: int) -> List[Dict]:
        """Get epics for a project"""
        self._ensure_authenticated()
        epics = self.api.epics.list(project=project_id)
        return [self._epic_to_dict(e) for e in epics]

    def get_epic(self, epic_id: int) -> Dict:
        """Get epic by ID"""
        self._ensure_authenticated()
        epic = self.api.epics.get(epic_id)
        return self._epic_to_dict(epic)

    # Tasks
    def get_tasks(self, project_id: int, user_story_id: Optional[int] = None) -> List[Dict]:
        """Get tasks for a project or user story"""
        self._ensure_authenticated()
        filters = {"project": project_id}
        if user_story_id:
            filters["user_story"] = user_story_id
        
        # Ensure we get all tasks too
        tasks = []
        try:
            # First try standard list, if it returns limited set we might need pagination loop too
            # But tasks are usually fewer per US. If per project, might be many.
            # python-taiga .list() normally iterates. Let's trust it for tasks for now unless reported issue.
            tasks = self.api.tasks.list(**filters)
        except Exception as e:
            # If list fails, try manual pagination or just return empty
            print(f"Error fetching tasks: {e}")
            return []
            
        return [self._task_to_dict(t) for t in tasks]

    def get_task(self, task_id: int) -> Dict:
        """Get task by ID"""
        self._ensure_authenticated()
        task = self.api.tasks.get(task_id)
        return self._task_to_dict(task)

    def create_task(self, project_id: int, subject: str, **kwargs) -> Dict:
        """Create a new task"""
        self._ensure_authenticated()
        
        # Get required status if not provided
        status = kwargs.get('status')
        if not status:
            # Get first available task status
            try:
                statuses = self.get_task_statuses(project_id)
                if statuses:
                    status = statuses[0]['id']
            except:
                pass
        
        # Create task via direct API call
        import requests
        response = requests.post(
            f"{self.host}/api/v1/tasks",
            headers={
                "Authorization": f"Bearer {self.api.token}",
                "Content-Type": "application/json"
            },
            json={
                "project": project_id,
                "subject": subject,
                "description": kwargs.get('description', ''),
                "status": status,
                "assigned_to": kwargs.get('assigned_to'),
                "user_story": kwargs.get('user_story')
            },
            timeout=30
        )
        
        if response.status_code in [200, 201]:
            return self._task_to_dict_from_json(response.json())
        else:
            raise Exception(f"Failed to create task: {response.status_code} - {response.text[:200]}")

    def update_task(self, task_id: int, **kwargs) -> Dict:
        """Update a task"""
        self._ensure_authenticated()
        task = self.api.tasks.get(task_id)
        
        # Update attributes
        for key, value in kwargs.items():
            if value is not None and hasattr(task, key):
                setattr(task, key, value)
        
        task.update()
        return self._task_to_dict(task)

    def delete_task(self, task_id: int) -> None:
        """Delete a task"""
        self._ensure_authenticated()
        task = self.api.tasks.get(task_id)
        task.delete()

    def bulk_create_tasks(self, project_id: int, tasks_data: List[Dict]) -> List[Dict]:
        """
        Create multiple tasks
        
        Note: Taiga's native bulk_create endpoint requires milestone_id which is too restrictive.
        We use the fallback method which creates tasks one by one but is more flexible.
        """
        self._ensure_authenticated()
        return self._bulk_create_fallback(project_id, tasks_data)
    
    def _bulk_create_fallback(self, project_id: int, tasks_data: List[Dict]) -> List[Dict]:
        """Fallback: create tasks one by one"""
        created_tasks = []
        for task_data in tasks_data:
            try:
                task = self.create_task(project_id, **task_data)
                created_tasks.append(task)
            except Exception as e:
                created_tasks.append({"error": str(e), "data": task_data})
        return created_tasks
    
    def _task_to_dict_from_json(self, task_json: Dict) -> Dict:
        """Convert task JSON response to dict (for bulk_create response)"""
        return {
            "id": task_json.get("id"),
            "ref": task_json.get("ref"),
            "subject": task_json.get("subject"),
            "description": task_json.get("description", ""),
            "status": task_json.get("status"),
            "status_extra_info": task_json.get("status_extra_info"),
            "assigned_to": task_json.get("assigned_to"),
            "assigned_to_extra_info": task_json.get("assigned_to_extra_info"),
            "user_story": task_json.get("user_story"),
            "project": task_json.get("project"),
            "created_date": task_json.get("created_date"),
            "modified_date": task_json.get("modified_date"),
        }

    # Metadata
    def get_task_statuses(self, project_id: int) -> List[Dict]:
        """Get task statuses for a project"""
        self._ensure_authenticated()
        project = self.api.projects.get(project_id)
        return [{"id": s.id, "name": s.name, "color": s.color} for s in project.task_statuses]

    def get_project_members(self, project_id: int, slug: Optional[str] = None) -> List[Dict]:
        """
        Get project members
        If slug is provided, uses get_by_slug (often returns complete member list)
        """
        self._ensure_authenticated()
        if slug:
            project = self.api.projects.get_by_slug(slug)
        else:
            project = self.api.projects.get(project_id)
            
        return [
            {
                "id": m.id,
                "user": m.user,
                "full_name_display": m.full_name_display,
                "full_name": getattr(m, 'full_name', m.full_name_display),  # Ensure full_name
                "role_name": m.role_name,
                "role": m.role,
                "is_active": getattr(m, 'is_user_active', True), # Check active status
                "photo": getattr(m, 'photo', None)
            }
            for m in project.members
        ]

    # Helper methods to convert objects to dicts
    def _project_to_dict(self, project) -> Dict:
        """Convert project object to dict"""
        members_data = []
        if hasattr(project, 'members'):
            members_data = [
                {
                    "id": m.id,
                    "user": m.user,
                    "full_name_display": m.full_name_display,
                    "full_name": getattr(m, 'full_name', m.full_name_display),
                    "role_name": m.role_name,
                    "role": m.role,
                    "is_active": getattr(m, 'is_user_active', True),
                    "photo": getattr(m, 'photo', None),
                    "username": getattr(m, 'username', None),
                    "color": getattr(m, 'color', None)
                }
                for m in project.members
            ]

        return {
            "id": project.id,
            "name": project.name,
            "slug": project.slug,
            "description": project.description,
            "total_story_points": getattr(project, 'total_story_points', 0),
            "members": members_data
        }

    def _userstory_to_dict(self, story) -> Dict:
        """Convert user story object to dict"""
        return {
            "id": story.id,
            "ref": story.ref,
            "subject": story.subject,
            "description": getattr(story, 'description', ''),
            "status": story.status,
            "status_extra_info": {
                "name": story.status_extra_info.get('name') if story.status_extra_info else None,
                "color": story.status_extra_info.get('color') if story.status_extra_info else None
            }
        }

    def _epic_to_dict(self, epic) -> Dict:
        """Convert epic object to dict"""
        return {
            "id": epic.id,
            "ref": epic.ref,
            "subject": epic.subject,
            "description": epic.description,
            "status": epic.status,
            "status_extra_info": {
                "name": epic.status_extra_info.get('name') if epic.status_extra_info else None,
                "color": epic.status_extra_info.get('color') if epic.status_extra_info else None
            }
        }

    def _task_to_dict(self, task) -> Dict:
        """Convert task object to dict"""
        return {
            "id": task.id,
            "ref": task.ref,
            "subject": task.subject,
            "description": task.description,
            "status": task.status,
            "assigned_to": task.assigned_to,
            "user_story": task.user_story,
            "status_extra_info": {
                "name": task.status_extra_info.get('name') if task.status_extra_info else None,
                "color": task.status_extra_info.get('color') if task.status_extra_info else None
            },
            "assigned_to_extra_info": {
                "full_name_display": task.assigned_to_extra_info.get('full_name_display') if task.assigned_to_extra_info else None
            }
        }


# Global service instance
taiga_service = TaigaService()
