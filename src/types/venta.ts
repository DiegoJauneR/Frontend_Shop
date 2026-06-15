// ─── Display types (used by VentasPage, PuntoVentaPage) ─────────────────────
export type MetodoPago = 'Efectivo' | 'Tarjeta' | 'Transferencia'
export type TipoProductoVenta = 'unidad' | 'peso'

export interface Venta {
  id: string
  boletaId?: string
  date: string
  time: string
  employeeName: string
  products: number
  total: number
  paymentMethod: MetodoPago
}

export interface VendedorStats {
  name: string
  total: number
  transactions: number
  products: number
}

export interface ProductoVenta {
  id: number
  cod_barra: string
  categoria: string
  nombre: string
  precio: number
  costo: number | null
  unidad: string
  tipo_venta: TipoProductoVenta
}

export interface VentaDetalleInput {
  productoId: number
  nombre: string
  cantidad: number
  peso?: number
  precioUnitario: number
  subtotal: number
}

export interface NuevaVentaInput {
  employeeName: string
  paymentMethod: MetodoPago
  total: number
  items: VentaDetalleInput[]
}

export interface VentaRegistrada extends NuevaVentaInput {
  id: string
  date: string
  time: string
  boletaId?: string
}

// ─── API response types (mirror backend exactly) ─────────────────────────────
export type ApiMetodoPago = 'efectivo' | 'debito' | 'credito' | 'transferencia'
export type ApiEstadoVenta = 'pagado' | 'anulada' | 'pendiente'
export type ApiComprobante = 'boleta' | 'factura' | 'cotizacion'

export interface ApiVentaDetalle {
  id: number
  id_venta: number
  id_producto: number
  codigo_producto: string | null
  nombre_producto: string
  cantidad: number | string
  precio_unitario: string
  subtotal_linea: string
}

export interface ApiBoletaDetalle {
  id_detalle: number
  id_boleta: number
  id_producto: number | null
  codigo_producto: string | null
  nombre_producto: string
  cantidad: number | string
  precio_unitario: string
  subtotal_linea: string
}

export interface ApiBoleta {
  id_boleta: number
  id_venta: number
  fecha_emision: string | null
  subtotal: number | string
  total_pagar: number | string
  tipo_pago: ApiMetodoPago
  detalles: ApiBoletaDetalle[]
}

export interface ApiVenta {
  id: number
  fecha: string
  id_usuario: number | null
  employee_name: string | null
  id_cierre_caja: number | null
  subtotal: number | string
  descuento: number | string
  recargo: number | string
  total: number | string
  tipo_pago: ApiMetodoPago
  efectivo_recibido: number | null
  vuelto: number | null
  comprobante: ApiComprobante
  estado: ApiEstadoVenta
  detalles: ApiVentaDetalle[]
  boleta: ApiBoleta | null
}

export interface ApiProductoVenta {
  id: number
  cod_barra: string | null
  categoria: string | null
  nombre: string
  precio: string
  costo: string | null
  unidad: string
  tipo_venta: 'unidad' | 'peso'
}
