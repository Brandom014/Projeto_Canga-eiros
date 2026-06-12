from pydantic import BaseModel
from typing import List

class ItemVendaRequest(BaseModel):
    produto_id: int
    quantidade: int

class VendaRequest(BaseModel):
    itens: List[ItemVendaRequest]