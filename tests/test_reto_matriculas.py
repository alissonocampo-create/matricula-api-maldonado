import pytest


@pytest.mark.parametrize("prefijo", ["", "/api/v1"])
def test_matriculas_del_estudiante(cliente, prefijo):
    respuesta = cliente.get(f"{prefijo}/estudiantes/1/matriculas")
    assert respuesta.status_code == 200
    filas = respuesta.json()
    assert {fila["id"] for fila in filas} == {1, 3}
    assert all(fila["estudiante_id"] == 1 for fila in filas)
    assert {fila["asignatura_codigo"] for fila in filas} == {"IS-110", "IS-210"}
    assert filas[0]["periodo_nombre"] == "2026-3"


@pytest.mark.parametrize("prefijo", ["", "/api/v1"])
def test_estudiante_sin_matriculas(cliente, prefijo):
    respuesta = cliente.get(f"{prefijo}/estudiantes/5/matriculas")
    assert respuesta.status_code == 200
    assert respuesta.json() == []


@pytest.mark.parametrize("prefijo", ["", "/api/v1"])
def test_estudiante_inexistente(cliente, prefijo):
    assert cliente.get(f"{prefijo}/estudiantes/99999/matriculas").status_code == 404


def test_cancelacion_conserva_historial(cliente):
    assert cliente.patch("/api/v1/matriculas/3/cancelar").status_code == 200
    filas = cliente.get("/api/v1/estudiantes/1/matriculas").json()
    assert next(fila for fila in filas if fila["id"] == 3)["estado"] == "CANCELADA"


def test_id_invalido(cliente):
    assert cliente.get("/estudiantes/no-es-id/matriculas").status_code == 422
