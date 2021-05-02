const router = require('express').Router()
const Product = require('../models/product')

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
    folder: 'ihe ejigoro',
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

// add new product
router.post('/:id', parser.array('image'), async (req, res) => {
  const {
    description,
    nameofitem,
    nameofvendor,
    phone,
    address,
    price,
    state,
    category,
    color,
    _id
  } = req.body

  try {
    // Create new product
    const item = new Product({
      description,
      nameofitem,
      nameofvendor,
      phone,
      seller: _id,
      address,
      price,
      state,
      category,
      color
    })
    if (req.files) {
      // if you are adding multiple files at a go
      const imageURIs = [] // array to hold the image urls
      const files = req.files // array of images
      for (const file of files) {
        const { path } = file
        imageURIs.push(path)
      }

      item.image = imageURIs // add the urls to object

      // Save user
      await item.save()
      res.json(item)
    }
  } catch (err) {
    console.error('server error occur', err.message)

    return res.status(401).send('There was an error creating request.')
  }
})

// get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    res.json(product)
  } catch (err) {
    console.log(err)
    return res.status(500).send('There was an error getting product.')
  }
})

// get all products
router.get('/', async (req, res) => {
  try {
    const product = await Product.find()
    res.json(product)
  } catch (err) {
    return res.status(500).send('There was an error getting all products.')
  }
})

// delete a product
router.delete('/:id', async (req, res) => {
  try {
    // find product by id
    const product = await Product.findById(req.params.id)
    // delete image from cloudinary
    await cloudinary.uploader.destroy(product.cloudinary_id)
    // delete product from db
    await product.remove()
  } catch (err) {
    return res.status(500).send('There was an error deleting product.')
  }
})

// edit product
router.put('/:id', parser.array('image'), async (req, res) => {
  try {
    let product = await Product.findById(req.params.id)

    await cloudinary.uploader.destroy(product.cloudinary_id)

    const data = {
      description: req.body.description || product.description,
      nameofitem: req.body.nameofitem || product.nameofitem,
      nameofvendor: req.body.nameofvendor || product.nameofvendor,
      phone: req.body.phone || product.phone,
      address: req.body.address || product.address,
      price: req.body.price || product.price,
      state: req.body.state || product.state,
      category: req.body.category || product.category,
      seller: req.body._id
    }

    if (req.files) {
      // if you are adding multiple files at a go
      const imageURIs = [] // array to hold the image urls
      const files = req.files // array of images
      for (const file of files) {
        const { path } = file
        imageURIs.push(path)
      }

      data.image = imageURIs // add the urls to object

      product = await Product.findByIdAndUpdate(req.params.id, data, {
        new: true
      })
      res.json(product)
    }
  } catch (err) {
    return res.status(401).send('There was an error editing request.')
  }
})

module.exports = router
