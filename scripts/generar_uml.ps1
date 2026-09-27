# Genera el diagrama desde los campos reales de SQLite, sin modificar la BD.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$raizProyecto = Split-Path $PSScriptRoot -Parent
$pythonProyecto = Join-Path $raizProyecto 'venv/Scripts/python.exe'
$modelo = & $pythonProyecto -c @'
import json, sqlite3, sys
from pathlib import Path
db = sqlite3.connect(Path(sys.argv[1]).resolve().as_uri() + '?mode=ro', uri=True)
tables = ['carreras','estudiantes','docentes','asignaturas','periodos','aulas','secciones','matriculas','calificaciones','usuarios']
result = {}
for table in tables:
    foreign = {r[3] for r in db.execute('PRAGMA foreign_key_list(' + table + ')')}
    result[table] = [r[1] + ': ' + r[2].lower() + (' [PK]' if r[5] else '') + (' [FK]' if r[1] in foreign else '') for r in db.execute('PRAGMA table_info(' + table + ')')]
print(json.dumps(result))
db.close()
'@ (Join-Path $raizProyecto 'sistema_academico.db') | ConvertFrom-Json
if ($LASTEXITCODE -ne 0) { throw 'No se pudo leer el esquema SQLite.' }

$bmp = New-Object System.Drawing.Bitmap 3000,1900
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::White)
$g.SmoothingMode = 'AntiAlias'
$g.TextRenderingHint = 'AntiAliasGridFit'
$titulo = New-Object System.Drawing.Font 'Arial',30,([System.Drawing.FontStyle]::Bold)
$cabecera = New-Object System.Drawing.Font 'Arial',21,([System.Drawing.FontStyle]::Bold)
$texto = New-Object System.Drawing.Font 'Consolas',17
$nota = New-Object System.Drawing.Font 'Arial',17
$tinta = [System.Drawing.Brushes]::Black
$fondo = [System.Drawing.Brushes]::DarkSlateGray
$linea = New-Object System.Drawing.Pen ([System.Drawing.Color]::DimGray),3
$g.DrawString('UML - Sistema de Gestion Academica', $titulo, $tinta, 65, 25)
$g.DrawString('Campos reales de SQLite | Curso: asignatura ofertada mediante una seccion', $nota, $tinta, 65, 80)

$cajas = @{
    carreras = @(65,160); estudiantes = @(800,160)
    matriculas = @(1535,160); calificaciones = @(2270,160)
    docentes = @(65,700); asignaturas = @(800,700)
    secciones = @(1535,800); usuarios = @(2270,900)
    aulas = @(65,1270); periodos = @(800,1370)
}
$nombres = @{
    carreras='Carrera'; estudiantes='Estudiante'; matriculas='Matricula'
    calificaciones='Calificacion'; docentes='Docente'; asignaturas='Asignatura (curso)'
    secciones='Seccion'; usuarios='Usuario'; aulas='Aula'; periodos='Periodo'
}
function Relacion($puntos, $unoX, $unoY, $muchosX, $muchosY, $uno='1', $muchos='0..*') {
    $p = @($puntos | ForEach-Object { New-Object System.Drawing.PointF $_[0],$_[1] })
    $g.DrawLines($linea, [System.Drawing.PointF[]]$p)
    $g.DrawString($uno,$nota,$tinta,$unoX,$unoY)
    $g.DrawString($muchos,$nota,$tinta,$muchosX,$muchosY)
}
# Las asociaciones se trazan por los espacios entre clases.
Relacion @(@(675,230),@(800,230)) 680 195 735 195
Relacion @(@(1410,230),@(1535,230)) 1415 195 1470 195
Relacion @(@(2145,230),@(2270,230)) 2150 195 2200 195 '1' '0..1'
Relacion @(@(675,330),@(730,330),@(730,750),@(800,750)) 680 335 738 713
Relacion @(@(1410,870),@(1535,870)) 1415 835 1470 835
Relacion @(@(1840,800),@(1840,368)) 1850 760 1850 385
Relacion @(@(675,820),@(700,820),@(700,1235),@(1490,1235),@(1490,960),@(1535,960)) 680 825 1460 920
Relacion @(@(675,1380),@(755,1380),@(755,1310),@(1460,1310),@(1460,1090),@(1535,1090)) 680 1343 1470 1053 '0..1' '0..*'
Relacion @(@(1410,1480),@(1500,1480),@(1500,1190),@(1535,1190)) 1415 1440 1460 1150
Relacion @(@(990,700),@(990,635),@(1240,635),@(1240,700)) 1000 655 1250 655 '0..1' '0..*'

foreach ($tabla in $cajas.Keys) {
    $x,$y = $cajas[$tabla]
    $campos = @($modelo.$tabla)
    $alto = 48 + 32 * $campos.Count
    $g.FillRectangle([System.Drawing.Brushes]::White,$x,$y,610,$alto)
    $g.DrawRectangle($linea,$x,$y,610,$alto)
    $g.FillRectangle($fondo,$x,$y,610,44)
    $g.DrawString($nombres[$tabla],$cabecera,[System.Drawing.Brushes]::White,($x+12),($y+4))
    for ($i=0; $i -lt $campos.Count; $i++) {
        $g.DrawString($campos[$i],$texto,$tinta,($x+12),($y+49+32*$i))
    }
}
$g.DrawString('Usuario no tiene claves foraneas hacia las demas tablas.', $nota, $tinta, 2270, 1220)
$g.DrawString('Una matricula tiene cero o una calificacion. Un aula es opcional en una seccion.', $nota, $tinta, 65, 1790)
$g.DrawString('La autorrelacion de Asignatura representa requisito_id. PK: clave primaria. FK: clave foranea.', $nota, $tinta, 65, 1830)
$bmp.Save((Join-Path $raizProyecto 'uml.png'),[System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
$titulo.Dispose()
$cabecera.Dispose()
$texto.Dispose()
$nota.Dispose()
$linea.Dispose()
