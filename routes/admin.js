var express = require('express');
const async = require('hbs/lib/async');
const { response, path } = require('../app');
var router = express.Router();
var adminHelpers = require('../helpers/admin-helpers')



const multer = require("multer");
const userHelpers = require('../helpers/user-helpers');
const { order } = require('paypal-rest-sdk');

//setting up multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/images");
  },
  
  filename: function (req, file, cb) {
    const ext = file.mimetype.split("/")[1];
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}.${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (
    file.originalname.split(".")[2]||file.originalname.split(".")[1] === "jpg" ||
    file.originalname.split(".")[2]||file.originalname.split(".")[1] === "png" ||
    file.originalname.split(".")[2]||file.originalname.split(".")[1] === "jpeg"
  ) {
    cb(null, true);
  } else {
    cb(new Error("Not a png/jpg/jpeg"), false);
  }
};

const upload = multer({ storage, fileFilter});

// module.exports = { upload };


function verifyLogin(req, res, next) {
  if (req.session.adminLoggedIn)
    next();
  else
    res.render('admin/login');
}

/* GET users listing. */
router.get('/view-products',async function(req, res, next) {
  admin = req.session.admin
  if (admin) {
    await adminHelpers.getProduct().then((products) => {
      
      res.render('./admin/view-products', { products, admin })
    })
  }
  else {
    res.render("admin/login", { formValidate: true })
  }

});
router.get('/login', (req, res) => {
  if (req.session.adminLoggedIn) {
    res.redirect('/admin')
  }
  else {
    res.render("admin/login", { formValidate: true })
  }
})

router.post('/login', (req, res) => {
  adminHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      console.log(response.status);
      req.session.adminLoggedIn = true
      req.session.admin = response.admin
      res.redirect('/admin')
    }
    else {

      res.redirect('/admin/login')
    }
  })

})
router.get('/logout', (req, res) => {
  req.session.admin = null
  req.session.adminLoggedIn = false
  res.redirect('/admin/login')
})

router.get('/add-product', verifyLogin, async (req, res) => {
  categories = await adminHelpers.getCategory(req.body)
  Subcategory = await adminHelpers.getSubcategory(req.body)
  admin = req.session.admin
  res.render('./admin/add-product', { admin, categories, Subcategory, formValidate: true })
})

router.post('/add-product', upload.array('image', 5), async (req, res) => {
  
  file = req.files
  
  var image = []
  file.forEach(element => {
    image.push(element.filename)
  })
  
  console.log(req.body)
  
  category = await adminHelpers.getProductCategory(req.body.category1)
  Subcategory = await adminHelpers.getProductSubcategory(req.body.category2)
  console.log(category)
  req.body.category_id = category._id
  req.body.Subcategory_id = Subcategory._id

  adminHelpers.addProduct(req.body, image).then((data) => { 
    var id = data.insertedId 
    res.redirect('/admin')

  })
})
router.get('/edit-product/:id', async (req, res) => {

  category = await adminHelpers.getCategory()
  Subcategory = await adminHelpers.getSubcategory()
  let Products = await adminHelpers.getProductDetails(req.params.id)
  console.log(Products);
  res.render('./admin/edit-product', { Products, category, Subcategory, admin: true ,formValidate:true})

})
router.post('/edit-product/:id',upload.array('image',5),async(req, res) => {
  Id = req.params.id
  file = req.files
  var image = []
  file.forEach(element => {
    image.push(element.filename)
  })
  req.body.image = image

  category = await adminHelpers.getProductCategory(req.body.category1)
  Subcategory = await adminHelpers.getProductSubcategory(req.body.category2)
  req.body.category1 = category.category
  req.body.category2 = Subcategory.Subcategory
  console.log("category",req.body.category1,req.body.category2)

  req.body.category_id = category._id
  req.body.Subcategory_id = Subcategory._id
  adminHelpers.editProduct(req.body, Id).then((response) => {
    
    res.redirect('/admin')
  })
})

router.get('/delete-product/:id', (req, res) => {
  Id = req.params.id
  console.log("id:", Id);
  adminHelpers.deleteProduct(Id).then(() => {
    res.redirect('/admin')
  })

})
router.get('/view-users', verifyLogin, (req, res) => {
  admin = req.session.admin
  adminHelpers.viewUsers().then((Users) => {
    console.log(Users);
    res.render('admin/view-users', { Users, admin })
  })
})
router.get('/block-user/:id', (req, res) => {
  Id = req.params.id
  adminHelpers.blockUser(Id).then(() => {
    req.session.user = null
    res.redirect('/admin/view-users')
  })
})

router.get('/unblock-user/:id', (req, res) => {
  Id = req.params.id
  adminHelpers.unblockUser(Id).then(() => {
    res.redirect('/admin/view-users')
  })
})

router.get('/categories', verifyLogin, async (req, res) => {
  admin = req.session.admin
  categories = await adminHelpers.getCategory()
  res.render('admin/categories', { categories, admin })
})

router.get("/add-categories", verifyLogin, (req, res) => {
  admin = req.session.admin
  res.render('admin/add-categories', { formValidate: true, admin })
})

router.post('/add-categories', (req, res) => {
  console.log("category", req.body.category);
  adminHelpers.addCategory(req.body.category).then((category) => {
    if (category) {
      res.redirect('/admin/categories')
    }
    else {
      res.redirect('/admin/categories')
    }
  })
})

router.get('/sub-categories', async (req, res) => {
  Subcategory = await adminHelpers.getSubcategory1()
  res.render('admin/subcategories',{admin:req.session.admin,Subcategory})
})

router.get('/add-sub-categories/:id', async (req, res) => {
  Id = req.params.id
  category = await adminHelpers.getCategory1(Id)
  category = category.category
  res.render('admin/add-sub-categories', { category, formValidate: true ,Id})
})

router.post('/add-sub-categories', async (req, res) => {
  category = req.body.category
  console.log(category);
  admin = req.session.admin
  sub = await adminHelpers.subcategoryExist(req.body)
  Subcategory = await adminHelpers.getSubcategory()
  if(sub){
    res.redirect('/admin/sub-categories')
  }
  else{
    adminHelpers.addSubcategory(req.body, category).then(() => {
      res.redirect('/admin/sub-categories')
    })
  }
})

router.get('/delete-category/:id', (req, res) => {
  Id = req.params.id
  adminHelpers.deleteCategory(Id).then(() => {
    adminHelpers.deletecategoryProducts(Id).then(()=>{
      res.redirect('/admin/categories')

    })
  })
})

router.get('/delete-subcategory',(req,res)=>{
  console.log(req.query)
  adminHelpers.deleteSubcategory(req.params.id).then(()=>{
    adminHelpers.deleteSubcategoryProducts(req.query._id,req.query.name)
    res.redirect('/admin/sub-categories')
  })
})


router.get('/banners',async (req, res) => {
  admin = req.session.admin
  banners =await adminHelpers.banners()
  console.log("banners",banners)
  res.render('admin/banners', { admin: true , banners})
})

router.get('/add-banner', (req, res) => {
  admin = req.session.admin
  res.render("admin/add-banner", { admin: true })
})

router.post('/add-banner', upload.array('image', 5), (req, res) => {

  file = req.files
  let image = []
  file.forEach(element => {
    image.push(element.filename)
  })
  adminHelpers.addBanner(req.body, image)
  res.redirect('/admin/banners')

})

router.get('/edit-banner/:id',async(req,res)=>{
  await adminHelpers.editBanner(req.params.id).then((banner)=>{

    console.log("banner get:",banner)
    res.render("admin/edit-banner",{banner,admin:req.session.admin})
  })
})

router.post('/edit-banners/:id',upload.array('image',5),async(req,res)=>{
  file = req.files
  var image = []
  console.log("count", file.length);
  file.forEach(element => {
    image.push(element.filename)
  })
  console.log("image",image)
  req.body.image = image
  console.log("req.image",req.body.image)
  await adminHelpers.editBanners(req.body,req.params.id).then(()=>{
    res.redirect('/admin/banners')
  })

})
router.get('/delete-banner/:id',(req,res)=>{
  adminHelpers.deleteBanner(req.params.id).then(()=>{
    res.json({status:true})
  })
})

router.get('/demo',async(req,res)=>{
  products =await adminHelpers.getProduct()
  console.log(products)
  res.render('admin/demo',{ formValidate: true,products})
})

router.get('/demo1',(req,res)=>{
  res.json({status:true})
})

router.get('/orders',async(req,res)=>{
  orders =await adminHelpers.viewOrders()
  orders.forEach((element,index)=>{
    orders[index].Date=element.Date.getFullYear()+"-"+(element.Date.getMonth()+1)+'-'+element.Date.getDate()
  })
  console.log(orders)
  res.render('admin/orders',{admin:true,orders})
})

router.get('/cancel-order/:id',(req,res)=>{
  adminHelpers.cancelOrder(req.params.id).then((response)=>{
    res.json({status:true})
  })
})

router.post('/save-image',upload.single('image'),(req,res)=>{
  file = req.file
 
  console.log(file)
  image = file.filename
  console.log(image)
  userHelpers.addImage(image,req.session.user._id).then(()=>{
    res.redirect('/profile')
  })
})

router.get('/',async(req,res)=>{
  totalEarning =await adminHelpers.totalEarning()
  totalOrders = await adminHelpers.totalOrders()
  users = await adminHelpers.totalCustomers()
  totalProducts = await adminHelpers.totalProducts()
  refunds = await adminHelpers.totalRefunds()
  topProducts =await adminHelpers.topSellingProducts()
  recentOrders = await adminHelpers.recentOrders()
  productStock = await adminHelpers.productStock()
  paymentMethods = await adminHelpers.paymentMethods()
  console.log("total",totalEarning)
  console.log("------------",products);
  res.render('admin/dashboard',{admin:true , totalEarning,totalOrders,users,refunds,topProducts,recentOrders,productStock,paymentMethods:JSON.stringify(paymentMethods),totalProducts})
})

router.get('/add-data',async(req,res)=>{
  
  orders = await adminHelpers.totalOrders()
  earning = await adminHelpers.totalEarning()
  refunds = await adminHelpers.totalRefunds()
  sales = await adminHelpers.getWeeklySales()
  console.log(sales)
  res.json({status:true,order:orders,earning:earning,refunds:refunds,sales:sales})
})

router.get('/1month-data',async(req,res)=>{
  orders = await adminHelpers.monthlyOrders()
  earning = await adminHelpers.monthlyEarning()
  refunds = await adminHelpers.monthlyRefunds()
  sales = await adminHelpers.getmonthlySale()
  res.json({status:true,order:orders,earning:earning,refunds:refunds,sales:sales})


})

router.get('/6month-data',async(req,res)=>{
  orders = await adminHelpers.sixmonthlyOrders()
  earning = await adminHelpers.sixmonthlyEarning()
  refunds = await adminHelpers.sixmonthlyRefunds()
  res.json({status:true,order:orders,earning:earning,refunds:refunds})

})

router.get('/yearly-data',async(req,res)=>{
  orders = await adminHelpers.yearlyOrders()
  earning = await adminHelpers.yearlyEarning()
  refunds = await adminHelpers.yearlyRefunds()
  sales = await adminHelpers.getYearlySale()
  res.json({status:true,order:orders,earning:earning,refunds:refunds,sales:sales})

})


router.get('/product-offer',async(req,res)=>{
  products = await adminHelpers.getProduct()
  res.render('admin/product-offer',{admin:true,products})
})

router.post('/add-product-offer',(req,res)=>{
  console.log(req.body)
  adminHelpers.addProductOffer(req.body).then(()=>{
    res.redirect('/admin/product-offer')
  })
})

router.get('/category-offer',async(req,res)=>{
  categories = await adminHelpers.getCategories()
  Subcategory = await adminHelpers.getSubcategories()
  res.render('admin/category-offer',{admin:true,categories,Subcategory})
})

router.post('/add-category-offer',(req,res)=>{
  console.log(req.body)
  adminHelpers.addCategoryOffer(req.body).then(()=>{
    res.redirect('/admin/category-offer')
  })
})

router.get('/get-product-offer',async(req,res)=>{
  offers =await adminHelpers.getProductOffer()
  res.render('admin/view-product-offer',{admin:true,offers})
})

router.get('/delete-product-offer',(req,res)=>{
  adminHelpers.deleteProductOffer(req.query._id,req.query.name).then(()=>{
    res.redirect('/admin/get-product-offer')
  })
})

router.get('/get-category-offer',async(req,res)=>{
  offers =await adminHelpers.getCategoryOffer()
  res.render('admin/view-category-offer',{admin:true,offers})
})

router.get('/delete-category-offer',(req,res)=>{
  adminHelpers.deleteCategoryOffer(req.query._id,req.query.cat,req.query.sub).then(()=>{
    res.redirect('/admin/get-category-offer')
  })
})

router.get('/coupon-offer',(req,res)=>{
  res.render('admin/coupon-offer',{admin:true})
})

router.post('/add-coupon-offer',(req,res)=>{
  adminHelpers.addCouponOffer(req.body).then((data)=>{
    if(data.Exists){
      res.render('admin/coupon-offer',{Exists:"Coupon already exists"})
    }
    else{
      res.redirect('/admin/coupon-offer')
    }
  })
})

router.get('/get-coupon-offer',async(req,res)=>{
  offers =await adminHelpers.getCouponOffer()
  res.render('admin/view-coupon-offer',{admin:true,offers})
})

router.get('/offers',(req,res)=>{
  res.render('admin/offers',{admin:true})
})

router.get('/delete-coupon-offer',(req,res)=>{
  adminHelpers.deleteCouponOffer(req.query._id,req.query.coupon).then(()=>{
    res.redirect('/admin/get-coupon-offer')
  })
})

router.get('/sales-report',async(req,res)=>{
  salesReport = null
  var date = new Date();

var claimedDate = new Date(date.setDate(date.getDate()-1)) ;
var todaysDate = new Date()


// converting toString and splitting up


  console.log(claimedDate)
  if(req.query.fromDate&&req.query.tillDate){
    salesReport =await adminHelpers.getSalesReport(req.query.fromDate,req.query.tillDate,date)
  }
  res.render('admin/sales-report',{admin:true,salesReport})
}) 

router.get('/stock-report',async(req,res)=>{
  Products = await adminHelpers.productStock()
  res.render('admin/stock-report',{admin:true,Products})
})
 





module.exports = router;
