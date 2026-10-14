from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from typing import List, Optional, Any, Union

# Certifique-se de que o router NÃO tem prefixo aqui
router = APIRouter()

templates = Jinja2Templates(directory="app/templates")

# ---------------------------------------------------------
# SCHEMAS DE DADOS DA VENDA
# ---------------------------------------------------------
class PagamentoSchema(BaseModel):
    tipo: str
    nome: Optional[str] = ""
    valor: float

class ItemVendaSchema(BaseModel):
    produto_id: Optional[Any] = None
    nome: Optional[str] = ""
    quantidade: int
    preco_unitario: Optional[float] = 0.0

class VendaRequestPayload(BaseModel):
    vendedor: Optional[str] = "Admin"
    cliente_id: Optional[Any] = None
    cliente: Optional[Union[str, dict]] = "Consumidor Final"
    itens: List[ItemVendaSchema]
    subtotal: float
    desconto: float
    total: float
    troco: Optional[float] = 0.0
    pagamentos: List[PagamentoSchema]


# 1. Rota GET para carregar o HTML da página
@router.get("/pagamento", response_class=HTMLResponse)
async def renderizar_pagamento(request: Request):
    return templates.TemplateResponse("pagamento.html", {"request": request})


# 2. Rota POST (Aceita /vendas/api/finalizar, /api/finalizar-venda e /vendas/finalizar)
@router.post("/vendas/api/finalizar")
@router.post("/api/finalizar-venda")
@router.post("/vendas/finalizar")
async def finalizar_venda(venda: VendaRequestPayload):
    try:
        # ---------------------------------------------------------
        # TRAVA DE SEGURANÇA: VALIDAÇÃO DO DESCONTO NO BACKEND
        # ---------------------------------------------------------
        if venda.desconto < 0:
            raise HTTPException(
                status_code=400,
                detail="O valor do desconto não pode ser negativo."
            )

        if venda.desconto > venda.subtotal:
            raise HTTPException(
                status_code=400,
                detail=f"O desconto (R$ {venda.desconto:.2f}) não pode ser maior que o subtotal da compra (R$ {venda.subtotal:.2f})."
            )

        nome_cliente = "Consumidor Final"
        if isinstance(venda.cliente, dict):
            nome_cliente = venda.cliente.get("nome", "Consumidor Final")
        elif isinstance(venda.cliente, str):
            nome_cliente = venda.cliente

        print("\n================ VENDA RECEBIDA NO PYTHON ================")
        print(f"Vendedor: {venda.vendedor}")
        print(f"Cliente: {nome_cliente}")
        print(f"Subtotal: R$ {venda.subtotal:.2f} | Desconto: R$ {venda.desconto:.2f}")
        print(f"Total: R$ {venda.total:.2f} | Troco: R$ {venda.troco:.2f}")
        print(f"Pagamentos: {len(venda.pagamentos)} forma(s)")
        print(f"Itens: {len(venda.itens)} produto(s)")
        print("===========================================================\n")

        # --- AQUI VOCÊ ADICIONA A LÓGICA DE SALVAR NO BANCO E DAR BAIXA NO ESTOQUE ---

        return {
            "status": "sucesso",
            "mensagem": "Venda realizada com sucesso!",
            "venda_id": 1024
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro ao processar venda: {e}")
        raise HTTPException(status_code=400, detail=str(e))