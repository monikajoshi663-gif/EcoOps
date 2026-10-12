import { User } from '../models/User.model.js'
import { generateToken } from '../middleware/auth.js'
import { DEMO_USERS } from '../config/constants.js'

export async function getDemoUsers(req, res) {
  try {
    const users = await User.find({
      id: { $in: ['demo-student', 'demo-staff', 'demo-admin'] },
    }).select('id name role email team')

    if (users.length > 0) {
      return res.status(200).json({
        success: true,
        data: {
          users: users.map((u) => ({
            id: u.id,
            name: u.name,
            role: u.role,
            team: u.team,
          })),
        },
      })
    }

    // Fallback to constants if not yet queried
    return res.status(200).json({
      success: true,
      data: {
        users: DEMO_USERS.map((u) => ({
          id: u.id,
          name: u.name,
          role: u.role,
          team: u.team,
        })),
      },
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

export async function register(req, res) {
  try {
    const { name, email, password, role = 'student', team } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      })
    }

    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email',
      })
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role,
      team: team || null,
    })

    const token = generateToken(user)

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id || user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          team: user.team,
        },
        token,
      },
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      })
    }

    // Support either email or demo user id
    const user = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { id: email }],
    })

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      })
    }

    const isDemo = user.id && user.id.startsWith('demo-')
    const isMatch = (await user.comparePassword(password)) || (isDemo && (password === 'demo123' || password === 'password123'))
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      })
    }

    const token = generateToken(user)

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: {
        user: {
          id: user.id || user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          team: user.team,
        },
        token,
      },
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

export async function getMe(req, res) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated',
    })
  }

  return res.status(200).json({
    success: true,
    data: {
      user: {
        id: req.user.id || req.user._id?.toString(),
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        team: req.user.team,
      },
    },
  })
}

export async function logout(req, res) {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  })
}
