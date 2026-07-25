import { brand, formatCopyright, formatPoweredBy } from '@/lib/brand'

const year = new Date().getFullYear()

export function Footer() {
  const contactLinks = [
    brand.supportPhone
      ? {
          label: brand.supportPhone,
          href: `tel:${brand.supportPhone.replace(/\s/g, '')}`,
          className: 'text-blue-600 hover:text-blue-700 hover:underline transition-colors',
        }
      : null,
    brand.whatsappNumber
      ? {
          label: 'WhatsApp',
          href: `https://wa.me/${brand.whatsappNumber.replace(/[^\d]/g, '')}`,
          className: 'text-green-600 hover:text-green-700 hover:underline transition-colors',
        }
      : null,
    brand.supportEmail
      ? {
          label: brand.supportEmail,
          href: `mailto:${brand.supportEmail}`,
          className: 'text-blue-600 hover:text-blue-700 hover:underline transition-colors',
        }
      : null,
  ].filter(Boolean) as Array<{ label: string; href: string; className: string }>

  return (
    <footer className="border-t border-gray-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-gray-500">{brand.appName}</p>
          <p className="text-xs text-gray-400">{formatCopyright(year)}</p>
          <p className="text-xs text-gray-500">{formatPoweredBy()}</p>
        </div>

        <div className="flex flex-col gap-1 text-xs text-gray-500 sm:items-end">
          {contactLinks.length > 0 && (
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-gray-400">Need help?</span>
              {contactLinks.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  target={item.href.startsWith('https://') ? '_blank' : undefined}
                  rel={item.href.startsWith('https://') ? 'noopener noreferrer' : undefined}
                  className={item.className}
                >
                  {item.label}
                </a>
              ))}
            </p>
          )}
          {brand.businessHours && <p>{brand.businessHours}</p>}
          {brand.businessAddress && <p className="text-right">{brand.businessAddress}</p>}
        </div>
      </div>
    </footer>
  )
}
