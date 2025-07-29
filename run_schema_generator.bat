@echo off
echo Ejecutando el generador de documentacion del esquema...
echo.
python generate_schema.py
echo.
echo Proceso finalizado. Presiona cualquier tecla para salir.
pause > nul
