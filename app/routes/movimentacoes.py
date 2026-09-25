from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Request, Depends, HTTPException, status
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.movimentacoes import Movimentacao
from app.models.produtos import Produto
from app.models.usuarios import Usuario
from app.dependencies import get_current_user


router = APIRouter()

templates = Jinja2Templates(
    directory="app/templates"
)

FUSO_BR = ZoneInfo("America/Sao_Paulo")


def formatar_data_movimentacao(dt):
    if not dt:
        return None
    
    # Se a data no banco não tiver timezone definido (naive), assumimos que foi salva em UTC
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
        
    # Converte para o fuso horário de Brasília (UTC-3)
    return dt.astimezone(FUSO_BR).isoformat()


# Schema para validação dos dados de entrada
class MovimentacaoCreate(BaseModel):
    produto_id: int
    tipo: str  # "ENTRADA" ou "SAIDA"
    quantidade: int
    valor: float
    observacao: Optional[str] = None


@router.get("/movimentacoes", response_class=HTMLResponse)
def tela_movimentacoes(
    request: Request,
    user=Depends(get_current_user)
):
    return templates.TemplateResponse(
        "movimentacoes.html",
        {"request": request}
    )


@router.get("/api/movimentacoes")
def listar_movimentacoes(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    movimentacoes = db.query(Movimentacao).all()

    return [
        {
            "id": m.id,
            "produto": m.produto.nome if m.produto else "-",
            "usuario": m.usuario.nome if m.usuario else "-",
            "tipo": m.tipo,
            "quantidade": m.quantidade,
            "valor": m.valor,
            "observacao": m.observacao,
            "data": formatar_data_movimentacao(m.data)
        }
        for m in movimentacoes
    ]


@router.post("/api/movimentacoes")
def criar_movimentacao(
    dados: MovimentacaoCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    # Verifica se o produto existe
    produto = db.query(Produto).filter(Produto.id == dados.produto_id).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    tipo_normalizado = dados.tipo.strip().upper()

    # Atualiza o estoque do produto caso a coluna exista
    if hasattr(produto, "estoque") and produto.estoque is not None:
        if tipo_normalizado == "ENTRADA":
            produto.estoque += dados.quantidade
        elif tipo_normalizado == "SAIDA":
            if produto.estoque < dados.quantidade:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Estoque insuficiente. Estoque atual: {produto.estoque}"
                )
            produto.estoque -= dados.quantidade

    nova_movimentacao = Movimentacao(
        produto_id=dados.produto_id,
        usuario_id=user.id,
        tipo=tipo_normalizado,
        quantidade=dados.quantidade,
        valor=dados.valor,
        observacao=dados.observacao,
        data=datetime.now(timezone.utc)
    )

    db.add(nova_movimentacao)
    db.commit()
    db.refresh(nova_movimentacao)

    return {
        "mensagem": "Movimentação criada com sucesso",
        "id": nova_movimentacao.id
    }


@router.get("/relatorio", response_class=HTMLResponse)
def tela_relatorio(
    request: Request,
    user=Depends(get_current_user)
):
    return templates.TemplateResponse(
        "relatorio.html",
        {"request": request}
    )