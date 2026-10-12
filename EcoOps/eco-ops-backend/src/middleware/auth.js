import jwt from 'jsonwebtoken'
import { User } from '../models/User.model.js'
import { DEMO_USERS } from '../config/constants.js'

const JWT_SECRET = process.env.JWT_SECRET || 'ecoops_dev_jwt_secret_key_2026'

export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id || user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      team: user.team,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    const demoUserId = req.headers['x-demo-user-id']

    // 1. Check Bearer token
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      try {
        const decoded = jwt.verify(token, JWT_SECRET)
        const user = await User.findOne({
          $or: [{ id: decoded.id }, { email: decoded.email }],
        })
        if (user) {
          req.user = user
          return next()
        }
      } catch (err) {
        // Token invalid, fall through to check demo header
      }
    }

    // 2. Check X-Demo-User-Id header (for seamless hackathon demo switcher)
    if (demoUserId) {
      const user = await User.findOne({
        $or: [{ id: demoUserId }, { email: demoUserId }],
      })
      if (user) {
        req.user = user
        return next()
      }

      // Check if it's one of DEMO_USERS constants
      const demoConst = DEMO_USERS.find((u) => u.id === demoUserId)
      if (demoConst) {
        req.user = {
          id: demoConst.id,
          name: demoConst.name,
          email: demoConst.email,
          role: demoConst.role,
          team: demoConst.team || null,
        }
        return next()
      }
    }

    // Default demo fallback if no header in development mode
    // (Ensure API doesn't fail if demo frontend doesn't pass header on non-protected route)
    req.user = null
    next()
  } catch (error) {
    next(error)
  }
}

export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Provide a valid Bearer token or X-Demo-User-Id header.',
    })
  }
  next()
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: requires one of [${roles.join(', ')}] role. Current role is '${req.user.role}'.`,
      })
    }
    next()
  }
}
