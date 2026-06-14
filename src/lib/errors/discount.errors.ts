export class AdminUserDiscountNotFoundError extends Error {
  readonly name = 'AdminUserDiscountNotFoundError'

  constructor() {
    super('User discount not found')
  }
}

export class InvalidDiscountValueError extends Error {
  readonly name = 'InvalidDiscountValueError'

  constructor(message: string) {
    super(message)
  }
}

export class InvalidDiscountWindowError extends Error {
  readonly name = 'InvalidDiscountWindowError'

  constructor() {
    super('Discount end date must be after the start date')
  }
}

export class DiscountedAmountInvalidError extends Error {
  readonly name = 'DiscountedAmountInvalidError'

  constructor() {
    super('Discount must remain lower than the bundle price at purchase time')
  }
}
