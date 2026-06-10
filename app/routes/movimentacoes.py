from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates


router = APIRouter()

templates = Jinja2Templates(
    directory="app/templates"
)

@router.get("/movimentacoes", response_class=HTMLResponse)
def tela_movimentacoes(request: Request):
    return templates.TemplateResponse(
        "movimentacoes.html",
        {"request": request}
    )


@router.get("/relatorio", response_class=HTMLResponse)
def tela_relatorio(request: Request):
    return templates.TemplateResponse(
        "relatorio.html",
        {"request": request}
    )

@router.get("/configuracoes", response_class=HTMLResponse)
def tela_relatorio(request: Request):
    return templates.TemplateResponse(
        "configuracoes.html",
        {"request": request}
    )