from fastapi import FastAPI
from app.database import Base, engine

from app.routes import produtos, auth, vendas

Base.metadata.create_all(bind=engine)

app = FastAPI(title="API de Produtos")

app.include_router(produtos.router)
app.include_router(auth.router)
app.include_router(vendas.router)

@app.get("/")
def home():
    return {"mensagem": "API funcionando"}