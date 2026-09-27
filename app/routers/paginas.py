"""Publicacion del frontend y comprobacion de salud."""

from pathlib import Path

from fastapi import APIRouter, FastAPI
from fastapi.staticfiles import StaticFiles


router = APIRouter()
CARPETA_FRONTEND = Path(__file__).resolve().parents[2] / "frontend"


@router.get("/salud", tags=["Inicio"])
def comprobar_salud():
    return {"estado": "OK"}


def montar_frontend(app: FastAPI) -> None:
    # Registrar al final para que el montaje no oculte las rutas de la API.
    app.mount("/", StaticFiles(directory=CARPETA_FRONTEND, html=True), name="frontend")
