import json
from datetime import datetime
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.categoria import Categoria
from app.models.itens_venda import ItemVenda
from app.models.movimentacoes import Movimentacao
from app.models.produtos import Produto
from app.models.vendas import Venda

router = APIRouter(
    prefix="/vendas",
    tags=["Vendas"]
)

templates = Jinja2Templates(
    directory="app/templates"
)

# =========================
# TELA PDV
# =========================

@router.get("/", response_class=HTMLResponse)
def pagina_vendas(
    request: Request,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    produtos = (
        db.query(Produto)
        .filter(Produto.ativo == True)
        .all()
    )

    categorias = (
        db.query(Categoria)
        .all()
    )

    return templates.TemplateResponse(
        "vendas.html",
        {
            "request": request,
            "produtos": produtos,
            "categorias": categorias
        }
    )

# =========================
# FINALIZAR VENDA (SUPORTE TOTAL A MÚLTIPLOS PAGAMENTOS)
# =========================

@router.post("/api/finalizar")
def finalizar_venda(
    dados: Dict[str, Any],
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    itens_in = dados.get("itens", [])
    if not itens_in:
        raise HTTPException(
            status_code=400,
            detail="Carrinho vazio"
        )

    for item in itens_in:
        qtd = int(item.get("quantidade", 0))
        if qtd < 1:
            raise HTTPException(
                status_code=400,
                detail="A quantidade de cada produto deve ser maior que zero."
            )

    pagamentos_in = dados.get("pagamentos", [])
    forma_pagto = str(dados.get("forma_pagamento", "") or "").lower()

    if not pagamentos_in and forma_pagto not in {"dinheiro", "pix", "debito", "credito", "multiplo"}:
        raise HTTPException(
            status_code=400,
            detail="Forma de pagamento inválida."
        )

    total_bruto = 0.0
    produtos_processados = []

    # Valida todos os produtos e calcula o subtotal bruto
    for item in itens_in:
        p_id = item.get("produto_id") or item.get("id")
        qtd = int(item.get("quantidade", 1))

        produto = (
            db.query(Produto)
            .filter(Produto.id == p_id)
            .first()
        )

        if not produto:
            raise HTTPException(
                status_code=404,
                detail=f"Produto {p_id} não encontrado"
            )

        if produto.estoque < qtd:
            raise HTTPException(
                status_code=400,
                detail=f"Estoque insuficiente para {produto.nome}"
            )

        subtotal_item = produto.preco * qtd
        total_bruto += float(subtotal_item)

        produtos_processados.append({
            "produto": produto,
            "quantidade": qtd
        })

    # Captura desconto e troco
    desconto = float(dados.get("desconto") or 0)
    total_liquido = max(0.0, total_bruto - desconto)
    troco = float(dados.get("troco") or 0)

    # Guarda a lista completa de pagamentos em formato JSON
    if pagamentos_in and len(pagamentos_in) > 0:
        forma_pagamento_salvar = json.dumps(pagamentos_in)
    else:
        forma_pagamento_salvar = forma_pagto or "dinheiro"

    cliente_info = dados.get("cliente") or dados.get("cliente_id")

    venda_kwargs = {
        "data": datetime.now(),
        "total": total_liquido,
        "usuario_id": user.id,
        "forma_pagamento": forma_pagamento_salvar,
        "cliente": str(cliente_info) if cliente_info else None,
    }

    if hasattr(Venda, "desconto"):
        venda_kwargs["desconto"] = desconto

    if hasattr(Venda, "troco"):
        venda_kwargs["troco"] = troco

    venda = Venda(**venda_kwargs)

    db.add(venda)
    db.commit()
    db.refresh(venda)

    # Cria os itens da venda e realiza as baixas de estoque
    for item in produtos_processados:
        produto = item["produto"]
        quantidade = item["quantidade"]

        item_venda = ItemVenda(
            venda_id=venda.id,
            produto_id=produto.id,
            quantidade=quantidade,
            preco=produto.preco
        )
        db.add(item_venda)

        produto.estoque -= quantidade

        movimentacao = Movimentacao(
            produto_id=produto.id,
            usuario_id=user.id,
            tipo="saida",
            quantidade=quantidade,
            valor=produto.preco,
            observacao="Venda finalizada",
        )
        db.add(movimentacao)

    db.commit()

    return {
        "success": True,
        "venda_id": venda.id,
        "subtotal": total_bruto,
        "desconto": desconto,
        "total": total_liquido,
        "troco": troco,
        "itens": len(produtos_processados)
    }

# =========================
# PRODUTOS
# =========================

@router.get("/produtos")
def listar_produtos(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    produtos = (
        db.query(Produto)
        .filter(Produto.ativo == True)
        .all()
    )
    return produtos

# =========================
# HISTÓRICO
# =========================

@router.get("/historico")
def historico_vendas(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    return (
        db.query(Venda)
        .order_by(Venda.id.desc())
        .all()
    )

# =========================
# DETALHES DA VENDA (PARA O MODAL DO RELATÓRIO)
# =========================

@router.get("/api/detalhes/{venda_id}")
def obter_detalhes_venda(
    venda_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    venda = db.query(Venda).filter(Venda.id == venda_id).first()

    if not venda:
        raise HTTPException(
            status_code=404,
            detail="Venda não encontrada"
        )

    itens_db = (
        db.query(ItemVenda, Produto)
        .join(Produto, ItemVenda.produto_id == Produto.id)
        .filter(ItemVenda.venda_id == venda_id)
        .all()
    )

    itens_formatados = []
    subtotal_bruto = 0.0

    for item_venda, produto in itens_db:
        subtotal_item = float(item_venda.quantidade * item_venda.preco)
        subtotal_bruto += subtotal_item
        itens_formatados.append({
            "nome": produto.nome,
            "quantidade": item_venda.quantidade,
            "preco_unitario": float(item_venda.preco),
            "subtotal": subtotal_item
        })

    desconto = float(getattr(venda, "desconto", 0) or 0)
    total_final = float(venda.total)
    troco = float(getattr(venda, "troco", 0) or 0)

    # Identifica o vendedor
    vendedor_nome = "Administrador"
    if hasattr(venda, "usuario") and venda.usuario:
        vendedor_nome = getattr(venda.usuario, "nome", None) or getattr(venda.usuario, "username", None) or "Administrador"

    # Processa os pagamentos (Extrai a lista enviada em JSON)
    pagamentos_formatados = []
    forma_raw = str(getattr(venda, "forma_pagamento", "") or "")

    if forma_raw.startswith("[") or forma_raw.startswith("{"):
        try:
            data_parsed = json.loads(forma_raw)
            if isinstance(data_parsed, list):
                for item in data_parsed:
                    pagamentos_formatados.append({
                        "tipo": item.get("tipo") or item.get("forma") or "Pagamento",
                        "nome": item.get("nome") or item.get("tipo") or "Pagamento",
                        "valor": float(item.get("valor", 0))
                    })
        except Exception:
            pass

    if not pagamentos_formatados:
        pagamentos_formatados.append({
            "tipo": venda.forma_pagamento or "dinheiro",
            "nome": venda.forma_pagamento or "Dinheiro",
            "valor": total_final
        })

    return {
        "id": venda.id,
        "cliente": venda.cliente or "Consumidor Final",
        "vendedor": vendedor_nome,
        "forma_pagamento": venda.forma_pagamento,
        "subtotal": subtotal_bruto,
        "desconto": desconto,
        "total": total_final,
        "troco": troco,
        "data": venda.data.isoformat() if venda.data else "",
        "pagamentos": pagamentos_formatados,
        "itens": itens_formatados
    }