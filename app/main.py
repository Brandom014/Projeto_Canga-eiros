from fastapi import FastAPI
from app.database import Base, engine

from app.routes import produtos

Base.metadata.create_all(bind=engine)

app = FastAPI(title="API de Produtos")

app.include_router(produtos.router)

@app.get("/")
def home():
    return {"mensagem": "API funcionando"}