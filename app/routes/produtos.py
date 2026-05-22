from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.produtos import Produto

router = APIRouter(prefix="/produtos", tags=["Produtos"])

@router.post("/")
def criar_produto(nome: str, preco: float, estoque: int, db: Session = Depends(get_db)):
    produto = Produto(nome=nome, preco=preco, estoque=estoque)
    db.add(produto)
    db.commit()
    return {"msg": "Produto criado"}

@router.get("/")
def listar_produtos(db: Session = Depends(get_db)):
    return db.query(Produto).all()