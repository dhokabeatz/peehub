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
