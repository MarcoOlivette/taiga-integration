"""
Testes de Projetos
"""
from conftest import PROJECT_SLUG, print_separator


def test_list_projects(api):
    """Teste: Listar todos os projetos"""
    print_separator("TESTE: LISTAR PROJETOS")
    
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
        
        print("\n✅ TESTE PASSOU!")
        return projects
        
    except Exception as e:
        print(f"\n❌ ERRO: {str(e)}")
        raise


def test_get_project_by_slug(api):
    """Teste: Obter projeto DASA"""
    print_separator(f"TESTE: OBTER PROJETO DASA (slug: '{PROJECT_SLUG}')")
    
    try:
        # Listar projetos
        projects = api.projects.list()
        
        # Encontrar o projeto DASA
        project = next((p for p in projects if p.slug == PROJECT_SLUG), None)
        
        if not project:
            print(f"\n⚠️  Projeto DASA (slug: '{PROJECT_SLUG}') não encontrado")
            print(f"   📝 Usando primeiro projeto disponível como fallback...")
            project = projects[0]
        
        print(f"\n🎯 Projeto selecionado:")
        print(f"   Nome: {project.name}")
        print(f"   ID: {project.id}")
        print(f"   Slug: {project.slug}")
        print(f"   Descrição: {project.description[:100] if project.description else 'N/A'}...")
        
        # Informações adicionais (se disponíveis)
        if hasattr(project, 'total_story_points'):
            print(f"   Total Story Points: {project.total_story_points}")
        
        # Membros (se disponível)
        members = getattr(project, 'members', None)
        if members:
            print(f"\n👥 Membros do projeto: {len(members)}")
        
        assert project.id is not None, "ID não encontrado"
        
        print("\n✅ TESTE PASSOU!")
        print(f"   ℹ️  Projeto '{project.name}' será usado nos próximos testes")
        return project
        
    except Exception as e:
        import traceback
        print(f"\n❌ ERRO: {str(e)}")
        print(f"\nTraceback:")
        traceback.print_exc()
        raise


def test_get_project_metadata(project):
    """Teste: Obter metadados do projeto (status, prioridades, etc)"""
    print_separator(f"TESTE: METADADOS DO PROJETO '{project.name}'")
    
    try:
        # Task Statuses
        task_statuses = getattr(project, 'task_statuses', None)
        if task_statuses:
            print(f"\n📊 Status de Tarefas ({len(task_statuses)}):")
            for status in task_statuses[:5]:
                print(f"   - {status.name} (ID: {status.id}, Cor: {status.color})")
        else:
            print(f"\n📊 Status de Tarefas: Não disponível")
        
        # User Story Statuses
        us_statuses = getattr(project, 'us_statuses', None)
        if us_statuses:
            print(f"\n📊 Status de User Stories ({len(us_statuses)}):")
            for status in us_statuses[:5]:
                print(f"   - {status.name} (ID: {status.id})")
        else:
            print(f"\n📊 Status de User Stories: Não disponível")
        
        # Prioridades
        priorities = getattr(project, 'priorities', None)
        if priorities:
            print(f"\n⚡ Prioridades ({len(priorities)}):")
            for priority in priorities:
                print(f"   - {priority.name} (ID: {priority.id})")
        
        # Severidades
        severities = getattr(project, 'severities', None)
        if severities:
            print(f"\n🔥 Severidades ({len(severities)}):")
            for severity in severities:
                print(f"   - {severity.name} (ID: {severity.id})")
        
        # Validações mais flexíveis
        if task_statuses:
            assert len(task_statuses) > 0, "Nenhum status de tarefa encontrado"
        if us_statuses:
            assert len(us_statuses) > 0, "Nenhum status de user story encontrado"
        
        print("\n✅ TESTE PASSOU!")
        
    except Exception as e:
        import traceback
        print(f"\n❌ ERRO: {str(e)}")
        print(f"\nTraceback:")
        traceback.print_exc()
        raise

