export interface Producto {
  id: number
  cod_barra: string | null
  categoria: string | null
  nombre: string
  costo: string | null
  precio: string
  unidad: string | null
  tipo_venta: string | null
}

export interface ProductoFormData {
  cod_barra: string
  categoria: string
  nombre: string
  costo: string
  precio: string
  unidad: string
  tipo_venta: 'unidad' | 'peso'
}

export const emptyProductoForm: ProductoFormData = {
  cod_barra: '',
  categoria: '',
  nombre: '',
  costo: '',
  precio: '',
  unidad: 'unidad',
  tipo_venta: 'unidad',
}
