# ClickMoto Backend

Backend API para el sistema de gestión de parqueo de motocicletas ClickMoto.

## Instalación

```bash
npm install
```

## Configuración

1. Copia el archivo `.env.example` a `.env`
2. Configura las variables de entorno necesarias

## Ejecución

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm start
```

El servidor se ejecutará en `http://localhost:3001`

## Endpoints

- `POST /api/auth/login` - Autenticación
- `GET /api/motorcycles` - Obtener todas las motocicletas
- `GET /api/motorcycles/:id` - Obtener motocicleta por ID
- `POST /api/motorcycles` - Crear nueva motocicleta
- `PUT /api/motorcycles/:id` - Actualizar motocicleta
- `DELETE /api/motorcycles/:id` - Eliminar motocicleta
- `POST /api/motorcycles/:id/pago` - Registrar pago
- `PUT /api/motorcycles/:id/lavado` - Actualizar estado de lavado
- `GET /api/health` - Estado del servidor

## Próximos pasos

- [ ] Integrar base de datos (MongoDB/PostgreSQL)
- [ ] Implementar autenticación JWT real
- [ ] Agregar validaciones y sanitización
- [ ] Implementar sistema de suscripciones
- [ ] Agregar middleware de autenticación
- [ ] Implementar sistema de reportes

