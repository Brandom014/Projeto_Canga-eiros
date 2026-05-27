from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.produtos import Produto
from app.models.vendas import Venda
from app.models.itens_venda import ItemVenda
from app.dependencies import get_current_user
from app.models.movimentacoes import Movimentacao

router = APIRouter(prefix="/vendas", tags=["Vendas"])

@router.post("/")
def criar_venda(produto_id: int, quantidade: int, db: Session = Depends(get_db), user=Depends(get_current_user)):

    produto = db.query(Produto).filter(Produto.id == produto_id).first()

    if not produto:
        raise HTTPException(status_code=404, detail="Produto não existe")

    if produto.estoque < quantidade:
        raise HTTPException(status_code=400, detail="Estoque insuficiente")

    total = produto.preco * quantidade

    venda = Venda(total=total)
    db.add(venda)
    db.commit()
    db.refresh(venda)

    item = ItemVenda(
        venda_id=venda.id,
        produto_id=produto.id,
        quantidade=quantidade,
        subtotal=total
    )

    produto.estoque -= quantidade

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
        "msg": "Venda realizada",
        "total": total
    }

@router.get("/")
def listar_vendas(db: Session = Depends(get_db)):

    vendas = db.query(Venda).all()

    return vendas

@router.get("/itens")
def listar_itens(db: Session = Depends(get_db)):

    itens = db.query(ItemVenda).all()

    return itens