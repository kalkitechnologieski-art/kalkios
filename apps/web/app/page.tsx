import Homepage from './(app)/page'

// The public homepage lives in the (app) route group; re-export its metadata so
// Next applies it for "/" instead of falling back to the root metadata.
export { metadata } from './(app)/page'

export const revalidate = 3600

export default function Page() {
  return <Homepage />
}
