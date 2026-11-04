const BASE = '/api'
const TOKEN_KEY = 'admin_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

/** true se o token existe e ainda não expirou (o backend continua sendo quem valida). */
export function hasValidToken() {
  const token = getToken()
  if (!token) return false
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now()
  } catch {
    return false
  }
}

function getHeaders() {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

/** Sessão expirada ou inválida: limpa o token e volta para o login. */
function handleUnauthorized() {
  clearToken()
  window.location.assign('/admin/login?expirado=1')
}

async function request(path, { method = 'GET', body, fallbackError }) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: getHeaders(),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
  const json = await res.json().catch(() => ({}))

  if (res.status === 401 && path.startsWith('/admin/')) {
    handleUnauthorized()
    throw new Error('Sessão expirada. Faça login novamente.')
  }
  if (!res.ok) throw new Error(json.error || fallbackError)
  return json
}

export async function login(username, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || 'Credenciais inválidas')
  return json
}

export const fetchAllPlaces = () =>
  request('/places?limit=200', { fallbackError: 'Erro ao carregar lugares' })

export const fetchPlaceById = (id) =>
  request(`/places/${id}`, { fallbackError: 'Lugar não encontrado' })

export const fetchCategories = () =>
  request('/places/categories', { fallbackError: 'Erro ao carregar categorias' })

export const createPlace = (data) =>
  request('/admin/places', { method: 'POST', body: data, fallbackError: 'Erro ao criar lugar' })

export const updatePlace = (id, data) =>
  request(`/admin/places/${id}`, { method: 'PUT', body: data, fallbackError: 'Erro ao atualizar lugar' })

export const deletePlace = (id) =>
  request(`/admin/places/${id}`, { method: 'DELETE', fallbackError: 'Erro ao remover lugar' })

export async function geocodeAddress(address) {
  const query = encodeURIComponent(`${address}, São Paulo, Brasil`)
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
    { headers: { 'Accept-Language': 'pt-BR' } }
  )
  if (!res.ok) throw new Error('Erro ao buscar endereço')
  const data = await res.json()
  if (!data.length) throw new Error('Endereço não encontrado. Tente ser mais específico.')
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), label: data[0].display_name }
}
