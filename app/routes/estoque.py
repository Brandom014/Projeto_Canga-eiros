from fastapi import APIRouter, Depends, Request, Form, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.produtos import Produto
from app.models.categoria import Categoria

router = APIRouter(prefix="/estoque", tags=["Estoque"])

templates = Jinja2Templates(directory="app/templates")


# =========================
# LISTAR PRODUTOS
# =========================

@router.get("/", response_class=HTMLResponse)
def estoque(
    request: Request,
    db: Session = Depends(get_db)
):

    produtos = db.query(Produto).all()
    categorias = db.query(Categoria).all()

    total = len(produtos)

    em_falta = len(
        [p for p in produtos if p.estoque == 0]
    )

    estoque_total = sum(
        p.estoque
        for p in produtos
    )

    valor_total = sum(
        p.preco * p.estoque
        for p in produtos
    )

    return templates.TemplateResponse(
        "estoque.html",
        {
            "request": request,
            "produtos": produtos,
            "categorias": categorias,
            "total": total,
            "em_falta": em_falta,
            "estoque_total": estoque_total,
            "valor_total": valor_total
        }
    )


# =========================
# CRIAR PRODUTO
# =========================

@router.post("/criar")
def criar_produto(
    nome: str = Form(...),
    preco: float = Form(...),
    estoque: int = Form(...),
    db: Session = Depends(get_db)
):

    produto = Produto(
        nome=nome,
        preco=preco,
        estoque=estoque,
        ativo=True
    )

    db.add(produto)
    db.commit()

    return RedirectResponse(
        "/estoque/",
        status_code=303
    )


# =========================
# EDITAR PRODUTO
# =========================

@router.post("/editar/{produto_id}")
def editar_produto(
    produto_id: int,
    nome: str = Form(...),
    preco: float = Form(...),
    estoque: int = Form(...),
    db: Session = Depends(get_db)
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

    produto.nome = nome
    produto.preco = preco
    produto.estoque = estoque

    db.commit()

    return RedirectResponse(
        "/estoque/",
        status_code=303
    )


# =========================
# ATUALIZAR ESTOQUE
# =========================

@router.post("/atualizar/{produto_id}")
def atualizar_estoque(
    produto_id: int,
    estoque: int = Form(...),
    db: Session = Depends(get_db)
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

    produto.estoque = estoque

    db.commit()

    return RedirectResponse(
        "/estoque/",
        status_code=303
    )


# =========================
# ATIVAR / DESATIVAR
# =========================

@router.post("/toggle/{produto_id}")
def toggle_produto(
    produto_id: int,
    db: Session = Depends(get_db)
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

    produto.ativo = not produto.ativo

    db.commit()

    return RedirectResponse(
        "/estoque/",
        status_code=303
    )


# =========================
# EXCLUIR PRODUTO
# =========================

@router.post("/excluir/{produto_id}")
def excluir_produto(
    produto_id: int,
    db: Session = Depends(get_db)
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

    db.delete(produto)
    db.commit()

    return RedirectResponse(
        "/estoque/",
        status_code=303
    )