const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const cloudinary = require('cloudinary').v2
const { CloudinaryStorage } = require('multer-storage-cloudinary')
const multer = require('multer')

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
})

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'users',
    upload_preset: 'ihe ejigoro',
    format: async (req, file) => {
      'jpg', 'png', 'JPG', 'jpeg'
    }, // supports promises as well
    public_id: (req, file) => {
      console.log(
        new Date().toISOString().replace(/:/g, '-') + file.originalname
      )
      return new Date().toISOString().replace(/:/g, '-') + file.originalname
    }
  }
})

const parser = multer({ storage: storage })

// Load input validation
const validateRegisterInput = require('../validation/register')
const validateLoginInput = require('../validation/login')

// Load User model
const User = require('../models/user')

router.post('/register', (req, res) => {
  // Form validation
  const { errors, isValid } = validateRegisterInput(req.body)
  // Check validation
  if (!isValid) {
    return res.status(400).json(errors)
  }
  User.findOne({ email: req.body.email }).then((user) => {
    if (user) {
      return res.status(400).json({ email: 'Email already exists' })
    } else {
      const newUser = new User({
        nameofvendor: req.body.nameofvendor,
        email: req.body.email,
        password: req.body.password
      })

      // Hash password before saving in database
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) {
            console.log('There seems to be an error', err)
          }
          newUser.password = hash
          newUser
            .save()
            .then((user) => res.json(user))
            .catch((err) => console.log('There seems to be an error', err))
        })
      })
    }
  })
})

router.put('/:id', parser.single('image'), async (req, res) => {
  try {
    let user = await User.findById(req.params.id)

    // Delete image from cloudinary
    await cloudinary.uploader.destroy(user.cloudinary_id)

    // Upload image to cloudinary
    const result = await cloudinary.uploader.upload(req.file.path)

    const data = {
      nameofvendor: req.body.nameofvendor || user.nameofvendor,
      avatar: result.secure_url || user.avatar,
      cloudinary_id: result.public_id || user.cloudinary_id,
      state: req.body.state || user.state,
      phone: req.body.phone || user.phone
    }
    user = await User.findByIdAndUpdate(req.params.id, data, {
      new: true
    })
    res.json(user)
    console.log(user)
  } catch (error) {
    return res.status(401).send('There was an error editing request.')
  }
})

router.post('/login', (req, res) => {
  // Form validation
  const { errors, isValid } = validateLoginInput(req.body)
  // Check validation
  if (!isValid) {
    return res.status(400).json(errors)
  }
  const email = req.body.email
  const password = req.body.password
  // Find user by email
  User.findOne({ email }).then((user) => {
    // Check if user exists
    if (!user) {
      return res.status(404).json({ emailnotfound: 'Email not found' })
    }
    // Check password
    bcrypt.compare(password, user.password).then((isMatch) => {
      if (isMatch) {
        // User matched
        // Create JWT Payload
        const payload = {
          id: user.id,
          nameofvendor: user.nameofvendor
        }
        // Sign token
        jwt.sign(
          payload,
          process.env.secretOrKey,
          {
            expiresIn: 31556926 // 1 year in seconds
          },
          (err, token) => {
            res.json({
              success: true,
              token: 'Bearer ' + token
            })
            if (err) {
              console.log(err)
            }
          }
        )
      } else {
        return res.status(400).json({ passwordincorrect: 'Password incorrect' })
      }
    })
  })
})

module.exports = router
