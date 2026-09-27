from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import inicializar_base_datos
from app.routers import (
    asignaturas,
    auth,
    aulas,
    calificaciones,
    carreras,
    dashboard,
    docentes,
    estudiantes,
    matriculas,
    paginas,
    periodos,
    reportes,
    secciones,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    inicializar_base_datos()
    yield


app = FastAPI(
    title="API del Sistema de Gestión Académica",
    description=(
        "Proyecto demostrativo de Programación II con FastAPI, SQLite, "
        "relaciones entre tablas, validaciones y reglas de negocio."
    ),
    version="2.0.0",
    lifespan=lifespan,
)

# Permite conectar más adelante un frontend creado con Vite/Vue o React.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PREFIJO = "/api/v1"
app.include_router(auth.router, prefix=PREFIJO)
app.include_router(carreras.router, prefix=PREFIJO)
app.include_router(estudiantes.router, prefix=PREFIJO)
app.include_router(docentes.router, prefix=PREFIJO)
app.include_router(asignaturas.router, prefix=PREFIJO)
app.include_router(periodos.router, prefix=PREFIJO)
app.include_router(aulas.router, prefix=PREFIJO)
app.include_router(secciones.router, prefix=PREFIJO)
app.include_router(matriculas.router, prefix=PREFIJO)
app.include_router(calificaciones.router, prefix=PREFIJO)
app.include_router(reportes.router, prefix=PREFIJO)
app.include_router(dashboard.router, prefix=PREFIJO)
app.include_router(paginas.router)


paginas.montar_frontend(app)
