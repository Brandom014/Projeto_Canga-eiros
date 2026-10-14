import sqlite3
import os
import random

# Caminho para o banco de dados
DB_PATH = os.path.join(os.path.dirname(__file__), "banco.db")

# Imagens reais de material escolar para variar no cadastro
IMAGENS = [
    "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1503792501406-2c40da09e1e2?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1585336261026-6757688719d3?q=80&w=800&auto=format&fit=crop"
]

def gerar_100_produtos():
    produtos = []
    
    # 1. Escrita (30 produtos)
    cores_caneta = ["Azul", "Preta", "Vermelha", "Verde", "Rosa", "Roxa", "Laranja", "Dourada"]
    pontas = ["0.7mm", "1.0mm", "0.5mm"]
    for i, cor in enumerate(cores_caneta):
        for ponta in pontas:
            cost = round(random.uniform(0.60, 2.50), 2)
            produtos.append({
                "codigo_barras": f"78912345{len(produtos)+1000:05d}",
                "nome": f"Caneta Esferográfica {cor} {ponta}",
                "descricao": f"Caneta esferográfica escrita macia ponta {ponta} cor {cor}.",
                "categoria": "Papelaria", "subcategoria": "Escrita", "unidade_medida": "UN",
                "preco_custo": cost, "preco_venda": round(cost * 2.5, 2), "preco": round(cost * 2.5, 2),
                "estoque_atual": random.randint(30, 200), "estoque": random.randint(30, 200), "quantidade": random.randint(30, 200),
                "estoque_minimo": 10, "ncm": "96081000", "ativo": 1, "status": "Em estoque",
                "imagem_principal": IMAGENS[0], "imagem": IMAGENS[0]
            })

    lapis_tipos = ["Grafite HB nº2", "Grafite 2B", "Grafite 4B", "Grafite 6B", "Tons Pastéis 12 Cores", "24 Cores EcoLápis", "36 Cores Sextavado", "48 Cores Aquarelável"]
    for tipo in lapis_tipos:
        cost = round(random.uniform(1.20, 25.00), 2)
        produtos.append({
            "codigo_barras": f"78912345{len(produtos)+1000:05d}",
            "nome": f"Lápis {tipo}",
            "descricao": f"Lápis de excelente qualidade tipo {tipo}.",
            "categoria": "Papelaria", "subcategoria": "Escrita", "unidade_medida": "CX" if "Cores" in tipo else "UN",
            "preco_custo": cost, "preco_venda": round(cost * 2.2, 2), "preco": round(cost * 2.2, 2),
            "estoque_atual": random.randint(15, 80), "estoque": random.randint(15, 80), "quantidade": random.randint(15, 80),
            "estoque_minimo": 5, "ncm": "96091000", "ativo": 1, "status": "Em estoque",
            "imagem_principal": IMAGENS[1], "imagem": IMAGENS[1]
        })

    # 2. Cadernos e Papéis (25 produtos)
    materias = ["1 Matéria 80fls", "10 Matérias 200fls", "15 Matérias 300fls", "20 Matérias 400fls"]
    estilos = ["Capa Dura Preto", "Capa Dura Estampado", "Capa Dura Neon", "Capa Flexível", "Brochura 96fls"]
    for mat in materias:
        for est in estilos:
            cost = round(random.uniform(8.00, 32.00), 2)
            produtos.append({
                "codigo_barras": f"78912345{len(produtos)+1000:05d}",
                "nome": f"Caderno Universitário {mat} - {est}",
                "descricao": f"Caderno universitário {mat} com {est}.",
                "categoria": "Papelaria", "subcategoria": "Cadernos e Papéis", "unidade_medida": "UN",
                "preco_custo": cost, "preco_venda": round(cost * 1.9, 2), "preco": round(cost * 1.9, 2),
                "estoque_atual": random.randint(10, 60), "estoque": random.randint(10, 60), "quantidade": random.randint(10, 60),
                "estoque_minimo": 5, "ncm": "48201000", "ativo": 1, "status": "Em estoque",
                "imagem_principal": IMAGENS[2], "imagem": IMAGENS[2]
            })

    papeis = ["Papel Sulfite A4 75g Pacote 500fls", "Bloco Notas Adesivas 76x76mm Amarelo", "Bloco Sticky Notes Neon 4 Cores", "Papel Canson A4 140g 20fls", "Refil Caderno Inteligente Universitário"]
    for p in papeis:
        cost = round(random.uniform(3.50, 22.00), 2)
        produtos.append({
            "codigo_barras": f"78912345{len(produtos)+1000:05d}",
            "nome": p,
            "descricao": f"Item de papelaria escolar: {p}.",
            "categoria": "Papelaria", "subcategoria": "Cadernos e Papéis", "unidade_medida": "PCT" if "Pacote" in p else "UN",
            "preco_custo": cost, "preco_venda": round(cost * 1.8, 2), "preco": round(cost * 1.8, 2),
            "estoque_atual": random.randint(20, 100), "estoque": random.randint(20, 100), "quantidade": random.randint(20, 100),
            "estoque_minimo": 10, "ncm": "48025610", "ativo": 1, "status": "Em estoque",
            "imagem_principal": IMAGENS[2], "imagem": IMAGENS[2]
        })

    # 3. Corte e Adesão (15 produtos)
    corte_adesao = [
        "Tesoura Escolar Sem Ponta 13cm", "Tesoura Inox Multiuso 17cm", "Cola em Bastão 9g", "Cola em Bastão 21g", "Cola em Bastão 40g",
        "Cola Branca Escolar 90g", "Cola Branca Escolar 250g", "Fita Adesiva Transparente 12x30m", "Fita Crepe 18mmx50m", "Fita Dupla Face 12mm",
        "Kit Washi Tape 5 Rollos Decorados", "Corretivo em Fita 5mmx6m", "Corretivo Líquido 18ml", "Glitter Escolar 6 Cores 15g", "Cola Pano 37g"
    ]
    for item in corte_adesao:
        cost = round(random.uniform(1.80, 12.00), 2)
        produtos.append({
            "codigo_barras": f"78912345{len(produtos)+1000:05d}",
            "nome": item,
            "descricao": f"Artigo para corte e adesão escolar: {item}.",
            "categoria": "Papelaria", "subcategoria": "Corte e Adesão", "unidade_medida": "UN",
            "preco_custo": cost, "preco_venda": round(cost * 2.1, 2), "preco": round(cost * 2.1, 2),
            "estoque_atual": random.randint(25, 120), "estoque": random.randint(25, 120), "quantidade": random.randint(25, 120),
            "estoque_minimo": 8, "ncm": "35061000", "ativo": 1, "status": "Em estoque",
            "imagem_principal": IMAGENS[3], "imagem": IMAGENS[3]
        })

    # 4. Artes e Atividades (15 produtos)
    artes = [
        "Tinta Guache 6 Cores 15ml", "Tinta Guache 12 Cores 15ml", "Massa de Modelar 6 Cores 90g", "Massa de Modelar Soft 12 Cores",
        "Giz de Cera Meu Primeiro Giz 12 Cores", "Giz de Cera Retrátil 8 Cores", "Pincel Escolar Chato nº 8", "Pincel Escolar Redondo nº 4",
        "Kit Pincéis Escolares 4 Unidades", "Tela para Pintura 20x30cm", "Papel E.V.A. com Glitter A4 Pacote 5fls", "Cartolina Escolar Branca",
        "Cartolina Escolar Colorida Pacote 10fls", "Caneta Hidrocor 12 Cores Lavável", "Caneta Hidrocor 24 Cores Ponta Fina"
    ]
    for item in artes:
        cost = round(random.uniform(2.50, 18.00), 2)
        produtos.append({
            "codigo_barras": f"78912345{len(produtos)+1000:05d}",
            "nome": item,
            "descricao": f"Material para artes e atividades pedagógicas: {item}.",
            "categoria": "Papelaria", "subcategoria": "Artes e Atividades", "unidade_medida": "UN" if "Pincel" in item or "Tela" in item else "CX",
            "preco_custo": cost, "preco_venda": round(cost * 2.0, 2), "preco": round(cost * 2.0, 2),
            "estoque_atual": random.randint(15, 75), "estoque": random.randint(15, 75), "quantidade": random.randint(15, 75),
            "estoque_minimo": 5, "ncm": "32131000", "ativo": 1, "status": "Em estoque",
            "imagem_principal": IMAGENS[4], "imagem": IMAGENS[4]
        })

    # 5. Organização e Acessórios (15 produtos)
    organizacao = [
        "Régua Plástica Transparente 30cm", "Régua Alumínio 30cm", "Kit Esquadros + Transferidor", "Compasso Escolar com Grafite",
        "Pasta L Transparente A4", "Pasta Sanfonada 12 Divisórias A4", "Pasta Aba Elástico Plástica", "Pasta Catálogo 50 Plásticos",
        "Grampeador de Mesa Mini 26/6", "Caixa de Grampos 26/6 5000un", "Perfurador de Papel 2 Furos 10fls", "Caixa de Clips para Papel 2/0 100un",
        "Borracha Escolar Branca com Cinta", "Apontador com Depósito Duplo", "Apontador Simples de Metal"
    ]
    for item in organizacao:
        cost = round(random.uniform(1.10, 22.00), 2)
        produtos.append({
            "codigo_barras": f"78912345{len(produtos)+1000:05d}",
            "nome": item,
            "descricao": f"Acessório de organização escolar e escritório: {item}.",
            "categoria": "Papelaria", "subcategoria": "Organização e Acessórios", "unidade_medida": "UN" if not "Caixa" in item else "CX",
            "preco_custo": cost, "preco_venda": round(cost * 2.2, 2), "preco": round(cost * 2.2, 2),
            "estoque_atual": random.randint(20, 110), "estoque": random.randint(20, 110), "quantidade": random.randint(20, 110),
            "estoque_minimo": 5, "ncm": "39261000", "ativo": 1, "status": "Em estoque",
            "imagem_principal": IMAGENS[5], "imagem": IMAGENS[5]
        })

    # Garante exatamente 100 produtos
    return produtos[:100]

def rodar_seed():
    if not os.path.exists(DB_PATH):
        print(f"❌ Banco de dados não encontrado em: {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Mapeia as colunas reais da tabela 'produtos'
    cursor.execute("PRAGMA table_info(produtos);")
    colunas_existentes = [col[1] for col in cursor.fetchall()]

    if not colunas_existentes:
        print("❌ A tabela 'produtos' não foi encontrada na base de dados!")
        conn.close()
        return

    produtos_seed = gerar_100_produtos()
    print(f"🌱 Inserindo {len(produtos_seed)} produtos no banco de dados...")

    sucesso = 0
    for prod in produtos_seed:
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
        except Exception as e:
            pass

    conn.commit()
    conn.close()
    print(f"✅ {sucesso} produtos cadastrados com sucesso!")
    print("🎉 Atualize a página do seu navegador (F5) para visualizar os 100 produtos.")

if __name__ == "__main__":
    rodar_seed()