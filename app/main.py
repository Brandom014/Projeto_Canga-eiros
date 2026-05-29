from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from app.database import Base, engine
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from app.routes import produtos, auth, vendas, estoque, dashboard, usuarios

Base.metadata.create_all(bind=engine)

app = FastAPI(title="API de Produtos")

templates = Jinja2Templates(directory="app/templates")

app.mount("/static", StaticFiles(directory="app/static"), name="static")

app.include_router(produtos.router)
app.include_router(auth.router)
app.include_router(vendas.router)
app.include_router(estoque.router)
app.include_router(dashboard.router)
app.include_router(usuarios.router)

@app.get("/", response_class=HTMLResponse)
def home(request: Request):

    return templates.TemplateResponse(
        "base.html",
        {"request": request}
    )