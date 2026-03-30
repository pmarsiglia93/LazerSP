import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAllPlaces, deletePlace } from '../services/api.js'

const C = { primary: '#1E3A5F', secondary: '#FFB703', bg: '#F5F7FA', border: '#E5E7EB', danger: '#E63946', success: '#2A9D8F', white: '#FFFFFF', text: '#1F2937', textLight: '#6B7280' }

export default function PlacesList() {
  const [places, setPlaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetchAllPlaces()
      .then(res => setPlaces(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id, name) => {
    if (!confirm(`Tem certeza que deseja remover "${name}"? Esta ação não pode ser desfeita.`)) return
    setDeletingId(id)
    try {
      await deletePlace(id)
      setPlaces(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      alert(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    navigate('/admin/login')
  }

  const filtered = places.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase()) ||
    p.address.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      {/* Header */}
      <div style={{ background: C.primary, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 28 }}>🏙️</span>
          <div>
            <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 800, lineHeight: 1.2 }}>LazerSP Admin</h1>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>Gerenciamento de equipamentos de lazer</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
        >
          Sair
        </button>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 20px' }}>
        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, categoria ou endereço..."
            style={{ flex: 1, minWidth: 200, padding: '10px 14px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, outline: 'none', background: C.white }}
          />
          <button
            onClick={() => navigate('/admin/novo')}
            style={{ background: C.secondary, color: C.primary, border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 800, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            + Novo equipamento
          </button>
        </div>

        {/* Count */}
        <p style={{ color: C.textLight, fontSize: 13, marginBottom: 16, fontWeight: 600 }}>
          {loading ? 'Carregando...' : `${filtered.length} equipamento${filtered.length !== 1 ? 's' : ''}`}
        </p>

        {error && (
          <div style={{ background: '#FFF0F0', border: `1px solid ${C.danger}`, borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: C.danger, fontSize: 14 }}>
            {error}
          </div>
        )}

        {/* Table */}
        {!loading && (
          <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
                <thead>
                  <tr style={{ background: '#F9FAFB', borderBottom: `2px solid ${C.border}` }}>
                    {['Nome', 'Categoria', 'Endereço', 'Avaliação', 'Status', ''].map((h, i) => (
                      <th key={i} style={{ padding: '12px 16px', textAlign: i === 5 ? 'right' : 'left', fontSize: 11, fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((place, i) => (
                    <tr key={place.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : 'none', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: C.text, maxWidth: 200 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{place.name}</div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ background: C.primary + '18', color: C.primary, fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 999, whiteSpace: 'nowrap' }}>
                          {place.category}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: C.textLight, maxWidth: 220 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{place.address}</div>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 14, color: C.text, whiteSpace: 'nowrap' }}>
                        ⭐ {place.rating}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ background: place.isOpen ? '#E6F8F5' : '#FFF0F0', color: place.isOpen ? C.success : C.danger, fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 999 }}>
                          {place.isOpen ? 'Aberto' : 'Fechado'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => navigate(`/admin/editar/${place.id}`)}
                            style={{ background: C.primary, color: '#fff', border: 'none', borderRadius: 6, padding: '7px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(place.id, place.name)}
                            disabled={deletingId === place.id}
                            style={{ background: C.danger, color: '#fff', border: 'none', borderRadius: 6, padding: '7px 14px', cursor: deletingId === place.id ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, opacity: deletingId === place.id ? 0.6 : 1 }}
                          >
                            {deletingId === place.id ? '...' : 'Remover'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: 48, color: C.textLight, fontSize: 14 }}>
                        Nenhum equipamento encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
