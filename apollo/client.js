import { useMemo } from 'react'
import { ApolloClient, InMemoryCache } from '@apollo/client'
import merge from 'deepmerge'

let apolloClient = null

function createIsomorphLink(context) {
  if (typeof window === 'undefined') {
    const { SchemaLink } = require('@apollo/client/link/schema')
    const { schema } = require('./schema')
    console.log(context)
    return new SchemaLink({ schema, context })
  } else {
    const { HttpLink } = require('@apollo/client/link/http')
    return new HttpLink({
      uri: '/api/graphql',
      credentials: 'same-origin',
    })
  }
}

function createApolloClient(context) {
  return new ApolloClient({
    ssrMode: typeof window === 'undefined',
    link: createIsomorphLink(context),
    cache: new InMemoryCache(),
  })
}

/**
 * 
 * @param {*} initialState 
 * @returns {ApolloClient}
 */
export function initializeApollo(initialState = null, context = undefined) {
  const _apolloClient = apolloClient ?? createApolloClient(context)

  // If your page has Next.js data fetching methods that use Apollo Client, the initial state
  // get hydrated here
  if (initialState) {
    // Get existing cache, loaded during client side data fetching
    const existingCache = _apolloClient.extract()

    // Merge the existing cache into data passed from getStaticProps/getServerSideProps
    const data = merge(initialState, existingCache)

    // Restore the cache with the merged data
    _apolloClient.cache.restore(data)
  }
  // For SSG and SSR always create a new Apollo Client
  if (typeof window === 'undefined') return _apolloClient
  // Create the Apollo Client once in the client
  if (!apolloClient) apolloClient = _apolloClient

  return _apolloClient
}

export function useApollo(initialState) {
  const store = useMemo(() => initializeApollo(initialState), [initialState])
  return store
}
