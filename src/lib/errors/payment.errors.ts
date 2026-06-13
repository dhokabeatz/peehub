import type { TransactionStatus } from '@prisma/client'

export class PaymentNotFoundError extends Error {
  readonly name = 'PaymentNotFoundError'
  constructor() {
    super('Payment transaction not found')
  }
}

export class PaymentAlreadyProcessedError extends Error {
  readonly name = 'PaymentAlreadyProcessedError'
  readonly status: TransactionStatus
  constructor(status: TransactionStatus) {
    super(`Payment transaction has already been processed (status: ${status})`)
    this.status = status
  }
}

export class WalletFundingError extends Error {
  readonly name = 'WalletFundingError'
  constructor(message: string) {
    super(message)
  }
}

export class PaystackVerificationError extends Error {
  readonly name = 'PaystackVerificationError'
  constructor(message: string) {
    super(message)
  }
}

export class ManualPaymentConfirmationNotAllowedError extends Error {
  readonly name = 'ManualPaymentConfirmationNotAllowedError'
  readonly provider: string

  constructor(provider: string) {
    super(`Manual confirmation is not allowed for provider "${provider}"`)
    this.provider = provider
  }
}
