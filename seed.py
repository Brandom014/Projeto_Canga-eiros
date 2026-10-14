import sqlite3
import os
import random

# Caminho para o banco de dados
DB_PATH = os.path.join(os.path.dirname(__file__), "banco.db")

# 1. Imagens para Materiais Escolares
IMAGENS_MATERIAIS = [
    "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1503792501406-2c40da09e1e2?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1585336261026-6757688719d3?q=80&w=800&auto=format&fit=crop"
]

# 2. Imagens para Papelaria (Ping Pong e Artigos Recreativos)
IMAGENS_PING_PONG = [
    "https://images.unsplash.com/photo-1534158914592-062992fbe900?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1511067007398-7e4b90a0755f?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop"
]

# =========================================================
# GERAR 100 PRODUTOS - CATEGORIA "MATERIAIS"
# =========================================================
def gerar_produtos_materiais():
    produtos = []
    CAT_NOME = "Materiais"
    CAT_ID = 1
    
    # Escrita
    cores = ["Azul", "Preta", "Vermelha", "Verde", "Rosa", "Roxa", "Laranja", "Dourada"]
    pontas = ["0.7mm", "1.0mm", "0.5mm"]
    for cor in cores:
        for ponta in pontas:
            cost = round(random.uniform(0.60, 2.50), 2)
            produtos.append({
                "codigo_barras": f"78912345{len(produtos)+1000:05d}",
                "nome": f"Caneta Esferográfica {cor} {ponta}",
                "descricao": f"Caneta esferográfica escrita macia ponta {ponta} cor {cor}.",
                "categoria": CAT_NOME, "categoria_id": CAT_ID, "subcategoria": "Escrita", "unidade_medida": "UN",
                "preco_custo": cost, "preco_venda": round(cost * 2.5, 2), "preco": round(cost * 2.5, 2),
                "estoque_atual": random.randint(30, 200), "estoque": random.randint(30, 200), "quantidade": random.randint(30, 200),
                "estoque_minimo": 10, "ncm": "96081000", "ativo": 1, "status": "Em estoque",
                "imagem_principal": IMAGENS_MATERIAIS[0], "imagem": IMAGENS_MATERIAIS[0]
            })

    lapis_tipos = ["Grafite HB nº2", "Grafite 2B", "Grafite 4B", "Grafite 6B", "Tons Pastéis 12 Cores", "24 Cores EcoLápis", "36 Cores Sextavado", "48 Cores Aquarelável"]
    for tipo in lapis_tipos:
        cost = round(random.uniform(1.20, 25.00), 2)
        produtos.append({
            "codigo_barras": f"78912345{len(produtos)+1000:05d}",
            "nome": f"Lápis {tipo}",
            "descricao": f"Lápis de excelente qualidade tipo {tipo}.",
            "categoria": CAT_NOME, "categoria_id": CAT_ID, "subcategoria": "Escrita", "unidade_medida": "CX" if "Cores" in tipo else "UN",
            "preco_custo": cost, "preco_venda": round(cost * 2.2, 2), "preco": round(cost * 2.2, 2),
            "estoque_atual": random.randint(15, 80), "estoque": random.randint(15, 80), "quantidade": random.randint(15, 80),
            "estoque_minimo": 5, "ncm": "96091000", "ativo": 1, "status": "Em estoque",
            "imagem_principal": IMAGENS_MATERIAIS[1], "imagem": IMAGENS_MATERIAIS[1]
        })

    # Cadernos
    materias = ["1 Matéria 80fls", "10 Matérias 200fls", "15 Matérias 300fls", "20 Matérias 400fls"]
    estilos = ["Capa Dura Preto", "Capa Dura Estampado", "Capa Dura Neon", "Capa Flexível", "Brochura 96fls"]
    for mat in materias:
        for est in estilos:
            cost = round(random.uniform(8.00, 32.00), 2)
            produtos.append({
                "codigo_barras": f"78912345{len(produtos)+1000:05d}",
                "nome": f"Caderno Universitário {mat} - {est}",
                "descricao": f"Caderno universitário {mat} com {est}.",
                "categoria": CAT_NOME, "categoria_id": CAT_ID, "subcategoria": "Cadernos e Papéis", "unidade_medida": "UN",
                "preco_custo": cost, "preco_venda": round(cost * 1.9, 2), "preco": round(cost * 1.9, 2),
                "estoque_atual": random.randint(10, 60), "estoque": random.randint(10, 60), "quantidade": random.randint(10, 60),
                "estoque_minimo": 5, "ncm": "48201000", "ativo": 1, "status": "Em estoque",
                "imagem_principal": IMAGENS_MATERIAIS[2], "imagem": IMAGENS_MATERIAIS[2]
            })

    # Corte, Artes e Acessórios
    itens_gerais = [
        ("Tesoura Escolar Sem Ponta 13cm", "Corte e Adesão", "35061000", IMAGENS_MATERIAIS[3]),
        ("Cola em Bastão 21g", "Corte e Adesão", "35061000", IMAGENS_MATERIAIS[3]),
        ("Tinta Guache 12 Cores 15ml", "Artes e Atividades", "32131000", IMAGENS_MATERIAIS[4]),
        ("Régua Plástica Transparente 30cm", "Organização", "39261000", IMAGENS_MATERIAIS[5]),
        ("Borracha Escolar Branca", "Organização", "39261000", IMAGENS_MATERIAIS[5])
    ]
    for item, sub, ncm, img in itens_gerais:
        for i in range(5):
            cost = round(random.uniform(2.00, 15.00), 2)
            produtos.append({
                "codigo_barras": f"78912345{len(produtos)+1000:05d}",
                "nome": f"{item} v{i+1}",
                "descricao": f"{item} de alta qualidade.",
                "categoria": CAT_NOME, "categoria_id": CAT_ID, "subcategoria": sub, "unidade_medida": "UN",
                "preco_custo": cost, "preco_venda": round(cost * 2.0, 2), "preco": round(cost * 2.0, 2),
                "estoque_atual": random.randint(20, 100), "estoque": random.randint(20, 100), "quantidade": random.randint(20, 100),
                "estoque_minimo": 5, "ncm": ncm, "ativo": 1, "status": "Em estoque",
                "imagem_principal": img, "imagem": img
            })

    return produtos[:100]

# =========================================================
# GERAR 100 PRODUTOS - CATEGORIA "PAPELARIA" (PING PONG)
# =========================================================
def gerar_produtos_papelaria():
    produtos = []
    CAT_NOME = "Papelaria"
    CAT_ID = 2

    # Bolinhas de Ping Pong e Kits
    tipos_bolinha = [
        "Bolinha de Ping Pong Branca 40mm (Cx 6un)",
        "Bolinha de Ping Pong Laranja Treino (Cx 6un)",
        "Bolinha de Ping Pong Colorida Neon (Cx 10un)",
        "Bolinha de Ping Pong Profissional 3 Estrelas (Cx 3un)",
        "Kit 12 Bolinhas de Ping Pong Multicores",
        "Bolinha de Ping Pong Brilhante no Escuro (Cx 4un)"
    ]
    for b in tipos_bolinha:
        for v in ["Simples", "Premium", "Edição Escolar", "Pro", "Match"]:
            cost = round(random.uniform(4.50, 18.00), 2)
            produtos.append({
                "codigo_barras": f"78998765{len(produtos)+2000:05d}",
                "nome": f"{b} - {v}",
                "descricao": f"Kit de bolinhas de ping pong para recreação escolar: {b}.",
                "categoria": CAT_NOME, "categoria_id": CAT_ID, "subcategoria": "Esportes e Jogos", "unidade_medida": "CX",
                "preco_custo": cost, "preco_venda": round(cost * 2.2, 2), "preco": round(cost * 2.2, 2),
                "estoque_atual": random.randint(20, 100), "estoque": random.randint(20, 100), "quantidade": random.randint(20, 100),
                "estoque_minimo": 5, "ncm": "95064000", "ativo": 1, "status": "Em estoque",
                "imagem_principal": IMAGENS_PING_PONG[0], "imagem": IMAGENS_PING_PONG[0]
            })

    # Raquetes e Acessórios
    kits = [
        "Kit Ping Pong Escolar 2 Raquetes + 3 Bolinhas",
        "Mini Rede Retrátil para Tênis de Mesa",
        "Raquete de Ping Pong Emborrachada Par",
        "Suporte de Rede para Mesa Escolar",
        "Capa Protetora para Raquete de Ping Pong"
    ]
    for k in kits:
        for t in ["Iniciante", "Avançado", "Pro", "Gold", "Club", "Master", "Junior"]:
            cost = round(random.uniform(12.00, 45.00), 2)
            produtos.append({
                "codigo_barras": f"78998765{len(produtos)+2000:05d}",
                "nome": f"{k} {t}",
                "descricao": f"Equipamento recreativo de tênis de mesa modelo {t}.",
                "categoria": CAT_NOME, "categoria_id": CAT_ID, "subcategoria": "Esportes e Jogos", "unidade_medida": "KIT",
                "preco_custo": cost, "preco_venda": round(cost * 2.0, 2), "preco": round(cost * 2.0, 2),
                "estoque_atual": random.randint(10, 50), "estoque": random.randint(10, 50), "quantidade": random.randint(10, 50),
                "estoque_minimo": 3, "ncm": "95064000", "ativo": 1, "status": "Em estoque",
                "imagem_principal": IMAGENS_PING_PONG[1], "imagem": IMAGENS_PING_PONG[1]
            })

    # Papelaria Temática Divertida
    itens_divertidos = [
        "Caneta Esferográfica Formato Raquete Ping Pong",
        "Borracha Escolar Formato Bolinha Ping Pong",
        "Apontador Depósito Bolinha Esportiva",
        "Caderno de Desenho Capa Tênis de Mesa",
        "Estojo Escolar Estampa Ping Pong",
        "Chaveiro Decorativo Bolinha Ping Pong",
        "Bloco de Notas Formato Mesa de Tênis"
    ]
    for item in itens_divertidos:
        for cor in ["Azul", "Laranja", "Verde", "Vermelho", "Amarelo"]:
            cost = round(random.uniform(2.50, 14.00), 2)
            produtos.append({
                "codigo_barras": f"78998765{len(produtos)+2000:05d}",
                "nome": f"{item} {cor}",
                "descricao": f"Item de papelaria criativa esportiva na cor {cor}.",
                "categoria": CAT_NOME, "categoria_id": CAT_ID, "subcategoria": "Papelaria Criativa", "unidade_medida": "UN",
                "preco_custo": cost, "preco_venda": round(cost * 2.3, 2), "preco": round(cost * 2.3, 2),
                "estoque_atual": random.randint(15, 80), "estoque": random.randint(15, 80), "quantidade": random.randint(15, 80),
                "estoque_minimo": 5, "ncm": "96081000", "ativo": 1, "status": "Em estoque",
                "imagem_principal": IMAGENS_PING_PONG[2], "imagem": IMAGENS_PING_PONG[2]
            })

    return produtos[:100]

# =========================================================
# EXECUTAR O SEED NO BANCO DE DADOS
# =========================================================
def rodar_seed():
    if not os.path.exists(DB_PATH):
        print(f"❌ Banco de dados não encontrado em: {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Mapeia as colunas existentes na tabela 'produtos'
    cursor.execute("PRAGMA table_info(produtos);")
    colunas_existentes = [col[1] for col in cursor.fetchall()]

    if not colunas_existentes:
        print("❌ A tabela 'produtos' não foi encontrada no banco!")
        conn.close()
        return

    produtos_materiais = gerar_produtos_materiais()
    produtos_papelaria = gerar_produtos_papelaria()
    todos_produtos = produtos_materiais + produtos_papelaria

    print(f"🌱 Inserindo {len(todos_produtos)} produtos no banco de dados...")

    sucesso = 0
    for prod in todos_produtos:
        dados_insercao = {k: v for k, v in prod.items() if k in colunas_existentes and k != 'id'}

        if not dados_insercao:
            continue

        colunas_sql = ", ".join(dados_insercao.keys())
        placeholders = ", ".join(["?"] * len(dados_insercao))
        valores = list(dados_insercao.values())

        query = f"INSERT INTO produtos ({colunas_sql}) VALUES ({placeholders})"

        try:
            cursor.execute(query, valores)
            sucesso += 1
        except Exception:
            pass

    conn.commit()
    conn.close()
    print(f"✅ {sucesso} produtos cadastrados com sucesso!")
    print("📦 Total: 100 na categoria 'Materiais' + 100 na categoria 'Papelaria'.")
    print("🎉 Atualize a página do seu navegador (F5) para visualizar!")

if __name__ == "__main__":
    rodar_seed()