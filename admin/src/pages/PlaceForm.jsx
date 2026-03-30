import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchPlaceById, createPlace, updatePlace, geocodeAddress } from '../services/api.js'

const C = { primary: '#1E3A5F', secondary: '#FFB703', bg: '#F5F7FA', border: '#E5E7EB', danger: '#E63946', success: '#2A9D8F', white: '#FFFFFF', text: '#1F2937', textLight: '#6B7280' }

const CATEGORIES = ['Parques', 'Museus', 'Bares', 'Restaurantes', 'Centros Culturais', 'Teatros', 'Cinemas', 'Shoppings', 'Esportes', 'Shows', 'Outros']

const EMPTY_FORM = {
  name: '', category: 'Parques', address: '', description: '',
  imageUrl: '', rating: '4.0', openingHours: '', priceLevel: 'Gratuito',
  highlight: '', instagram: '', tags: '', latitude: '', longitude: '', isOpen: true,
}

function Section({ title, children }) {
  return (
    <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, padding: '20px 24px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <h2 style={{ fontSize: 11, fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>{title}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</div>
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 }}>{label}</label>
      {children}
      {hint && <p style={{ fontSize: 12, color: C.textLight, marginTop: 5 }}>{hint}</p>}
    </div>
  )
}

const inp = { width: '100%', padding: '10px 14px', border: `1px solid #E5E7EB`, borderRadius: 8, fontSize: 14, color: '#1F2937', background: '#fff', outline: 'none' }

export default function PlaceForm() {
  const { id } = useParams()
  const isEditing = !!id
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY_FORM)
  const [loadingData, setLoadingData] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [geocoding, setGeocoding] = useState(false)
  const [geocodeResult, setGeocodeResult] = useState(null)

  useEffect(() => {
    if (!isEditing) return
    fetchPlaceById(id)
      .then(res => {
        const p = res.data
        setForm({
          name: p.name || '',
          category: p.category || 'Parques',
          address: p.address || '',
          description: p.description || '',
          imageUrl: p.imageUrl || '',
          rating: String(p.rating ?? '4.0'),
          openingHours: p.openingHours || '',
          priceLevel: p.priceLevel || 'Gratuito',
          highlight: p.highlight || '',
          instagram: p.instagram || '',
          tags: (p.tags || []).join(', '),
          latitude: String(p.latitude ?? ''),
          longitude: String(p.longitude ?? ''),
          isOpen: p.isOpen ?? true,
        })
      })
      .catch(err => setError(err.message))
      .finally(() => setLoadingData(false))
  }, [id, isEditing])

  const set = (field) => (e) =>
    setForm(prev => ({ ...prev, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const handleGeocode = async () => {
    if (!form.address.trim()) return
    setGeocoding(true)
    setGeocodeResult(null)
    try {
      const result = await geocodeAddress(form.address)
      setGeocodeResult(result)
    } catch (err) {
      setGeocodeResult({ error: err.message })
    } finally {
      setGeocoding(false)
    }
  }

  const confirmGeocode = () => {
    if (!geocodeResult || geocodeResult.error) return
    setForm(prev => ({ ...prev, latitude: String(geocodeResult.lat), longitude: String(geocodeResult.lon) }))
    setGeocodeResult(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload = {
        name: form.name,
        category: form.category,
        address: form.address,
        description: form.description,
        imageUrl: form.imageUrl,
        rating: parseFloat(form.rating) || 0,
        openingHours: form.openingHours,
        priceLevel: form.priceLevel,
        highlight: form.highlight,
        instagram: form.instagram || null,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        latitude: parseFloat(form.latitude) || 0,
        longitude: parseFloat(form.longitude) || 0,
        isOpen: form.isOpen,
      }
      if (isEditing) {
        await updatePlace(id, payload)
      } else {
        await createPlace(payload)
      }
      navigate('/admin')
    } catch (err) {
      setError(err.message)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setSaving(false)
    }
  }

  if (loadingData) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
        <p style={{ color: C.textLight, fontSize: 16 }}>Carregando dados...</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      {/* Header */}
      <div style={{ background: C.primary, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16, position: 'sticky', top: 0, zIndex: 10 }}>
        <button
          type="button"
          onClick={() => navigate('/admin')}
          style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
        >
          ← Voltar
        </button>
        <div>
          <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 800, lineHeight: 1.2 }}>
            {isEditing ? 'Editar equipamento' : 'Novo equipamento'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>
            {isEditing ? form.name : 'Preencha os dados do novo local de lazer'}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '28px 20px' }}>
        {error && (
          <div style={{ background: '#FFF0F0', border: `1px solid ${C.danger}`, borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: C.danger, fontSize: 14, fontWeight: 600 }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Basic info */}
          <Section title="Informações básicas">
            <Field label="Nome *">
              <input style={inp} value={form.name} onChange={set('name')} required placeholder="Ex: Parque Ibirapuera" />
            </Field>
            <Field label="Categoria *">
              <select style={inp} value={form.category} onChange={set('category')}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Destaque" hint="Frase curta que aparece no card do app">
              <input style={inp} value={form.highlight} onChange={set('highlight')} placeholder="Ex: O maior parque urbano de São Paulo" />
            </Field>
            <Field label="Descrição">
              <textarea style={{ ...inp, minHeight: 110, resize: 'vertical' }} value={form.description} onChange={set('description')} placeholder="Descrição completa do local..." />
            </Field>
          </Section>

          {/* Location */}
          <Section title="Localização">
            <Field label="Endereço *" hint="Digite o endereço e clique em Geocodificar para obter as coordenadas automaticamente">
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  style={{ ...inp, flex: 1 }}
                  value={form.address}
                  onChange={set('address')}
                  required
                  placeholder="Ex: Av. Pedro Álvares Cabral, s/n - Vila Mariana, São Paulo"
                />
                <button
                  type="button"
                  onClick={handleGeocode}
                  disabled={geocoding || !form.address.trim()}
                  style={{
                    background: C.primary, color: '#fff', border: 'none', borderRadius: 8,
                    padding: '10px 16px', cursor: geocoding || !form.address.trim() ? 'not-allowed' : 'pointer',
                    fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap',
                    opacity: geocoding || !form.address.trim() ? 0.5 : 1,
                  }}
                >
                  {geocoding ? '⏳' : '📍'} {geocoding ? 'Buscando...' : 'Geocodificar'}
                </button>
              </div>
            </Field>

            {geocodeResult && !geocodeResult.error && (
              <div style={{ background: '#F0FBF9', border: `1px solid ${C.success}`, borderRadius: 8, padding: 16 }}>
                <p style={{ fontSize: 13, color: C.text, marginBottom: 12, lineHeight: 1.6 }}>
                  <b style={{ color: C.success }}>✓ Endereço encontrado:</b><br />
                  {geocodeResult.label}
                </p>
                <p style={{ fontSize: 13, color: C.textLight, marginBottom: 12 }}>
                  Lat: {geocodeResult.lat.toFixed(6)} · Lon: {geocodeResult.lon.toFixed(6)}
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={confirmGeocode} style={{ background: C.success, color: '#fff', border: 'none', borderRadius: 7, padding: '9px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                    ✓ Usar estas coordenadas
                  </button>
                  <button type="button" onClick={() => setGeocodeResult(null)} style={{ background: 'transparent', color: C.textLight, border: `1px solid ${C.border}`, borderRadius: 7, padding: '9px 14px', cursor: 'pointer', fontSize: 13 }}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}
            {geocodeResult?.error && (
              <p style={{ color: C.danger, fontSize: 13, padding: '8px 0' }}>⚠️ {geocodeResult.error}</p>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Latitude" hint="Preenchido automaticamente pelo geocodificador">
                <input style={inp} value={form.latitude} onChange={set('latitude')} placeholder="-23.587416" />
              </Field>
              <Field label="Longitude" hint="Preenchido automaticamente pelo geocodificador">
                <input style={inp} value={form.longitude} onChange={set('longitude')} placeholder="-46.657634" />
              </Field>
            </div>
          </Section>

          {/* Details */}
          <Section title="Informações detalhadas">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Avaliação (0.0 – 5.0)">
                <input style={inp} type="number" min="0" max="5" step="0.1" value={form.rating} onChange={set('rating')} />
              </Field>
              <Field label="Preço">
                <input style={inp} value={form.priceLevel} onChange={set('priceLevel')} placeholder="Ex: Gratuito, R$ 30,00" />
              </Field>
            </div>
            <Field label="Horário de funcionamento" hint="Ex: Ter-Dom 10:00 - 18:00 | Seg-Sex 08:00 - 17:00, Sáb 09:00 - 13:00">
              <input style={inp} value={form.openingHours} onChange={set('openingHours')} placeholder="Ex: Ter-Dom 10:00 - 18:00" />
            </Field>
            <Field label="Instagram (sem @)">
              <input style={inp} value={form.instagram} onChange={set('instagram')} placeholder="Ex: parqueibirapuera" />
            </Field>
            <Field label="Tags" hint="Palavras-chave separadas por vírgula">
              <input style={inp} value={form.tags} onChange={set('tags')} placeholder="Ex: natureza, parque, família, piquenique" />
            </Field>
          </Section>

          {/* Image */}
          <Section title="Imagem">
            <Field label="URL da imagem (Unsplash recomendado)" hint="Use https://images.unsplash.com/photo-{ID}?w=800&q=80">
              <input style={inp} value={form.imageUrl} onChange={set('imageUrl')} placeholder="https://images.unsplash.com/photo-..." />
            </Field>
            {form.imageUrl ? (
              <img
                src={form.imageUrl}
                alt="Preview"
                style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 8, border: `1px solid ${C.border}` }}
                onError={e => { e.target.style.display = 'none' }}
                onLoad={e => { e.target.style.display = 'block' }}
              />
            ) : null}
          </Section>

          {/* Status */}
          <Section title="Status">
            <Field label="" hint="Se o horário de funcionamento estiver preenchido, o status é calculado automaticamente pelo sistema. Este campo serve como override manual.">
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.isOpen}
                  onChange={set('isOpen')}
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
                <span style={{ fontSize: 14, color: C.text, fontWeight: 600 }}>Marcar como aberto agora</span>
              </label>
            </Field>
          </Section>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button
              type="button"
              onClick={() => navigate('/admin')}
              style={{ flex: 1, padding: '14px', background: C.white, color: C.text, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{ flex: 2, padding: '14px', background: C.primary, color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? 'Salvando...' : (isEditing ? '✓ Salvar alterações' : '+ Criar equipamento')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
