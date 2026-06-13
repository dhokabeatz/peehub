export class AdminUserNotFoundError extends Error {
  readonly name = 'AdminUserNotFoundError'

  constructor() {
    super('User not found')
  }
}

export class SelfUserDeactivationError extends Error {
  readonly name = 'SelfUserDeactivationError'

  constructor() {
    super('You cannot deactivate your own account')
  }
}
