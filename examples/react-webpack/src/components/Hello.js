import React from 'react'
import { Link } from 'react-router'
import classes from './Hello.css'

export default class Hello extends React.Component {
  render () {
    return (
      <div className={classes.root}>
        <Link to='world'>Hello</Link>
      </div>
    )
  }
}
