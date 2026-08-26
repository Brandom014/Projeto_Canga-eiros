from pydantic import BaseModel
from typing import List

class ItemVendaRequest(BaseModel):
    produto_id: int
    quantidade: int

class VendaRequest(BaseModel):
    itens: List[ItemVendaRequest]
    forma_pagamento: str = "Dinheiro"
    cliente: str | None = None