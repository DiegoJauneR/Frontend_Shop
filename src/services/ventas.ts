import { api } from '../lib/axios'
import type {
  ApiMetodoPago,
  ApiProductoVenta,
  ApiVenta,
  MetodoPago,
  NuevaVentaInput,
  ProductoVenta,
  Venta,
  VentaRegistrada,
} from '../types/venta'

// Maps API tipo_pago → display label
const metodoPagoMap: Record<ApiMetodoPago, MetodoPago> = {
  efectivo: 'Efectivo',
  debito: 'Tarjeta',
  credito: 'Tarjeta',
  transferencia: 'Transferencia',
}

// Maps display label → API tipo_pago
const metodoPagoApiMap: Record<MetodoPago, ApiMetodoPago> = {
  Efectivo: 'efectivo',
  Tarjeta: 'debito',
  Transferencia: 'transferencia',
}

function transformVenta(v: ApiVenta): Venta {
  return {
    id: String(v.id),
    date: v.fecha.slice(0, 10),
    time: v.fecha.slice(11, 16),
    employeeName: v.employee_name ?? `Usuario ${v.id_usuario}`,
    products: v.detalles?.length ?? 0,
    total: v.total,
    paymentMethod: metodoPagoMap[v.tipo_pago] ?? 'Efectivo',
  }
}

function transformProductoVenta(p: ApiProductoVenta): ProductoVenta {
  return {
    id: p.id,
    codigo: p.codigo ?? '',
    cod_barra: p.cod_barra ?? '',
    categoria: p.categoria ?? '',
    nombre: p.nombre,
    precio: parseFloat(p.precio),
    costo: p.costo !== null ? parseFloat(p.costo) : null,
    unidad: p.unidad ?? 'unidad',
    stock: p.stock ?? 0,
    tipo_venta: p.tipo_venta ?? 'unidad',
  }
}

export async function getVentas(): Promise<Venta[]> {
  const response = await api.get<ApiVenta[]>('/ventas')
  return response.data.map(transformVenta)
}

export async function getProductosVenta(): Promise<ProductoVenta[]> {
  const response = await api.get<ApiProductoVenta[]>('/productos', {
    params: { skip: 0, limit: 1000 },
  })
  return response.data.map(transformProductoVenta)
}

export async function registrarVenta(data: NuevaVentaInput): Promise<VentaRegistrada> {
  const payload = {
    tipo_pago: metodoPagoApiMap[data.paymentMethod],
    items: data.items.map(item => ({
      id_producto: item.productoId,
      cantidad: item.cantidad,
    })),
    comprobante: 'boleta',
    estado: 'pagado',
  }

  const response = await api.post<ApiVenta>('/ventas', payload)
  const v = response.data

  return {
    ...data,
    id: String(v.id),
    date: v.fecha.slice(0, 10),
    time: v.fecha.slice(11, 16),
  }
}
