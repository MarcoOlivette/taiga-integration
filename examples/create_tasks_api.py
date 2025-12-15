"""
Exemplo de uso da API para criar tarefas em massa via código Python

Este script demonstra como usar a API REST para criar tarefas
no Taiga sem precisar da interface web.
"""

import requests
import json

# Configurações
API_BASE_URL = "http://localhost:3000/api"
TAIGA_URL = "https://pista.decea.mil.br/api/v1"
USERNAME = "seu_usuario"
PASSWORD = "sua_senha"

# Dados do projeto
PROJECT_ID = 133  # DASA
USER_STORY_ID = 5258  # ID da User Story


def login():
    """Faz login e retorna o token"""
    response = requests.post(
        f"{API_BASE_URL}/auth/login",
        json={
            "username": USERNAME,
            "password": PASSWORD,
            "taiga_url": TAIGA_URL
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        token = data["data"]["auth_token"]
        print(f"✅ Login realizado com sucesso!")
        return token
    else:
        print(f"❌ Erro no login: {response.text}")
        return None


def create_tasks_bulk(token, project_id, user_story_id, tasks):
    """
    Cria múltiplas tarefas de uma vez
    
    Args:
        token: Token de autenticação
        project_id: ID do projeto
        user_story_id: ID da User Story
        tasks: Lista de dicionários com 'subject' e 'description'
    """
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    response = requests.post(
        f"{API_BASE_URL}/projects/{project_id}/userstories/{user_story_id}/tasks/bulk",
        headers=headers,
        json={"tasks": tasks}
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"\n✅ {data['message']}")
        print(f"\nTarefas criadas:")
        for task in data['data']:
            print(f"  - #{task['ref']}: {task['subject']}")
        return data['data']
    else:
        print(f"❌ Erro ao criar tarefas: {response.text}")
        return None


def main():
    """Exemplo de uso"""
    print("=" * 70)
    print("  Criação de Tarefas em Massa via API")
    print("=" * 70)
    
    # 1. Fazer login
    print("\n1️⃣  Fazendo login...")
    token = login()
    
    if not token:
        return
    
    # 2. Definir as tarefas a serem criadas
    print(f"\n2️⃣  Preparando tarefas para o projeto {PROJECT_ID}, US #{USER_STORY_ID}...")
    
    tasks_to_create = [
        {
            "subject": "Tarefa A - Implementar funcionalidade X",
            "description": "Descrição detalhada da tarefa A\nCom múltiplas linhas"
        },
        {
            "subject": "Tarefa B - Criar testes unitários",
            "description": "Criar testes para a funcionalidade X"
        },
        {
            "subject": "Tarefa C - Documentar código",
            "description": "Adicionar docstrings e comentários"
        }
    ]
    
    print(f"   📝 {len(tasks_to_create)} tarefas preparadas")
    
    # 3. Criar as tarefas
    print(f"\n3️⃣  Criando tarefas...")
    created_tasks = create_tasks_bulk(token, PROJECT_ID, USER_STORY_ID, tasks_to_create)
    
    if created_tasks:
        print(f"\n🎉 Processo concluído com sucesso!")
    else:
        print(f"\n❌ Falha ao criar tarefas")
    
    print("\n" + "=" * 70)


if __name__ == "__main__":
    main()
