
# Taco's Serrano — PWA + CMS (Decap) listo para Play Store

Este paquete agrega:
- `manifest.webmanifest` (PWA)
- `service-worker.js` con **network-first** para `/data/*` (precios/fotos siempre frescos)
- Íconos PWA en `static/icons/`
- Panel **Decap CMS** en `/admin` (para editar productos, categorías y opciones)
- Estructura de contenido en `content/` y datos iniciales en `data/menu.json`

## Pasos para Netlify
1. Sube este proyecto a un repo (GitHub).
2. En **Netlify**:
   - Conecta el repo y despliega.
   - Activa **Identity** y **Git Gateway** (Settings → Identity).
   - En **Identity → Services** habilita Git Gateway.
   - Crea un usuario administrador (tu correo) y verifica la invitación.
3. Entra a `https://TU_DOMINIO/admin` e inicia sesión para editar.

## Cómo usar el CMS
- Colección **Productos**: nombre, precio, categoría, disponibilidad, imagen y descripción.
- Colección **Categorías**: define las categorías visibles.
- **Opciones**: proteínas / aderezos / extras.

Los archivos se guardan en `content/`. Tu app puede:
- Leer directamente `content/` si está construida con un generador estático.
- O consumir `data/menu.json` (actualízalo desde un script de build que lea `content/`).

## PWA/Play Store
- El `index.html` ya incluye:
  - `<link rel="manifest" href="/manifest.webmanifest">`
  - `<meta name="theme-color" content="#C8102E">`
  - Registro del service worker.
- Empaqueta la PWA con **PWABuilder** para generar `.aab` y subir a **Google Play Console**.

## Nota
- Si tu código actual consume el menú desde HTML, te recomiendo migrarlo a leer `/data/menu.json` o un endpoint propio. Así, los cambios del CMS se reflejan sin tocar código.
- Los colores siguen tu línea gráfica (Amarillo Taco `#FFD100` y Rojo Serrano `#C8102E`).

_Actualizado el 2025-10-11_
