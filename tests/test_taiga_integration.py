"""
Testes de Integração - python-taiga Library
Testes SOMENTE DE LEITURA para verificar se a biblioteca está funcionando
"""
import os
from dotenv import load_dotenv
from taiga import TaigaAPI

load_dotenv()

# Credenciais de teste
TEST_USERNAME = os.getenv("TEST_USERNAME", "MarcoOlivette")
TEST_PASSWORD = os.getenv("TEST_PASSWORD", "NovaSenhaTaiga__@832")
TAIGA_HOST = "https://pista.decea.mil.br"
PROJECT_SLUG = "asa"  # Projeto principal para testes


def print_separator(title):
    """Imprime separador visual"""
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)


def test_1_authentication():
    """Teste 1: Autenticação com Taiga"""
    print_separator("TESTE 1: AUTENTICAÇÃO")
    
    try:
        api = TaigaAPI(host=TAIGA_HOST)
        api.auth(username=TEST_USERNAME, password=TEST_PASSWORD)
        
        print(f"\n✅ Autenticação bem-sucedida!")
        print(f"🔑 Token: {api.token[:30]}...")
        
        # Obter informações do usuário
        me = api.me()
        print(f"\n👤 Usuário logado:")
        print(f"   ID: {me.id}")
        print(f"   Username: {me.username}")
        print(f"   Nome completo: {me.full_name}")
        print(f"   Email: {me.email}")
        
        assert api.token is not None, "Token não foi gerado"
        assert me.username == TEST_USERNAME, "Usuário incorreto"
        
        print("\n✅ TESTE 1 PASSOU!")
        return api
        
    except Exception as e:
        print(f"\n❌ ERRO: {str(e)}")
        raise


def test_2_list_projects(api):
    """Teste 2: Listar todos os projetos"""
    print_separator("TESTE 2: LISTAR PROJETOS")
    
    try:
        projects = api.projects.list()
        
        print(f"\n📋 Total de projetos encontrados: {len(projects)}")
        print("\n" + "-" * 70)
        
        for i, project in enumerate(projects[:10], 1):  # Mostrar primeiros 10
            print(f"\n{i}. {project.name}")
            print(f"   ID: {project.id}")
            print(f"   Slug: {project.slug}")
            print(f"   Descrição: {project.description[:80] if project.description else 'N/A'}...")
            
        if len(projects) > 10:
            print(f"\n... e mais {len(projects) - 10} projeto(s)")
        
        assert len(projects) > 0, "Nenhum projeto encontrado"
        
        print("\n✅ TESTE 2 PASSOU!")
        return projects
        
    except Exception as e:
        print(f"\n❌ ERRO: {str(e)}")
        raise


def test_3_get_project_by_slug(api):
    """Teste 3: Obter projeto específico por slug"""
    print_separator(f"TESTE 3: OBTER PROJETO '{PROJECT_SLUG}' POR SLUG")
    
    try:
        project = api.projects.get_by_slug(PROJECT_SLUG)
        
        print(f"\n🎯 Projeto encontrado:")
        print(f"   Nome: {project.name}")
        print(f"   ID: {project.id}")
        print(f"   Slug: {project.slug}")
        print(f"   Descrição: {project.description}")
        print(f"   Total Story Points: {project.total_story_points}")
        print(f"   Criado em: {project.created_date}")
        
        # Membros
        print(f"\n👥 Membros do projeto ({len(project.members)}):")
        for member in project.members[:5]:
            print(f"   - {member.full_name_display} ({member.role_name})")
        
        if len(project.members) > 5:
            print(f"   ... e mais {len(project.members) - 5} membro(s)")
        
        assert project.slug == PROJECT_SLUG, "Slug incorreto"
        assert project.id is not None, "ID não encontrado"
        
        print("\n✅ TESTE 3 PASSOU!")
        return project
        
    except Exception as e:
        print(f"\n❌ ERRO: {str(e)}")
        raise


def test_4_list_user_stories(api, project):
    """Teste 4: Listar User Stories do projeto"""
    print_separator(f"TESTE 4: LISTAR USER STORIES DO PROJETO '{project.name}'")
    
    try:
        stories = api.user_stories.list(project=project.id)
        
        print(f"\n📖 Total de User Stories: {len(stories)}")
        
        if stories:
            print("\n" + "-" * 70)
            print("Primeiras User Stories:")
            
            for i, story in enumerate(stories[:5], 1):
                print(f"\n{i}. #{story.ref}: {story.subject}")
                print(f"   ID: {story.id}")
                print(f"   Status: {story.status_extra_info.get('name') if story.status_extra_info else 'N/A'}")
                if story.assigned_to_extra_info:
                    print(f"   Atribuído a: {story.assigned_to_extra_info.get('full_name_display')}")
                if story.description:
                    desc = story.description[:100].replace('\n', ' ')
                    print(f"   Descrição: {desc}...")
            
            if len(stories) > 5:
                print(f"\n... e mais {len(stories) - 5} user story(ies)")
        else:
            print("\n⚠️  Nenhuma User Story encontrada neste projeto")
        
        print("\n✅ TESTE 4 PASSOU!")
        return stories
        
    except Exception as e:
        print(f"\n❌ ERRO: {str(e)}")
        raise


def test_5_list_epics(api, project):
    """Teste 5: Listar Épicos do projeto"""
    print_separator(f"TESTE 5: LISTAR ÉPICOS DO PROJETO '{project.name}'")
    
    try:
        epics = api.epics.list(project=project.id)
        
        print(f"\n🎯 Total de Épicos: {len(epics)}")
        
        if epics:
            print("\n" + "-" * 70)
            print("Primeiros Épicos:")
            
            for i, epic in enumerate(epics[:5], 1):
                print(f"\n{i}. #{epic.ref}: {epic.subject}")
                print(f"   ID: {epic.id}")
                print(f"   Status: {epic.status_extra_info.get('name') if epic.status_extra_info else 'N/A'}")
                if epic.description:
                    desc = epic.description[:100].replace('\n', ' ')
                    print(f"   Descrição: {desc}...")
            
            if len(epics) > 5:
                print(f"\n... e mais {len(epics) - 5} épico(s)")
        else:
            print("\n⚠️  Nenhum Épico encontrado neste projeto")
        
        print("\n✅ TESTE 5 PASSOU!")
        return epics
        
    except Exception as e:
        print(f"\n❌ ERRO: {str(e)}")
        raise


def test_6_list_tasks(api, project):
    """Teste 6: Listar Tarefas do projeto"""
    print_separator(f"TESTE 6: LISTAR TAREFAS DO PROJETO '{project.name}'")
    
    try:
        tasks = api.tasks.list(project=project.id)
        
        print(f"\n✅ Total de Tarefas: {len(tasks)}")
        
        if tasks:
            print("\n" + "-" * 70)
            print("Primeiras Tarefas:")
            
            for i, task in enumerate(tasks[:5], 1):
                print(f"\n{i}. #{task.ref}: {task.subject}")
                print(f"   ID: {task.id}")
                print(f"   Status: {task.status_extra_info.get('name') if task.status_extra_info else 'N/A'}")
                if task.assigned_to_extra_info:
                    print(f"   Atribuído a: {task.assigned_to_extra_info.get('full_name_display')}")
                if task.user_story:
                    print(f"   User Story: #{task.user_story}")
            
            if len(tasks) > 5:
                print(f"\n... e mais {len(tasks) - 5} tarefa(s)")
        else:
            print("\n⚠️  Nenhuma Tarefa encontrada neste projeto")
        
        print("\n✅ TESTE 6 PASSOU!")
        return tasks
        
    except Exception as e:
        print(f"\n❌ ERRO: {str(e)}")
        raise


def test_7_get_project_metadata(project):
    """Teste 7: Obter metadados do projeto (status, prioridades, etc)"""
    print_separator(f"TESTE 7: METADADOS DO PROJETO '{project.name}'")
    
    try:
        # Task Statuses
        print(f"\n📊 Status de Tarefas ({len(project.task_statuses)}):")
        for status in project.task_statuses[:5]:
            print(f"   - {status.name} (ID: {status.id}, Cor: {status.color})")
        
        # User Story Statuses
        print(f"\n� Status de User Stories ({len(project.us_statuses)}):")
        for status in project.us_statuses[:5]:
            print(f"   - {status.name} (ID: {status.id})")
        
        # Prioridades
        if hasattr(project, 'priorities') and project.priorities:
            print(f"\n⚡ Prioridades ({len(project.priorities)}):")
            for priority in project.priorities:
                print(f"   - {priority.name} (ID: {priority.id})")
        
        # Severidades
        if hasattr(project, 'severities') and project.severities:
            print(f"\n🔥 Severidades ({len(project.severities)}):")
            for severity in project.severities:
                print(f"   - {severity.name} (ID: {severity.id})")
        
        assert len(project.task_statuses) > 0, "Nenhum status de tarefa encontrado"
        assert len(project.us_statuses) > 0, "Nenhum status de user story encontrado"
        
        print("\n✅ TESTE 7 PASSOU!")
        
    except Exception as e:
        print(f"\n❌ ERRO: {str(e)}")
        raise


def test_8_get_specific_items(api, project, stories, tasks):
    """Teste 8: Obter itens específicos por ID/Ref"""
    print_separator("TESTE 8: OBTER ITENS ESPECÍFICOS")
    
    try:
        # Obter uma user story específica (se existir)
        if stories:
            story = stories[0]
            print(f"\n� Obtendo User Story #{story.ref} por ID...")
            fetched_story = api.user_stories.get(story.id)
            print(f"   ✅ User Story obtida: {fetched_story.subject}")
            assert fetched_story.id == story.id, "ID da story não corresponde"
            
            # Obter pela ref usando o projeto
            print(f"\n📖 Obtendo User Story #{story.ref} por Ref...")
            story_by_ref = project.get_userstory_by_ref(story.ref)
            print(f"   ✅ User Story obtida: {story_by_ref.subject}")
            assert story_by_ref.id == story.id, "Story obtida por ref não corresponde"
        
        # Obter uma tarefa específica (se existir)
        if tasks:
            task = tasks[0]
            print(f"\n✅ Obtendo Tarefa #{task.ref} por ID...")
            fetched_task = api.tasks.get(task.id)
            print(f"   ✅ Tarefa obtida: {fetched_task.subject}")
            assert fetched_task.id == task.id, "ID da tarefa não corresponde"
            
            # Obter pela ref usando o projeto
            print(f"\n✅ Obtendo Tarefa #{task.ref} por Ref...")
            task_by_ref = project.get_task_by_ref(task.ref)
            print(f"   ✅ Tarefa obtida: {task_by_ref.subject}")
            assert task_by_ref.id == task.id, "Tarefa obtida por ref não corresponde"
        
        print("\n✅ TESTE 8 PASSOU!")
        
    except Exception as e:
        print(f"\n❌ ERRO: {str(e)}")
        raise


def test_9_filter_tasks_by_userstory(api, project, stories):
    """Teste 9: Filtrar tarefas por User Story"""
    print_separator("TESTE 9: FILTRAR TAREFAS POR USER STORY")
    
    try:
        if stories:
            story = stories[0]
            print(f"\n📖 Buscando tarefas da User Story #{story.ref}: {story.subject}")
            
            tasks = api.tasks.list(project=project.id, user_story=story.id)
            
            print(f"\n✅ Tarefas encontradas: {len(tasks)}")
            
            if tasks:
                for i, task in enumerate(tasks[:3], 1):
                    print(f"   {i}. #{task.ref}: {task.subject}")
                    print(f"      Status: {task.status_extra_info.get('name') if task.status_extra_info else 'N/A'}")
            else:
                print("   ⚠️  Esta User Story não possui tarefas")
            
            print("\n✅ TESTE 9 PASSOU!")
        else:
            print("\n⚠️  Pulando teste - nenhuma User Story disponível")
            print("\n✅ TESTE 9 PASSOU (SKIP)!")
        
    except Exception as e:
        print(f"\n❌ ERRO: {str(e)}")
        raise


def run_all_tests():
    """Executa todos os testes em sequência"""
    print("\n" + "=" * 70)
    print("  TESTES DE INTEGRAÇÃO - PYTHON-TAIGA LIBRARY")
    print("  Modo: SOMENTE LEITURA (sem operações de escrita)")
    print("=" * 70)
    
    try:
        # Teste 1: Autenticação
        api = test_1_authentication()
        
        # Teste 2: Listar projetos
        projects = test_2_list_projects(api)
        
        # Teste 3: Obter projeto específico
        project = test_3_get_project_by_slug(api)
        
        # Teste 4: Listar User Stories
        stories = test_4_list_user_stories(api, project)
        
        # Teste 5: Listar Épicos
        epics = test_5_list_epics(api, project)
        
        # Teste 6: Listar Tarefas
        tasks = test_6_list_tasks(api, project)
        
        # Teste 7: Metadados do projeto
        test_7_get_project_metadata(project)
        
        # Teste 8: Obter itens específicos
        test_8_get_specific_items(api, project, stories, tasks)
        
        # Teste 9: Filtrar tarefas por User Story
        test_9_filter_tasks_by_userstory(api, project, stories)
        
        # Resumo final
        print("\n" + "=" * 70)
        print("  ✅ TODOS OS TESTES PASSARAM COM SUCESSO!")
        print("=" * 70)
        print(f"\n📊 Resumo:")
        print(f"   - Projetos encontrados: {len(projects)}")
        print(f"   - User Stories no projeto '{project.name}': {len(stories)}")
        print(f"   - Épicos no projeto '{project.name}': {len(epics)}")
        print(f"   - Tarefas no projeto '{project.name}': {len(tasks)}")
        print(f"   - Membros do projeto: {len(project.members)}")
        print(f"\n🎉 A biblioteca python-taiga está funcionando perfeitamente!")
        print("=" * 70 + "\n")
        
    except Exception as e:
        print("\n" + "=" * 70)
        print("  ❌ FALHA NOS TESTES")
        print("=" * 70)
        print(f"\nErro: {str(e)}\n")
        raise


if __name__ == "__main__":
    run_all_tests()
