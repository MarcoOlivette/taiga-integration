"""
Teste simples: criar 1 tarefa usando bulk_create_tasks
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.taiga_service import taiga_service
from dotenv import load_dotenv

load_dotenv()

# Configurações
TAIGA_URL = "https://pista.decea.mil.br/api/v1"
USERNAME = os.getenv("TEST_USERNAME", "marcoolivette")
PASSWORD = os.getenv("TEST_PASSWORD")

# Dados
PROJECT_ID = 133  # DASA
USER_STORY_ID = 4861  # US específica

# Tarefa de teste
TEST_TASK = {
    "subject": "[TESTE] Tarefa de teste para validar bulk_create",
    "description": "Esta é uma tarefa de teste criada para validar o funcionamento do bulk_create_tasks"
}


def main():
    print("=" * 80)
    print("  TESTE: Criar 1 tarefa usando bulk_create_tasks")
    print("=" * 80)
    
    # 1. Login
    print("\n🔐 Fazendo login...")
    try:
        login_result = taiga_service.login(USERNAME, PASSWORD, TAIGA_URL)
        user = login_result['user']
        print(f"✅ Login OK - {user['full_name']}")
    except Exception as e:
        print(f"❌ Erro no login: {str(e)}")
        return
    
    # 2. Criar tarefa
    print(f"\n📝 Criando tarefa de teste...")
    print(f"   Projeto: {PROJECT_ID}")
    print(f"   User Story: {USER_STORY_ID}")
    print(f"   Subject: {TEST_TASK['subject']}")
    
    try:
        results = taiga_service.bulk_create_tasks(PROJECT_ID, [TEST_TASK])
        
        if results and len(results) > 0:
            result = results[0]
            
            if 'error' in result:
                print(f"\n❌ Erro ao criar tarefa:")
                print(f"   {result['error']}")
            else:
                print(f"\n✅ Tarefa criada com sucesso!")
                print(f"   ID: {result['id']}")
                print(f"   Ref: #{result['ref']}")
                print(f"   Subject: {result['subject']}")
                print(f"   Status: {result.get('status_extra_info', {}).get('name', 'N/A')}")
                print(f"\n🔗 https://pista.decea.mil.br/project/asa/task/{result['ref']}")
        else:
            print(f"\n❌ Nenhum resultado retornado")
            
    except Exception as e:
        print(f"\n❌ Exceção ao criar tarefa:")
        print(f"   {str(e)}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "=" * 80)


if __name__ == "__main__":
    main()
