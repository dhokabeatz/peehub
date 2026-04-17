import passport from 'passport'
import { localStrategy } from './local.strategy'
import { jwtStrategy } from './jwt.strategy'

passport.use('local', localStrategy)
passport.use('jwt', jwtStrategy)

// Stateless — no session serialization needed (JWT handles state).
passport.serializeUser((user, done) => done(null, user))
passport.deserializeUser((user, done) => done(null, user as Express.User))

export default passport
