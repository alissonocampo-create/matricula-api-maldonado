"""Funciones de contrasenas compartidas por el login y los datos iniciales."""

import hashlib


def hash_clave(clave: str) -> str:
    """Conserva el hash SHA-256 del proyecto didactico original."""
    return hashlib.sha256(clave.encode("utf-8")).hexdigest()
