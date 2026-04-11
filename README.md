# Frontend Template

Template base para proyectos frontend con React, TypeScript y Vite, configurado con las herramientas esenciales para desarrollo moderno.

## 🚀 Tecnologías Incluidas

### Core
- **React 19** - Librería UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **Tailwind CSS** - Utility-first CSS framework

### UI Components & Styling
- **Mantine** - Biblioteca de componentes UI completa
- **Swiper** - Carruseles y sliders modernos
- **Lucide Icons** - Iconos modernos y ligeros

### State Management
- **Zustand** - Gestión de estado global (alternativa ligera a Redux)
- **TanStack Query (React Query)** - Gestión de estado del servidor, cache y sincronización

### Forms & Validation
- **React Hook Form** - Manejo eficiente de formularios
- **Zod** - Validación de schemas y tipos en runtime

### HTTP & Data
- **Axios** - Cliente HTTP con interceptores y mejores defaults

### Utilities
- **dayjs** - Manipulación y formato de fechas (ligero)

## 📁 Estructura de Carpetas

```
src/
├── 📁 components/      # Componentes reutilizables de UI
├── 📁 pages/          # Componentes de página (uno por ruta)
├── 📁 layout/         # Componentes de layout (header, footer, etc.)
├── 📁 context/        # Proveedores de React Context
├── 📁 hooks/          # Custom React hooks
├── 📁 store/          # Estado global (Zustand)
├── 📁 services/       # Servicios API e integraciones externas
├── 📁 utils/          # Funciones utilitarias
├── 📁 types/          # Definiciones de tipos TypeScript
├── 📁 constants/      # Constantes de la aplicación
├── 📁 lib/            # Configuraciones de librerías
├── 📁 middleware/     # Middlewares personalizados
├── 📁 routes/         # Definiciones de rutas
└── 📁 assets/         # Assets estáticos (imágenes, fonts, etc.)
```

## 🛠️ Scripts Disponibles

```bash
npm run dev      # Inicia el servidor de desarrollo
npm run build    # Construye para producción
npm run preview  # Preview del build de producción
npm run lint     # Ejecuta ESLint
```

## 📦 Instalación

```bash
npm install
npm run dev
```
