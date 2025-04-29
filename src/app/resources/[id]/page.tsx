import { Metadata } from 'next'
import { ResourcePageClient } from "./resource-page-client"

export const metadata: Metadata = {
  title: 'Resource Details',
  description: 'View and manage your learning resources',
}

export function generateStaticParams() {
  // In a real app, this would return all possible resource IDs
  // For now, we'll return a few example IDs
  return [
    { id: 'example-1' },
    { id: 'example-2' },
    { id: 'example-3' },
  ]
}

export default function ResourcePage({ params }: { params: { id: string } }) {
  return <ResourcePageClient id={params.id} />
}