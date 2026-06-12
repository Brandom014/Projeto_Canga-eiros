from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user

from app.models.produtos import Produto
from app.models.vendas import Venda
from app.models.itens_venda import ItemVenda
from app.models.movimentacoes import Movimentacao
from app.models.categoria import Categoria

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
    db: Session = Depends(get_db)
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
# FINALIZAR VENDA
# =========================

@router.post("/finalizar")
def finalizar_venda(
    produto_id: int,
    quantidade: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):

    produto = (
        db.query(Produto)
        .filter(Produto.id == produto_id)
        .first()
    )

    if not produto:
        raise HTTPException(
            status_code=404,
            detail="Produto não encontrado"
        )

    if produto.estoque < quantidade:
        raise HTTPException(
            status_code=400,
            detail="Estoque insuficiente"
        )

    total = produto.preco * quantidade

    venda = Venda(
        total=total,
        usuario_id=user.id
    )

    db.add(venda)
    db.commit()
    db.refresh(venda)

    item = ItemVenda(
        venda_id=venda.id,
        produto_id=produto.id,
        quantidade=quantidade,
        preco=produto.preco
    )

    produto.estoque -= quantidade

    movimentacao = Movimentacao(
        produto_id=produto.id,
        tipo="saida",
        quantidade=quantidade
    )

    db.add(item)
    db.add(movimentacao)

    db.commit()

    return {
        "success": True,
        "venda_id": venda.id,
        "total": total
    }

# =========================
# PRODUTOS
# =========================

@router.get("/produtos")
def listar_produtos(
    db: Session = Depends(get_db)
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
    db: Session = Depends(get_db)
):

    return (
        db.query(Venda)
        .order_by(Venda.id.desc())
        .all()
    )