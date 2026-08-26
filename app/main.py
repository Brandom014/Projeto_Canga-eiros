from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy import inspect, text

from app.database import Base, engine

from app.routes import (
    produtos,
    categorias,
    auth,
    vendas,
    estoque,
    dashboard,
    usuarios,
    movimentacoes,
    relatorio
)

# Cria as tabelas
Base.metadata.create_all(bind=engine)

# Mantém instalações SQLite existentes compatíveis com a foto de perfil.
with engine.begin() as connection:
    usuarios_columns = {
        column["name"] for column in inspect(engine).get_columns("usuarios")
    }
    if "foto_perfil" not in usuarios_columns:
        connection.execute(
            text("ALTER TABLE usuarios ADD COLUMN foto_perfil VARCHAR")
        )
    vendas_columns = {
        column["name"] for column in inspect(engine).get_columns("vendas")
    }
    if "cliente" not in vendas_columns:
        connection.execute(
            text("ALTER TABLE vendas ADD COLUMN cliente VARCHAR")
        )

# App
app = FastAPI(
    title="PDV SENAI"
)

# Templates
templates = Jinja2Templates(
    directory="app/templates"
)

# Arquivos estáticos (css, js, imagens)
app.mount(
    "/static",
    StaticFiles(directory="app/static"),
    name="static"
)

# Se você tiver uma pasta uploads separada
# descomente estas linhas:

# app.mount(
#     "/uploads",
#     StaticFiles(directory="uploads"),
#     name="uploads"
# )

# Rotas
app.include_router(produtos.router)
app.include_router(auth.router)
app.include_router(vendas.router)
app.include_router(estoque.router)
app.include_router(dashboard.router)
app.include_router(usuarios.router)
app.include_router(categorias.router)
app.include_router(movimentacoes.router)
app.include_router(relatorio.router)

# Home
@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse(
        "base.html",
        {
            "request": request
        }
    )

# Página 404
@app.exception_handler(404)
def not_found(request: Request, exc):
    return templates.TemplateResponse(
        "404.html",
        {
            "request": request
        },
        status_code=404
    )

# Tratamento de autenticação
@app.exception_handler(StarletteHTTPException)
def http_exception_handler(
    request: Request,
    exc: StarletteHTTPException
):

    if exc.status_code == 401:
        response = RedirectResponse(
            url="/auth/login?erro=Sessão expirada. Faça login novamente.",
            status_code=303,
        )
        response.delete_cookie("access_token", path="/")
        return response

    if exc.status_code == 403:
        response = RedirectResponse(
            url="/auth/login?erro=Acesso não autorizado.",
            status_code=303,
        )
        response.delete_cookie("access_token", path="/")
        return response

    return RedirectResponse(
        url="/404"
    )