"""
Test Taiga Authentication and Project Listing
"""
import pytest
import asyncio
import os
from dotenv import load_dotenv
from app.taiga_service import TaigaClient

load_dotenv()

# Test credentials
TEST_USERNAME = os.getenv("TEST_USERNAME", "MarcoOlivette")
TEST_PASSWORD = os.getenv("TEST_PASSWORD", "NovaSenhaTaiga__@832")
TEST_TAIGA_URL = os.getenv("TAIGA_API_URL", "https://pista.decea.mil.br/api/v1")


@pytest.mark.asyncio
async def test_authentication():
    """Test 1: Verify authentication with Taiga"""
    print("\n" + "="*60)
    print("TEST 1: AUTENTICAÇÃO NO TAIGA")
    print("="*60)
    
    client = TaigaClient()
    
    try:
        print(f"\n📡 Conectando ao Taiga: {TEST_TAIGA_URL}")
        print(f"👤 Usuário: {TEST_USERNAME}")
        
        result = await client.login(TEST_USERNAME, TEST_PASSWORD, TEST_TAIGA_URL)
        
        print("\n✅ AUTENTICAÇÃO BEM-SUCEDIDA!")
        print(f"\n🔑 Token recebido: {result['auth_token'][:20]}...")
        print(f"👤 Usuário logado: {result['user'].get('full_name', result['user'].get('username'))}")
        print(f"📧 Email: {result['user'].get('email', 'N/A')}")
        print(f"🆔 User ID: {result['user'].get('id')}")
        
        assert result['auth_token'] is not None, "Auth token não foi retornado"
        assert result['user'] is not None, "Dados do usuário não foram retornados"
        
        print("\n✅ TESTE 1 PASSOU!")
        return client
        
    except Exception as e:
        print(f"\n❌ ERRO NA AUTENTICAÇÃO: {str(e)}")
        pytest.fail(f"Falha na autenticação: {str(e)}")


@pytest.mark.asyncio
async def test_get_projects():
    """Test 2: Verify project listing"""
    print("\n" + "="*60)
    print("TEST 2: LISTAGEM DE PROJETOS")
    print("="*60)
    
    # First authenticate
    client = TaigaClient()
    
    try:
        print(f"\n📡 Autenticando...")
        await client.login(TEST_USERNAME, TEST_PASSWORD, TEST_TAIGA_URL)
        print("✅ Autenticado com sucesso!")
        
        print(f"\n📋 Buscando projetos...")
        projects = await client.get_projects()
        
        print(f"\n✅ PROJETOS ENCONTRADOS: {len(projects)}")
        print("\n" + "-"*60)
        
        for i, project in enumerate(projects[:5], 1):  # Show first 5 projects
            print(f"\n{i}. {project.get('name')}")
            print(f"   ID: {project.get('id')}")
            print(f"   Slug: {project.get('slug')}")
            print(f"   Descrição: {project.get('description', 'N/A')[:100]}")
            print(f"   Membros: {len(project.get('members', []))}")
            print(f"   Total Story Points: {project.get('total_story_points', 0)}")
        
        if len(projects) > 5:
            print(f"\n... e mais {len(projects) - 5} projeto(s)")
        
        print("\n" + "-"*60)
        
        assert len(projects) > 0, "Nenhum projeto foi retornado"
        assert all('id' in p and 'name' in p for p in projects), "Projetos com dados incompletos"
        
        # Try to find the ASA project
        asa_project = next((p for p in projects if p.get('slug') == 'asa'), None)
        if asa_project:
            print(f"\n🎯 PROJETO ASA ENCONTRADO!")
            print(f"   Nome: {asa_project.get('name')}")
            print(f"   ID: {asa_project.get('id')}")
            print(f"   URL: https://pista.decea.mil.br/project/{asa_project.get('slug')}/timeline")
        
        print("\n✅ TESTE 2 PASSOU!")
        
    except Exception as e:
        print(f"\n❌ ERRO AO BUSCAR PROJETOS: {str(e)}")
        pytest.fail(f"Falha ao buscar projetos: {str(e)}")


@pytest.mark.asyncio
async def test_full_flow():
    """Test 3: Complete flow - Auth + Projects + User Stories"""
    print("\n" + "="*60)
    print("TEST 3: FLUXO COMPLETO (AUTH + PROJECTS + USER STORIES)")
    print("="*60)
    
    client = TaigaClient()
    
    try:
        # Step 1: Authenticate
        print(f"\n📡 Passo 1: Autenticando...")
        await client.login(TEST_USERNAME, TEST_PASSWORD, TEST_TAIGA_URL)
        print("✅ Autenticado!")
        
        # Step 2: Get projects
        print(f"\n📋 Passo 2: Buscando projetos...")
        projects = await client.get_projects()
        print(f"✅ {len(projects)} projetos encontrados!")
        
        # Step 3: Get first project details
        if projects:
            first_project = projects[0]
            print(f"\n🔍 Passo 3: Detalhes do projeto '{first_project.get('name')}'...")
            project_details = await client.get_project(first_project['id'])
            print(f"✅ Detalhes carregados!")
            
            # Step 4: Get user stories
            print(f"\n📖 Passo 4: Buscando User Stories...")
            user_stories = await client.get_user_stories(first_project['id'])
            print(f"✅ {len(user_stories)} User Stories encontradas!")
            
            if user_stories:
                print(f"\n📝 Primeiras User Stories:")
                for i, story in enumerate(user_stories[:3], 1):
                    print(f"   {i}. #{story.get('ref')}: {story.get('subject')}")
        
        print("\n✅ TESTE 3 PASSOU - FLUXO COMPLETO FUNCIONAL!")
        
    except Exception as e:
        print(f"\n❌ ERRO NO FLUXO COMPLETO: {str(e)}")
        pytest.fail(f"Falha no fluxo completo: {str(e)}")


if __name__ == "__main__":
    print("\n" + "="*60)
    print("EXECUTANDO TESTES DE INTEGRAÇÃO COM TAIGA")
    print("="*60)
    
    # Run tests
    asyncio.run(test_authentication())
    asyncio.run(test_get_projects())
    asyncio.run(test_full_flow())
    
    print("\n" + "="*60)
    print("✅ TODOS OS TESTES PASSARAM!")
    print("="*60)
