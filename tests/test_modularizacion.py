import pytest


@pytest.mark.parametrize(
    ("ruta", "tipo"),
    [("/app.js", "javascript"), ("/styles.css", "text/css")],
)
def test_frontend_conserva_archivos(cliente, ruta, tipo):
    respuesta = cliente.get(ruta)
    assert respuesta.status_code == 200
    assert tipo in respuesta.headers["content-type"]
    assert respuesta.content


def test_dashboard_completo_y_ruta_documentada(cliente):
    respuesta = cliente.get("/api/v1/reportes/dashboard")
    assert respuesta.json() == {
        "estudiantes_activos": 4,
        "docentes_activos": 3,
        "carreras_activas": 2,
        "asignaturas_activas": 5,
        "periodo_activo": "2026-3",
        "secciones_abiertas": 4,
        "matriculas_activas": 4,
    }
    rutas = cliente.get("/openapi.json").json()["paths"]
    assert "/api/v1/reportes/dashboard" in rutas
    assert "/api/v1/auth/login" in rutas
    assert "/salud" in rutas
