from fastapi import APIRouter

from app.database import conexion_lectura


router = APIRouter(prefix="/reportes", tags=["Reportes y consultas avanzadas"])


@router.get("/dashboard")
def obtener_dashboard():
    with conexion_lectura() as conexion:
        periodo = conexion.execute(
            """
            SELECT id, anio, numero FROM periodos
            WHERE activo = 1 ORDER BY anio DESC, numero DESC LIMIT 1
            """
        ).fetchone()
        resumen = {
            "estudiantes_activos": conexion.execute(
                "SELECT COUNT(*) FROM estudiantes WHERE estado = 'ACTIVO'"
            ).fetchone()[0],
            "docentes_activos": conexion.execute(
                "SELECT COUNT(*) FROM docentes WHERE estado = 'ACTIVO'"
            ).fetchone()[0],
            "carreras_activas": conexion.execute(
                "SELECT COUNT(*) FROM carreras WHERE activo = 1"
            ).fetchone()[0],
            "asignaturas_activas": conexion.execute(
                "SELECT COUNT(*) FROM asignaturas WHERE activo = 1"
            ).fetchone()[0],
            "periodo_activo": (
                f"{periodo['anio']}-{periodo['numero']}" if periodo else None
            ),
            "secciones_abiertas": 0,
            "matriculas_activas": 0,
        }
        if periodo:
            resumen["secciones_abiertas"] = conexion.execute(
                """
                SELECT COUNT(*) FROM secciones
                WHERE periodo_id = ? AND estado = 'ABIERTA'
                """,
                (periodo["id"],),
            ).fetchone()[0]
            resumen["matriculas_activas"] = conexion.execute(
                """
                SELECT COUNT(*)
                FROM matriculas m
                JOIN secciones s ON s.id = m.seccion_id
                WHERE s.periodo_id = ? AND m.estado = 'MATRICULADA'
                """,
                (periodo["id"],),
            ).fetchone()[0]
    return resumen
