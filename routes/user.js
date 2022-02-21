const { response } = require('express');
var express = require('express');
const async = require('hbs/lib/async');
const { Collection } = require('mongodb');
const adminHelpers = require('../helpers/admin-helpers');
const { banners } = require('../helpers/admin-helpers');
const { addressCount } = require('../helpers/user-helpers');
const userHelpers = require('../helpers/user-helpers');
var router = express.Router();
var userHelper = require('../helpers/user-helpers')


const twilio = require('../twilio')
const client = require("twilio")(twilio.accountsId, twilio.authToken)

// twilio
// const accountSid = process.env.TWILIO_ACCOUNT_SID; 
// const authToken = process.env.TWILIO_AUTH_TOKEN;
// const client = require('twilio')(accountSid, authToken);

const paypal = require('paypal-rest-sdk');
const { default: Swal } = require('sweetalert2');

paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': 'AfCvvoo-4au-zP3fhXZBXYBE58kP3Tv-zI3KacA8T0V5emeUaDInC-snqcC5quP0rkWOA10gkLoNxhDy',
  'client_secret': 'EMgbQfvI4PKOk6HoiV4mc5wDHmOL2KirEI94EX8vrOmyW8FNycA8s2W8Z0xE7ofBB2l5TatTqruOUjrZ'
});



let verifyLogin = (req, res, next) => {
  if (req.session.user) next()
  else res.render('user/login')
}



router.get('/', async (req, res) => {
  try {
    let { page, size } = req.query
    if (!page) {
      page = 1
    }
    if (!size) {
      size = 6
    }
    var limit = parseInt(size)
    var skip = (page - 1) * size

  } catch (err) {
    console.log(err)
  }


  products = await userHelpers.getProducts(limit, skip)

  cartCount = 0
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id)

  }

  banner = await adminHelpers.banners()
  res.render('user/home', { user: true, status: req.session.user, products, cartCount, banner })


})
router.get('/signup', function (req, res, next) {
  amount = 0
  res.render('user/signup', { formValidate: true , amount});
});

router.get('/request-otp', (req, res) => {
  res.render('user/forgot_password', { formValidate: true })
})

router.get('/get_otp', async (req, res) => {
  req.session.phonenumber = req.query.phonenumber

  await client.verify.services('VAfff790887170f2ed311674599e612ee9')
    .verifications
    .create({ to: '+91' + req.session.phonenumber, channel: 'sms' })
    .then((data) => {
      console.log("getotp:", data)
      res.render('./user/verify')
    }).catch(() => {
      console.log("eroor occured")
      res.render("user/forgot_password", { error: "Invalid mobile number", formValidate: true })
      console.log("eroor occured")
      res.render("user/verify", { error: "Invalid otp" })
    })

})

router.get('/verify', async (req, res) => {
  await client.verify.services('VAfff790887170f2ed311674599e612ee9')
    .verificationChecks
    .create({ to: '+91' + req.session.phonenumber, code: req.query.code })
    .then((data) => {
      if (data.status == "approved") {
        console.log("status:", data)
        userHelper.verifyPhone(req.session.phonenumber).then((response) => {
          if (response.status) {
            req.session.userLoggedIn = true
            req.session.user = response.user
            res.redirect('/')
          }
          else {
            req.session.userLoginErr = "Invalid Mobile number"
            res.render('user/login', { LoginErr: req.session.userLoginErr })
          }

        }).catch((e) => {

        })
      } else {
        res.render("user/verify", { error: "Invalid OTP" })
      }

    }).catch((err) => {
      res.redirect({ error: "Invalid OTP" }, '/verify')
    })
})
router.get('/login', (req, res) => {

  res.render("user/login", { formValidate: true })


})


router.post('/login', (req, res) => {
  userHelper.doLogin(req.body).then((response) => {

    if (response.status) {
      if (response.block == false) {
        req.session.userLoggedIn = true
        req.session.user = response.user
        res.redirect('/')
      }
      else {
        req.session.userBlock = true
        res.render('user/login', { LoginErr: req.session.userLoginErr })
        req.session.userLoginErr = false
      }

    }

    else {
      req.session.userLoginErr = "Invalid Username or Password"
      res.render("user/login", { LoginErr: req.session.userLoginErr })
    }

  })
})



router.post('/signup', async (req, res) => {
  req.session.phone = req.body.phone
  console.log(req.body.Wallet);
  await userHelper.doSignup(req.body).then(async (response) => {
    await client.verify.services('VAfff790887170f2ed311674599e612ee9')
      .verifications
      .create({ to: '+91' + req.session.phone, channel: 'sms' })
      .then((verification) => {
        console.log("success ")
        res.render('./user/signupotp')
      }).catch(() => {
        console.log("eroor occured")
        res.render("user/signup", { msg: "Invalid mobile number" })
      })
  }).catch((err) => {
    res.render('user/signup', { err })
  })
})

router.get('/resend-otp', async (req, res) => {
  await client.verify.services('VAfff790887170f2ed311674599e612ee9')
    .verifications
    .create({ to: '+91' + req.session.phonenumber, channel: 'sms' })
    .then((data) => {
      console.log("getotp:", data)
      res.render('user/login')
    }).catch(() => {
      console.log("eroor occured")
      res.render("user/signupotp", { error: "Invalid otp" })
    })
})

router.post('/signupotp', async (req, res) => {
  await client.verify.services('VAfff790887170f2ed311674599e612ee9')
    .verificationChecks
    .create({ to: '+91' + req.session.phone, code: req.body.code })
    .then((data) => {
      if (data.status == "approved") {
        console.log("status:", data.status)
        res.redirect("/login")
      } else {
        console.log("error status:", data.status)
        res.render("user/signupotp", { msg: "Invalid otp" })
      }
    }).catch((err) => {
      res.render("user/signupotp", { msg: "Invalid otp" })
      console.log(err)
    })

})

router.get('/otp-timer', (req, res) => {
  res.render('user/otp-timer')
})


router.get('/forgot_password', (req, res) => {
  res.render('./user/forgot_password')
})

router.get('/logout', (req, res) => {
  req.session.user = null
  res.redirect('/')
})


router.get('/products', async (req, res) => {

  cartCount = 0
  
  if(req.query.field){

    products = await userHelpers.searchProduct(req.query.field)
  }
  else{

    products = await userHelpers.getProducts()
  }
  const length = products.length
  console.log(length)
  allcategory = await userHelper.getproductCategory()
  Subcategories = await userHelper.getSubcategories()
  if (req.session.user) {

    cartCount = await userHelper.getCartCount(req.session.user._id)
  }
  if(length == 0){
    products = false
  }
  res.render('user/products', { products, length: JSON.stringify(length), allcategory, Subcategories, user: true, all: true, cartCount, status: req.session.user, formValidate: true }) 


})

router.post('/verify', (req, res) => {
  res.render('user/create_password')
})

router.post('/reset_password', (req, res) => {
  phone = req.session.phonenumber
  userHelper.resetPassword(req.body, phone).then(() => {
    res.render('user/login')
  })
})

router.get('/product_details/:id', verifyLogin, async (req, res) => {
  Id = req.params.id
  let cartCount = 0
  product = await userHelper.productDetails(Id)
  console.log(product);
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id)
  }
  res.render('user/product_details', { product, user: true, cartCount, status: req.session.user })
})

router.get('/all-products', async (req, res) => {
  products = await userHelper.getProducts()
  res.render('user/products', { products, user: true, all: true, status: req.session.user })

})
router.get('/bottom-wear', async (req, res) => {
  products = await userHelper.getBottomWear()
  res.render('user/products', { products, bottom: true, user: true })
})
router.get('/category', (req, res) => {
  category = req.body.category
  categoryProducts = userHelper.getCategoryProducts(category)
  res.render('user/products', { categoryProducts })
})


router.get('/add-to-cart', async (req, res) => {

  console.log(req.query)
  if (req.session.user) {
    await userHelper.addToCart(req.session.user._id, req.query.id).then(() => {
      res.json({ status: true })
    })

  }
  else {
    res.json({ noUser: true })
  }
})

router.get('/cart', async (req, res) => {
  user = req.session.user
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id)

    var cartStatus = false

    if (cartCount > 0) {
      cartStatus = true

      products = await userHelper.getCartProducts(req.session.user._id)
      console.log("products:", products)
      total = await userHelper.totalAmount(user._id)

      res.render("user/cart", { products, user: true, formValidate: true, cartCount, status: req.session.user, total, cartStatus })

    }
    else {
      res.render('user/cart', { user: true, status: req.session.user })
    }
  }
  else {
    res.redirect('/login')
  }

  // else {
  //   res.render('user/cart', { user: true, status: req.session.user })
  // }
})

router.post('/change-product-total', (req, res) => {
  userHelper.changeProductTotal(req.body.cartId, req.body.productId, req.body.count)
})

router.get('/remove-cart-product/:id', (req, res) => {
  console.log("ids:", req.params.id)
  console.log("product remove")
  userHelper.removeCartProduct(req.params.id, req.session.user._id).then(() => {

    res.json({ status: true })
  })
})

router.post('/change-product-quantity', async (req, res) => {
  user = req.session.user
  console.log("get call")
  userHelper.changeProductQuantity(req.body.cart, req.body.product, req.body.count).then(async (response) => {
    response.total = await userHelper.totalAmount(user._id)

    res.json({ status: true, total: response.total })

  })
})

router.get('/place-order',verifyLogin, async (req, res) => {
  paypalPay = false
  if(req.query.paypalFail){
    paypalPay = true
  }

  console.log(req.session.user._id)
  let addresscount = null
  user = req.session.user
  total = await userHelper.totalAmount(user._id) 
  userdetails = await userHelper.getUserdetails(req.session.user._id)
  if (userdetails.Address) {

    addresscount = userdetails.Address.length
  }
  if (req.session.user) {

    cartCount = await userHelper.getCartCount(req.session.user._id)
  }

  res.render('user/place-order', { user: req.session.user, total, status: req.session.user, formValidate: true, userdetails, addresscount, cartCount ,paypalPay})
})



router.post('/place-order', async (req, res) => {
  console.log(req.body)
  payment = req.body.payment
  number = req.body.radio_group1

  if (number) {

    if (number < 5) {
      req.body = await userHelper.getArrayAddress(number, req.session.user._id)
    }
    else {
      req.body = await userHelper.getUserAddress(req.session.user._id)
    }
    req.body.payment = payment
    req.body.userId = req.session.user._id
    console.log(req.body)
    if (req.body.firstname && req.body.lastname && req.body.address) {
      console.log("body")
      products = await userHelper.getProductsList(req.body.userId)
      console.log(products)
      total = await userHelper.totalAmount(req.body.userId)
      console.log(total)

      if (products != undefined) {
        console.log("products und")
        if (req.body.payment) {
          userHelper.placeOrder(req.body, products, total).then((orderId) => {
            if (req.body.payment == 'cod') {

              res.json({ codsuccess: true,orderId })

            }

            else if (req.body.payment == "razorpay") {

              userHelper.generateRazorpay(orderId, total).then((response) => {
                res.json(response)
              }).catch((err) => {
                console.log(err)
              })
            }
            else {

              res.json({ paypalSuccess: true, orderId, products, total })

            }
          })
        }
        else {
          res.json({ nopayment: true })
        }

      }
      else {

        res.json({ productsStatus: true })
      }


    }
    else {
      console.log("no body");
      res.json({ nobody: true })
    }

  }
  else {
    res.json({ nobody: true })
  }
})

router.get('/delete-order-product', (req, res) => {
  console.log(req.query.order)
  userHelper.deleteOrderProduct(req.query.order.receipt,req.session.user._id)
  res.json({status:true})
})



router.get('/view-orders', async (req, res) => {
  let ordersStatus = null
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id)
    await userHelper.viewOrders(req.session.user._id).then((orders) => {
      if (orders.length > 0) {
        ordersStatus = true
      }
      res.render("user/view-orders", { user: true, ordersStatus, orders, status: req.session.user, cartCount })

    })
  }
  else {
    res.redirect('/login')
  }
  // else {
  //   res.render("user/view-orders", { user: true, status: req.session.user })
  // }

})

router.get('/view-order-products', async (req, res) => {
  products = await userHelper.orderProducts(req.query.id)
  userHelper.deleteOrderProduct(req.query.id,req.session.user._id).then(()=>{
    res.render('user/view-order-products', { user: req.session.user, products, status: req.session.user })
  })
})

router.post('/verify-payment', (req, res) => {
  userHelper.verifyPayment(req.body).then(() => {
    userHelper.changePaymentStatus(req.body['order[receipt]']).then(() => {
      res.json({ status: true })
    })
  }).catch(err => {
    res.json({ status: false })
  })

})

router.get('/products/collection', async (req, res) => {
  main = req.query.main
  sub = req.query.sub
  allcategory = null
  products = await userHelper.getcollectionsDress(main, sub)
  category = await userHelper.getproductCategory(main, sub)
  if (main === "Latest" || main == null) {
    allcategory = category
    category = null

  }
  cartCount = 0
  if (req.session.user) {

    cartCount = await userHelper.getCartCount(req.session.user._id)
  }

  length = products.length
  res.render('user/products', { cartCount, products, allcategory, category, all: true, user: true, status: req.session.user, length, formValidate: true })

})

router.get('/cancel-order/:id', (req, res) => {
  userHelper.cancelOrder(req.params.id).then((response) => {
    res.json({ status: true })
  })
})

router.get('/change-address', async (req, res) => {
  Id = req.query.Id
  count = req.query.count
  if (count) {
    Address = await userHelper.getUserAddress1(Id, count)
    userdetails = Address[count]


  }
  else {

    userdetails = await userHelper.getUserAddress(Id)
  }
  res.render('user/change-address', { user: true, status: req.session.user, userdetails })

})

router.get('/add-address', async (req, res) => {
  user = req.session.user._id
  addresscount = await userHelper.addressCount(user)
  res.render('user/add-address', { user: user._id, status: req.session.user, addresscount, formValidate: true })
})

router.post('/change-address', (req, res) => {

  if (req.body.address) {
    userHelper.changeAddress1(req.body, req.session.user._id).then(() => {
      res.redirect('/place-order')
    })

  }
  else {

    userHelper.changeAddress(req.body).then(() => {

      res.redirect('/place-order')
    })
  }


})

router.post('/add-address', (req, res) => {
  if (req.body.Id) {
    userHelper.addAddress1(req.body).then(() => {
      res.redirect('/place-order')
    })
  }
  else {

    userHelper.addAddress(req.body, req.session.user._id).then(() => {
      res.redirect('/place-order')
    })
  }
})

router.get('/profile',verifyLogin, async (req, res) => {
  userdetails = await userHelper.getUserdetails(req.session.user._id)
  cartCount = await userHelper.getCartCount(req.session.user._id)
  res.render('user/profile', { user: true, status: req.session.user, userdetails, user_profile: true, formValidate: true ,cartCount })
})

router.get('/orders', async (req, res) => {
  let ordersStatus = null
  if (req.session.user) {

    await userHelper.viewOrders(req.session.user._id).then((orders) => {
      if (orders.length > 0) {
        ordersStatus = true
      }
      res.render("user/orders", { user: true, ordersStatus, orders, status: req.session.user, user_profile: true })

    })
  }
  else {
    res.render("user/orders", { user: true, status: req.session.user,usersidebar:true })
  }

})

router.get('/address', async (req, res) => {
  address1 = null
  if (req.session.user) {
    address = await userHelper.getUserAddress(req.session.user._id)

    if (address.Address) {
      address1 = await userHelper.getUserAddress1(req.session.user._id)
      address1.forEach((element, index) => {
        element.count = index
      });
      console.log(address1)

    }

    res.render('user/address', { user: true, status: req.session.user, address, address1, user_profile: true })
  }
})


router.get('/edit-address', async (req, res) => {
  Id = req.query.Id
  address = req.query.address

  if (address) {

    Address = await userHelper.getUserAddress2(Id, address)
    console.log(Address.length)

    for (i = 0; i < Address.length; i++) {
      if (Address[i].address == address) {

        userdetails = Address[i]
      }
    }

  }
  else {

    userdetails = await userHelper.getUserAddress(Id)
  }
  res.render('user/edit-address', { user: true, status: req.session.user, userdetails })

})

router.post('/edit-address', (req, res) => {

  if (req.body.address) {
    userHelper.changeAddress1(req.body, req.session.user._id).then(() => {
      res.redirect('/address')
    })

  }
  else {

    userHelper.changeAddress(req.body).then(() => {

      res.redirect('/address')
    })
  }
})

router.get('/delete-address/:address', async (req, res) => {
  Id = req.session.user._id
  address = req.params.address


  userHelper.deleteAddress(Id, address).then(() => {
    res.json({ status: true })

  })

})

router.get('/add-new-address', (req, res) => {
  res.render('user/add-new-address', { user: true, status: req.session.user, user_profile: true })
})

router.post('/add-new-address', async (req, res) => {
  userHelper.addAddress(req.body, req.session.user._id).then(async () => {
    Address = await userHelper.addAddressIndex(req.session.user._id)
    console.log('Address:', Address)

    console.log(Address)
    res.redirect('/address')

  })
})

// paypal

router.post('/buy', async (req, res) => {
  console.log("paypal payment")
  order = await userHelper.thisOrder()
  amount = order.Total


  // create payment object 
  var payment = {
    "intent": "authorize",
    "payer": {
      "payment_method": "paypal"
    },
    "redirect_urls": {
      "return_url": "http://localhost:3001/view-order-products?id="+order._id,
      "cancel_url": "http://localhost:3001/place-order?paypalFail="+true
    },
    "transactions": [{
      "amount": {
        "total": amount,
        "currency": "USD"
      },
      "description": "Products ordered",

    }]
  }
  // call the create Pay method 
  createPay(payment)
    .then((transaction) => {
      console.log("transaction", transaction)
      var id = transaction.id;
      var links = transaction.links;
      var counter = links.length;
      while (counter--) {
        if (links[counter].method == 'REDIRECT') {
          // redirect to paypal where user approves the transaction 

          return res.json(links[counter].href)
        }
      }
    })
    .catch((err) => {
      console.log(err);
      res.json({ error: true });
    });
});



// error page 
router.get('/err', (req, res) => {

  res.json({ paypalPaymentFailure: true })

})

// helper functions 
var createPay = (payment) => {
  return new Promise((resolve, reject) => {

    paypal.payment.create(payment, function (err, payment) {
      if (err) {
        reject(err);
      }
      else {
        resolve(payment);
      }
    });
  });
}



router.post('/edit-profile', (req, res) => {
  console.log(req.body)
  userHelper.editProfile(req.body, req.session.user._id).then(() => {
    res.redirect('/profile')
  })
})


router.get('/add-to-wishlist/:id',verifyLogin, (req, res) => {
  userHelper.addToWishlist(req.session.user._id, req.params.id).then(() => {
    res.json({ status: true })
  })
})

router.get('/wishlist',verifyLogin, async (req, res) => {
  wishlist = await userHelper.getwishlistProducts(req.session.user._id).then(async() => {
    cartCount = await userHelper.getCartCount(req.session.user._id)
    res.render('user/wishlist', { wishlist, user: true, status: req.session.user ,cartCount}) 
  })
})

router.get('/delete-wishlist/:id', (req, res) => {
  userHelper.deleteWishlistProduct(req.session.user._id, req.params.id).then(() => {
    res.json({ status: true })
  })
})

router.post('/products/price', async (req, res) => {
  console.log(req.body)
  if (req.body.all) {
    all = req.body.all

    array = all.split(" ")
    main = array[0]
    sub = array[1]


    req.body.sub = sub
    req.body.main = main
    products = await userHelper.getPriceProducts(req.body.sub, req.body.main, req.body.min, req.body.max)
    length = products.length
    res.render('user/products', { products, category, all: true, user: true, status: req.session.user, length })

  }
  else {



    products = await userHelper.getPriceProducts(req.body.sub, req.body.main, req.body.min, req.body.max)
    length = products.length
    console.log("producs match", products.length)
    res.render('user/products', { products, allcategory, all: true, user: true, status: req.session.user, length })
  }
})

router.get('/check-coupon', async (req, res) => {
  await userHelper.checkCoupon(req.query.coupon, req.query.total).then((data) => {
    console.log(data)
    if (data.Err) {

      res.json({ Err: true })

    }
    else {

      res.json({ total: data })

    }
  })
})

router.get('/referal',async(req,res)=>{
  userHelper.checkReferal(req.query.id).then((response)=>{

    let amount = 0
    if(response.status){
      amount = 50
    }
    res.render('user/signup', { formValidate: true,amount })
  })
})

router.get('/signupotp',(req,res)=>{
  res.render('user/signupotp')
})

router.get('/check-wallet',(req,res)=>{
  userHelper.checkWallet(req.session.user._id,req.query.total).then((data)=>{
    console.log(data)
    if(data.zeroWallet){
      res.json({zeroWallet:true})
    }
    else{
      res.json({data:data})
    }
  })
})



module.exports = router; 
