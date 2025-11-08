# Taco's Serrano React App

Aplicación React + Firebase para gestionar el menú, carrito y panel de administrador.

## Requisitos
- Node.js 18+
- Cuenta de Firebase con Authentication, Firestore y Storage habilitados.

## Configuración
1. Copia este directorio y ejecuta `npm install`.
2. Actualiza las credenciales de Firebase dentro de `src/App.jsx` (`firebaseConfig`).
3. Ejecuta `npm run dev` para entorno local o `npm run build` para generar la versión de producción.

## Scripts
- `npm run dev`: inicia Vite en modo desarrollo.
- `npm run build`: compila la app para producción.
- `npm run preview`: sirve la compilación resultante.

## Notas
- El panel de administrador requiere usuarios creados en Firebase Authentication (correo/contraseña).
- Los productos se almacenan en la colección `productos` de Firestore.
- Las imágenes se guardan en Firebase Storage bajo `productos/`.
