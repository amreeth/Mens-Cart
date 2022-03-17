var db = require('../config/connection')
var collection = require('../config/collection')
const bcrypt = require('bcrypt')
const { response } = require('express')
const { ObjectId } = require('mongodb')
const { ObjectID } = require('bson')
// const { ObjectId } = require('mongodb')
const objectId = require('mongodb').ObjectID
const Razorpay = require('razorpay')
const dotenv=require('dotenv')
dotenv.config()


const { ORDER_COLLECTION } = require('../config/collection')
const { resolve } = require('path')


var instance = new Razorpay({
    key_id: process.env.key_id,
    key_secret:process.env.key_secret,
});

module.exports = {

    doSignup: (userData) => {
        // console.log(collection.USER_COLLECTION);
        // console.log("userdata",userData);
        return new Promise(async (resolve, reject) => {
            userData.wallet=0;
            userData.wallet = parseInt(userData.wallet)
            userData.password = await bcrypt.hash(userData.password, 10)
            userData.confirmpassword = await bcrypt.hash(userData.confirmpassword, 10)
            // console.log(userData.password);
            userData.block = false;
            if (userData.referId) {
                userData.wallet=100;
                db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data)=>{

                    db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userData.referId)},{
                       $set:{
                           wallet:100
                       }
                    })
                    resolve(data.insertedId)
                })
            } else {
                db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                    // console.log(data);
                    resolve(data.insertedId)
                })
            }
        })
    },
    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
            if (user) {
                console.log("---------------------------------------------------------------------------------------");
                bcrypt.compare(userData.password, user.password).then((status) => {
                    if (user.block == false) {
                        if (status) {
                            console.log('login success');
                            response.user = user
                            response.status = true
                            resolve(response)
                        } else {
                            console.log('login failed');
                            resolve({ status: false })
                        }
                    } else {
                        reject({ block: true })
                    }

                })
            } else {
                console.log('login failed');
                resolve({ status: false })
            }
        })
    },
    findUser: (phonenumber) => {
        return new Promise(async (resolve, reject) => {
            user = await db.get().collection(collection.USER_COLLECTION).findOne({ mobno: phonenumber })
            resolve(user)
        })

    },
    findEmail:(email)=>{
        return new Promise(async(resolve,reject)=>{
            emailExist=await db.get().collection(collection.USER_COLLECTION).findOne({email:email})
            resolve(emailExist)
        })
    },

    getAllUsers: () => {
        return new Promise(async (resolve, reject) => {
            let users = await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(users)
        })
    },

    getAllUsersCount: () => {
        return new Promise(async (resolve, reject) => {
            let userCount = await db.get().collection(collection.USER_COLLECTION).estimatedDocumentCount();
            // console.log(userCount, 'sssssssssssss');
            resolve(userCount)
        })
    },

    blockUser: (userId) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, {
                $set: { block: true }
            }).then((status) => {
                resolve({ blockStatus: true })
            }).catch((response) => {
                console.log(response);
            })
        })
    },
    unBlockUser: (userId) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, {
                $set: { block: false }
            }).then((status) => {
                resolve({ blockStatus: true })
            }).catch((response) => {
                console.log(response);
            })
        })
    },

    LoginOtpUser: (mob) => {
        return new Promise(async (resolve, reject) => {
            var user = await db.get().collection(collection.USER_COLLECTION).findOne({ mobno: mob })
            console.log("fjkkkjkkhkjk>>>>>>>>>>>>>>>>>>>>>>>>>>>>>", user);
            resolve(user)
        })
    },

    addToCart: (proId, userId) => {
        
        let proObj = {
            item: objectId(proId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (userCart) {
                let proExist = userCart.products.findIndex(product => product.item == proId)

                console.log(proExist, 'pro exist ');

                if (proExist != -1) {

                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: objectId(userId), 'products.item': objectId(proId) }, {
                            $inc: {
                                'products.$.quantity': 1
                            }
                        }).then(() => {
                            resolve()
                        })
                } else {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId) },
                        {
                            $push: { products: proObj }
                        }).then(() => {
                            resolve(true)
                        })
                }
            } else {
                let cartObj = {
                    user: objectId(userId),
                    products: [proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve()
                })
            }
        })
    },
    getCartProducts: (userId) => {
        // console.log(userId);
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
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
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: "product"
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }
            ]).toArray()

            // console.log(cartItems, 'cart items ');
            resolve(cartItems)
        })
    },
    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) })
            if (cart) {
                count = cart.products.length
            }
            resolve(count)

        })
    },
    changeProductQuantity: (details) => {
        console.log(details, 'hbhj');
        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)
        console.log(details);
        return new Promise((resolve, reject) => {
            if (details.count == -1 && details.quantity == 1) {
                // console.log("if case worked");
                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(details.cart) }, {
                    $pull: { products: { item: objectId(details.product) } }
                }).then((response) => {
                    resolve({ removeProduct: true })
                })
            } else {

                // console.log("else case worked");
                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(details.cart), 'products.item': objectId(details.product) }, {
                    $inc: { 'products.$.quantity': details.count }
                }).then((response) => {
                    resolve({ status: true })
                })
            }
        })
    },
    removeCartItem: (productId, userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId) }, {
                $pull: {
                    products: { item: objectId(productId) }
                }
            }).then((response) => {
                resolve()
            })
        })
    },




    getTotalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
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
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: "product"
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    $group: {
                        _id: 0,
                        total: { $sum: { $multiply: ['$quantity', '$product.price'] } },
                        mrp: { $sum: { $multiply: ['$quantity', '$product.OldPrice'] } }
                    }
                }
            ]).toArray()
            // console.log(total, 'dasdadadfadf');
            if (!total.length == 0) {
                // console.log("iifffffffffffffffffffffffff");
                resolve(total)
            }
            else {
                // console.log("elseeeeeeeeeeeeeeeee");
                resolve(total)
                // console.log("resolved");
            }
        })
    },
    placeOrder: (order, products, total, userAddress, discount) => {
        userID = order.userId;
        if(order.checked)
        {
            wallet=order.checked
        }
        return new Promise((resolve, reject) => {
            let status = order['payment-method'] === 'COD' ? 'placed' : 'pending'
            let orderObj = {
                deliveryDetails: userAddress,
                userId: objectId(order.userId),
                paymentMethod: order['payment-method'],
                products: products,
                totalAmount: total,
                discount: discount,
                status: status,
                date: new Date(),
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((data) => {

                console.log(status);

                if(status==='placed'){

                    if(order.checked){
                        db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userID)},{
                            $inc:{wallet:-100}
                        })
                    }
                    // db.get().collection(collection.USER_COLLECTION).updateOne({})
                    db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userID) }, {
                        $unset: { couponamount: "" }
                    })
                    db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(order.userId) })
                }
                // console.log(data.insertedId,'asdfghjk');
                resolve(data.insertedId)
            })
        })
    },
    getCartProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            resolve(cart.products)
            
            reject()
        })
    },


    getUserAddress: (addressId) => {
        return new Promise(async (resolve, reject) => {
            let address = await db.get().collection(collection.ADDRESS_COLLECTION).findOne({ _id: objectId(addressId) })
            resolve(address)
        })
    },

    CheckUserExistsForLoginOTP: (mob) => {
        return new Promise(async (resolve, reject) => {
            user = await db.get().collection(collection.USER_COLLECTION).findOne({ mobno: mob })
            console.log(user);
            resolve(user)
        })
    },
    getUserDetials: (userId) => {
        return new Promise(async (resolve, reject) => {
            userDetils = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) })
            resolve(userDetils)
        })
    },


    updateProfile: (user) => {
        // console.log(user,'qwwqqqqqqqqqqqqq');
        // console.log(userId,'userid');
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.USER_COLLECTION)
                .updateOne({ _id: objectId(user.id) },
                    {
                        $set: {
                            firstname: user.firstname,
                            lastname: user.lastname,
                            email: user.email,
                            dob: user.dob,
                            mobno: user.mobno,
                            altermobno: user.altermobno
                        }
                    }, { upsert: true }
                ).then((response) => {
                    resolve()
                })
        })
    },
    changePassword: (data) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(data.userID) }).then((user) => {
                console.log(user);
                bcrypt.compare(data.currentpassword, user.password).then(async (status) => {
                    console.log(status, ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
                    console.log(data.password);
                    console.log(data.confirmpassword);
                    if (status) {

                        newpassword = await bcrypt.hash(data.password, 10)
                        confirmpassword = await bcrypt.hash(data.confirmpassword, 10)
                        await db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(data.userID) }, {
                            $set: {
                                password: newpassword,
                                confirmpassword: confirmpassword
                            }
                        })
                        console.log("dgdfdfdffdfdfdf");
                        resolve({ status: true })
                    } else {
                        resolve({ status: false })
                    }
                })
            })
        })
    },

    generateRazorpay: (orderId, total) => {
        return new Promise((resolve, reject) => {
            var options = {
                amount: total * 100,
                currency: 'INR',
                receipt: "" + orderId
            };
            instance.orders.create(options, function (err, order) {
                if (err) {
                    console.log(err);
                } else {
                    console.log(order);
                    resolve(order)
                }
            });
        })
    },
    verifyPayment: (details) => {
        return new Promise((resolve, reject) => {
            const crypto = require('crypto');
            let hmac = crypto.createHmac('sha256', 'F6VTZs2IrfQIYidaOqSfDFPy')
            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]']);
            hmac = hmac.digest('hex')
            if (hmac == details['payment[razorpay_signature]']) {
                resolve()
            } else {
                reject()
            }
        })
    },


    changePaymentStatus: (orderId,userID) => {
        return new Promise((resolve, reject) => {

            console.log("Paypal");
            console.log(orderId+" "+userID);
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) }, {
                $set: {
                    status: 'placed'
                }
            }).then(() => {

                db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userID) }, {
                    $unset: { couponamount: "" }
                })
                db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(userID) })
                resolve()
            })
        })
    },

    getUserWallet: (userId) => {
        return new Promise((resolve, reject) => {
            let user = db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) }).then((user) => {
                // console.log(user, '11111111111111111111111');
                resolve(user)
            })
        })
    }


}