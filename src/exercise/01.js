// Simple Data-fetching
// http://localhost:3000/isolated/exercise/01.js

import * as React from 'react'
import {PokemonDataView, fetchPokemon, PokemonErrorBoundary} from '../pokemon'

function createResource(promise) {
  let status = 'pending'
  let resolved
  let error

  let resourcePromise = promise.then(
    data => {
      status = 'resolved'
      resolved = data
    },
    err => {
      status = 'rejected'
      error = err
    },
  )

  return {
    read() {
      if (status === 'pending') throw resourcePromise
      if (status === 'rejected') throw error
      if (status === 'resolved') return resolved
    },
  }
}

const pokemonResource = createResource(fetchPokemon('charizard'))

function PokemonInfo() {
  const pokemon = pokemonResource.read()

  return (
    <div>
      <div className="pokemon-info__img-wrapper">
        <img src={pokemon.image} alt={pokemon.name} />
      </div>
      <PokemonDataView pokemon={pokemon} />
    </div>
  )
}

function App() {
  return (
    <div className="pokemon-info-app">
      <div className="pokemon-info">
        <React.Suspense fallback={<div>loading...</div>}>
          <PokemonErrorBoundary>
            <PokemonInfo />
          </PokemonErrorBoundary>
        </React.Suspense>
      </div>
    </div>
  )
}

export default App
