export interface WalletBalance {
  balance: string   // Decimal serialised as string by Prisma
  currency: string  // 'GHS'
}

export interface FundWalletResult {
  reference: string | null
  amount: string
  currency: string
  status: string
  provider: string
  authorization_url?: string  // present when PAYMENT_PROVIDER=paystack; client should redirect here
}
