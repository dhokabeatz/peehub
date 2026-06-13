const phone = process.env.NEXT_PUBLIC_SUPPORT_PHONE
const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL
const year  = new Date().getFullYear()

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-gray-400">
          © {year} PeeHub. All rights reserved.
        </p>

        {(phone || email) && (
          <p className="text-xs text-gray-500 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-gray-400">Need help?</span>
            {phone && (
              <>
                <a
                  href={`tel:${phone.replace(/\s/g, '')}`}
                  className="text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                >
                  {phone}
                </a>
                <a
                  href={`https://wa.me/${phone.replace(/[\s+]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:text-green-700 hover:underline transition-colors"
                >
                  WhatsApp
                </a>
              </>
            )}
            {email && (
              <span className="text-gray-300 hidden sm:inline">·</span>
            )}
            {email && (
              <a
                href={`mailto:${email}`}
                className="text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                {email}
              </a>
            )}
          </p>
        )}
      </div>
    </footer>
  )
}
