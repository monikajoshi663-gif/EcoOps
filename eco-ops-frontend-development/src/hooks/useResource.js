import useSWR from 'swr'
import { useApp } from '../context/AppContext'

// Fetches through whichever API (live or demo) is active. The mode is part of the key,
// so live and demo data never share a cache entry.
export function useResource(name, fnName, args, options) {
  const { mode, api } = useApp()
  const key = [mode, name, JSON.stringify(args ?? null)]
  return useSWR(key, () => api[fnName](args), { keepPreviousData: true, shouldRetryOnError: false, ...options })
}
