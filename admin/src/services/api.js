const BASE = '/api'

function getHeaders() {
  const token = localStorage.getItem('admin_token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export async function login(username, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Credenciais inválidas')
  }
  return res.json()
}

export async function fetchAllPlaces() {
  const res = await fetch(`${BASE}/places?limit=200`, { headers: getHeaders() })
  if (!res.ok) throw new Error('Erro ao carregar lugares')
  return res.json()
}

export async function fetchPlaceById(id) {
  const res = await fetch(`${BASE}/places/${id}`, { headers: getHeaders() })
  if (!res.ok) throw new Error('Lugar não encontrado')
  return res.json()
}

export async function createPlace(data) {
  const res = await fetch(`${BASE}/admin/places`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Erro ao criar lugar')
  return json
}

export async function updatePlace(id, data) {
  const res = await fetch(`${BASE}/admin/places/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Erro ao atualizar lugar')
  return json
}

export async function deletePlace(id) {
  const res = await fetch(`${BASE}/admin/places/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Erro ao remover lugar')
  return json
}

export async function geocodeAddress(address) {
  const query = encodeURIComponent(`${address}, São Paulo, Brasil`)
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
    { headers: { 'Accept-Language': 'pt-BR', 'User-Agent': 'LazerSP-Admin/1.0' } }
  )
  if (!res.ok) throw new Error('Erro ao buscar endereço')
  const data = await res.json()
  if (!data.length) throw new Error('Endereço não encontrado. Tente ser mais específico.')
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), label: data[0].display_name }
}
