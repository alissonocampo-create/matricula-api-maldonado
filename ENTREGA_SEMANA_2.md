# Entrega Semana 2: API modular

## Organizacion de esta version

Este repositorio contiene el Sistema Academico ampliado, que ya tenia parte
de la separacion hecha. Se completo la extraccion de seguridad, dashboard y
paginas conservando las URL y el comportamiento existentes.

| Responsabilidad del enunciado | Archivo en este proyecto |
| --- | --- |
| Conexion, tablas y datos iniciales | `app/database.py` |
| Contrasenas | `app/seguridad.py` |
| Modelos BaseModel | `app/schemas.py` |
| Login | `app/routers/auth.py` |
| Estudiantes | `app/routers/estudiantes.py` |
| Cursos | `app/routers/asignaturas.py` y `app/routers/secciones.py` |
| Matriculas | `app/routers/matriculas.py` |
| Resumen | `app/routers/dashboard.py` |
| Paginas y archivos del frontend | `app/routers/paginas.py` |
| Creacion de FastAPI y registro de routers | `app/main.py` |
| Entrada para Uvicorn | `main.py` |

`app/routers/__init__.py` identifica el paquete de rutas. Los endpoints usan
`APIRouter` y los modulos importan sus dependencias explicitamente.

## Diferencias que hay que explicar

- El PDF describe una API de cuatro entidades. Esta version tiene mas tablas:
  una asignatura representa la materia y una seccion representa su oferta
  con docente, periodo, horario y cupo. No existe una tabla llamada cursos.
- `schemas.py` cumple la funcion de `esquemas.py` dentro del paquete `app`.
- El login original no emite tokens; la separacion conserva ese comportamiento.
- La pagina se sirve mediante `StaticFiles`, incluyendo HTML, CSS y JavaScript.
- El reto opcional no forma parte de estos cambios.

Esta adaptacion no equivale literalmente al proyecto de cuatro entidades
descrito en el PDF; hay que confirmar con el docente que acepta esta base.

## Ejecutar y comprobar

Desde la carpeta que contiene este documento, en PowerShell:

```powershell
.\venv\Scripts\python.exe -m uvicorn main:app --reload
```

Abrir `http://127.0.0.1:8000` y entrar con `admin` / `admin123`.
Swagger esta en `http://127.0.0.1:8000/docs`.

```powershell
.\venv\Scripts\python.exe -m pytest -q
```

Las pruebas usan una base temporal y no modifican la base de demostracion.

## Para explicar en clase

1. `main.py` importa la aplicacion ensamblada en `app/main.py`.
2. `include_router` registra las rutas de cada modulo.
3. El router recibe los datos, los modelos validan su estructura y los
   servicios aplican las reglas de negocio.
4. `database.py` administra SQLite; `seguridad.py` calcula el hash del login.
5. El dashboard consulta los totales y el modulo de paginas sirve el frontend.

## Entrega en GitHub

Conservar el historial original. El commit inicial local se llama
`primer version`; no se ha reescrito como `Version original`.
El commit de esta separacion debe llamarse `API modular`.
Confirmar en GitHub que el UML subido este guardado como `uml.png` y que
corresponda al modelo presentado. `venv` esta excluido por `.gitignore`.
