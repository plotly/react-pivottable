import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { AppContainer } from 'react-hot-loader'
import App from './App'

const render = (Component) => {
  ReactDOM.render(
    <AppContainer>
      <Component />
    </AppContainer>,
    document.getElementById('app'),
  )
}

render(App)

// Webpack Hot Module Replacement API
if ((module as any).hot) {
  (module as any).hot.accept('./App', () => { render(App) })
}
