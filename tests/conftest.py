"""
Configurações compartilhadas para os testes
"""
import os
from dotenv import load_dotenv

load_dotenv()

# Credenciais de teste
TEST_USERNAME = os.getenv("TEST_USERNAME", "MarcoOlivette")
TEST_PASSWORD = os.getenv("TEST_PASSWORD", "NovaSenhaTaiga__@832")
TAIGA_HOST = "https://pista.decea.mil.br"
PROJECT_SLUG = "asa"  # Projeto principal para testes


def print_separator(title):
    """Imprime separador visual"""
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)


def print_subseparator(title):
    """Imprime sub-separador visual"""
    print("\n" + "-" * 70)
    print(f"  {title}")
    print("-" * 70)
