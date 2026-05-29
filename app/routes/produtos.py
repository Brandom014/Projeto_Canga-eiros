from fastapi import APIRouter, Depends, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.produtos import Produto
from app.dependencies import get_current_user

router = APIRouter(prefix="/produtos", tags=["Produtos"])

templates = Jinja2Templates(directory="app/templates")

# Página HTML dos produtos
@router.get("/", response_class=HTMLResponse)
def pagina_produtos(
    request: Request,
    db: Session = Depends(get_db)
):

    produtos = db.query(Produto).all()

    return templates.TemplateResponse(
        "produtos.html",
        {
            "request": request,
            "produtos": produtos
        }
    )

# Criar produto
@router.post("/criar")
def criar_produto(
    nome: str,
    preco: float,
    estoque: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):

    produto = Produto(
        nome=nome,
        preco=preco,
        estoque=estoque
    )

    db.add(produto)
    db.commit()

    return {"msg": "Produto criado"}