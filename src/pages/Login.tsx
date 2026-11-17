import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Scale, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as any)?.from?.pathname || '/'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    if (!email || !password) {
      setErrorMsg('Por favor, informe seu e-mail e senha.')
      return
    }

    setLoading(true)
    const res = await signIn(email, password)
    setLoading(false)

    if (res.error) {
      const err = res.error
      if (err.message && err.message.includes('desativada')) {
        setErrorMsg('Sua conta está desativada. Fale com o superadministrador.')
      } else {
        setErrorMsg('E-mail ou senha inválidos. Tente novamente.')
      }
      return
    }

    navigate(from, { replace: true })
  }

  const fillQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail)
    setPassword('Skip@Pass123')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-blue-900 text-white rounded-2xl shadow-md">
            <Scale className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Controle de Causas Trabalhistas
          </h1>
          <p className="text-sm text-slate-500">
            Gestão integrada de processos, audiências e prazos processuais
          </p>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Acessar Sistema</CardTitle>
            <CardDescription>
              Informe suas credenciais autorizadas. O cadastro é realizado exclusivamente pela
              administração.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {errorMsg && (
                <Alert variant="destructive" className="bg-red-50 text-red-900 border-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{errorMsg}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">E-mail corporativo</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu.email@empresa.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <button
                    type="button"
                    onClick={() => navigate('/recuperar-senha')}
                    className="text-xs text-blue-700 hover:text-blue-900 font-medium"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full bg-blue-900 hover:bg-blue-800 text-white"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Entrando...
                  </>
                ) : (
                  'Entrar no Sistema'
                )}
              </Button>

              <div className="w-full pt-4 border-t border-slate-100 text-xs text-slate-500 text-center">
                <p className="font-medium text-slate-700 mb-2">Acesso Rápido de Demonstração:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <button
                    type="button"
                    onClick={() => fillQuickLogin('luiz.moura@pmaisservicos.com.br')}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs border"
                  >
                    Superadmin
                  </button>
                  <button
                    type="button"
                    onClick={() => fillQuickLogin('admin@causas.jur.br')}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs border"
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => fillQuickLogin('leitura@causas.jur.br')}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs border"
                  >
                    Leitura
                  </button>
                </div>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
