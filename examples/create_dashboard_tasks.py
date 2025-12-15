"""
Script para criar tarefas em massa na US #4861 do projeto DASA
Versão otimizada: usa bulk_create_tasks com verificação de duplicatas
"""

import sys
import os

# Adicionar o diretório raiz ao path para importar o taiga_service
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.taiga_service import taiga_service
from dotenv import load_dotenv

load_dotenv()

# Configurações
TAIGA_URL = "https://pista.decea.mil.br/api/v1"
USERNAME = os.getenv("TEST_USERNAME", "marcoolivette")
PASSWORD = os.getenv("TEST_PASSWORD")

# Dados do projeto
PROJECT_ID = 133  # DASA
USER_STORY_ID = 4861  # US específica

# Lista de tarefas a serem criadas
TASKS = [
    # Filtros Gerais
    {
        "subject": "[REF: Filtros Gerais] [BACKEND] Criar serviço para calcular a diferença de tempo (EOBT vs Envio)",
        "description": "Criar serviço para calcular a diferença de tempo (EOBT vs Envio) e classificar se houve tensão baseada no parâmetro dinâmico (5, 10 ou 20 min).",
        "user_story": USER_STORY_ID
    },
    {
        "subject": "[REF: Filtros Gerais] [FRONTEND] Implementar store no Pinia para gerenciar estado global",
        "description": "Implementar store no Pinia para gerenciar o estado global dos filtros (Data, Aeródromo, Nível de Tensão e Tipo de Voo).",
        "user_story": USER_STORY_ID
    },
    {
        "subject": "[REF: Filtros Gerais] [BACKEND] Implementar filtro de Tipo de Operação",
        "description": "Implementar filtro de 'Tipo de Operação' (Regular vs Geral) nas queries base do relatório.",
        "user_story": USER_STORY_ID
    },
    
    # Gráfico Tensão Total (Pizza)
    {
        "subject": "[REF: Gráfico Tensão Total (Pizza)] [BACKEND] Criar endpoint para dados gerais",
        "description": "Criar endpoint que retorna os números absolutos e percentuais de planos 'Normais' vs 'Sob Tensão'.",
        "user_story": USER_STORY_ID
    },
    {
        "subject": "[REF: Gráfico Tensão Total (Pizza)] [FRONTEND] Desenvolver componente visual Pizza/Rosca",
        "description": "Desenvolver componente visual (Pizza/Rosca) que consome os dados gerais e reage às mudanças da Store.",
        "user_story": USER_STORY_ID
    },
    {
        "subject": "[REF: Gráfico Tensão Total (Pizza)] [TESTES] Validar cálculo de porcentagem",
        "description": "Validar se o cálculo de porcentagem está correto e se a soma total bate com os registros.",
        "user_story": USER_STORY_ID
    },
    
    # Gráfico por CAIS (Barras)
    {
        "subject": "[REF: Gráfico por CAIS (Barras)] [BACKEND] Criar query de agrupamento por CAIS",
        "description": "Criar query de agrupamento para contar tensões separadas por cada CAIS.",
        "user_story": USER_STORY_ID
    },
    {
        "subject": "[REF: Gráfico por CAIS (Barras)] [FRONTEND] Desenvolver componente de barras comparativo",
        "description": "Desenvolver componente de barras comparativo entre os diferentes centros (CAIS).",
        "user_story": USER_STORY_ID
    },
    
    # Gráfico por Aeródromo (Ranking)
    {
        "subject": "[REF: Gráfico por Aeródromo (Ranking)] [BACKEND] Criar endpoint de ranking",
        "description": "Criar endpoint que lista os aeródromos de partida com maior índice de tensão (Top X).",
        "user_story": USER_STORY_ID
    },
    {
        "subject": "[REF: Gráfico por Aeródromo (Ranking)] [FRONTEND] Implementar visualização de ranking",
        "description": "Implementar visualização de lista ou gráfico de barras horizontal para os aeródromos críticos.",
        "user_story": USER_STORY_ID
    },
    
    # Gráfico Temporal (Linha/Hora)
    {
        "subject": "[REF: Gráfico Temporal (Linha/Hora)] [BACKEND] Desenvolver agregação por hora",
        "description": "Desenvolver agregação de dados de tensão por hora (00h-23h) para análise de picos diários.",
        "user_story": USER_STORY_ID
    },
    {
        "subject": "[REF: Gráfico Temporal (Linha/Hora)] [FRONTEND] Criar gráfico de linha Time Series",
        "description": "Criar gráfico de linha (Time Series) mostrando a evolução da tensão ao longo do dia.",
        "user_story": USER_STORY_ID
    },
    
    # Gráfico Temporal (Heatmap/Dia)
    {
        "subject": "[REF: Gráfico Temporal (Heatmap/Dia)] [BACKEND] Criar agregação por dia",
        "description": "Criar agregação de dados por dia da semana e dia do mês.",
        "user_story": USER_STORY_ID
    },
    {
        "subject": "[REF: Gráfico Temporal (Heatmap/Dia)] [FRONTEND] Implementar Heatmap",
        "description": "Implementar visualização (Heatmap ou Barras Agrupadas) para identificar dias críticos na semana.",
        "user_story": USER_STORY_ID
    },
    
    # Todos os Gráficos
    {
        "subject": "[REF: Todos os Gráficos] [TESTES] Criar testes para lógica borderline",
        "description": "Criar testes unitários para a lógica de 'borderline' (ex: 19min 59seg é tensão? 20min 01seg é normal?).",
        "user_story": USER_STORY_ID
    },
    {
        "subject": "[REF: Todos os Gráficos] [DOCUMENTACAO] Documentar regras matemáticas",
        "description": "Documentar as regras matemáticas de arredondamento de tempo utilizadas nos cálculos.",
        "user_story": USER_STORY_ID
    },
    
    # Dashboard Geral
    {
        "subject": "[REF: Dashboard Geral] [FRONTEND] Montar layout responsivo",
        "description": "Montar o layout responsivo que orquestra todos os componentes acima na mesma tela.",
        "user_story": USER_STORY_ID
    },
    {
        "subject": "[REF: Dashboard Geral] [TESTES] Teste de integração de filtros",
        "description": "Teste de integração para garantir que ao mudar o filtro 'Regular/Geral', todos os gráficos atualizam simultaneamente.",
        "user_story": USER_STORY_ID
    },
    
    # Seletor de Turnos
    {
        "subject": "[REF: Seletor de Turnos] [BACKEND] Implementar lógica de Data Operacional",
        "description": "Implementar lógica de 'Data Operacional' para lidar com turnos que cruzam a meia-noite (ex: Turno Noite que termina no dia seguinte).",
        "user_story": USER_STORY_ID
    },
    {
        "subject": "[REF: Seletor de Turnos] [FRONTEND] Criar componente de seleção de datas",
        "description": "Criar componente de seleção de datas que permite escolher 'Manhã' ou 'Noite' e converte para o range de horários correto.",
        "user_story": USER_STORY_ID
    },
    {
        "subject": "[REF: Seletor de Turnos] [TESTES] Testar mensagens em horários críticos",
        "description": "Testar exaustivamente mensagens enviadas às 23:59 e 00:01 para garantir que caem no mesmo turno.",
        "user_story": USER_STORY_ID
    },
    
    # Filtro por CAIS
    {
        "subject": "[REF: Filtro por CAIS] [FRONTEND] Implementar restrição visual",
        "description": "Implementar restrição visual que obriga a seleção de um único CAIS antes de liberar a busca.",
        "user_story": USER_STORY_ID
    },
    {
        "subject": "[REF: Filtro por CAIS] [BACKEND] Implementar validação na API",
        "description": "Implementar validação na API que rejeita requisições sem um CAIS definido (segurança/performance).",
        "user_story": USER_STORY_ID
    },
    
    # Cards de KPI (Resumo)
    {
        "subject": "[REF: Cards de KPI (Resumo)] [BACKEND] Criar endpoint de produtividade",
        "description": "Criar endpoint que calcula a média de produtividade do turno (Total Mensagens / Total Operadores).",
        "user_story": USER_STORY_ID
    },
    {
        "subject": "[REF: Cards de KPI (Resumo)] [FRONTEND] Desenvolver componentes de topo",
        "description": "Desenvolver componentes de topo para exibir 'Total do Turno' e 'Média do Turno'.",
        "user_story": USER_STORY_ID
    },
    
    # Tabela de Operadores
    {
        "subject": "[REF: Tabela de Operadores] [BACKEND] Criar query agrupada por operador",
        "description": "Criar query que conta FPL, CHG, DLA, CNL agrupados por ID do operador.",
        "user_story": USER_STORY_ID
    },
    {
        "subject": "[REF: Tabela de Operadores] [BACKEND] Otimizar query de somatório",
        "description": "Otimizar query para trazer o somatório total de mensagens por operador já calculado.",
        "user_story": USER_STORY_ID
    },
    {
        "subject": "[REF: Tabela de Operadores] [FRONTEND] Implementar Data Grid",
        "description": "Implementar estrutura da tabela (Data Grid) para listar os operadores e suas contagens.",
        "user_story": USER_STORY_ID
    },
    {
        "subject": "[REF: Tabela de Operadores] [FRONTEND] Integrar Store Pinia",
        "description": "Integrar Store (Pinia) para armazenar os dados da tabela e evitar re-fetching ao trocar de aba.",
        "user_story": USER_STORY_ID
    },
    
    # Colunas da Tabela
    {
        "subject": "[REF: Colunas da Tabela] [FRONTEND] Implementar ordenação de colunas",
        "description": "Implementar lógica de ordenação (sort) nas colunas de tipos de mensagem (quem enviou mais FPL, etc).",
        "user_story": USER_STORY_ID
    },
    
    # Formatação Condicional (Cores)
    {
        "subject": "[REF: Formatação Condicional (Cores)] [FRONTEND] Implementar lógica visual",
        "description": "Implementar lógica visual: se total_operador > media_turno pinta de verde, senão vermelho.",
        "user_story": USER_STORY_ID
    },
    {
        "subject": "[REF: Formatação Condicional (Cores)] [TESTES] Testar aplicação de CSS",
        "description": "Testar se a classe CSS correta é aplicada baseada em mocks de média e total.",
        "user_story": USER_STORY_ID
    },
    {
        "subject": "[REF: Tabela de Operadores] [TESTES] Validar divisão por zero",
        "description": "Validar o cálculo de média quando o número de operadores é zero (evitar divisão por zero).",
        "user_story": USER_STORY_ID
    },
    
    # Exportação de Dados
    {
        "subject": "[REF: Exportação de Dados] [BACKEND] Criar rota para gerar CSV",
        "description": "Criar rota para gerar CSV com os dados brutos do turno selecionado.",
        "user_story": USER_STORY_ID
    },
    {
        "subject": "[REF: Exportação de Dados] [FRONTEND] Adicionar botão de download",
        "description": "Adicionar botão de download e conectar com a rota de exportação.",
        "user_story": USER_STORY_ID
    },
    
    # Dashboard Monitoramento
    {
        "subject": "[REF: Dashboard Monitoramento] [DOCUMENTACAO] Documentar horários de turnos",
        "description": "Documentar os horários exatos de início e fim de cada turno configurados no sistema.",
        "user_story": USER_STORY_ID
    },
    {
        "subject": "[REF: Dashboard Monitoramento] [DOCUMENTACAO] Explicar regra de Média do Turno",
        "description": "Explicar a regra de 'Média do Turno' para evitar dúvidas futuras sobre a produtividade.",
        "user_story": USER_STORY_ID
    },
    
    # Geral
    {
        "subject": "[REF: Geral] [FRONTEND] Implementar feedback visual de loading",
        "description": "Implementar feedback visual (Skeletons/Spinners) durante o carregamento das tabelas e gráficos.",
        "user_story": USER_STORY_ID
    },
    {
        "subject": "[REF: Geral] [FRONTEND] Criar tratativa de erro visual",
        "description": "Criar tratativa de erro visual caso a API falhe ou não encontre dados para o turno.",
        "user_story": USER_STORY_ID
    },
    {
        "subject": "[REF: Geral] [TESTES] Teste E2E de fluxo completo",
        "description": "Teste E2E simples simulando um fluxo completo de pesquisa e visualização de resultados.",
        "user_story": USER_STORY_ID
    }
]


def main():
    """Executa o script"""
    print("=" * 80)
    print("  Criação de Tarefas em Massa - Dashboard de Monitoramento de Tensão")
    print("  Usando taiga_service.bulk_create_tasks com verificação de duplicatas")
    print("=" * 80)
    
    # 1. Fazer login
    print("\n🔐 Fazendo login no Taiga...")
    try:
        login_result = taiga_service.login(USERNAME, PASSWORD, TAIGA_URL)
        user = login_result['user']
        print(f"✅ Login realizado com sucesso!")
        print(f"   Usuário: {user['full_name']} ({user['username']})")
    except Exception as e:
        print(f"❌ Erro no login: {str(e)}")
        return
    
    # 2. Buscar tarefas existentes
    print(f"\n🔍 Verificando tarefas existentes na US #{USER_STORY_ID}...")
    try:
        existing_tasks = taiga_service.get_tasks(PROJECT_ID, USER_STORY_ID)
        existing_subjects = {task['subject'] for task in existing_tasks}
        print(f"   Encontradas {len(existing_subjects)} tarefas existentes")
    except Exception as e:
        print(f"⚠️  Erro ao buscar tarefas existentes: {str(e)}")
        existing_subjects = set()
    
    # 3. Filtrar tarefas que já existem
    tasks_to_create = []
    already_exist = []
    
    for task in TASKS:
        if task["subject"] in existing_subjects:
            already_exist.append(task["subject"])
        else:
            tasks_to_create.append(task)
    
    if already_exist:
        print(f"\n⏭️  {len(already_exist)} tarefas já existem (pulando):")
        for subject in already_exist[:5]:
            print(f"   ✓ {subject[:70]}...")
        if len(already_exist) > 5:
            print(f"   ... e mais {len(already_exist) - 5}")
    
    if not tasks_to_create:
        print(f"\n✅ Todas as tarefas já existem! Nada a fazer.")
        print(f"\n🔗 Acesse: https://pista.decea.mil.br/project/asa/us/{USER_STORY_ID}")
        return
    
    # 4. Criar tarefas usando bulk_create_tasks
    print(f"\n📝 Criando {len(tasks_to_create)} novas tarefas usando bulk_create_tasks...")
    print(f"   Projeto: {PROJECT_ID} (DASA)")
    print(f"   User Story: #{USER_STORY_ID}")
    
    try:
        results = taiga_service.bulk_create_tasks(PROJECT_ID, tasks_to_create)
        
        # Separar sucessos e falhas
        created = [r for r in results if 'error' not in r]
        failed = [r for r in results if 'error' in r]
        
        # 5. Resumo
        print(f"\n" + "="*80)
        print(f"📊 RESUMO:")
        print(f"   ✅ Criadas com sucesso: {len(created)}")
        print(f"   ⏭️  Já existiam: {len(already_exist)}")
        print(f"   ❌ Falharam: {len(failed)}")
        print(f"   📋 Total na lista: {len(TASKS)}")
        print(f"="*80)
        
        if created:
            print(f"\n✅ Tarefas criadas:")
            for task in created[:10]:
                print(f"   #{task['ref']}: {task['subject'][:60]}...")
            if len(created) > 10:
                print(f"   ... e mais {len(created) - 10}")
        
        if failed:
            print(f"\n❌ Tarefas que falharam:")
            for result in failed:
                print(f"   - {result['data']['subject'][:60]}...")
                print(f"     Erro: {result['error'][:100]}")
        
        print(f"\n🎉 Processo concluído!")
        print(f"🔗 Acesse: https://pista.decea.mil.br/project/asa/us/{USER_STORY_ID}")
        
    except Exception as e:
        print(f"\n❌ Erro ao criar tarefas: {str(e)}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "=" * 80)


if __name__ == "__main__":
    main()
