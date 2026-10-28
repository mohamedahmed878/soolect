import { useCallback, useEffect, useState } from 'react'
import { api } from '../services/api'

export default function useProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = useCallback(() => {
    setLoading(true); setError('')
    api.getProducts().then(setProducts).catch(() => setError("Can't reach the server. Check VITE_API_URL or try again.")).finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])
  return { products, loading, error, reload: load }
}
