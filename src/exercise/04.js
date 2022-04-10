// Cache resources
// http://localhost:3000/isolated/exercise/04.js

import * as React from 'react'
import {
  fetchPokemon,
  PokemonInfoFallback,
  PokemonForm,
  PokemonDataView,
  PokemonErrorBoundary,
  // usePokemonResource,
} from '../pokemon'
import {createResource} from '../utils'

function PokemonInfo({pokemonResource}) {
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

const SUSPENSE_CONFIG = {
  timeoutMs: 4000,
  busyDelayMs: 300,
  busyMinDurationMs: 700,
}

const PokemonCacheContext = React.createContext(undefined)

function PokemonCacheProvider({children, cacheTime = 0}) {
  const cache = React.useRef({}).current
  const expirations = React.useRef({}).current

  const getPokemonResource = React.useCallback(
    name => {
      let pokemonResource = cache[name]
      if (!pokemonResource) {
        pokemonResource = createPokemonResource(name)
        cache[name] = pokemonResource
        expirations[name] = Date.now() + cacheTime
      }
      return pokemonResource
    },
    [cache, expirations, cacheTime],
  )

  React.useEffect(() => {
    const intervalId = setInterval(() => {
      const now = Date.now()
      for (const [name, expiredTime] of Object.entries(expirations)) {
        if (expiredTime < now) {
          delete cache[name]
          delete expirations[name]
        }
      }
    }, 1000)

    return () => {
      clearInterval(intervalId)
    }
  }, [cache, expirations])

  return (
    <PokemonCacheContext.Provider value={getPokemonResource}>
      {children}
    </PokemonCacheContext.Provider>
  )
}

function usePokemonResourceCache() {
  return React.useContext(PokemonCacheContext)
}

function createPokemonResource(pokemonName) {
  return createResource(fetchPokemon(pokemonName))
}

function AppWithProvider() {
  return (
    <PokemonCacheProvider cacheTime={5000}>
      <App />
    </PokemonCacheProvider>
  )
}

function App() {
  const [pokemonName, setPokemonName] = React.useState('')
  const [startTransition, isPending] = React.useTransition(SUSPENSE_CONFIG)
  const [pokemonResource, setPokemonResource] = React.useState(null)
  const getPokemonResource = usePokemonResourceCache()

  React.useEffect(() => {
    if (!pokemonName) {
      setPokemonResource(null)
      return
    }
    startTransition(() => {
      setPokemonResource(getPokemonResource(pokemonName))
    })
  }, [getPokemonResource, pokemonName, startTransition])

  function handleSubmit(newPokemonName) {
    setPokemonName(newPokemonName)
  }

  function handleReset() {
    setPokemonName('')
  }

  return (
    <div className="pokemon-info-app">
      <PokemonForm pokemonName={pokemonName} onSubmit={handleSubmit} />
      <hr />
      <div className={`pokemon-info ${isPending ? 'pokemon-loading' : ''}`}>
        {pokemonResource ? (
          <PokemonErrorBoundary
            onReset={handleReset}
            resetKeys={[pokemonResource]}
          >
            <React.Suspense
              fallback={<PokemonInfoFallback name={pokemonName} />}
            >
              <PokemonInfo pokemonResource={pokemonResource} />
            </React.Suspense>
          </PokemonErrorBoundary>
        ) : (
          'Submit a pokemon'
        )}
      </div>
    </div>
  )
}

export default AppWithProvider
