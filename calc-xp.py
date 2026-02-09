"""
Calculadora de Treinos para Atingir XP Objetivo
Sistema com bônus/debuffs multiplicativos em cascata
Suporta progressão a partir de treinos já realizados
"""

import math


def calcular_xp_individual(n_treino):
    """
    Calcula o XP base de um treino específico (sem bônus).
    
    Args:
        n_treino: Número do treino (1, 2, 3, ...)
    
    Returns:
        XP base do treino
    """
    if n_treino == 1:
        return 150
    else:
        return 150 * (n_treino - 1)


def aplicar_modificadores(xp_base, modificadores_percentuais):
    """
    Aplica modificadores (bônus/debuffs) em cascata com floor entre cada aplicação.
    
    Args:
        xp_base: XP inicial
        modificadores_percentuais: Lista de modificadores em % (positivo = bônus, negativo = debuff)
    
    Returns:
        XP final após todos os modificadores (com floor)
    """
    xp_atual = xp_base
    
    for modificador in modificadores_percentuais:
        multiplicador = 1 + (modificador / 100)
        xp_atual = xp_atual * multiplicador
        xp_atual = math.floor(xp_atual)  # Aplica floor após cada modificador
    
    return xp_atual


def calcular_xp_total(n_treinos, modificadores_percentuais, treinos_iniciais=0):
    """
    Calcula o XP total acumulado após n_treinos.
    
    Args:
        n_treinos: Número total de treinos (incluindo os iniciais)
        modificadores_percentuais: Lista de modificadores em % aplicados em cascata
        treinos_iniciais: Número de treinos já realizados anteriormente
    
    Returns:
        XP total acumulado
    """
    xp_total = 0
    
    for n in range(1, n_treinos + 1):
        xp_base_treino = calcular_xp_individual(n)
        xp_treino_com_bonus = aplicar_modificadores(xp_base_treino, modificadores_percentuais)
        xp_total += xp_treino_com_bonus
    
    return xp_total


def calcular_xp_adicional(treino_inicial, treino_final, modificadores_percentuais):
    """
    Calcula o XP ganho entre dois treinos (exclusivo).
    
    Args:
        treino_inicial: Último treino já realizado
        treino_final: Último treino após novos treinos
        modificadores_percentuais: Lista de modificadores em %
    
    Returns:
        XP ganho entre treino_inicial e treino_final
    """
    if treino_inicial >= treino_final:
        return 0
    
    xp_adicional = 0
    
    for n in range(treino_inicial + 1, treino_final + 1):
        xp_base_treino = calcular_xp_individual(n)
        xp_treino_com_bonus = aplicar_modificadores(xp_base_treino, modificadores_percentuais)
        xp_adicional += xp_treino_com_bonus
    
    return xp_adicional


def calcular_multiplicador_total(modificadores_percentuais):
    """
    Calcula o multiplicador total (aproximado, sem considerar floors intermediários).
    """
    multiplicador = 1.0
    for mod in modificadores_percentuais:
        multiplicador *= (1 + mod / 100)
    return multiplicador


def encontrar_treinos_necessarios(xp_objetivo, modificadores_percentuais, 
                                  treinos_ja_feitos=0, xp_ja_acumulado=0, verbose=True):
    """
    Encontra o número mínimo de treinos para atingir o XP objetivo.
    
    Args:
        xp_objetivo: XP que deseja atingir
        modificadores_percentuais: Lista de modificadores em % aplicados em cascata
        treinos_ja_feitos: Número de treinos já realizados
        xp_ja_acumulado: XP já acumulado anteriormente
        verbose: Se True, mostra informações detalhadas
    
    Returns:
        Tupla (treinos_totais, treinos_adicionais_necessarios)
    """
    if verbose:
        print("\n" + "=" * 70)
        print("CALCULADORA DE TREINOS - SISTEMA DE XP")
        print("=" * 70)
        
        if treinos_ja_feitos > 0:
            print(f"\n📊 SITUAÇÃO ATUAL:")
            print(f"   Treinos já realizados: {treinos_ja_feitos}")
            print(f"   XP já acumulado: {xp_ja_acumulado:,.0f}")
            print(f"   Próximo treino será: #{treinos_ja_feitos + 1}")
            
            # Calcula o XP do próximo treino
            proximo_xp_base = calcular_xp_individual(treinos_ja_feitos + 1)
            proximo_xp_total = aplicar_modificadores(proximo_xp_base, modificadores_percentuais)
            print(f"   Próximo treino renderá: {proximo_xp_total:,.0f} XP")
            print()
        
        print(f"🎯 Objetivo: {xp_objetivo:,.0f} XP")
        
        if xp_ja_acumulado >= xp_objetivo:
            print(f"\n✅ OBJETIVO JÁ ALCANÇADO!")
            print(f"   Você já tem {xp_ja_acumulado:,.0f} XP (excede em {xp_ja_acumulado - xp_objetivo:,.0f} XP)")
            print("=" * 70 + "\n")
            return treinos_ja_feitos, 0
        
        xp_faltante = xp_objetivo - xp_ja_acumulado
        print(f"🎯 XP faltante: {xp_faltante:,.0f}")
        
        print(f"\n⚙️  Modificadores configurados: {modificadores_percentuais}")
        
        # Mostra cada modificador
        for i, mod in enumerate(modificadores_percentuais, 1):
            if mod >= 0:
                print(f"   #{i}: +{mod}% (bônus)")
            else:
                print(f"   #{i}: {mod}% (debuff)")
        
        multiplicador = calcular_multiplicador_total(modificadores_percentuais)
        print(f"📊 Multiplicador total aproximado: {multiplicador:.4f}x")
        print("\n" + "-" * 70)
    
    # Se já atingiu o objetivo
    if xp_ja_acumulado >= xp_objetivo:
        return treinos_ja_feitos, 0
    
    # Busca binária para eficiência
    n_min = treinos_ja_feitos + 1
    n_max = treinos_ja_feitos + 10000  # Limite superior inicial
    
    # Primeiro, encontra um limite superior válido
    while calcular_xp_total(n_max, modificadores_percentuais) < xp_objetivo:
        n_max *= 2
        if n_max > 1000000:
            print("⚠️  Aviso: Objetivo muito alto! Pode demorar...")
            break
    
    # Busca binária
    while n_min < n_max:
        n_meio = (n_min + n_max) // 2
        xp_atual = calcular_xp_total(n_meio, modificadores_percentuais)
        
        if xp_atual < xp_objetivo:
            n_min = n_meio + 1
        else:
            n_max = n_meio
    
    treinos_totais = n_min
    treinos_adicionais = treinos_totais - treinos_ja_feitos
    
    # Validação e exibição
    if verbose:
        if treinos_totais > treinos_ja_feitos + 1:
            xp_anterior = calcular_xp_total(treinos_totais - 1, modificadores_percentuais)
            print(f"\n🔍 Testando {treinos_totais - 1} treinos totais ({treinos_totais - 1 - treinos_ja_feitos} adicionais):")
            print(f"   XP Total Acumulado: {xp_anterior:,.0f}")
            falta = xp_objetivo - xp_anterior
            print(f"   ❌ Insuficiente (faltam {falta:,.0f} XP)")
        
        xp_final = calcular_xp_total(treinos_totais, modificadores_percentuais)
        
        print(f"\n🔍 Testando {treinos_totais} treinos totais ({treinos_adicionais} adicionais):")
        print(f"   XP Total Acumulado: {xp_final:,.0f}")
        excesso = xp_final - xp_objetivo
        print(f"   ✅ Suficiente (excede em {excesso:,.0f} XP)")
        
        print("\n" + "=" * 70)
        print(f"🎉 RESULTADO:")
        print(f"   Treinos totais necessários: {treinos_totais}")
        print(f"   Treinos adicionais a fazer: {treinos_adicionais}")
        print(f"   XP final: {xp_final:,.0f} XP")
        
        # Mostra breakdown do que falta fazer
        if treinos_adicionais > 0:
            xp_ganho_adicional = xp_final - xp_ja_acumulado
            print(f"\n📈 Ganho de XP com os {treinos_adicionais} novos treinos: {xp_ganho_adicional:,.0f} XP")
        
        print("=" * 70 + "\n")
    
    return treinos_totais, treinos_adicionais


def exibir_progressao(n_treinos_max, modificadores_percentuais, treinos_iniciais=0, 
                      xp_inicial=0, intervalo=1):
    """
    Exibe a progressão de XP ao longo dos treinos.
    
    Args:
        n_treinos_max: Número máximo de treinos para exibir
        modificadores_percentuais: Lista de modificadores em %
        treinos_iniciais: Número de treinos já realizados
        xp_inicial: XP já acumulado
        intervalo: Mostra a cada N treinos
    """
    print("\n" + "=" * 90)
    print("TABELA DE PROGRESSÃO DE XP")
    print("=" * 90)
    
    if treinos_iniciais > 0:
        print(f"⚠️  Mostrando a partir do treino #{treinos_iniciais + 1} (XP inicial: {xp_inicial:,.0f})")
        print("=" * 90)
    
    print(f"{'Treino':<10} {'Status':<12} {'XP Base':<12} {'XP c/ Mods':<15} {'XP Acumulado':<20}")
    print("-" * 90)
    
    xp_acumulado = xp_inicial
    inicio = max(1, treinos_iniciais + 1)
    
    # Mostra os treinos já feitos se houver (apenas resumo)
    if treinos_iniciais > 0:
        print(f"1-{treinos_iniciais:<7} {'[Feitos]':<12} {'-':<12} {'-':<15} {xp_inicial:<20,.0f}")
        print("-" * 90)
    
    for n in range(inicio, n_treinos_max + 1):
        if (n - inicio) % intervalo == 0 or n == n_treinos_max:
            xp_base = calcular_xp_individual(n)
            xp_com_mods = aplicar_modificadores(xp_base, modificadores_percentuais)
            xp_acumulado += xp_com_mods
            
            status = "[Novo]" if n > treinos_iniciais else "[Feito]"
            print(f"{n:<10} {status:<12} {xp_base:<12,.0f} {xp_com_mods:<15,.0f} {xp_acumulado:<20,.0f}")
        else:
            # Apenas acumula sem exibir
            xp_base = calcular_xp_individual(n)
            xp_com_mods = aplicar_modificadores(xp_base, modificadores_percentuais)
            xp_acumulado += xp_com_mods
    
    print("=" * 90 + "\n")


def validar_numero(prompt, tipo=float, positivo=False, minimo=None):
    """
    Solicita um número ao usuário com validação.
    
    Args:
        prompt: Mensagem a exibir
        tipo: Tipo de número (int ou float)
        positivo: Se True, aceita apenas números positivos
        minimo: Valor mínimo aceito (opcional)
    
    Returns:
        Número validado
    """
    while True:
        try:
            entrada = input(prompt).strip().replace(",", ".")
            
            if entrada == "" and minimo is not None:
                return minimo
            
            numero = tipo(entrada)
            
            if positivo and numero <= 0:
                print("⚠️  O valor deve ser maior que zero!")
                continue
            
            if minimo is not None and numero < minimo:
                print(f"⚠️  O valor deve ser pelo menos {minimo}!")
                continue
            
            return numero
        except ValueError:
            print("⚠️  Digite um número válido!")


def menu_interativo():
    """
    Menu interativo para configurar e calcular treinos necessários.
    """
    print("\n" + "🎮" * 35)
    print(" " * 20 + "CALCULADORA DE TREINOS - MODO INTERATIVO")
    print("🎮" * 35 + "\n")
    
    # Configuração do objetivo
    xp_objetivo = validar_numero(
        "🎯 Digite o XP objetivo: ",
        tipo=float,
        positivo=True
    )
    
    # Pergunta sobre progresso atual
    print("\n" + "=" * 70)
    print("📊 PROGRESSO ATUAL")
    print("=" * 70)
    tem_progresso = input("Você já fez alguns treinos? (s/n): ").strip().lower()
    
    treinos_ja_feitos = 0
    xp_ja_acumulado = 0
    
    if tem_progresso in ['s', 'sim', 'y', 'yes']:
        treinos_ja_feitos = validar_numero(
            "Quantos treinos você já fez? ",
            tipo=int,
            minimo=0
        )
        
        if treinos_ja_feitos > 0:
            xp_ja_acumulado = validar_numero(
                "Quanto XP você já acumulou? ",
                tipo=float,
                minimo=0
            )
            
            print(f"\n✓ Registrado: {treinos_ja_feitos} treinos, {xp_ja_acumulado:,.0f} XP")
            
            if xp_ja_acumulado >= xp_objetivo:
                print(f"\n🎉 Você já atingiu seu objetivo!")
                print(f"   XP atual: {xp_ja_acumulado:,.0f}")
                print(f"   XP objetivo: {xp_objetivo:,.0f}")
                print(f"   Excesso: {xp_ja_acumulado - xp_objetivo:,.0f} XP")
                return None, None, None, None
    
    # Configuração dos modificadores
    print("\n" + "=" * 70)
    print("⚙️  CONFIGURAÇÃO DE MODIFICADORES (aplicados em cascata)")
    print("=" * 70)
    print("📌 Bônus: digite valores POSITIVOS (ex: 265 para +265%)")
    print("📌 Debuffs: digite valores NEGATIVOS (ex: -50 para -50%)")
    print("📌 Pressione Enter sem digitar nada para finalizar")
    print("=" * 70 + "\n")
    
    modificadores_percentuais = []
    contador = 1
    
    while True:
        entrada = input(f"Modificador #{contador} (%): ").strip()
        
        if entrada == "":
            if len(modificadores_percentuais) == 0:
                print("ℹ️  Nenhum modificador adicionado. Continuando sem bônus/debuffs.")
                modificadores_percentuais = [0]
            break
        
        try:
            modificador = float(entrada.replace(",", "."))
            
            # Validação: não permitir -100% ou menos (zeraria ou negativaria o XP)
            if modificador <= -100:
                print("⚠️  Modificador não pode ser -100% ou menor (zeraria o XP)!")
                continue
            
            modificadores_percentuais.append(modificador)
            
            # Mostra preview do próximo treino (se já houver treinos feitos)
            if treinos_ja_feitos > 0:
                proximo_n = treinos_ja_feitos + 1
                proximo_base = calcular_xp_individual(proximo_n)
                proximo_total = aplicar_modificadores(proximo_base, modificadores_percentuais)
                print(f"   ✓ Adicionado! Preview treino #{proximo_n}: {proximo_base} base → {proximo_total} final")
            else:
                exemplo_150 = aplicar_modificadores(150, modificadores_percentuais)
                print(f"   ✓ Adicionado! Preview treino #1: 150 base → {exemplo_150} final")
            
            contador += 1
        except ValueError:
            print("⚠️  Digite um número válido!")
    
    # Remove o modificador zero se foi o único adicionado
    if modificadores_percentuais == [0]:
        modificadores_percentuais = []
    
    # Confirmação
    print("\n" + "=" * 70)
    print("📋 RESUMO DA CONFIGURAÇÃO:")
    print("=" * 70)
    print(f"🎯 Objetivo: {xp_objetivo:,.0f} XP")
    
    if treinos_ja_feitos > 0:
        print(f"📊 Progresso atual: {treinos_ja_feitos} treinos, {xp_ja_acumulado:,.0f} XP")
        xp_faltante = xp_objetivo - xp_ja_acumulado
        print(f"🎯 XP faltante: {xp_faltante:,.0f}")
    
    if modificadores_percentuais:
        print(f"⚙️  Modificadores: {modificadores_percentuais}")
        
        if treinos_ja_feitos > 0:
            proximo_n = treinos_ja_feitos + 1
            proximo_base = calcular_xp_individual(proximo_n)
            proximo_total = aplicar_modificadores(proximo_base, modificadores_percentuais)
            print(f"💡 Próximo treino (#{proximo_n}) renderá: {proximo_total} XP")
        else:
            exemplo_primeiro = aplicar_modificadores(150, modificadores_percentuais)
            print(f"💡 Treino #1 renderá: {exemplo_primeiro} XP")
    else:
        print("⚙️  Sem modificadores")
        if treinos_ja_feitos > 0:
            proximo_n = treinos_ja_feitos + 1
            proximo_base = calcular_xp_individual(proximo_n)
            print(f"💡 Próximo treino (#{proximo_n}) renderá: {proximo_base} XP")
        else:
            print("💡 Treino #1 renderá: 150 XP")
    
    print("=" * 70)
    
    confirmar = input("\n✅ Confirmar e calcular? (s/n): ").strip().lower()
    
    if confirmar not in ['s', 'sim', 'y', 'yes']:
        print("\n❌ Cálculo cancelado.")
        return None, None, None, None
    
    # Cálculo
    treinos_totais, treinos_adicionais = encontrar_treinos_necessarios(
        xp_objetivo, 
        modificadores_percentuais if modificadores_percentuais else [0],
        treinos_ja_feitos,
        xp_ja_acumulado,
        verbose=True
    )
    
    # Pergunta se quer ver a progressão
    if treinos_adicionais > 0:
        ver_progressao = input("\n📊 Deseja ver a tabela de progressão? (s/n): ").strip().lower()
        
        if ver_progressao in ['s', 'sim', 'y', 'yes']:
            intervalo = 1
            if treinos_adicionais > 30:
                usar_intervalo = input(
                    f"São {treinos_adicionais} treinos novos. Mostrar a cada quantos treinos? (1 = todos): "
                ).strip()
                intervalo = int(usar_intervalo) if usar_intervalo else 1
            
            exibir_progressao(
                treinos_totais,
                modificadores_percentuais if modificadores_percentuais else [0],
                treinos_ja_feitos,
                xp_ja_acumulado,
                intervalo
            )
    
    return treinos_totais, treinos_adicionais, modificadores_percentuais, xp_objetivo


# ============================================================================
# EXECUÇÃO PRINCIPAL
# ============================================================================

if __name__ == "__main__":
    # Testa se o sistema está correto
    print("\n" + "🔬" * 35)
    print(" " * 25 + "TESTE DE VALIDAÇÃO DO SISTEMA")
    print("🔬" * 35)
    
    print("\n✓ Testando cálculo do Treino #1 com [+265%, +10%]:")
    xp_treino1 = aplicar_modificadores(150, [265, 10])
    print(f"  150 → +265% = {math.floor(150 * 3.65)} → +10% = {xp_treino1}")
    print(f"  Resultado esperado: 601 XP")
    print(f"  Resultado obtido: {xp_treino1} XP")
    
    if xp_treino1 == 601:
        print("  ✅ CORRETO!\n")
    else:
        print("  ❌ ERRO!\n")
    
    # Exemplo com progresso inicial
    print("=" * 70)
    print("📌 EXEMPLO: Usuário com 10 treinos já feitos")
    print("=" * 70)
    
    # Calcula quanto XP teria com 10 treinos
    xp_10_treinos = calcular_xp_total(10, [265, 10])
    print(f"Simulando: Usuário com 10 treinos tem {xp_10_treinos:,.0f} XP acumulado")
    print(f"Objetivo: 76.500 XP\n")
    
    treinos_totais, treinos_adicionais = encontrar_treinos_necessarios(
        xp_objetivo=76500,
        modificadores_percentuais=[265, 10],
        treinos_ja_feitos=10,
        xp_ja_acumulado=xp_10_treinos,
        verbose=True
    )
    
    # Menu interativo
    continuar = True
    while continuar:
        print("\n" + "🎯" * 35)
        resultado = menu_interativo()
        
        if resultado[0] is None:
            break
        
        repetir = input("\n🔄 Fazer outro cálculo? (s/n): ").strip().lower()
        continuar = repetir in ['s', 'sim', 'y', 'yes']
    
    print("\n" + "👋" * 35)
    print(" " * 30 + "Até logo!")
    print("👋" * 35 + "\n")
