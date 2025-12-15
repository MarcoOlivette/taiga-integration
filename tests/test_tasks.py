"""
Testes de Tarefas
"""
from conftest import print_separator


def test_list_tasks(api, project):
    """Teste: Listar Tarefas do projeto"""
    print_separator(f"TESTE: LISTAR TAREFAS DO PROJETO '{project.name}'")
    
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
        
        print("\n✅ TESTE PASSOU!")
        return tasks
        
    except Exception as e:
        print(f"\n❌ ERRO: {str(e)}")
        raise


def test_get_task_by_ref(api, project, tasks):
    """Teste: Obter Tarefa por Ref"""
    print_separator("TESTE: OBTER TAREFA POR REF")
    
    try:
        if tasks:
            task = tasks[0]
            print(f"\n✅ Obtendo Tarefa #{task.ref} por Ref...")
            task_by_ref = project.get_task_by_ref(task.ref)
            print(f"   ✅ Tarefa obtida: {task_by_ref.subject}")
            assert task_by_ref.id == task.id, "Tarefa obtida por ref não corresponde"
            
            print("\n✅ TESTE PASSOU!")
        else:
            print("\n⚠️  Pulando teste - nenhuma Tarefa disponível")
            print("\n✅ TESTE PASSOU (SKIP)!")
        
    except Exception as e:
        print(f"\n❌ ERRO: {str(e)}")
        raise


def test_filter_tasks_by_userstory(api, project, stories):
    """Teste: Filtrar tarefas por User Story"""
    print_separator("TESTE: FILTRAR TAREFAS POR USER STORY")
    
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
            
            print("\n✅ TESTE PASSOU!")
        else:
            print("\n⚠️  Pulando teste - nenhuma User Story disponível")
            print("\n✅ TESTE PASSOU (SKIP)!")
        
    except Exception as e:
        print(f"\n❌ ERRO: {str(e)}")
        raise
