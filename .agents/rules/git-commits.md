---
description: Siempre hacer commits en git cuando haya cambios pendientes
---

# Control de Versiones

Siempre que realices cambios en el código (ya sea por peticiones del usuario, correcciones de errores, etc.), asegúrate de realizar un `git commit` directamente con las implementaciones correspondientes. 

**Reglas obligatorias:**
1. Al finalizar de escribir y probar el código o solucionar los pedidos del usuario, comprueba tu estado en source control.
2. Si hay archivos modificados, usa `git add .` seguido de un commit descriptivo: `git commit -m "feat/fix: descripción clara"`.
3. Notifica al usuario que has guardado el progreso en git (Source Control).
