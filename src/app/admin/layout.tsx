import { redirect } from 'next/navigation'
import { getServerSession } from '@/app/_lib/auth'
import { findUserById } from '@/repositories/user.repository'
import { AdminShell } from '@/components/layout/AdminShell'
import { ROLES } from '@/constants/roles'

// Force fresh server render on every request — prevents stale session data
// being served from Next.js segment cache after a user switch.
export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession()
  if (!session) redirect('/login')
  if (session.role !== ROLES.ADMIN) redirect('/dashboard')

  const user = await findUserById(session.id)
  if (!user) redirect('/login')

  return (
    <AdminShell user={{ fullName: user.fullName, role: user.role }}>
      {children}
    </AdminShell>
  )
}
