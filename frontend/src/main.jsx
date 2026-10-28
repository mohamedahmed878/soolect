import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { ThemeProvider } from './context/ThemeContext'
import { WishlistProvider } from './context/WishlistContext'
import { SearchProvider } from './context/SearchContext'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary><BrowserRouter>
      <ThemeProvider><AuthProvider><CartProvider><WishlistProvider><SearchProvider><App /></SearchProvider></WishlistProvider></CartProvider></AuthProvider></ThemeProvider>
    </BrowserRouter></ErrorBoundary>
  </React.StrictMode>
)
