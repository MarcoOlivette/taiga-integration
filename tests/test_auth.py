"""
Testes de Autenticação
"""
from taiga import TaigaAPI
from conftest import TEST_USERNAME, TEST_PASSWORD, TAIGA_HOST, print_separator


def test_authentication():
    """Teste: Autenticação com Taiga"""
    print_separator("TESTE: AUTENTICAÇÃO")
    
    try:
        api = TaigaAPI(host=TAIGA_HOST)
        api.auth(username=TEST_USERNAME, password=TEST_PASSWORD)
        
        print(f"\n✅ Autenticação bem-sucedida!")
        print(f"🔑 Token: {api.token[:30]}...")
        
        # Obter informações do usuário
        me = api.me()
        print(f"\n👤 Usuário logado:")
        print(f"   ID: {me.id}")
        print(f"   Username: {me.username}")
        print(f"   Nome completo: {me.full_name}")
        print(f"   Email: {me.email}")
        
        assert api.token is not None, "Token não foi gerado"
        assert me.username.lower() == TEST_USERNAME.lower(), "Usuário incorreto"
        
        print("\n✅ TESTE PASSOU!")
        return api
        
    except Exception as e:
        print(f"\n❌ ERRO: {str(e)}")
        raise
