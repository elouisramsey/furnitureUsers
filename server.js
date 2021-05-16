const express = require('express')
const cookieParser = require('cookie-parser')
const expressSession = require('express-session')
const morgan = require('morgan')
const cors = require('cors')
const path = require('path')
require('dotenv').config()
const passport = require('passport')
const helmet = require('helmet')

const mongoose = require('mongoose')
const MongoStore = require('connect-mongo')

const users = require('./routes/users')

const app = express()
const PORT = process.env.PORT || 8000

app.use(morgan('dev'))
app.use(express.urlencoded({ extended: true }))
app.use(cors())
app.use(express.json())
app.use(helmet())
app.use(cookieParser())
app.use(express.json())

/**
 * Session Configuration
 */
app.set('trust proxy', 1) // Cross-Domain Session Cookie

const session = {
  secret: process.env.SESSION_SECRET,
  cookie: {
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // must be 'none' to enable cross-site delivery
    secure: process.env.NODE_ENV === 'production' // must be true if sameSite='none'
  },
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.ATLAS_URI })
}

if (app.get('env') === 'production') {
  // Serve secure cookies, requires HTTPS
  session.cookie.secure = true
}
app.use(expressSession(session))

// Connect DB
mongoose
  .connect(process.env.ATLAS_URI, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => console.log('mongoDB is connected'))
  .then(
    app.listen(PORT, () => {
      console.log(`server running on port ${PORT}`)
    })
  )
  .catch((err) => console.log(err))

// Passport middleware
app.use(passport.initialize())
// Passport config
require('./config/passport')(passport)

app.use(express.static(path.join(__dirname, 'pages')))

// Routes
app.use('/routes/users', users)
app.use('/product', require('./routes/product'))

// Error handlers

// Catch 404 and forward to error handler
app.use(function (req, res, next) {
  const err = new Error('Not Found')
  err.status = 404
  next(err)
})

// Development error handler
// Will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) {
    res.status(err).json(err.status)
    res.json('error', {
      message: err.message,
      error: err
    })
  })
}

// Production error handler
// No stacktraces leaked to user
// app.use(function (err, req, res, next) {
//   res.status(err).json(err.status)
//   res.json('error', {
//     message: err.message,
//     error: {}
//   })
// })

module.exports = app
