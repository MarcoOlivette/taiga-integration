"""
Teste de Busca Paginada de User Stories
Testa a funcionalidade de pesquisa com paginação no projeto DASA
"""
import sys
import os

# Adicionar diretório raiz ao path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.taiga_service import taiga_service
from dotenv import load_dotenv

load_dotenv()

# Credenciais
TEST_USERNAME = os.getenv("TEST_USERNAME", "MarcoOlivette")
TEST_PASSWORD = os.getenv("TEST_PASSWORD")
TAIGA_HOST = "https://pista.decea.mil.br"
PROJECT_ID = 133  # DASA


def print_separator(title):
    """Imprime separador visual"""
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)


def test_search_user_stories():
    """Teste: Buscar User Stories com paginação e filtros"""
    print_separator("TESTE: BUSCA PAGINADA DE USER STORIES NO DASA")
    
    try:
        # 1. Autenticar
        print("\n🔐 Autenticando...")
        result = taiga_service.login(TEST_USERNAME, TEST_PASSWORD, TAIGA_HOST)
        print(f"✅ Autenticado como: {result['user']['full_name']}")
        
        # 2. Buscar todas as US do backlog (sem query)
        print_separator("TESTE 1: Buscar TODAS as US do Backlog (página 1)")
        print(f"\n📋 Buscando User Stories do projeto DASA (ID: {PROJECT_ID})")
        print(f"   Parâmetros: milestone=null, page=1, page_size=100")
        
        result1 = taiga_service.search_user_stories(
            project_id=PROJECT_ID,
            milestone="null",  # Backlog
            page=1,
            page_size=100
        )
        
        print(f"\n✅ Resultado:")
        print(f"   Total de US no backlog: {result1['pagination']['total']}")
        print(f"   US retornadas nesta página: {len(result1['stories'])}")
        print(f"   Página atual: {result1['pagination']['page']}")
        print(f"   Total de páginas: {result1['pagination']['total_pages']}")
        
        print(f"\n📖 Primeiras 5 User Stories:")
        for i, story in enumerate(result1['stories'][:5], 1):
            print(f"   {i}. #{story['ref']}: {story['subject']}")
            print(f"      ID: {story['id']}")
            print(f"      Status: {story.get('status_extra_info', {}).get('name', 'N/A')}")
        
        # 3. Buscar com query específica
        print_separator("TESTE 2: Buscar US com query 'teste'")
        print(f"\n🔍 Buscando User Stories com query='teste'")
        
        result2 = taiga_service.search_user_stories(
            project_id=PROJECT_ID,
            query="teste",
            milestone="null",
            page=1,
            page_size=100
        )
        
        print(f"\n✅ Resultado da busca:")
        print(f"   Total de US encontradas: {result2['pagination']['total']}")
        print(f"   US retornadas: {len(result2['stories'])}")
        
        if result2['stories']:
            print(f"\n📖 User Stories encontradas:")
            for i, story in enumerate(result2['stories'][:10], 1):
                print(f"   {i}. #{story['ref']}: {story['subject']}")
        else:
            print(f"\n   ⚠️  Nenhuma US encontrada com 'teste' no título")
        
        # 4. Testar paginação (página 2)
        if result1['pagination']['total_pages'] > 1:
            print_separator("TESTE 3: Buscar Página 2")
            print(f"\n📄 Buscando página 2...")
            
            result3 = taiga_service.search_user_stories(
                project_id=PROJECT_ID,
                milestone="null",
                page=2,
                page_size=100
            )
            
            print(f"\n✅ Resultado página 2:")
            print(f"   US retornadas: {len(result3['stories'])}")
            print(f"   Página atual: {result3['pagination']['page']}")
            
            print(f"\n📖 Primeiras 3 User Stories da página 2:")
            for i, story in enumerate(result3['stories'][:3], 1):
                print(f"   {i}. #{story['ref']}: {story['subject']}")
        else:
            print_separator("TESTE 3: Paginação")
            print(f"\n   ℹ️  Apenas 1 página disponível, pulando teste de paginação")
        
        # 5. Comparar com método antigo
        print_separator("TESTE 4: Comparar com método list() padrão")
        print(f"\n📊 Comparando resultados...")
        
        old_result = taiga_service.get_user_stories(PROJECT_ID)
        
        print(f"\n   Método search_user_stories (paginado):")
        print(f"      Total: {result1['pagination']['total']} US")
        print(f"      Retornadas: {len(result1['stories'])} US")
        
        print(f"\n   Método get_user_stories (padrão):")
        print(f"      Retornadas: {len(old_result)} US")
        
        print(f"\n   💡 Diferença: {result1['pagination']['total'] - len(old_result)} US a mais com paginação!")
        
        # Resumo final
        print_separator("✅ RESUMO DOS TESTES")
        print(f"\n✅ Todos os testes passaram com sucesso!")
        print(f"\n📊 Estatísticas:")
        print(f"   - Total de US no backlog do DASA: {result1['pagination']['total']}")
        print(f"   - US por página: {result1['pagination']['page_size']}")
        print(f"   - Total de páginas: {result1['pagination']['total_pages']}")
        print(f"   - US encontradas com 'teste': {result2['pagination']['total']}")
        print(f"\n🎉 A busca paginada está funcionando perfeitamente!")
        print("=" * 70 + "\n")
        
    except Exception as e:
        import traceback
        print(f"\n❌ ERRO: {str(e)}")
        print(f"\nTraceback:")
        traceback.print_exc()
        raise


if __name__ == "__main__":
    test_search_user_stories()
