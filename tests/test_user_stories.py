"""
Testes de User Stories
"""
from conftest import print_separator


def test_list_user_stories(api, project):
    """Teste: Listar User Stories do projeto"""
    print_separator(f"TESTE: LISTAR USER STORIES DO PROJETO '{project.name}'")
    
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
                description = getattr(story, 'description', None)
                if description:
                    desc = description[:100].replace('\n', ' ')
                    print(f"   Descrição: {desc}...")
            
            if len(stories) > 5:
                print(f"\n... e mais {len(stories) - 5} user story(ies)")
        else:
            print("\n⚠️  Nenhuma User Story encontrada neste projeto")
        
        print("\n✅ TESTE PASSOU!")
        return stories
        
    except Exception as e:
        print(f"\n❌ ERRO: {str(e)}")
        raise


def test_get_userstory_by_ref(api, project, stories):
    """Teste: Obter User Story por Ref"""
    print_separator("TESTE: OBTER USER STORY POR REF")
    
    try:
        if stories:
            story = stories[0]
            print(f"\n📖 Obtendo User Story #{story.ref} por Ref...")
            story_by_ref = project.get_userstory_by_ref(story.ref)
            print(f"   ✅ User Story obtida: {story_by_ref.subject}")
            assert story_by_ref.id == story.id, "Story obtida por ref não corresponde"
            
            print("\n✅ TESTE PASSOU!")
        else:
            print("\n⚠️  Pulando teste - nenhuma User Story disponível")
            print("\n✅ TESTE PASSOU (SKIP)!")
        
    except Exception as e:
        print(f"\n❌ ERRO: {str(e)}")
        raise
