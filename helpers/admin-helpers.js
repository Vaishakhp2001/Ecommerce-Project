const async = require('hbs/lib/async')
const ObjectId = require('mongodb').ObjectId
var db = require('../config/connection')
module.exports = {
    doLogin: (data) => {
        response = {}
        response.status = false
        return new Promise(async (resolve, reject) => {
            admin = await db.get().collection('admin').findOne({ email: data.email })
            if (admin) {

                if (admin.password === data.password) {
                    response.admin = admin.email
                    response.status = true
                    resolve(response)
                }
                else {
                    resolve(response.status)
                }
            }
            else {
                resolve(response.status)
            }

        })
    },
    addProduct: (product, image) => {
        product.price = parseInt(product.price)
        product.count = parseInt(product.count)
        console.log("product:", product)
        return new Promise((resolve, reject) => {
            product.image = image
            db.get().collection('product').insertOne(product).then((data) => {
                resolve(data)
            })
        })
    },
    getProduct: () => {
        return new Promise(async (resolve, reject) => {
            let Products = await db.get().collection('product').find({ status: "active" }).toArray()
            resolve(Products)
        })
    },
    getProductDetails: (Id) => {
        return new Promise(async (resolve, reject) => {
            let Products = await db.get().collection('product').findOne({ _id: ObjectId(Id) })

            resolve(Products)
        })
    },
    editProduct: (data, Id) => {
        console.log("data:", data.category1)
        return new Promise(async (resolve, reject) => {
            await db.get().collection('product').updateOne({ _id: ObjectId(Id) },
                {
                    $set:
                    {
                        name: data.name,
                        price: parseInt(data.price),
                        category1: data.category1,
                        category2: data.category2,
                        description: data.description,
                        count: parseInt(data.count),
                        category_id: data.category_id,
                        Subcategory_id: data.Subcategory_id,
                        image: data.image

                    }
                })
                .then((response) => {
                    resolve(response)
                })
        })
    },
    deleteProduct: (Id) => {
        let date = new Date()
        return new Promise((resolve, reject) => {
            db.get().collection('product').updateOne({ _id: ObjectId(Id) }, { $set: { status: "deleted", deleted_date: date } }).then((response) => {
                resolve(response)
            })
        })
    },
    viewUsers: () => {
        return new Promise(async (resolve, reject) => {
            user = await db.get().collection('users').find().toArray()
            resolve(user)
        })
    },
    blockUser: (Id) => {
        return new Promise((resolve, reject) => {
            db.get().collection('users').updateOne({ _id: ObjectId(Id) }, { $set: { status: false } }).then((response) => {
                resolve(response)
            })
        })
    },
    unblockUser: (Id) => {
        return new Promise((resolve, reject) => {
            db.get().collection('users').updateOne({ _id: ObjectId(Id) }, { $set: { status: true } }).then((response) => {
                resolve(response)
            })
        })
    },
    addCategory: (data) => {
        return new Promise(async (resolve, reject) => {
            category = await db.get().collection('categories').findOne({ category: data })

            console.log("find category:", category);
            if (category == null) {
                db.get().collection('categories').insert({ category: data }).then(() => {
                    resolve()
                })
            }
            else {
                resolve(category)
            }
        })
    },
    getCategory: () => {
        return new Promise(async (resolve, reject) => {
            const categories = await db.get().collection('categories').find().toArray()
            resolve(categories)
        })
    },
    addSubcategory: (data, category) => {
        data.category = category;
        console.log("data:", data);

        return new Promise((resolve, reject) => {
            db.get().collection('subcategories').insertOne(data).then((response) => {
                resolve(response)
            })
        })
    },
    getSubcategory: () => {
        return new Promise(async (resolve, reject) => {
            const Subcategories = await db.get().collection('subcategories').distinct('Subcategory')
            resolve(Subcategories)
        })
    },
    getSubcategory1: () => {
        return new Promise(async (resolve, reject) => {
            const Subcategories = await db.get().collection('subcategories').find().toArray()
            resolve(Subcategories)
        })
    },
    getProductCategory: (data) => {
        return new Promise(async (resolve, reject) => {
            const category = await db.get().collection('categories').findOne({ category: data })
            console.log(category)
            resolve(category)

        })
    },
    getProductSubcategory: (data) => {
        return new Promise(async (resolve, reject) => {
            const subcategory = await db.get().collection('subcategories').findOne({ Subcategory: data })
            resolve(subcategory)
        })
    },
    getCategory1: (Id) => {
        return new Promise(async (resolve, reject) => {
            const category = await db.get().collection('categories').findOne({ _id: ObjectId(Id) })
            resolve(category)
        })
    },
    subcategoryExist: (data) => {
        category = data.category
        Subcategory = data.Subcategory
        return new Promise(async (resolve, reject) => {
            const sub = await db.get().collection('subcategories').findOne({ category, Subcategory })
            resolve(sub)
        })
    },
    deleteCategory: (Id) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection('categories').deleteOne({ _id: ObjectId(Id) }).then(() => {
                resolve()
            })
        })
    },
    deleteSubcategory: (Id) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection('subcategories').deleteOne({ _id: ObjectId(Id) }).then(() => {
                resolve()
            })
        })
    },
    addBanner: (data, image) => {
        console.log(image)
        data.image = image
        return new Promise(async (resolve, reject) => {
            await db.get().collection('banner').insertOne(data).then(() => {
                resolve()
            })
        })
    },
    banners: () => {
        return new Promise(async (resolve, reject) => {
            banners = await db.get().collection('banner').find().toArray()
            resolve(banners)
        })
    },
    editBanner: (Id) => {
        return new Promise(async (resolve, reject) => {
            banner = await db.get().collection('banner').findOne({ _id: ObjectId(Id) })
            console.log("banner:", banner)
            resolve(banner)
        })
    },
    editBanners: (body, Id) => {

        return new Promise(async (resolve, reject) => {
            await db.get().collection('banner').updateOne({ _id: ObjectId(Id) },
                {
                    $set: {
                        description: body.description,
                        image: [body.image]
                    }
                }).then((response) => {
                    resolve(response)
                })
        })
    },
    deleteBanner: (Id) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection('banner').deleteOne({ _id: ObjectId(Id) }).then((response) => {
                resolve(response)
                console.log(response)
            })
        })
    },
    viewOrders: () => {
        return new Promise(async (resolve, reject) => {
            orders = await db.get().collection('order').find().toArray()

            resolve(orders)
        })
    },
    deletecategoryProducts: (Id) => {
        let date = new Date()
        return new Promise(async (resolve, reject) => {
            await db.get().collection('product').updateMany({ category_id: ObjectId(Id) }, { $set: { status: "deleted", deleted_date: date } }).then(() => {
                resolve()
            })
        })
    },
    deleteSubcategoryProducts: (Id, name) => {
        let date = new Date()
        return new Promise(async (resolve, reject) => {
            await db.get().collection('product').updateMany({ category1: name, Subcategory_id: ObjectId(Id) }, { $set: { status: "deleted", deleted_date: date } }).then(() => {
                resolve()
            })
        })
    },
    cancelOrder: (Id) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection('order').updateOne({ _id: ObjectId(Id) },
                {
                    $set: {
                        Status: "cancelled"
                    }
                }).then((response) => {
                    resolve(response)
                })
        })
    },
    totalEarning: () => {
        return new Promise(async (resolve, reject) => {
            total = await db.get().collection('order').aggregate([
                {
                    $match: {
                        Status: { $ne: "cancelled" }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalEarning: { $sum: '$Total' }
                    }

                }
            ]).toArray()
            console.log(total)
            resolve(total[0].totalEarning)
        })
    },
    totalOrders: () => {
        return new Promise(async (resolve, reject) => {
            count = await db.get().collection('order').count()
            console.log("ordercount", count)
            resolve(count)
        })
    },
    totalCustomers: () => {
        return new Promise(async (resolve, reject) => {
            customers = await db.get().collection('users').count()
            resolve(customers)
        })
    },
    totalRefunds: () => {
        return new Promise(async (resolve, reject) => {
            refunds = await db.get().collection('order').find({ Total: { $exists: true }, Status: "cancelled" }).count()
            console.log("refunds", refunds)
            resolve(refunds)
        })
    },
    monthlyOrders: () => {
        return new Promise(async (resolve, reject) => {
            orders = await db.get().collection('order').find({
                Date: {
                    $lt: new Date(),
                    $gte: new Date(new Date().setMonth(new Date().getMonth() - 1))
                }
            }).count()
            console.log("month orders", orders)
            resolve(orders)
        })
    },
    monthlyEarning: () => {
        return new Promise(async (resolve, reject) => {
            earning = await db.get().collection('order').aggregate([
                {
                    $match: {
                        Status: { $ne: "cancelled" },
                        Date: {
                            $lt: new Date(), $gte: new Date(new Date().setMonth(new Date().getMonth() - 1))
                        }
                    }
                },
                {
                    $group: {
                        _id: null,

                        totalEarning: { $sum: '$Total' }
                    }
                }
            ]).toArray()
            console.log("earning", earning)
            resolve(earning[0].totalEarning)
        })
    },
    monthlyRefunds: () => {
        return new Promise(async (resolve, reject) => {
            refunds = await db.get().collection("order").find({ Date: { $lt: new Date(), $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)) }, Status: 'cancelled', Total: { $exists: true } }).count()
            console.log(refunds)
            resolve(refunds)
        })
    },
    sixmonthlyOrders: () => {
        return new Promise(async (resolve, reject) => {
            orders = await db.get().collection('order').find({
                Date: {
                    $lt: new Date(),
                    $gte: new Date(new Date().setMonth(new Date().getMonth() - 6))
                }
            }).count()
            console.log("month orders", orders)
            resolve(orders)
        })
    },
    sixmonthlyEarning: () => {
        return new Promise(async (resolve, reject) => {
            earning = await db.get().collection('order').aggregate([
                {
                    $match: {
                        Status: { $ne: "cancelled" },
                        Date: {
                            $lt: new Date(), $gte: new Date(new Date().setMonth(new Date().getMonth() - 6))
                        }
                    }
                },
                {
                    $group: {
                        _id: null,

                        totalEarning: { $sum: '$Total' }
                    }
                }
            ]).toArray()
            console.log("earning", earning)
            resolve(earning[0].totalEarning)

        })
    },
    sixmonthlyRefunds: () => {
        return new Promise(async (resolve, reject) => {
            refunds = await db.get().collection("order").find({ Date: { $lt: new Date(), $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) }, Status: 'cancelled', Total: { $exists: true } }).count()
            console.log(refunds)
            resolve(refunds)

        })
    },
    yearlyOrders: () => {
        return new Promise(async (resolve, reject) => {
            orders = await db.get().collection('order').find({
                Date: {
                    $lt: new Date(),
                    $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1))
                }
            }).count()
            console.log("yearly orders", orders)
            resolve(orders)

        })
    },
    yearlyRefunds: () => {
        return new Promise(async (resolve, reject) => {

            refunds = await db.get().collection("order").find({ Date: { $lt: new Date(), $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) }, Status: 'cancelled', Total: { $exists: true } }).count()
            console.log(refunds)
            resolve(refunds)

        })

    },
    yearlyEarning: () => {
        return new Promise(async (resolve, reject) => {
            earning = await db.get().collection('order').aggregate([
                {
                    $match: {
                        Status: { $ne: "cancelled" },
                        Date: {
                            $lt: new Date(), $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1))
                        }
                    }
                },
                {
                    $group: {
                        _id: null,

                        totalEarning: { $sum: '$Total' }
                    }
                }
            ]).toArray()
            console.log("earning", earning)
            resolve(earning[0].totalEarning)

        })
    },
    topSellingProducts: () => {
        return new Promise(async (resolve, reject) => {
            products = await db.get().collection('order').aggregate([
                {
                    $unwind: "$Products"
                },
                {
                    $group: {
                        _id: "$Products.item",
                        quantity: { $sum: "$Products.quantity" },

                    }
                },
                {
                    $sort: {
                        quantity: -1
                    }
                },
                {
                    $limit: 5
                },
                {
                    $lookup: {
                        from: 'product',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $unwind: "$product"
                }
            ]).toArray()
            console.log("products-------------", products)
            resolve(products)
        })
    },
    recentOrders: () => {
        return new Promise(async (resolve, reject) => {
            orders = await db.get().collection("order").aggregate([
                {
                    $sort: {
                        Date: -1
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'UserId',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                {
                    $unwind: "$user"
                },
                {
                    $limit: 7
                }
            ]).toArray()
            console.log(orders)
            await orders.map((order) => {
                if (order.deliveryDetails.Payment == "cod") {
                    order.paymentColor = "success"
                }
                else if (order.deliveryDetails.Payment == "paypal") {
                    order.paymentColor = "primary"
                }
                else {

                    order.paymentColor = "info"

                }
                if (order.Status == "placed") {
                    order.StatusColor = "success"
                }
                else if (order.Status == "pending") {
                    order.StatusColor = "primary"
                }
            })
            resolve(orders)

        })
    },
    addProductOffer: (data) => {
        return new Promise(async (resolve, reject) => {
            data.discount = parseInt(data.discount)
            data.start_date = new Date(data.start_date)
            data.end_date = new Date(data.end_date)


            offerExist = await db.get().collection('product_offer').findOne({ 'offers.product': data.product })
            if (offerExist) {
                db.get().collection('product_offer').updateOne({ 'offers.product': data.product },
                    {
                        $set: {
                            'offers.discount': data.discount,
                            'offers.start_date': data.start_date,
                            'offers.end_date': data.end_date
                        }
                    })
            }
            else {

                db.get().collection('product_offer').insertOne({ offers: data })

            }
            let product = await db.get().collection('product').findOne({ name: data.product })
            let productPrice = parseInt(product.price)
            let discountPrice = parseInt(data.discount)
            let offerPrice = parseInt(productPrice - (productPrice * discountPrice) / 100)
            db.get().collection('product').updateOne({ name: data.product },
                {
                    $set: { offerPrice: offerPrice }
                }).then(() => {
                    resolve()
                })
        })
    },
    getSubcategories: () => {
        return new Promise(async (resolve, reject) => {
            category = await db.get().collection('subcategories').distinct('Subcategory')
            console.log(category)
            resolve(category)
        })
    },
    getCategories: () => {
        return new Promise(async (resolve, reject) => {
            category = await db.get().collection('categories').find().toArray()
            resolve(category)
        })
    },
    addCategoryOffer: (data) => {
        return new Promise(async (resolve, reject) => {
            data.discount = parseInt(data.discount)
            data.start_date = new Date(data.start_date)
            data.end_date = new Date(data.end_date)


            offerExist = await db.get().collection('category_offer').findOne({ 'offers.category': data.category, 'offers.subcategory': data.subcategory })
            if (offerExist) {
                db.get().collection('category_offer').updateOne({ 'offers.category': data.category, 'offers.subcategory': data.subcategory },
                    {
                        $set: {
                            'offers.discount': data.discount,
                            'offers.start_date': data.start_date,
                            'offers.end_date': data.end_date
                        }
                    })
            }
            else {

                db.get().collection('category_offer').insertOne({ offers: data })

            }

            products = await db.get().collection('product').find({ category1: data.category, category2: data.subcategory }).toArray()

            if (products.length != 0) {
                await products.map(async (product, index) => {

                    let productPrice = parseInt(product.price)
                    console.log(productPrice, index)
                    let discountPrice = parseInt(data.discount)
                    let offerPrice = parseInt(productPrice - ((productPrice * discountPrice) / 100))
                    console.log(offerPrice, index)
                    await db.get().collection('product').updateOne({ category1: data.category, category2: data.subcategory, _id: product._id },
                        {
                            $set: { categoryOffer: offerPrice }
                        })

                })
            }
            resolve()
        })

    },
    getProductOffer: () => {
        return new Promise(async (resolve, reject) => {
            products = await db.get().collection('product_offer').find().toArray()
            console.log(products)
            resolve(products)
        })
    },
    deleteProductOffer: (Id, name) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection('product_offer').deleteOne({ _id: ObjectId(Id) })
            db.get().collection('product').updateOne({ name: name },
                {
                    $unset: {
                        offerPrice: 1
                    }
                })
            resolve()
        })
    },
    getCategoryOffer: () => {
        return new Promise(async (resolve, reject) => {
            products = await db.get().collection('category_offer').find().toArray()
            resolve(products)
        })
    },
    deleteCategoryOffer: (Id, cat, sub) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection('category_offer').deleteOne({ _id: ObjectId(Id) })
            db.get().collection('product').updateOne({ category1: cat, category2: sub },
                {
                    $unset: {
                        categoryOffer: 1
                    }
                })
            resolve()
        })
    },
    addCouponOffer: (data) => {
        return new Promise(async (resolve, reject) => {
            let Exists = false
            data.discount = parseInt(data.discount)
            data.start_date = new Date(data.start_date)
            data.end_date = new Date(data.end_date)
            offerExists = await db.get().collection('coupon_offer').findOne({ 'offers.coupon': data.coupon })
            if (offerExists) {
                console.log("offer exists")
                resolve({ Exists: true })
            }
            else {
                db.get().collection('coupon_offer').insertOne({ offers: data }).then(() => {
                    console.log("not exists")
                    resolve({ Exists: false })
                })
            }
        })
    },
    getCouponOffer: () => {
        return new Promise(async (resolve, reject) => {
            offers = await db.get().collection('coupon_offer').find().toArray()
            resolve(offers)
        })
    },
    deleteCouponOffer: (Id, coupon) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection('coupon_offer').deleteOne({ _id: ObjectId(Id) }).then(() => {
                resolve()
            })
        })
    },
    getSalesReport: (startdate, enddate) => {

        return new Promise(async (resolve, reject) => {
            sales = await db.get().collection('order').aggregate([
                {
                    $unwind: "$Products"
                },
                {
                    $project: {
                        item: '$Products.item', quantity: '$Products.quantity', Total: 1, Status: 1, Date: 1
                    }
                },
                {
                    $match: {
                        Status: { $ne: "cancelled" },
                        Date: {
                            $lte: new Date(enddate),
                            $gte: new Date(startdate)
                        }
                    }
                },
                {
                    $lookup: {
                        from: 'product',
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $unwind: "$product"
                },
                {
                    $project: {
                        Total: 1, quantity: 1, name: "$product.name", price: "$product.price", count: "$product.count", status: "$product.status"
                    }
                },
                {
                    $group: {
                        _id: "$name", quantity: { $sum: "$quantity" }, totalSale: { $sum: "$price" }, price: { $first: "$price" }
                    }
                }


            ]).toArray()
            console.log(sales)
            resolve(sales)



        })
    },
    productStock: () => {
        return new Promise(async (resolve, reject) => {
            let stockStatus = null
            Products = await db.get().collection('order').aggregate([
                {
                    $unwind: "$Products"
                },
                {
                    $project: {
                        _id: "$Products.item", quantity: "$Products.quantity"
                    }
                },
                {
                    $group: {
                        _id: "$_id",
                        quantity: { $sum: 1 }
                    }
                },
                {
                    $lookup: {
                        from: "product",
                        localField: "_id",
                        foreignField: '_id',
                        as: "Product"
                    }
                },
                {
                    $unwind: "$Product"
                },
                {
                    $project: {
                        quantity: 1, count: "$Product.count", image: "$Product.image", name: "$Product.name"
                    }
                },
                {
                    $sort: {
                        quantity: -1
                    }
                }
            ]).toArray()
            console.log("sold quantity:", Products)
            await Products.map((product) => {
                if (product.count <= 0) {

                    stockStatus = "No stock"
                    background = "danger"
                }
                else if (product.count < 3 && product.count > 0) {
                    stockStatus = "Out of Stock"
                    background = "danger"
                }
                else {
                    stockStatus = "Stocked"
                    background = "success"
                }
                product.stockStatus = stockStatus
                product.statusColor = background


            })
            console.log("stock:", Products)
            resolve(Products)



        })
    },
    paymentMethods: () => {
        return new Promise(async (resolve, reject) => {
            payment = await db.get().collection('order').aggregate([
                {
                    $group: {
                        _id: "$deliveryDetails.Payment",
                        data: { $push: "$$ROOT" },
                        count: { $count: {} }
                    }
                }
            ]).toArray()
            let array = []
            for (i = 0; i < payment.length; i++) {
                array[i] = payment[i].count
            }
            console.log("paymet methods : ", array)
            resolve(array)

        })
    },
    totalProducts: () => {
        return new Promise(async (resolve, reject) => {
            products = await db.get().collection('product').find({ status: "active" }).count()
            console.log("totalproducts:", products)
            resolve(products)
        })
    },
    getWeeklySales: () => {
        return new Promise(async (resolve, reject) => {
            array = []
            for (i = 0; i < 7; i++) {


                start_date = new Date(new Date().setDate(new Date().getDate() - i))
                console.log(start_date)
                end_date = new Date(new Date().setDate(new Date().getDate() - (i + 1)))
                console.log(end_date)

                day = await db.get().collection('order').find({ Date: { $lte: start_date, $gte: end_date } }).count()
                array[i] = day


            }

            console.log(array)
            resolve(array)
        })
    },
    getmonthlySale:()=>{
        return new Promise(async(resolve,reject)=>{
            array = []
            for(i=0;i<12;i++){
                start_date = new Date(new Date().setMonth(new Date().getMonth()-i))
                console.log(start_date)
                end_date = new Date(new Date().setMonth(new Date().getMonth() - (i + 1)))
                console.log(end_date)
                day = await db.get().collection('order').find({ Date: { $lte: start_date, $gte: end_date } }).count()
                array[i] = day
            }
            console.log(array)
            resolve(array)
        })
    },
    getYearlySale:()=>{
        return new Promise(async(resolve,reject)=>{
            array = []
            for(i=0;i<12;i++){
                start_date = new Date(new Date().setFullYear(new Date().getFullYear()-i))
                console.log(start_date)
                end_date = new Date(new Date().setFullYear(new Date().getFullYear() - (i + 1)))
                console.log(end_date)
                day = await db.get().collection('order').find({ Date: { $lte: start_date, $gte: end_date } }).count()
                array[i] = day
            }
            console.log(array)
            resolve(array)
        })
    }



}                                                                                                                                                                   