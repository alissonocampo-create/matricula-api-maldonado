# Entrega Semana 2: API modular

## Organizacion de esta version

Este repositorio contiene el Sistema Academico ampliado, que ya tenia parte
de la separacion hecha. Se completo la extraccion de seguridad, dashboard y
paginas conservando las URL y el comportamiento existentes.

| Responsabilidad del enunciado | Archivo en este proyecto |
| --- | --- |
| Conexion, tablas y datos iniciales | `app/database.py` |
| Contrasenas | `app/seguridad.py` |
| Modelos BaseModel | `app/esquemas.py` |
| Login | `app/routers/auth.py` |
| Estudiantes | `app/routers/estudiantes.py` |
| Cursos | `app/routers/cursos.py` y `app/routers/secciones.py` |
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
- Los modelos estan en `app/esquemas.py`; el CRUD de asignaturas esta en
  `app/routers/cursos.py` y conserva sus rutas `/api/v1/asignaturas`.
- El login original no emite tokens; la separacion conserva ese comportamiento.
- La pagina se sirve mediante `StaticFiles`, incluyendo HTML, CSS y JavaScript.
- El reto opcional esta implementado y probado.

Se trabaja sobre la version ampliada que el estudiante confirma que recibio
del docente. El diagrama representa sus tablas reales, sin inventar una tabla
de cursos distinta de las asignaturas y secciones existentes.

## Reto opcional

`GET /estudiantes/1/matriculas` muestra los cursos de Ana, con su seccion,
periodo y estado. Tambien esta disponible en
`GET /api/v1/estudiantes/1/matriculas`.

- Estudiante con matriculas: lista de registros, incluyendo su historial.
- Estudiante existente sin matriculas: lista vacia y codigo 200.
- Estudiante inexistente: codigo 404.
- Identificador no numerico: codigo 422.
- Las matriculas canceladas conservan su estado para no perder el historial.

La coleccion Postman incluye ejemplos del reto. Las pruebas automaticas
comprueban las dos URL, los cursos devueltos y los casos anteriores.

## Diagrama

`uml.png` contiene todos los campos de las diez tablas, sus claves primarias
y foraneas y las multiplicidades. Una matricula puede tener cero o una
calificacion; una seccion puede no tener aula. Usuarios no tiene una relacion
por clave foranea con las otras tablas.

Para regenerarlo desde la base local, ejecutar en PowerShell:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/generar_uml.ps1
```

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
El commit de la separacion se llama `API modular`.
El UML esta guardado como `uml.png`. `venv` esta excluido por `.gitignore`.
El nombre del primer commit es la diferencia pendiente respecto al texto del
PDF; cambiarlo exigiria reescribir el historial ya publicado.

## Demostracion en clase

1. Iniciar la API y abrir el login.
2. Entrar con el usuario de prueba y mostrar el dashboard.
3. Abrir Swagger y consultar los estudiantes.
4. Ejecutar el reto con los identificadores 1, 5 y 99999.
5. Mostrar `main.py`, `app/main.py`, los routers y el diagrama.
6. Explicar que separar archivos cambia la organizacion, no las rutas previas.

Entrega: lunes 28 de septiembre de 2026, 4:00 p. m. Llevar el enlace del
repositorio y la API funcionando. Cada integrante debe poder explicarla.
