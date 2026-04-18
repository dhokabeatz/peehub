import { redirect } from 'next/navigation'
import { getServerSession } from '@/app/_lib/auth'
import { RegisterForm } from '@/components/forms/RegisterForm'

export const metadata = { title: 'Create Account · PeeHub' }

export default async function RegisterPage() {
  const session = await getServerSession()
  if (session) redirect('/dashboard')

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">PeeHub</h1>
          <p className="text-gray-500 mt-1 text-sm">Create your account</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm px-6 py-8">
          <RegisterForm />
        </div>
      </div>
    </main>
  )
}
