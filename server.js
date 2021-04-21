const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const path = require('path')
require('dotenv').config()
const passport = require('passport')

const PORT = process.env.PORT || 8000
const mongoose = require('mongoose')

const corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200
}

const users = require('./routes/users')

const app = express()

app.use(morgan('dev'))
app.use(express.urlencoded({ extended: true }))
app.use(cors(corsOptions))
app.use(express.json())

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
    res.status(err.status || 500)
    res.render('error', {
      message: err.message,
      error: err
    })
  })
}

// Production error handler
// No stacktraces leaked to user
app.use(function (err, req, res, next) {
  res.status(err.status || 500)
  res.render('error', {
    message: err.message,
    error: {}
  })
})

module.exports = app
