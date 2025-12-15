"""
Script para deletar tarefas #4871 a #4910 do projeto DASA
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
START_REF = 4871
END_REF = 4910


def main():
    print("=" * 80)
    print("  Deletar Tarefas #4871 a #4910 do projeto DASA")
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
    
    # 2. Buscar todas as tarefas do projeto
    print(f"\n🔍 Buscando tarefas do projeto {PROJECT_ID}...")
    try:
        all_tasks = taiga_service.get_tasks(PROJECT_ID)
        print(f"   Encontradas {len(all_tasks)} tarefas no projeto")
    except Exception as e:
        print(f"❌ Erro ao buscar tarefas: {str(e)}")
        return
    
    # 3. Filtrar tarefas no range
    tasks_to_delete = [
        task for task in all_tasks 
        if task['ref'] >= START_REF and task['ref'] <= END_REF
    ]
    
    if not tasks_to_delete:
        print(f"\n⚠️  Nenhuma tarefa encontrada no range #{START_REF} a #{END_REF}")
        return
    
    print(f"\n📋 Encontradas {len(tasks_to_delete)} tarefas para deletar:")
    for task in tasks_to_delete[:5]:
        print(f"   - #{task['ref']}: {task['subject'][:60]}...")
    if len(tasks_to_delete) > 5:
        print(f"   ... e mais {len(tasks_to_delete) - 5}")
    
    # 4. Confirmar
    print(f"\n⚠️  ATENÇÃO: Isso vai deletar {len(tasks_to_delete)} tarefas!")
    print(f"   Range: #{START_REF} a #{END_REF}")
    
    # 5. Deletar
    print(f"\n🗑️  Deletando tarefas...")
    deleted = []
    failed = []
    
    for i, task in enumerate(tasks_to_delete, 1):
        print(f"   [{i}/{len(tasks_to_delete)}] Deletando #{task['ref']}: {task['subject'][:50]}...")
        
        try:
            taiga_service.delete_task(task['id'])
            print(f"      ✅ Deletada")
            deleted.append(task['ref'])
        except Exception as e:
            error_msg = str(e)[:100]
            print(f"      ❌ Erro: {error_msg}")
            failed.append({"ref": task['ref'], "error": error_msg})
    
    # 6. Resumo
    print(f"\n" + "="*80)
    print(f"📊 RESUMO:")
    print(f"   ✅ Deletadas: {len(deleted)}")
    print(f"   ❌ Falharam: {len(failed)}")
    print(f"   📋 Total: {len(tasks_to_delete)}")
    print(f"="*80)
    
    if failed:
        print(f"\n❌ Tarefas que falharam:")
        for item in failed:
            print(f"   - #{item['ref']}: {item['error']}")
    
    if deleted:
        print(f"\n🎉 {len(deleted)} tarefas deletadas com sucesso!")
    
    print("\n" + "=" * 80)


if __name__ == "__main__":
    main()
