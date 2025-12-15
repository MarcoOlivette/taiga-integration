"""
Test Runner - Orchestrator de Testes
Executa todos os testes de integração em sequência
"""
import sys
import os

# Adicionar diretório de testes ao path
sys.path.insert(0, os.path.dirname(__file__))

from test_auth import test_authentication
from test_projects import test_list_projects, test_get_project_by_slug, test_get_project_metadata
from test_user_stories import test_list_user_stories, test_get_userstory_by_ref
from test_epics import test_list_epics
from test_tasks import test_list_tasks, test_get_task_by_ref, test_filter_tasks_by_userstory


def run_all_tests():
    """Executa todos os testes em sequência"""
    print("\n" + "=" * 70)
    print("  TESTES DE INTEGRAÇÃO - PYTHON-TAIGA LIBRARY")
    print("  Modo: SOMENTE LEITURA (sem operações de escrita)")
    print("=" * 70)
    
    # Contadores
    tests_passed = 0
    tests_failed = 0
    
    try:
        # ========== AUTENTICAÇÃO ==========
        print("\n" + "█" * 70)
        print("  MÓDULO: AUTENTICAÇÃO")
        print("█" * 70)
        api = test_authentication()
        tests_passed += 1
        
        # ========== PROJETOS ==========
        print("\n" + "█" * 70)
        print("  MÓDULO: PROJETOS")
        print("█" * 70)
        
        projects = test_list_projects(api)
        tests_passed += 1
        
        project = test_get_project_by_slug(api)
        tests_passed += 1
        
        test_get_project_metadata(project)
        tests_passed += 1
        
        # ========== USER STORIES ==========
        print("\n" + "█" * 70)
        print("  MÓDULO: USER STORIES")
        print("█" * 70)
        
        stories = test_list_user_stories(api, project)
        tests_passed += 1
        
        test_get_userstory_by_ref(api, project, stories)
        tests_passed += 1
        
        # ========== ÉPICOS ==========
        print("\n" + "█" * 70)
        print("  MÓDULO: ÉPICOS")
        print("█" * 70)
        
        epics = test_list_epics(api, project)
        tests_passed += 1
        
        # ========== TAREFAS ==========
        print("\n" + "█" * 70)
        print("  MÓDULO: TAREFAS")
        print("█" * 70)
        
        tasks = test_list_tasks(api, project)
        tests_passed += 1
        
        test_get_task_by_ref(api, project, tasks)
        tests_passed += 1
        
        test_filter_tasks_by_userstory(api, project, stories)
        tests_passed += 1
        
        # ========== RESUMO FINAL ==========
        print("\n" + "=" * 70)
        print("  ✅ TODOS OS TESTES PASSARAM COM SUCESSO!")
        print("=" * 70)
        print(f"\n📊 Resumo dos Testes:")
        print(f"   ✅ Testes passados: {tests_passed}")
        print(f"   ❌ Testes falhados: {tests_failed}")
        print(f"\n📊 Resumo dos Dados:")
        print(f"   - Projetos encontrados: {len(projects)}")
        print(f"   - User Stories no projeto '{project.name}': {len(stories)}")
        print(f"   - Épicos no projeto '{project.name}': {len(epics)}")
        print(f"   - Tarefas no projeto '{project.name}': {len(tasks)}")
        print(f"   - Membros do projeto: {len(project.members)}")
        print(f"\n🎉 A biblioteca python-taiga está funcionando perfeitamente!")
        print("=" * 70 + "\n")
        
        return 0  # Success
        
    except Exception as e:
        tests_failed += 1
        print("\n" + "=" * 70)
        print("  ❌ FALHA NOS TESTES")
        print("=" * 70)
        print(f"\n📊 Resumo:")
        print(f"   ✅ Testes passados: {tests_passed}")
        print(f"   ❌ Testes falhados: {tests_failed}")
        print(f"\nErro: {str(e)}\n")
        print("=" * 70 + "\n")
        
        return 1  # Failure


if __name__ == "__main__":
    exit_code = run_all_tests()
    sys.exit(exit_code)
