from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime

from app.models.vendas import Venda
from app.models.itens_venda import ItemVenda
from app.models.produtos import Produto
from app.models.movimentacoes import MovimentacaoEstoque  # Presente no teu projeto!
from app.schemas.venda import VendaRequest


def criar_venda(db: Session, dados: VendaRequest):
    try:
        total_venda = 0
        itens_para_processar = []

        # 1. Validar estoques e calcular os valores de todos os itens
        for item_req in dados.itens:
            produto = db.query(Produto).filter(Produto.id == item_req.produto_id).first()

            if not produto:
                raise HTTPException(
                    status_code=404, 
                    detail=f"Produto ID {item_req.produto_id} não encontrado."
                )

            if produto.estoque < item_req.quantidade:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Estoque insuficiente para '{produto.nome}'. Atual: {produto.estoque}"
                )

            subtotal_item = produto.preco * item_req.quantidade
            total_venda += subtotal_item

            itens_para_processar.append({
                "produto": produto,
                "quantidade": item_req.quantidade,
                "preco_unitario": produto.preco,
                "subtotal": subtotal_item
            })

        # 2. Criar o registro principal da Venda
        venda = Venda(
            total=total_venda,
            forma_pagamento=dados.forma_pagamento,
            cliente=dados.cliente
        )
        db.add(venda)
        
        # O db.flush() gera o ID da venda sem fechar a transação no banco
        db.flush()

        # 3. Baixar estoque, adicionar itens da venda e salvar a movimentação
        for item_info in itens_para_processar:
            prod = item_info["produto"]
            qtd = item_info["quantidade"]

            # Baixa o estoque do produto
            prod.estoque -= qtd

            # Salva o Item associado à Venda
            item_venda = ItemVenda(
                venda_id=venda.id,
                produto_id=prod.id,
                quantidade=qtd,
                preco_unitario=item_info["preco_unitario"],
                subtotal=item_info["subtotal"]
            )
            db.add(item_venda)

            # Registra o histórico de saída no estoque (movimentacoes.py)
            movimentacao = MovimentacaoEstoque(
                produto_id=prod.id,
                tipo="SAIDA",
                quantidade=qtd,
                origem="VENDA",
                origem_id=venda.id,
                observacao=f"Venda #{venda.id}"
            )
            db.add(movimentacao)

        # 4. Salva TUDO de uma só vez com segurança
        db.commit()
        db.refresh(venda)
        return venda

    except Exception as e:
        db.rollback()  # Se der qualquer erro, cancela tudo!
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


def listar_vendas(db: Session):
    return db.query(Venda).all()