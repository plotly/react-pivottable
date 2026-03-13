import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

// Create a root
const container = document.getElementById('app')
const root = createRoot(container)

// Render the app directly without AppContainer
root.render(<App />)

// Webpack Hot Module Replacement API
if (module.hot) {
  module.hot.accept('./App', () => {
    // When App is updated, re-render
    const NextApp = require('./App').default
    root.render(<NextApp />)
  })
}
