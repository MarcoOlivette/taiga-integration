# Guia de Instalação - Taiga Bulk Task Manager

## 📋 Pré-requisitos

- Python 3.12+
- Git
- Acesso ao Taiga da sua organização

## 🚀 Instalação

### 1. Clone o repositório

```bash
git clone git@github.com:MarcoOlivette/taiga-integration.git
cd taiga-integration
```

### 2. Instale as dependências do sistema (Ubuntu/Debian)

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

### 4. Instale as dependências Python

```bash
pip install -r requirements.txt
```

### 5. Configure as variáveis de ambiente

```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o .env com suas credenciais
nano .env
```

Configure as seguintes variáveis:

```bash
TAIGA_API_URL=https://pista.decea.mil.br/api/v1
TAIGA_AUTH_URL=https://pista.decea.mil.br/api/v1/auth
APP_PORT=3000
TEST_USERNAME=seu_usuario
TEST_PASSWORD=sua_senha
```

### 6. Execute os testes (opcional)

```bash
# Teste de autenticação e listagem de projetos
python tests/test_taiga_integration.py

# Ou com pytest
pytest tests/test_taiga_integration.py -v -s
```

### 7. Inicie o servidor

```bash
python main.py
```

A aplicação estará disponível em: **http://localhost:3000**

## 🔧 Comandos Úteis

### Ativar ambiente virtual

```bash
source venv/bin/activate
```

### Desativar ambiente virtual

```bash
deactivate
```

### Atualizar dependências

```bash
pip install -r requirements.txt --upgrade
```

### Executar servidor em modo desenvolvimento

```bash
# Com reload automático
uvicorn main:app --reload --host 0.0.0.0 --port 3000
```

### Executar testes

```bash
# Todos os testes
pytest

# Com output detalhado
pytest -v -s

# Teste específico
pytest tests/test_taiga_integration.py::test_authentication -v
```

## 📁 Estrutura do Projeto

```
taiga-integration/
├── app/                    # Lógica de negócio
│   ├── __init__.py
│   └── taiga_service.py   # Cliente Taiga usando python-taiga
├── routes/                 # Rotas da API
│   ├── __init__.py
│   └── taiga_routes.py    # Endpoints FastAPI
├── static/                 # Frontend
│   ├── index.html
│   ├── styles.css
│   ├── config.js
│   ├── api.js
│   └── app.js
├── tests/                  # Testes
│   └── test_taiga_integration.py
├── docs/                   # Documentação
│   └── python-taiga-reference.md
├── main.py                 # Aplicação FastAPI
├── requirements.txt        # Dependências Python
├── .env                    # Variáveis de ambiente (não versionado)
├── .env.example           # Exemplo de variáveis
├── .gitignore
└── README.md
```

## 🐛 Troubleshooting

### Erro: "No module named pip"

```bash
sudo apt install python3-pip
```

### Erro: "ensurepip is not available"

```bash
sudo apt install python3.12-venv
```

### Erro: "Permission denied" ao instalar pacotes

Use o ambiente virtual em vez de instalar globalmente:

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Porta 3000 já está em uso

Altere a porta no `.env`:

```bash
APP_PORT=8000
```

### Erro de SSL ao conectar com Taiga

Se estiver usando um certificado auto-assinado, você pode desabilitar a verificação SSL (não recomendado em produção) editando `app/taiga_service.py`:

```python
self.api = TaigaAPI(host=self.host, tls_verify=False)
```

## 📚 Documentação Adicional

- [README.md](README.md) - Visão geral do projeto
- [docs/python-taiga-reference.md](docs/python-taiga-reference.md) - Referência da biblioteca python-taiga
- [Documentação oficial do Taiga](https://docs.taiga.io/)
- [python-taiga no GitHub](https://github.com/nephila/python-taiga)

## 🤝 Contribuindo

1. Crie uma branch para sua feature: `git checkout -b feature/nova-feature`
2. Commit suas mudanças: `git commit -m '✨ feat: adiciona nova feature'`
3. Push para a branch: `git push origin feature/nova-feature`
4. Abra um Pull Request

## 📄 Licença

Uso interno - DECEA

---

**Desenvolvido com FastAPI e python-taiga** 🚀
