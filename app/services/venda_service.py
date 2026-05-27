from app.models.vendas import Venda
from app.models.itens_venda import ItemVenda
from app.models.produtos import Produto


def criar_venda(db, produto_id: int, quantidade: int):

    produto = db.query(Produto).filter(Produto.id == produto_id).first()

    if not produto:
        raise Exception("Produto não existe")

    if produto.estoque < quantidade:
        raise Exception("Estoque insuficiente")

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

    db.add(item)
    db.commit()

    return venda


def listar_vendas(db):
    return db.query(Venda).all()