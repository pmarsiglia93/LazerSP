import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchReviews, setReviewStatus, removeReview } from '../services/api.js'

const C = { primary: '#1E3A5F', secondary: '#FFB703', bg: '#F5F7FA', border: '#E5E7EB', danger: '#E63946', success: '#2A9D8F', white: '#FFFFFF', text: '#1F2937', textLight: '#6B7280' }

const FILTERS = [
  { value: '', label: 'Todas' },
  { value: 'published', label: 'Publicadas' },
  { value: 'hidden', label: 'Ocultas' },
]

const button = { border: `1px solid ${C.border}`, background: C.white, borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }

function formatDate(value) {
  const date = new Date(value.includes('T') ? value : `${value.replace(' ', 'T')}Z`)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export default function ReviewsModeration() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('')
  const [reviews, setReviews] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchReviews(filter)
      setReviews(res.data)
      setTotal(res.meta.total)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { load() }, [load])

  const toggleStatus = async (review) => {
    setBusyId(review.id)
    try {
      const status = review.status === 'published' ? 'hidden' : 'published'
      await setReviewStatus(review.id, status)
      await load()
    } catch (err) {
      alert(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (review) => {
    if (!confirm(`Excluir a avaliação de ${review.author.name} sobre "${review.place.name}"? Esta ação não pode ser desfeita.`)) return
    setBusyId(review.id)
    try {
      await removeReview(review.id)
      await load()
    } catch (err) {
      alert(err.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <div style={{ background: C.primary, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div>
          <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 800, lineHeight: 1.2 }}>Avaliações</h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>Moderação das avaliações publicadas no app</p>
        </div>
        <button
          onClick={() => navigate('/admin')}
          style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
        >
          ← Lugares
        </button>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 20px' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              style={{ ...button, background: filter === f.value ? C.primary : C.white, color: filter === f.value ? C.white : C.text }}
            >
              {f.label}
            </button>
          ))}
          <span style={{ marginLeft: 'auto', color: C.textLight, fontSize: 13, fontWeight: 600 }}>
            {total} {total === 1 ? 'avaliação' : 'avaliações'}
          </span>
        </div>

        {error && <p style={{ color: C.danger, marginBottom: 16 }}>{error}</p>}

        {loading ? (
          <p style={{ color: C.textLight }}>Carregando...</p>
        ) : reviews.length === 0 ? (
          <p style={{ color: C.textLight }}>Nenhuma avaliação neste filtro.</p>
        ) : (
          reviews.map(review => (
            <div key={review.id} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 12, opacity: review.status === 'hidden' ? 0.7 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <strong style={{ color: C.text }}>{review.place.name}</strong>
                  <div style={{ color: C.textLight, fontSize: 13, marginTop: 2 }}>
                    {review.author.name} · {review.author.email} · {formatDate(review.updatedAt)}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: C.secondary, fontSize: 15 }}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                  <span style={{ background: review.status === 'hidden' ? '#FFF0F0' : '#E6F8F5', color: review.status === 'hidden' ? C.danger : C.success, fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 999 }}>
                    {review.status === 'hidden' ? 'Oculta' : 'Publicada'}
                  </span>
                </div>
              </div>
              {review.comment && <p style={{ color: C.text, fontSize: 14, lineHeight: 1.5, marginTop: 10 }}>{review.comment}</p>}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button style={button} disabled={busyId === review.id} onClick={() => toggleStatus(review)}>
                  {review.status === 'published' ? 'Ocultar' : 'Republicar'}
                </button>
                <button style={{ ...button, color: C.danger }} disabled={busyId === review.id} onClick={() => handleDelete(review)}>
                  Excluir
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
