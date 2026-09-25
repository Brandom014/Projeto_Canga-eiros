from datetime import datetime
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
from app.schemas.venda import VendaRequest

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
# FINALIZAR VENDA (COM SUPORTE A DESCONTO)
# =========================

@router.post("/api/finalizar")
def finalizar_venda(
    dados: VendaRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    if not dados.itens:
        raise HTTPException(
            status_code=400,
            detail="Carrinho vazio"
        )

    if any(item.quantidade < 1 for item in dados.itens):
        raise HTTPException(
            status_code=400,
            detail="A quantidade de cada produto deve ser maior que zero."
        )

    if dados.forma_pagamento not in {"dinheiro", "pix", "debito", "credito"}:
        raise HTTPException(
            status_code=400,
            detail="Forma de pagamento inválida."
        )

    total_bruto = 0.0
    produtos_processados = []

    # Valida todos os produtos e calcula o subtotal bruto
    for item in dados.itens:
        produto = (
            db.query(Produto)
            .filter(Produto.id == item.produto_id)
            .first()
        )

        if not produto:
            raise HTTPException(
                status_code=404,
                detail=f"Produto {item.produto_id} não encontrado"
            )

        if produto.estoque < item.quantidade:
            raise HTTPException(
                status_code=400,
                detail=f"Estoque insuficiente para {produto.nome}"
            )

        subtotal_item = produto.preco * item.quantidade
        total_bruto += float(subtotal_item)

        produtos_processados.append({
            "produto": produto,
            "quantidade": item.quantidade
        })

    # Captura o desconto (caso enviado) e calcula o valor líquido
    desconto = float(getattr(dados, "desconto", 0) or 0)
    total_liquido = max(0.0, total_bruto - desconto)

    # Cria o dicionário da venda
    venda_kwargs = {
        "data": datetime.now(),
        "total": total_liquido,
        "usuario_id": user.id,
        "forma_pagamento": dados.forma_pagamento,
        "cliente": getattr(dados, "cliente", None) or getattr(dados, "cliente_id", None),
    }

    # Atribui o campo desconto apenas se a model Venda possuir essa coluna
    if hasattr(Venda, "desconto"):
        venda_kwargs["desconto"] = desconto

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

    return {
        "id": venda.id,
        "cliente": venda.cliente or "Consumidor Final",
        "forma_pagamento": venda.forma_pagamento,
        "subtotal": subtotal_bruto,
        "desconto": desconto,
        "total": total_final,
        "data": venda.data.isoformat() if venda.data else "",
        "itens": itens_formatados
    }