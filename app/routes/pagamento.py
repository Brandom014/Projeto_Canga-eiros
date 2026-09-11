from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

# Configura a pasta onde estão os arquivos .html
templates = Jinja2Templates(directory="app/templates")

# Schemas de dados que chegam no POST
class ItemVenda(BaseModel):
    produto_id: int
    quantidade: int

class VendaRequest(BaseModel):
    itens: List[ItemVenda]
    forma_pagamento: str
    cliente: Optional[str] = "Cliente Avulso"


# 1. Rota GET que carrega a tela de pagamento em HTML
@router.get("/pagamento", response_class=HTMLResponse)
async def renderizar_pagamento(request: Request):
    return templates.TemplateResponse("pagamento.html", {"request": request})


# 2. Rota POST que recebe o pagamento e finaliza a venda
@router.post("/vendas/finalizar")
async def finalizar_venda(venda: VendaRequest):
    try:
        # Lógica de banco de dados entra aqui (ex: salvar venda, atualizar estoque)
        
        return {
            "status": "sucesso",
            "mensagem": "Venda realizada com sucesso!",
            "venda_id": 1024
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))