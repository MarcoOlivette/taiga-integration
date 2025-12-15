#!/bin/bash
# Script para rodar os testes com ambiente virtual

echo "=========================================="
echo "  Taiga Integration - Test Runner"
echo "=========================================="
echo ""

# Ativar ambiente virtual se existir
if [ -d "venv" ]; then
    echo "🔄 Ativando ambiente virtual..."
    source venv/bin/activate
else
    echo "⚠️  Ambiente virtual não encontrado!"
    echo "Execute: python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# Verificar se python-taiga está instalado
echo "🔍 Verificando dependências..."
python3 -c "import taiga" 2>/dev/null

if [ $? -ne 0 ]; then
    echo "❌ python-taiga não está instalado"
    echo "Execute: pip install -r requirements.txt"
    exit 1
fi

echo "✅ Dependências OK"
echo ""
echo "🚀 Executando testes..."
echo ""

# Executar os testes
cd tests
python3 test_runner.py
TEST_RESULT=$?

# Desativar ambiente virtual
cd ..
deactivate 2>/dev/null

exit $TEST_RESULT
