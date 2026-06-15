import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, Navigate } from 'react-router-dom'
import { donOscarLogo } from '../assets/donOscarLogo'
import { login, getMe } from '../services/auth'
import { useAuthStore } from '../store/authStore'

const loginSchema = z.object({
  username: z.string().min(1, 'El usuario es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const { setToken, setUser, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const tokenResponse = await login({ username: data.username, password: data.password })
      setToken(tokenResponse.access_token)
      const user = await getMe()
      setUser(user)
      return user
    },
    onSuccess: () => {
      navigate('/dashboard', { replace: true })
    },
  })

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  function onSubmit(data: LoginForm) {
    loginMutation.mutate(data)
  }

  return (
    <div
      className="min-h-screen flex flex-col text-on-surface overflow-x-hidden"
      style={{
        background: 'radial-gradient(circle at 50% -20%, #e6f0ff 0%, #f9f9ff 70%)',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* TopAppBar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-surface-variant">
        <div className="flex justify-between items-center px-8 py-4 w-full max-w-screen-2xl mx-auto">
          <div className="text-xl font-extrabold tracking-tight text-primary flex items-center gap-2">
            <img
              src={donOscarLogo}
              alt="Don Oscar"
              className="w-9 h-9 rounded-full border border-slate-200 bg-white object-cover shadow-sm"
            />
            <span>Don Oscar</span>
          </div>
          <div className="flex items-center gap-8">
            <div className="hidden md:flex gap-8 items-center">
              <a
                className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors duration-200"
                href="#"
              >
                Contacto
              </a>
              <a className="text-sm font-bold text-primary hover:text-primary/80 transition-colors duration-200" href="#">
                Ingresar
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center px-6 py-24 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-10 pointer-events-none">
          <div
            className="w-full h-full rounded-full"
            style={{ background: '#1978e5', filter: 'blur(120px)' }}
          />
        </div>

        {/* Login Card */}
        <div
          className="bg-white w-full max-w-md rounded-lg p-8 md:p-12 border border-surface-variant/50 relative z-10"
          style={{ boxShadow: '0 10px 40px -10px rgba(25, 120, 229, 0.1)' }}
        >
          {/* Logo & Title */}
          <div className="flex flex-col items-center mb-10">
            <div className="bg-primary/5 p-4 rounded-3xl mb-6">
              <img
                src={donOscarLogo}
                alt="Don Oscar"
                className="w-16 h-16 rounded-2xl border border-slate-200 bg-white object-cover shadow-sm"
              />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">
              Iniciar sesión
            </h1>
          </div>

          {/* Error message */}
          {loginMutation.isError && (
            <div className="mb-6 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
              {(loginMutation.error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
                'Credenciales incorrectas. Verifica tu usuario y contraseña.'}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Username */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-on-surface-variant ml-1" htmlFor="username">
                Usuario
              </label>
              <input
                {...register('username')}
                id="username"
                autoComplete="username"
                placeholder="Ingresa tu usuario"
                type="text"
                className={`w-full bg-surface border rounded-lg px-4 py-3.5 text-on-surface placeholder-on-surface-variant/50 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 outline-none ${
                  errors.username ? 'border-red-400' : 'border-surface-variant'
                }`}
              />
              {errors.username && (
                <p className="text-xs text-red-500 ml-1">{errors.username.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-on-surface-variant ml-1" htmlFor="password">
                Contraseña
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  id="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                  className={`w-full bg-surface border rounded-lg px-4 py-3.5 pr-12 text-on-surface placeholder-on-surface-variant/50 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 outline-none ${
                    errors.password ? 'border-red-400' : 'border-surface-variant'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors p-1"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 ml-1">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="bg-primary w-full py-4 rounded-lg text-white font-bold text-sm uppercase tracking-widest hover:bg-primary/90 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 mt-4 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
              style={{ boxShadow: '0 4px 14px rgba(25, 120, 229, 0.2)' }}
            >
              {loginMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Ingresando...
                </span>
              ) : (
                'Ingresar'
              )}
            </button>

          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-10 bg-white border-t border-surface-variant">
        <div className="flex flex-col md:flex-row justify-center items-center gap-6 w-full max-w-screen-2xl mx-auto px-8">
          <span className="text-xs font-medium tracking-wide text-on-surface-variant/70">
            © 2024 Don Oscar. Todos los derechos reservados.
          </span>
          <div className="flex gap-8">
            <a className="text-xs font-medium text-on-surface-variant/70 hover:text-primary transition-colors" href="#">
              Política de Privacidad
            </a>
            <a className="text-xs font-medium text-on-surface-variant/70 hover:text-primary transition-colors" href="#">
              Términos de Servicio
            </a>
            <a className="text-xs font-medium text-on-surface-variant/70 hover:text-primary transition-colors" href="#">
              Soporte
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
