export interface Producto {
  id: number
  codigo: string | null
  cod_barra: string | null
  categoria: string | null
  nombre: string
  costo: string | null
  precio: string
  stock: number
  unidad: string | null
  tipo_venta: string | null
}

export interface ProductoFormData {
  codigo: string
  cod_barra: string
  categoria: string
  nombre: string
  costo: string
  precio: string
  unidad: string
  tipo_venta: 'unidad' | 'peso'
}

export const emptyProductoForm: ProductoFormData = {
  codigo: '',
  cod_barra: '',
  categoria: '',
  nombre: '',
  costo: '',
  precio: '',
  unidad: 'unidad',
  tipo_venta: 'unidad',
}
