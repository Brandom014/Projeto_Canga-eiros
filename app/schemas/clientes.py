from pydantic import BaseModel


class ClienteCreate(BaseModel):
    nome: str
    cpf: str
    telefone: str | None = None
    email: str | None = None


class ClienteUpdate(BaseModel):
    nome: str
    cpf: str
    telefone: str | None = None
    email: str | None = None