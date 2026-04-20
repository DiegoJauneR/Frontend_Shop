export interface Producto {
  id: number
  codigo: string | null
  cod_barra: string | null
  categoria: string | null
  nombre: string
  costo: string | null
  precio: string
}

export interface ProductoFormData {
  codigo: string
  cod_barra: string
  categoria: string
  nombre: string
  costo: string
  precio: string
}

export const emptyProductoForm: ProductoFormData = {
  codigo: '',
  cod_barra: '',
  categoria: '',
  nombre: '',
  costo: '',
  precio: '',
}
