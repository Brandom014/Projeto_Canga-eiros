from app.models.produtos import Produto


def criar_produto(db, nome: str, preco: float, estoque: int):
    produto = Produto(
        nome=nome,
        preco=preco,
        estoque=estoque
    )

    db.add(produto)
    db.commit()
    db.refresh(produto)

    return produto


def listar_produtos(db):
    return db.query(Produto).all()