var db = require("../config/connection")
const bcrypt = require('bcrypt')
const { response, query } = require("express")
const { ObjectId } = require("mongodb")
const async = require("hbs/lib/async")
const Razorpay = require('razorpay')
const { resolve } = require("path")
const { count } = require("console")

var instance = new Razorpay({
    key_id: 'rzp_test_TZBT8fsLswSnDr',
    key_secret: '6cAV0Ls27w9BS1Hxrt6ssGYJ',
});

module.exports = {
    doSignup: (data) => {
        return new Promise(async (resolve, reject) => {
            data.Wallet = parseInt(data.Wallet)
            console.log(data.Wallet)
            data.password = await bcrypt.hash(data.password, 10)
            data.status = true
            data.confirm_password = data.password
            user = await db.get().collection('users').findOne({ email: data.email })
            console.log(user);
            if (user) {
                reject("User already exist")
            }
            else {
                db.get().collection('users').insertOne(data).then((response) => {

                    resolve(response)
                })

            }
        })


    },
    doLogin: (data) => {

        return new Promise(async (resolve) => {
            const response = {}

            let user = await db.get().collection('users').findOne({ email: data.email })
            if (user) {
                bcrypt.compare(data.password, user.password).then((status) => {

                    response.block = false
                    if (status) {
                        if (user.status) {
                            response.user = user
                            response.status = true
                            resolve(response)
                        }
                        else {
                            response.block = true
                            resolve(response)
                        }
                    }
                    else {
                        response.status = false
                        resolve(response)
                    }
                })
            }
            else {

                resolve({ status: false })
            }
        })
    },
    getProducts: () => {

        return new Promise((resolve, reject) => {
            const products = db.get().collection('product').find({ status: "active" }).toArray()
            resolve(products)

        })
    },
    resetPassword: (data, phonenumber) => {
        return new Promise(async (resolve, reject) => {
            data.password = await bcrypt.hash(data.password, 10)
            db.get().collection('users').updateOne({ phone: phonenumber }, { $set: { password: data.password } }).then((response) => {
                resolve(response)
            })
        })
    },
    productDetails: (Id) => {
        return new Promise(async (resolve, reject) => {
            product = await db.get().collection('product').findOne({ _id: ObjectId(Id) })
            resolve(product)
        })
    },
    getwomensProducts: () => {
        return new Promise(async (resolve, reject) => {
            products = await db.get().collection('product').find({ category1: "Women" }).toArray()
            resolve(products)
        })
    },
    getmensProducts: () => {
        return new Promise(async (resolve, reject) => {
            products = await db.get().collection('product').find({ category1: "Men" }).toArray()
            resolve(products)
        })
    },
    getTopWear: () => {
        return new Promise(async (resolve, reject) => {
            products = await db.get().collection('product').find({ category2: "Top wear" }).toArray()
            resolve(products)
        })
    },
    getBottomWear: () => {
        return new Promise(async (resolve, reject) => {
            products = await db.get().collection('product').find({ category2: "Bottom wear" }).toArray()
            resolve(products)
        })
    },
    getCategories: () => {
        return new Promise(async (resolve, reject) => {
            categories = await db.get().collection('categories').find().toArray()
            resolve(categories)
        })
    },
    getSubcategories: () => {
        return new Promise(async (resolve, reject) => {
            Subcategories = await db.get().collection('subcategories').find().toArray()
            resolve(Subcategories)
        })
    },
    getCategoryProducts: (category) => {
        return new Promise(async (resolve, reject) => {
            products = await db.get().collection('product').find({ category1: category }).toArray()
            resolve(products)
        })
    },
    searchProduct: (data) => {
        return new Promise(async (resolve, reject) => {

            products = await db.get().collection('product').find({ name: { $regex: data, $options: "i" } }).toArray()
            resolve(products)
        })
    },
    addToCart: (userId, productId) => {


        proObj = {
            item: ObjectId(productId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            usercart = await db.get().collection('cart').findOne({ user: ObjectId(userId) })
            if (usercart) {

                let proExist = usercart.products.findIndex(product => product.item == productId)



                if (proExist != -1) {
                    db.get().collection('cart')
                        .updateOne({ 'products.item': ObjectId(productId) },
                            {
                                $inc: {
                                    'products.$.quantity': 1
                                }
                            }).then(() => {
                                resolve()
                            })

                } else {
                    db.get().collection('cart')
                        .updateOne({ user: ObjectId(userId) },
                            {
                                $push: { products: proObj }
                            }).then(() => {
                                resolve()
                            })
                }
            }

            else {
                db.get().collection('cart').insertOne({
                    user: ObjectId(userId),
                    products: [proObj]
                }).then((data) => {
                    resolve()
                })
            }
        })
    },
    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {

            products = await db.get().collection('cart').aggregate([
                {
                    $match: { user: ObjectId(userId) }
                },
                {
                    $unwind: '$products'

                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'

                    }
                },
                {
                    $lookup: {
                        from: 'product',
                        localField: 'item',
                        foreignField: '_id',
                        as: 'products'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$products', 0] }
                    }
                },
                {
                    $project: {

                        'item': 1, 'quantity': 1, 'product._id': 1, 'product.name': 1, 'product.category2': 1, 'product.price': 1,
                        'product.image': 1, 'product.offerPrice': 1, 'product.categoryOffer': 1

                    }
                }
            ]).toArray()
            console.log("tyyyryyryryryryryryr", products)

            await products.map((product) => {
                if (product.product.offerPrice) {
                    total = product.quantity * product.product.offerPrice

                }
                else if (product.product.categoryOffer) {
                    total = product.quantity * product.product.categoryOffer
                }
                else {
                    total = product.quantity * product.product.price
                }
                product.total = total
            })

            resolve(products)


            // products = await db.get().collection('cart').aggregate([
            //     {
            //         $match: { user: ObjectId(userId) }
            //     },
            //     {
            //         $unwind: '$products'

            //     },
            //     {
            //         $project: {
            //             item: '$products.item',
            //             quantity: '$products.quantity'

            //         }
            //     },
            //     {
            //         $lookup: {
            //             from: 'product',
            //             localField: 'item',
            //             foreignField: '_id',
            //             as: 'products'
            //         }
            //     },
            //     {
            //         $project: {
            //             item: 1, quantity: 1,product: { $arrayElemAt: ['$products', 0] }
            //         }
            //     },
            //     {
            //         $project: {

            //             'item': 1, 'quantity': 1, 'product._id': 1, 'product.name': 1, 'product.category2': 1, 'product.price': 1, 'product.image': 1, 'product.offerPrice':1 ,'product.categoryOffer':1,

            //              total: { $multiply: ['$quantity', { $toInt: '$product.price' }] }
            //         }
            //     }
            // ]).toArray()
            // console.log(products)
            // resolve(products)
        })


    },
    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            cartCount = 0
            cart = await db.get().collection('cart').findOne({ user: ObjectId(userId) })
            if (cart) {
                cartCount = await cart.products.length
            }
            resolve(cartCount)
        })
    },
    removeCartProduct: (proId, userId) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection('cart').updateOne({ user: ObjectId(userId) },
                {
                    $pull: { products: { item: ObjectId(proId) } }
                }).then((data) => {
                    console.log(data)
                    resolve(data)
                })


        })
    },
    changeProductQuantity: (cartId, proId, count) => {
        count = parseInt(count)
        return new Promise(async (resolve, reject) => {


            db.get().collection('cart').updateOne({ _id: ObjectId(cartId), 'products.item': ObjectId(proId) },
                {
                    $inc: { 'products.$.quantity': count }
                }).then((response) => {
                    resolve({ status: true })
                })

        })
    },
    changeProductTotal: (cartId, proId, count) => {
        return new Promise(async (resolve, reject) => {


        })
    },
    productTotal: (userId) => {
        return new Promise(async (resolve, reject) => {
            productTotal = await db.get().collection('cart').aggregate([
                {
                    $match: { user: ObjectId(userId) }
                },
                {
                    $unwind: "$products"
                },
                {
                    $project: {
                        'products.item': 1, 'products.quantity': 1
                    }
                },
                {
                    $lookup: {
                        from: 'product',
                        localField: 'products.item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        'products.quantity': 1, 'product': 1
                    }

                },
                {
                    $unwind: '$product'
                },
                {
                    $project: {
                        total: { $multiply: ["$products.quantity", { $toInt: "$product.price" }] }
                    }
                }

            ]).toArray()
            resolve(productTotal)
            console.log("ProductTotal:", productTotal)
        })
    },
    totalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {
            cart = await db.get().collection('cart').findOne({ user: ObjectId(userId) })
            console.log(cart)
            totalAmount = await db.get().collection('cart').aggregate([
                {
                    $match: { user: ObjectId(userId) }
                },
                {
                    $unwind: '$products'

                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'

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
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }
            ]).toArray()


            totalAmount.map((product) => {
                if (product.product.offerPrice) {
                    total = product.quantity * product.product.offerPrice

                }
                else if (product.product.categoryOffer) {
                    total = product.quantity * product.product.categoryOffer
                }
                else {
                    total = product.quantity * product.product.price
                }
                product.total = total

            })


            grandTotal = 0
            for (i = 0; i < totalAmount.length; i++) {
                grandTotal = totalAmount[i].total + grandTotal
            }
            console.log(grandTotal)
            if (cart) {

                resolve(grandTotal)
            }
            else {
                resolve()
            }




            // totalAmount = await db.get().collection('cart').aggregate([
            //     {
            //         $match: { user: ObjectId(userId) }
            //     },
            //     {
            //         $unwind: '$products'

            //     },
            //     {
            //         $project: {
            //             item: '$products.item',
            //             quantity: '$products.quantity'

            //         }
            //     },
            //     {
            //         $lookup: {
            //             from: 'product',
            //             localField: 'item',
            //             foreignField: '_id',
            //             as: 'product'
            //         }
            //     },
            //     {
            //         $project: {
            //             item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
            //         }
            //     },
            //     {
            //         $group: {
            //             _id: null,
            //             total: { $sum: { $multiply: ['$quantity', { $toInt: '$product.price' }] } }
            //         }
            //     }
            // ]).toArray()


            // if (cart) {
            //     resolve(totalAmount[0].total)
            // }
            // else {
            //     resolve()
            // }

        })
    },
    getProductsList: (userId) => {
        return new Promise(async (resolve, reject) => {
            cart = await db.get().collection('cart').findOne({ user: ObjectId(userId) })
            if (cart != null) {

                resolve(cart.products)
            }
            resolve()
        })
    },
    placeOrder: (data, products, total) => {

        // console.log("-------",ObjectId('products.$item')) 
        return new Promise(async (resolve, reject) => {
            let status = data.payment == 'cod' ? 'placed' : 'pending'
            let orderObj = {
                deliveryDetails: {
                    Firstname: data.firstname,
                    Lastname: data.lastname,
                    Address: data.address,
                    Email: data.email,
                    Phone: data.phone,
                    Pincode: data.pincode,
                    Payment: data.payment

                },
                UserId: ObjectId(data.userId),
                Products: products,
                Total: total,
                Status: status,
                Date: new Date()
            }
            db.get().collection('order').insertOne(orderObj).then((response) => {
                if (data.payment == 'cod') {
                    db.get().collection('cart').deleteOne({ user: ObjectId(data.userId) }).then(async () => {
                        await products.map((product) => {
                            quantity = parseInt(product.quantity)
                            db.get().collection('product').updateOne({ _id: ObjectId(product.item) }, { $inc: { count: (-quantity) } })
                        })


                    })
                    resolve(response.insertedId)
                }
                resolve(response.insertedId)

            })
        })
    },
    deleteOrderProduct: (Id, userId) => {
        return new Promise(async (resolve, reject) => {
            cart = await db.get().collection('order').aggregate([
                {
                    $match: {
                        _id: ObjectId(Id)
                    }
                },
                {
                    $unwind: "$Products"
                },
                {
                    $lookup: {
                        from: 'cart',
                        localField: 'Products.item',
                        foreignField: 'products.item',
                        as: 'cart'
                    }
                },
                {
                    $unwind: "$cart"
                },
                {
                    $match: {
                        "cart.user": ObjectId(userId)
                    }
                }
            ]).toArray()
            db.get().collection('cart').deleteOne({ user: ObjectId(userId) })
            resolve()
            console.log(cart)
        })
    },
    viewOrders: (userId) => {
        console.log(userId)
        return new Promise(async (resolve, reject) => {
            orders = await db.get().collection('order').find({ UserId: ObjectId(userId), Status: { $ne: "cancelled" } }).toArray()
            console.log(orders)
            resolve(orders)
        })
    },
    orderProducts: (Id) => {
        return new Promise(async (resolve, reject) => {
            products = await db.get().collection('order').aggregate([
                {
                    $match: { _id: ObjectId(Id) }
                },
                {
                    $project: {
                        'Products': 1
                    }
                },
                {
                    $unwind: '$Products'
                },
                {
                    $lookup: {
                        from: 'product',
                        localField: 'Products.item',
                        foreignField: '_id',
                        as: 'Product'
                    }
                },
                {
                    $project: {
                        'Product': 1, _id: 0
                    }
                },
                {
                    $unwind: '$Product'
                }
            ]).toArray()
            resolve(products)
        })
    },
    generateRazorpay: (orderId, total) => {
        return new Promise(async (resolve, reject) => {
            instance.orders.create({
                amount: total * 100,
                currency: "INR",
                receipt: "" + orderId,
                notes: {
                    key1: "value3",
                    key2: "value2"
                }
            }).then((data) => {
                console.log("razorpay :", data)
                resolve(data)
            }).catch((err) => {
                console.log(err)
            })
        })
    },
    verifyPayment: (data) => {
        return new Promise((resolve, reject) => {
            const crypto = require('crypto')
            try {
                let hmac = crypto.createHmac('sha256', '6cAV0Ls27w9BS1Hxrt6ssGYJ')
                hmac.update(data['payment[razorpay_order_id]'] + '|' + data['payment[razorpay_payment_id]'])
                hmac = hmac.digest('hex')
                if (hmac == data['payment[razorpay_signature]']) {
                    resolve()
                }
                else {
                    reject()
                }

            }
            catch (error) {
                console.log(error)
            }
        })
    },

    changePaymentStatus: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection('order').updateOne({ _id: ObjectId(orderId) },
                {
                    $set: {
                        Status: 'placed'
                    }
                }).then(() => {
                    resolve()
                })
        })
    },

    getcollectionsDress: (main, sub) => {
        return new Promise(async (resolve, reject) => {
            if (main == "Latest") {
                product = await db.get().collection('product').find({ status: "active" }).sort({ Date: 1 }).limit(6).toArray()
                resolve(product)
            }
            if (sub) {

                products = await db.get().collection('product').find({ status: "active", category1: main, category2: sub }).toArray()
                resolve(products)

            }
            if (main == null) {
                products = await db.get().collection('product').find({ status: "active", category2: sub }).toArray()
                resolve(products)
            }

            await db.get().collection('product').find({ status: "active", category1: main }).toArray().then(async (data) => {
                resolve(data)


                resolve(data)
                await db.get().collection('subcategories').find({ category: main }).toArray().then((response) => {
                    resolve(response)
                })
            })

        })
    },
    getproductCategory: (main, sub) => {
        return new Promise(async (resolve, reject) => {
            if (main == "Latest" || main == null) {
                category = await db.get().collection('subcategories').distinct('Subcategory')

                console.log("category:", category)
                resolve(category)

            }

            await db.get().collection('subcategories').find({ category: main }).toArray().then((response) => {
                resolve(response)
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
    getUserdetails: (Id) => {
        return new Promise(async (resolve, reject) => {
            user = await db.get().collection('users').findOne({ _id: Object(Id) })
            resolve(user)
        })
    },
    verifyPhone: (phone) => {
        return new Promise(async (resolve, reject) => {
            const response = {}

            user = await db.get().collection('users').findOne({ phone: phone })
            if (user) {
                if (user.status) {
                    response.user = user
                    response.status = true
                    resolve(response)
                }
                else {
                    response.user = false
                    response.status = false
                    resolve(response)
                }
            }
            else {
                response.status = false
                resolve(response)
            }

        })
    },
    changeAddress: (data) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection('users').updateOne({ _id: ObjectId(data.userId) },
                {
                    $set: {

                        firstname: data.firstname,
                        lastname: data.lastname,
                        address: data.address,
                        email: data.email,
                        phone: data.phone,
                        pincode: data.pincode,
                        address_type: data.address_type

                    }
                }).then(() => {
                    resolve()
                })
        })
    },
    addAddress: (data, Id) => {
        console.log(data)
        return new Promise(async (resolve, reject) => {
            db.get().collection('users').updateOne({ _id: ObjectId(Id) },
                {
                    $push: {
                        Address: data
                    }
                }).then((response) => {
                    console.log(response)
                    resolve()
                })
        })
    },
    getUserAddress: (Id) => {

        return new Promise(async (resolve, reject) => {
            useraddress = await db.get().collection('users').findOne({ _id: ObjectId(Id) })

            resolve(useraddress)
        })
    },
    addressCount: (Id) => {
        console.log("id:", Id)
        return new Promise(async (resolve, reject) => {
            user = await db.get().collection('users').findOne({ _id: ObjectId(Id) })
            console.log("user:", user)
            if (user.Address) {
                let count = user.Address.length
                resolve(count)
            }
            else {
                resolve()
            }
        })
    },
    getUserAddress1: (Id, count) => {
        return new Promise(async (resolve, reject) => {
            user = await db.get().collection('users').findOne({ _id: ObjectId(Id) })

            resolve(user.Address)
        })
    },
    getUserAddress2: (Id, address) => {
        return new Promise(async (resolve, reject) => {
            user = await db.get().collection('users').findOne({ _id: ObjectId(Id) })

            resolve(user.Address)
        })
    },
    changeAddress1: (data, Id) => {

        index = parseInt(data.count)

        return new Promise(async (resolve, reject) => {
            db.get().collection('users').updateOne({ _id: ObjectId(Id) },
                {
                    $set: {
                        'Address.$[elem].firstname': data.firstname,
                        'Address.$[elem].lastname': data.lastname,
                        'Address.$[elem].address': data.address,
                        'Address.$[elem].email': data.email,
                        'Address.$[elem].phone': data.phone,
                        'Address.$[elem].pincode': data.pincode,
                        'Address.$[elem].address_type': data.address_type
                    }
                },
                {
                    arrayFilters: [{ 'elem.pincode': { $eq: data.pincode } }]
                }).then(() => {
                    resolve()
                })

        }).then(() => {
            resolve()
        })
    },
    addAddress1: (data) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection('users').updateOne({ _id: ObjectId(data.userId) },
                {
                    $push: { 'Address': data }

                }).then(() => {

                    resolve()
                })

        })
    },
    getArrayAddress: (number, Id) => {
        return new Promise(async (resolve, reject) => {
            user = await db.get().collection('users').findOne({ _id: ObjectId(Id) })
            resolve(user.Address[number])
        })
    },
    deleteAddress: (Id, address) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection('users').updateOne({ _id: ObjectId(Id) },
                {
                    $pull: { Address: { address: address } }
                })
                .then(() => {

                    resolve()
                })
        })
    },
    addAddressIndex: (Id) => {
        return new Promise(async (resolve, reject) => {
            user = await db.get().collection('users').findOne({ _id: ObjectId(Id) })

            resolve(user.Address)
        })
    },
    addImage: (image, Id) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection('users').updateOne({ _id: ObjectId(Id) },
                {
                    $set: {
                        image: image
                    }
                }).then(() => {
                    resolve()
                })
        })
    },
    editProfile: (data, Id) => {
        return new Promise(async (resolve, reject) => {
            if (data.password) {
                data.password = await bcrypt.hash(data.password, 10)
                data.confirm_password = data.password
            }

            db.get().collection('users').updateOne({ _id: ObjectId(Id) },
                {
                    $set: {
                        firstname: data.firstname,
                        lastname: data.lastname,
                        phone: data.phone,
                        email: data.email,
                        password: data.password,
                        confirm_password: data.confirm_password
                    }

                }).then(() => {
                    resolve()
                })
        })
    },
    addToWishlist: (userId, proId) => {
        return new Promise(async (resolve, reject) => {
            userWishlist = await db.get().collection('wishlist').findOne({ user: ObjectId(userId) })
            if (userWishlist) {
                index = userWishlist.products.findIndex(product => product == proId)
                if (index == -1) {

                    db.get().collection('wishlist').updateOne({ user: ObjectId(userId) },
                        {
                            $push: { products: ObjectId(proId) }
                        })
                }

            }
            else {
                db.get().collection('wishlist').insertOne({ user: ObjectId(userId), products: [ObjectId(proId)] })
            }
            resolve()
        })
    },
    getwishlistProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            wishlist = await db.get().collection('wishlist').aggregate([
                {
                    $match: {
                        user: ObjectId(userId)
                    }
                },
                {
                    $unwind: '$products'
                },
                {
                    $lookup: {
                        from: 'product',
                        localField: 'products',
                        foreignField: '_id',
                        as: 'product'

                    }
                },
                {
                    $unwind: '$product'
                }

            ]).toArray()
            console.log(wishlist)
            resolve(wishlist)
        })
    },

    deleteWishlistProduct: (Id, proId) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection('wishlist').updateOne({ user: ObjectId(Id) },
                {
                    $pull: { products: ObjectId(proId) }
                }).then(() => {
                    resolve()
                })
        })
    },
    thisOrder: () => {
        return new Promise(async (resolve, reject) => {
            order = await db.get().collection('order').find().sort({ _id: -1 }).limit(1).toArray()
            console.log(order)
            resolve(order[0])
        })
    },
    getPriceProducts: (sub, main, min, max) => {
        return new Promise(async (resolve, reject) => {

            minimum = parseInt(min)
            maximum = parseInt(max)
            if (sub == null && main == null) {

                products = await db.get().collection('product').aggregate([
                    {
                        $match: {
                            price: { $lte: maximum, $gte: minimum }


                        }
                    }

                ]).toArray()
                resolve(products)
            }
            else if (sub && main == null) {
                products = await db.get().collection('product').aggregate([
                    {
                        $match: {
                            price: { $lte: maximum, $gte: minimum },
                            category2: sub
                        }
                    }

                ]).toArray()
                resolve(products)

            }
            else if (main && sub == null) {
                products = await db.get().collection('product').aggregate([
                    {
                        $match: {
                            price: { $lte: maximum, $gte: minimum },
                            category1: main

                        }
                    }
                ]).toArray()
                resolve(products)
            }
            else if (main && sub) {
                products = await db.get().collection('product').aggregate([
                    {
                        $match: {
                            price: { $lte: maximum, $gte: minimum },
                            category1: main,
                            category2: sub

                        }
                    }
                ]).toArray()
                resolve(products)
            }
            else {
                products = await db.get().collection('product').aggregate([
                    {
                        $match: {
                            price: { $lte: maximum },
                            price: { $gte: minimum }
                        }
                    }

                ]).toArray()

                resolve(products)
            }
        })
    },
    checkCoupon: (coupon, total) => {
        console.log(coupon)
        return new Promise(async (resolve, reject) => {
            let Err = false
            coupon = await db.get().collection('coupon_offer').findOne({ 'offers.coupon': coupon })
            if (coupon) {
                console.log("coupon exist")
                discount = coupon.offers.discount
                amount = parseInt(total)
                total = amount - (amount * discount) / 100
                console.log(total)
                resolve(total)
            }
            else {

                resolve({ Err: true })
            }

        })
    },
    checkReferal: (Id) => {
        console.log(Id)
        return new Promise(async (resolve, reject) => {
            user = await db.get().collection('users').findOne({ ReferalId: Id })
            console.log(user)
            if (user) {
                console.log("valid referal")
                user.Wallet = parseInt(user.Wallet)
                console.log(user.Wallet)
                if (user.Wallet === 0) {
                    Wallet = 100
                    console.log("wallet 0", Wallet)
                }
                else {
                    Wallet = parseInt(user.Wallet) + 100
                    console.log(Wallet)
                }
                await db.get().collection('users').updateOne({ _id: user._id }, { $set: { Wallet: Wallet } })
                resolve({ status: true })

            }
            else {
                resolve()
            }
        })
    },
    checkWallet: (Id, total) => {
        console.log(Id)
        return new Promise(async (resolve, reject) => {
            total = parseInt(total)
            user = await db.get().collection('users').findOne({ _id: ObjectId(Id) })
            if (user) {
                console.log(user.Wallet)
                if (user.Wallet == 0) {
                    resolve({ zeroWallet: true })
                }
                else {

                    user.Wallet = parseInt(user.Wallet)
                    if (total > user.Wallet) {
                        console.log("high")
                        total = total - user.Wallet
                        Wallet = 0
                    }
                    else {
                        console.log("Low")
                        Wallet = user.Wallet - total
                        total = 0
                    }
                    await db.get().collection('users').updateOne({ _id: ObjectId(Id) },
                        {
                            $set: {
                                Wallet: Wallet
                            }
                        })
                    resolve(total)
                }

            }

        })
    }
}
