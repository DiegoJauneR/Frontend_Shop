export interface Cliente {
  id: number
  rut: string | null
  nombre: string | null
  direccion: string | null
  ciudad: string | null
  telefono: string | null
  correo: string | null
  giro: string | null
}

export interface ClienteFormData {
  rut: string
  nombre: string
  direccion: string
  ciudad: string
  telefono: string
  correo: string
  giro: string
}

export const emptyClienteForm: ClienteFormData = {
  rut: '',
  nombre: '',
  direccion: '',
  ciudad: '',
  telefono: '',
  correo: '',
  giro: '',
}