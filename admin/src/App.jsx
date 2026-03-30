import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import PlacesList from './pages/PlacesList.jsx'
import PlaceForm from './pages/PlaceForm.jsx'

function PrivateRoute({ children }) {
  const token = localStorage.getItem('admin_token')
  return token ? children : <Navigate to="/admin/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin" element={<PrivateRoute><PlacesList /></PrivateRoute>} />
        <Route path="/admin/novo" element={<PrivateRoute><PlaceForm /></PrivateRoute>} />
        <Route path="/admin/editar/:id" element={<PrivateRoute><PlaceForm /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
