import { redirect } from 'next/navigation'
import { getServerSession } from '@/app/_lib/auth'
import { findUserById } from '@/repositories/user.repository'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { ROLES } from '@/constants/roles'

// Force fresh server render on every request — prevents stale session data
// being served from Next.js segment cache after a user switch.
export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession()
  if (!session) redirect('/login')

  // Admin users have no business in the retail shell — send them to their area.
  if (session.role === ROLES.ADMIN) redirect('/admin/orders')

  const user = await findUserById(session.id)
  if (!user) redirect('/login')

  return (
    <DashboardShell user={{ fullName: user.fullName, role: user.role }}>
      {children}
    </DashboardShell>
  )
}
