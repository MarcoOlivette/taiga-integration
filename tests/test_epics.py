"""
Testes de Épicos
"""
from conftest import print_separator


def test_list_epics(api, project):
    """Teste: Listar Épicos do projeto"""
    print_separator(f"TESTE: LISTAR ÉPICOS DO PROJETO '{project.name}'")
    
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
                description = getattr(epic, 'description', None)
                if description:
                    desc = description[:100].replace('\n', ' ')
                    print(f"   Descrição: {desc}...")
            
            if len(epics) > 5:
                print(f"\n... e mais {len(epics) - 5} épico(s)")
        else:
            print("\n⚠️  Nenhum Épico encontrado neste projeto")
        
        print("\n✅ TESTE PASSOU!")
        return epics
        
    except Exception as e:
        print(f"\n❌ ERRO: {str(e)}")
        raise
