# Taiga Bulk Task Manager 🚀

Aplicação web poderosa para gerenciamento em massa de tarefas no Taiga, desenvolvida com FastAPI e HTML/CSS/JS moderno. Focada em produtividade e experiência do usuário (UX).

## ✨ Principais Funcionalidades

### ⚡ Gestão de Tarefas

- **Criação em Massa**: Adicione múltiplas tarefas de uma vez com um clique.
- **Edição & Exclusão**: Modifique ou remova tarefas individualmente com facilidade.
- **Controle Total**: Gerencie status, responsáveis e detalhes das tarefas.
- **Preservação de Dados**: Edições em massa preservam descrições e outros campos importantes.

### 🚀 Ações em Massa (Bulk Actions)

- **Atribuição em Massa**: Vincule _todas_ as tarefas listadas a um membro com um único clique.
  - _Smart User Select_: Identifica e destaca o usuário logado (⭐) automaticamente.
  - _Fuzzy Search_: Busca inteligente de membros por nome ou cargo.
- **Atualização de Status em Massa**: Mova todas as tarefas para um novo status instantaneamente.
  - _Segurança_: Integrado com Controle de Concorrência Otimista (OCC) para evitar conflitos.

### ⭐ Favoritos Persistentes (SQLite)

- **Projetos Favoritos**: Salve seus projetos mais usados para acesso rápido.
- **User Stories Favoritas**: Marque as user stories que você acessa frequentemente.
- **Persistência Local**: Dados salvos em banco SQLite local (`favorites.db`).
- **Sem Perda de Dados**: Favoritos mantidos mesmo após fechar o navegador.
- **API RESTful**: Endpoints completos para gerenciar favoritos (ver `docs/FAVORITES_API.md`).

### 🎨 Interface & UX

- **Temas Claro & Escuro**: Alterne entre o modo Dark (padrão) e Light (inspirado no Taiga) com persistência automática.
- **Design Responsivo**: Cores vibrantes, gradientes e layout que se adapta a qualquer tela.
- **Feedback Rico**: Notificações toast, loaders e animações suaves.
- **Listagem Completa**: Sem limite de paginação - visualize todas as tarefas de uma US.

## 🏗️ Estrutura do Projeto

```
taiga-integration/
├── app/                    # Lógica de negócio (Python)
│   ├── taiga_service.py   # Wrapper robusto para API do Taiga
│   ├── database.py        # Modelos SQLAlchemy para favoritos
├── routes/                 # Rotas da API (FastAPI)
│   ├── taiga_routes.py    # Endpoints Taiga
│   ├── favorites_routes.py # Endpoints de favoritos
├── static/                 # Frontend (Vanilla JS + CSS Variables)
│   ├── index.html         # Interface Single Page Application
│   ├── styles.css         # Design System com temas
│   ├── app.js             # Lógica de UI e Estado
│   ├── api.js             # Camada de cliente HTTP
├── tests/                  # Testes de Integração
│   ├── test_integration_full_flow.py    # Teste do fluxo completo
│   ├── test_integration_favorites.py    # Teste de favoritos
├── docs/                   # Documentação
│   ├── FAVORITES_API.md   # API de favoritos
├── favorites.db            # Banco SQLite (gerado automaticamente)
├── main.py                 # Servidor de Aplicação
```

## 🚀 Instalação e Execução

### 1. Preparar Ambiente

```bash
git clone git@github.com:MarcoOlivette/taiga-integration.git
cd taiga-integration

# Criar e ativar venv
python3 -m venv venv
source venv/bin/activate
```

### 2. Configurar

Copie o exemplo e adicione sua URL do Taiga:

```bash
cp .env.example .env
nano .env
```

### 3. Instalar Dependências

```bash
pip install -r requirements.txt
```

**Nota**: A partir da versão com favoritos, SQLAlchemy é uma dependência obrigatória.

### 4. Rodar

```bash
python main.py
```

Acesse: **http://localhost:3000**

O banco de dados SQLite (`favorites.db`) será criado automaticamente na primeira execução.

## 📖 Guia de Uso

1. **Login**: Use suas credenciais do Taiga.
2. **Navegação**: Selecione um Projeto -> User Story ou Épico.
3. **Gerenciamento**:
   - Use o painel superior para adicionar tarefas rapidamente.
   - Use os painéis "Atribuição em Massa" e "Status em Massa" para alterações globais.
   - Clique no ícone de Sol/Lua no topo para trocar o tema.
4. **Favoritos**:
   - Use a API de favoritos para salvar projetos e user stories.
   - Consulte `docs/FAVORITES_API.md` para detalhes completos.

## 🔧 APIs Disponíveis

### Taiga API (`/api`)

- Projetos, User Stories, Épicos
- Criação, edição e exclusão de tarefas
- Criação em massa de tarefas
- Status e membros do projeto

### Favorites API (`/api/favorites`)

- `GET/POST/DELETE /api/favorites/projects` - Gerenciar projetos favoritos
- `GET/POST/DELETE /api/favorites/userstories` - Gerenciar user stories favoritas

Ver documentação completa em `docs/FAVORITES_API.md`.

## 🛠️ Stack Tecnológica

- **Backend**: FastAPI, python-taiga, Pydantic, SQLAlchemy.
- **Banco de Dados**: SQLite (favoritos locais).
- **Frontend**: HTML5, CSS3 (CSS Variables for Theming), Vanilla JS (ES6+).
- **Testes**: Pytest.

## 🧪 Testes de Integração

Execute os testes de integração:

```bash
# Teste do fluxo completo (criar US -> tarefas -> editar -> deletar)
python -m pytest tests/test_integration_full_flow.py -v -s

# Teste de favoritos SQLite
python -m pytest tests/test_integration_favorites.py -v -s
```

**Nota**: Os testes usam o projeto ID 367 (projeto de teste).

## 📝 Changelog Recente

### ✅ Correção de Bug Crítico

- **Fix**: Descrições de tarefas não são mais sobrescritas durante edições em massa.
- **Implementação**: Busca completa dos dados da tarefa antes de atualizar.

### ✅ Remoção de Limite de Paginação

- **Fix**: Listagem de tarefas não está mais limitada a 30 itens.
- **Implementação**: Header `x-disable-pagination: 1` em todas as requisições de tasks.

### ✅ Sistema de Favoritos

- **Feature**: Banco SQLite para persistência de favoritos.
- **Benefício**: Projetos e user stories favoritos não são perdidos ao fechar o navegador.

## 📄 Licença

Projeto de uso interno.

## 👤 Autor

**Marco Olivette**

---

⭐ Construído para agilidade.
