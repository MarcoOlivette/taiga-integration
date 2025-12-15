# Taiga Bulk Task Manager 🚀

Aplicação web para gerenciamento em massa de tarefas no Taiga, desenvolvida com FastAPI (backend) e HTML/CSS/JavaScript puro (frontend).

## 📋 Funcionalidades

- ✅ Autenticação com Taiga
- ✅ Listagem de projetos
- ✅ Navegação por User Stories e Épicos
- ✅ Criação em massa de tarefas
- ✅ Edição de tarefas existentes
- ✅ Interface moderna e responsiva

## 🏗️ Estrutura do Projeto

```
taiga-integration/
├── app/                    # Lógica de negócio
│   ├── __init__.py
│   └── taiga_service.py   # Cliente da API do Taiga
├── routes/                 # Rotas da API
│   ├── __init__.py
│   └── taiga_routes.py    # Endpoints FastAPI
├── static/                 # Frontend
│   ├── index.html         # Interface principal
│   ├── styles.css         # Estilos modernos
│   ├── config.js          # Configurações
│   ├── api.js             # Cliente API (frontend)
│   └── app.js             # Lógica da aplicação
├── tests/                  # Testes
│   └── test_taiga_integration.py
├── main.py                 # Aplicação FastAPI
├── requirements.txt        # Dependências Python
├── .env                    # Variáveis de ambiente (não versionado)
└── .env.example           # Exemplo de variáveis de ambiente
```

## 🚀 Instalação e Execução

### 1. Clone o repositório

```bash
git clone git@github.com:MarcoOlivette/taiga-integration.git
cd taiga-integration
```

### 2. Instale dependências do sistema (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install python3.12-venv
```

### 3. Crie e ative o ambiente virtual

```bash
# Criar ambiente virtual
python3 -m venv venv

# Ativar ambiente virtual
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows
```

> ⚠️ **Importante**: Sempre ative o ambiente virtual antes de instalar dependências ou executar a aplicação!

### 4. Configure o ambiente

```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o .env com suas credenciais
nano .env
```

### 5. Instale as dependências Python

```bash
pip install -r requirements.txt
```

### 6. Execute os testes (opcional)

```bash
# Teste de autenticação e listagem de projetos
python tests/test_taiga_integration.py

# Ou usando pytest
pytest tests/test_taiga_integration.py -v -s
```

### 7. Inicie o servidor

```bash
python main.py
```

A aplicação estará disponível em: **http://localhost:3000**

> 💡 **Dica**: Para mais detalhes de instalação e troubleshooting, consulte [INSTALL.md](INSTALL.md)

## 🧪 Testes

O projeto inclui testes de integração que verificam:

1. **Autenticação**: Conexão com o Taiga e obtenção de token
2. **Listagem de Projetos**: Busca de todos os projetos acessíveis
3. **Fluxo Completo**: Auth → Projects → User Stories

Execute os testes:

```bash
# Teste simples
python tests/test_taiga_integration.py

# Com pytest (mais detalhado)
pytest tests/test_taiga_integration.py -v -s
```

## 📡 API Endpoints

### Autenticação

- `POST /api/auth/login` - Login no Taiga
- `GET /api/auth/me` - Usuário atual

### Projetos

- `GET /api/projects` - Listar projetos
- `GET /api/projects/{id}` - Detalhes do projeto
- `GET /api/projects/{id}/members` - Membros do projeto

### User Stories

- `GET /api/projects/{id}/userstories` - Listar user stories
- `GET /api/userstories/{id}` - Detalhes da user story

### Épicos

- `GET /api/projects/{id}/epics` - Listar épicos
- `GET /api/epics/{id}` - Detalhes do épico

### Tarefas

- `GET /api/projects/{id}/tasks` - Listar tarefas
- `POST /api/tasks` - Criar tarefa
- `PATCH /api/tasks/{id}` - Atualizar tarefa
- `DELETE /api/tasks/{id}` - Deletar tarefa
- `POST /api/tasks/bulk` - Criar múltiplas tarefas

## 🎨 Interface

A interface foi desenvolvida com:

- **Design moderno** com dark theme
- **Cores vibrantes** e gradientes
- **Animações suaves** e micro-interações
- **Totalmente responsiva**
- **Sem frameworks** - HTML/CSS/JS puro

## 🔒 Segurança

- Tokens armazenados em `localStorage` (frontend)
- Refresh automático de tokens expirados
- CORS configurado para desenvolvimento
- Credenciais em `.env` (não versionado)

## 📝 Variáveis de Ambiente

```bash
# URL da API do Taiga
TAIGA_API_URL=https://pista.decea.mil.br/api/v1
TAIGA_AUTH_URL=https://pista.decea.mil.br/api/v1/auth

# Porta da aplicação
APP_PORT=3000

# Credenciais de teste (apenas desenvolvimento)
TEST_USERNAME=seu_usuario
TEST_PASSWORD=sua_senha
```

## 🛠️ Tecnologias

### Backend

- **FastAPI** - Framework web moderno e rápido
- **python-taiga** - Wrapper Python para a API REST do Taiga
- **Pydantic** - Validação de dados
- **python-dotenv** - Gerenciamento de variáveis de ambiente

### Frontend

- **HTML5** - Estrutura semântica
- **CSS3** - Estilos modernos com variáveis CSS
- **JavaScript (ES6+)** - Lógica da aplicação
- **Fetch API** - Requisições HTTP

### Testes

- **pytest** - Framework de testes
- **pytest-asyncio** - Suporte para testes assíncronos

## � Documentação

- **[INSTALL.md](INSTALL.md)** - Guia completo de instalação e troubleshooting
- **[docs/python-taiga-reference.md](docs/python-taiga-reference.md)** - Referência da biblioteca python-taiga
- **[Documentação oficial do Taiga](https://docs.taiga.io/)**
- **[python-taiga no GitHub](https://github.com/nephila/python-taiga)**

## �📖 Como Usar

1. **Login**: Acesse a aplicação e faça login com suas credenciais do Taiga
2. **Selecione um Projeto**: Escolha o projeto que deseja gerenciar
3. **Navegue**: Escolha entre User Stories ou Épicos
4. **Gerencie Tarefas**:
   - Visualize tarefas existentes
   - Adicione novas tarefas (uma por uma ou em massa)
   - Edite tarefas existentes
   - Exclua tarefas

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é de uso interno.

## 👤 Autor

**Marco Olivette**

---

⭐ Desenvolvido com FastAPI e ❤️
