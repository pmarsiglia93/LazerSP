import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../services/api.js'

const C = { primary: '#1E3A5F', secondary: '#FFB703', bg: '#F5F7FA', border: '#E5E7EB', danger: '#E63946', white: '#FFFFFF', text: '#1F2937', textLight: '#6B7280' }

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { token } = await login(username, password)
      localStorage.setItem('admin_token', token)
      navigate('/admin')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
      <div style={{ background: C.white, borderRadius: 16, padding: 40, width: '100%', maxWidth: 400, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: `1px solid ${C.border}` }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🏙️</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: C.primary }}>LazerSP Admin</h1>
          <p style={{ color: C.textLight, fontSize: 14, marginTop: 6 }}>Painel de gerenciamento de equipamentos</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 }}>Usuário</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoFocus
              style={{ width: '100%', padding: '10px 14px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.text, outline: 'none' }}
              placeholder="admin"
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 }}>Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '10px 14px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.text, outline: 'none' }}
              placeholder="••••••••"
            />
          </div>

          {error && <p style={{ color: C.danger, fontSize: 13, marginBottom: 16, textAlign: 'center' }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: 13, background: C.primary, color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
