import React from 'react'
import { Link } from 'react-router'
import classes from './World.css'

export default class World extends React.Component {
  render () {
    return (
      <div className={classes.root}>
        <Link to='/'>
          <img src={require('../../static/world.jpg')} />
        </Link>
      </div>
    )
  }
}
