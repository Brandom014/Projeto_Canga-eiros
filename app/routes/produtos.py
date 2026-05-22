from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.produtos import Produto
from app.dependencies import get_current_user

router = APIRouter(prefix="/produtos", tags=["Produtos"])

@router.post("/")
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
    return {"msg": "Produto criado", "user": user}

@router.get("/")
def listar_produtos(db: Session = Depends(get_db)):
    return db.query(Produto).all()