import { redirect } from 'next/navigation'
import { getServerSession } from '@/app/_lib/auth'
import { LoginForm } from '@/components/forms/LoginForm'
import { brand, formatPageTitle, formatPoweredBy } from '@/lib/brand'

export const metadata = { title: formatPageTitle('Sign In') }

export default async function LoginPage() {
  const session = await getServerSession()
  if (session) redirect('/dashboard')

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{brand.shortAppName}</h1>
          <p className="text-gray-500 mt-1 text-sm">{brand.appName}</p>
          <p className="text-gray-400 mt-1 text-xs">{formatPoweredBy()}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm px-6 py-8">
          <LoginForm />
        </div>
      </div>
    </main>
  )
}
