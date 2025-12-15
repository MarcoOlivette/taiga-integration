"""
Script para criar tarefas uma a uma na US #4861 do projeto DASA
Usando o formato correto da API do Taiga
"""

import sys
import os
import time

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
USER_STORY_ID = 4861  # US #4861
STATUS_ID = 667  # Em Análise

# Lista de tarefas (SEM user_story no dict, vamos adicionar depois)
TASKS = [
    {"subject": "[REF: Filtros Gerais] [BACKEND] Criar serviço para calcular a diferença de tempo (EOBT vs Envio)", "description": "Criar serviço para calcular a diferença de tempo (EOBT vs Envio) e classificar se houve tensão baseada no parâmetro dinâmico (5, 10 ou 20 min)."},
    {"subject": "[REF: Filtros Gerais] [FRONTEND] Implementar store no Pinia para gerenciar estado global", "description": "Implementar store no Pinia para gerenciar o estado global dos filtros (Data, Aeródromo, Nível de Tensão e Tipo de Voo)."},
    {"subject": "[REF: Filtros Gerais] [BACKEND] Implementar filtro de Tipo de Operação", "description": "Implementar filtro de 'Tipo de Operação' (Regular vs Geral) nas queries base do relatório."},
    {"subject": "[REF: Gráfico Tensão Total (Pizza)] [BACKEND] Criar endpoint para dados gerais", "description": "Criar endpoint que retorna os números absolutos e percentuais de planos 'Normais' vs 'Sob Tensão'."},
    {"subject": "[REF: Gráfico Tensão Total (Pizza)] [FRONTEND] Desenvolver componente visual Pizza/Rosca", "description": "Desenvolver componente visual (Pizza/Rosca) que consome os dados gerais e reage às mudanças da Store."},
    {"subject": "[REF: Gráfico Tensão Total (Pizza)] [TESTES] Validar cálculo de porcentagem", "description": "Validar se o cálculo de porcentagem está correto e se a soma total bate com os registros."},
    {"subject": "[REF: Gráfico por CAIS (Barras)] [BACKEND] Criar query de agrupamento por CAIS", "description": "Criar query de agrupamento para contar tensões separadas por cada CAIS."},
    {"subject": "[REF: Gráfico por CAIS (Barras)] [FRONTEND] Desenvolver componente de barras comparativo", "description": "Desenvolver componente de barras comparativo entre os diferentes centros (CAIS)."},
    {"subject": "[REF: Gráfico por Aeródromo (Ranking)] [BACKEND] Criar endpoint de ranking", "description": "Criar endpoint que lista os aeródromos de partida com maior índice de tensão (Top X)."},
    {"subject": "[REF: Gráfico por Aeródromo (Ranking)] [FRONTEND] Implementar visualização de ranking", "description": "Implementar visualização de lista ou gráfico de barras horizontal para os aeródromos críticos."},
    {"subject": "[REF: Gráfico Temporal (Linha/Hora)] [BACKEND] Desenvolver agregação por hora", "description": "Desenvolver agregação de dados de tensão por hora (00h-23h) para análise de picos diários."},
    {"subject": "[REF: Gráfico Temporal (Linha/Hora)] [FRONTEND] Criar gráfico de linha Time Series", "description": "Criar gráfico de linha (Time Series) mostrando a evolução da tensão ao longo do dia."},
    {"subject": "[REF: Gráfico Temporal (Heatmap/Dia)] [BACKEND] Criar agregação por dia", "description": "Criar agregação de dados por dia da semana e dia do mês."},
    {"subject": "[REF: Gráfico Temporal (Heatmap/Dia)] [FRONTEND] Implementar Heatmap", "description": "Implementar visualização (Heatmap ou Barras Agrupadas) para identificar dias críticos na semana."},
    {"subject": "[REF: Todos os Gráficos] [TESTES] Criar testes para lógica borderline", "description": "Criar testes unitários para a lógica de 'borderline' (ex: 19min 59seg é tensão? 20min 01seg é normal?)."},
    {"subject": "[REF: Todos os Gráficos] [DOCUMENTACAO] Documentar regras matemáticas", "description": "Documentar as regras matemáticas de arredondamento de tempo utilizadas nos cálculos."},
    {"subject": "[REF: Dashboard Geral] [FRONTEND] Montar layout responsivo", "description": "Montar o layout responsivo que orquestra todos os componentes acima na mesma tela."},
    {"subject": "[REF: Dashboard Geral] [TESTES] Teste de integração de filtros", "description": "Teste de integração para garantir que ao mudar o filtro 'Regular/Geral', todos os gráficos atualizam simultaneamente."},
    {"subject": "[REF: Seletor de Turnos] [BACKEND] Implementar lógica de Data Operacional", "description": "Implementar lógica de 'Data Operacional' para lidar com turnos que cruzam a meia-noite (ex: Turno Noite que termina no dia seguinte)."},
    {"subject": "[REF: Seletor de Turnos] [FRONTEND] Criar componente de seleção de datas", "description": "Criar componente de seleção de datas que permite escolher 'Manhã' ou 'Noite' e converte para o range de horários correto."},
    {"subject": "[REF: Seletor de Turnos] [TESTES] Testar mensagens em horários críticos", "description": "Testar exaustivamente mensagens enviadas às 23:59 e 00:01 para garantir que caem no mesmo turno."},
    {"subject": "[REF: Filtro por CAIS] [FRONTEND] Implementar restrição visual", "description": "Implementar restrição visual que obriga a seleção de um único CAIS antes de liberar a busca."},
    {"subject": "[REF: Filtro por CAIS] [BACKEND] Implementar validação na API", "description": "Implementar validação na API que rejeita requisições sem um CAIS definido (segurança/performance)."},
    {"subject": "[REF: Cards de KPI (Resumo)] [BACKEND] Criar endpoint de produtividade", "description": "Criar endpoint que calcula a média de produtividade do turno (Total Mensagens / Total Operadores)."},
    {"subject": "[REF: Cards de KPI (Resumo)] [FRONTEND] Desenvolver componentes de topo", "description": "Desenvolver componentes de topo para exibir 'Total do Turno' e 'Média do Turno'."},
    {"subject": "[REF: Tabela de Operadores] [BACKEND] Criar query agrupada por operador", "description": "Criar query que conta FPL, CHG, DLA, CNL agrupados por ID do operador."},
    {"subject": "[REF: Tabela de Operadores] [BACKEND] Otimizar query de somatório", "description": "Otimizar query para trazer o somatório total de mensagens por operador já calculado."},
    {"subject": "[REF: Tabela de Operadores] [FRONTEND] Implementar Data Grid", "description": "Implementar estrutura da tabela (Data Grid) para listar os operadores e suas contagens."},
    {"subject": "[REF: Tabela de Operadores] [FRONTEND] Integrar Store Pinia", "description": "Integrar Store (Pinia) para armazenar os dados da tabela e evitar re-fetching ao trocar de aba."},
    {"subject": "[REF: Colunas da Tabela] [FRONTEND] Implementar ordenação de colunas", "description": "Implementar lógica de ordenação (sort) nas colunas de tipos de mensagem (quem enviou mais FPL, etc)."},
    {"subject": "[REF: Formatação Condicional (Cores)] [FRONTEND] Implementar lógica visual", "description": "Implementar lógica visual: se total_operador > media_turno pinta de verde, senão vermelho."},
    {"subject": "[REF: Formatação Condicional (Cores)] [TESTES] Testar aplicação de CSS", "description": "Testar se a classe CSS correta é aplicada baseada em mocks de média e total."},
    {"subject": "[REF: Tabela de Operadores] [TESTES] Validar divisão por zero", "description": "Validar o cálculo de média quando o número de operadores é zero (evitar divisão por zero)."},
    {"subject": "[REF: Exportação de Dados] [BACKEND] Criar rota para gerar CSV", "description": "Criar rota para gerar CSV com os dados brutos do turno selecionado."},
    {"subject": "[REF: Exportação de Dados] [FRONTEND] Adicionar botão de download", "description": "Adicionar botão de download e conectar com a rota de exportação."},
    {"subject": "[REF: Dashboard Monitoramento] [DOCUMENTACAO] Documentar horários de turnos", "description": "Documentar os horários exatos de início e fim de cada turno configurados no sistema."},
    {"subject": "[REF: Dashboard Monitoramento] [DOCUMENTACAO] Explicar regra de Média do Turno", "description": "Explicar a regra de 'Média do Turno' para evitar dúvidas futuras sobre a produtividade."},
    {"subject": "[REF: Geral] [FRONTEND] Implementar feedback visual de loading", "description": "Implementar feedback visual (Skeletons/Spinners) durante o carregamento das tabelas e gráficos."},
    {"subject": "[REF: Geral] [FRONTEND] Criar tratativa de erro visual", "description": "Criar tratativa de erro visual caso a API falhe ou não encontre dados para o turno."},
    {"subject": "[REF: Geral] [TESTES] Teste E2E de fluxo completo", "description": "Teste E2E simples simulando um fluxo completo de pesquisa e visualização de resultados."}
]


def main():
    print("=" * 80)
    print("  Criação de Tarefas - Dashboard de Monitoramento de Tensão")
    print("  Método: Uma a uma (formato correto da API do Taiga)")
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
    
    # 2. Buscar tarefas existentes
    print(f"\n🔍 Verificando tarefas existentes na US #{USER_STORY_ID}...")
    try:
        existing_tasks = taiga_service.get_tasks(PROJECT_ID, USER_STORY_ID)
        existing_subjects = {task['subject'] for task in existing_tasks}
        print(f"   Encontradas {len(existing_subjects)} tarefas existentes")
    except Exception as e:
        print(f"⚠️  Erro ao buscar: {str(e)}")
        existing_subjects = set()
    
    # 3. Filtrar e criar
    to_create = [t for t in TASKS if t['subject'] not in existing_subjects]
    skipped = len(TASKS) - len(to_create)
    
    if skipped > 0:
        print(f"\n⏭️  {skipped} tarefas já existem (pulando)")
    
    if not to_create:
        print(f"\n✅ Todas as tarefas já existem!")
        return
    
    print(f"\n📝 Criando {len(to_create)} tarefas...")
    print(f"   Projeto: {PROJECT_ID} (DASA)")
    print(f"   User Story: #{USER_STORY_ID}")
    print(f"   Status: {STATUS_ID}")
    
    created = []
    failed = []
    
    for i, task in enumerate(to_create, 1):
        print(f"\n   [{i}/{len(to_create)}] {task['subject'][:60]}...")
        
        try:
            # Criar tarefa SEM user_story (por questão de permissões)
            # Você pode vincular manualmente depois pela interface
            result = taiga_service.create_task(
                PROJECT_ID,
                task['subject'],
                description=task['description'],
                status=STATUS_ID
                # user_story=USER_STORY_ID  # Comentado - sem permissão
            )
            print(f"      ✅ Criada: #{result['ref']}")
            created.append(result)
            time.sleep(0.3)  # Delay para não sobrecarregar
        except Exception as e:
            error_msg = str(e)[:100]
            print(f"      ❌ Erro: {error_msg}")
            failed.append({"task": task, "error": error_msg})
    
    # 4. Resumo
    print(f"\n" + "="*80)
    print(f"📊 RESUMO:")
    print(f"   ✅ Criadas: {len(created)}")
    print(f"   ⏭️  Já existiam: {skipped}")
    print(f"   ❌ Falharam: {len(failed)}")
    print(f"   📋 Total: {len(TASKS)}")
    print(f"="*80)
    
    if failed:
        print(f"\n❌ Tarefas que falharam:")
        for item in failed:
            print(f"   - {item['task']['subject'][:60]}...")
            print(f"     Erro: {item['error']}")
    
    if created:
        print(f"\n🎉 {len(created)} tarefas criadas com sucesso!")
        print(f"🔗 https://pista.decea.mil.br/project/asa/us/{USER_STORY_ID}")
    
    print("\n" + "=" * 80)


if __name__ == "__main__":
    main()
