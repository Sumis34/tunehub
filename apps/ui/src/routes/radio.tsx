import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/radio')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/radio"!</div>
}
