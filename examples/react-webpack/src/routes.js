import React from 'react'
import { IndexRoute, Route } from 'react-router'
import App from './components/App.js'
import Hello from './components/Hello.js'
import World from './components/World.js'

export default (
  <Route path='/' component={App}>
    <IndexRoute component={Hello} />
    <Route path='world' component={World} />
  </Route>
)
