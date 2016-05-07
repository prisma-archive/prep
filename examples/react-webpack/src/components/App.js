import React, { PropTypes } from 'react'
import classes from './App.css'

import 'normalize.css'

export default class App extends React.Component {
  static propTypes = {
    children: PropTypes.element.isRequired,
  }

  render () {
    return (
      <div className={classes.root}>
        {this.props.children}
      </div>
    )
  }
}
