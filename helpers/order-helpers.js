var db = require('../config/connection')
var collection = require('../config/collection')
const { tasksUrl } = require('twilio/lib/jwt/taskrouter/util')
const objectId = require('mongodb').ObjectId

module.exports = {

    getUserAllOrders: (user) => {
        user.id = objectId(user._id)
        return new Promise(async (resolve, reject) => {
            let userAllOrders = await db.get().collection(collection.ORDER_COLLECTION).find({ userId: user.id }).toArray()
            console.log(userAllOrders);
            resolve(userAllOrders)
        })
    },
    getOrderDetails: (orderId) => {
        // console.log(orderId);
        // console.log("reached database");
        orderId = objectId(orderId)
        return new Promise(async (resolve, reject) => {
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: orderId }
                },
                {
                    $unwind: '$products'
                }, {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'products.item',
                        foreignField: '_id',
                        as: "orders"
                    }
                },
                {
                    $unwind: '$orders'
                }
            ]).toArray()
            //  console.log("//////////////////////////////////////////////////////////////");
            //  console.log(orderItems);
            //  console.log("//////////////////////////////////////////////////////////////");
            // console.log(orderItems[0],'111111111111111111111111111111111111111111111111111111111');
            // console.log(orderItems[1],'222222222222222222222222222222222222222');
            resolve(orderItems)

        })
    },

    changeStatus: (status, id) => {
        let newStatus = status
        return new Promise(async (resolve, reject) => {
            if (newStatus == 'cancel') {
                await db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(id) },
                    {
                        $set: {
                            status: false,
                            cancelStatus: true,
                            shippedStatus: false
                        }
                    }, { upsert: true }).then(() => {
                        resolve()
                    })
            }
            else if (newStatus == 'shipped') {
                await db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(id) }, {
                    $set: {
                        status: false,
                        shippedStatus: true
                    }
                }, { upsert: true }
                ).then(() => {
                    resolve()
                })
            }
            else if (newStatus == 'delivered') {
                await db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(id) },
                    {
                        $set: {
                            status: false,
                            shippedStatus: false,
                            deliveryStatus: true
                        }
                    }, { upsert: true }
                ).then(() => {
                    resolve()
                })
            }
        })
    },


    getAllOrders: () => {
        return new Promise(async (resolve, reject) => {
            let allOrders = await db.get().collection(collection.ORDER_COLLECTION).find().toArray()
            console.log(allOrders);
            resolve(allOrders)
        })
    },

    getsalesReport: () => {
        return new Promise(async (resolve, reject) => {
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { deliveryStatus: true }
                },
                {
                    $project: {
                        orderId: '$orderId',
                        userId: '$userId',
                        paymentMethod: '$paymentMethod',
                        totalAmount: '$totalAmount',
                        date: '$date',
                        products: '$products'
                    }
                },
            ]).toArray()
            resolve(orderItems)
        })
    },


    getweeklyreport: async () => {
        const dayOfYear = (date) =>
            Math.floor(
                (date - new Date(date.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24
            )
        return new Promise(async (resolve, reject) => {
            const data = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        $and: [{ status: { $ne: 'cancelled' } }, { status: { $ne: 'pending' } }],
                        date: { $gte: new Date(new Date() - 7 * 60 * 60 * 24 * 1000) },
                    },
                },

                { $group: { _id: { $dayOfYear: '$date' }, count: { $sum: 1 } } },
            ]).toArray()

            const thisday = dayOfYear(new Date())
            let salesOfLastWeekData = []
            for (let i = 0; i < 8; i++) {
                let count = data.find((d) => d._id === thisday + i - 7)

                if (count) {
                    salesOfLastWeekData.push(count.count)
                } else {
                    salesOfLastWeekData.push(0)
                }
            }
            // console.log(salesOfLastWeekData);
            resolve(salesOfLastWeekData)

        })
    },

    getSalesReport: (from, to) => {
        console.log(new Date(from), 'from date ');
        console.log(new Date(to), 'to date');

        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        $and: [
                            { date: { $gte: new Date(from), $lte: new Date(to) } }, { deliveryStatus: true }]
                    }
                },
            ]).toArray()
            // console.log(orders, 'daily orders');
            resolve(orders)
        })
    },


    getNewSalesReport: (type) => {
        const numberOfDays = type === 'daily' ? 1 : type === 'weekly' ? 7 : type === 'monthly' ? 30 : type === 'yearly' ? 365 : 0
        const dayOfYear = (date) =>
            Math.floor(
                (date - new Date(date.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24
            )
        return new Promise(async (resolve, reject) => {
            const data = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        $and: [{
                            date: { $gte: new Date(new Date() - numberOfDays * 60 * 60 * 24 * 1000) }
                        }, { deliveryStatus: true }]
                    },
                },
            ]).toArray()
            // console.log(data, '111111111111');
            resolve(data)

        })
    },

    getTotalProfit: () => {
        return new Promise(async (resolve, reject) => {
            let profit = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match
                        : { deliveryStatus: true }
                },
                {
                    $group: {
                        _id: 0,
                        profit: {
                            $sum: '$totalAmount'
                        }
                    }
                }
            ]).toArray()
            // console.log(profit,'111111');
            resolve(profit[0]?.profit)
        })
    },
    TotalOrderCount: () => {
        return new Promise(async (resolve, reject) => {
            let totalOrders = await db.get().collection(collection.ORDER_COLLECTION).find({ deliveryStatus: true }).count()
            // console.log(totalOrders,'11111');
            resolve(totalOrders)
        })
    },
    getrazroPayTotal: () => {
        return new Promise(async (resolve, reject) => {
            let razorPayTotal = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        $and: [{ deliveryStatus: true }, { paymentMethod: 'ONLINE' }]
                    }
                }, {
                    $group: {
                        _id: 0,
                        profit: {
                            $sum: '$totalAmount'
                        }
                    }
                },
                {
                    $set: { status: 'Razorpay' }
                }
            ]).toArray()
            // console.log(razorPayTotal);
            resolve(razorPayTotal);
        })
    },
    getCodTotal:()=>{
        return new Promise(async (resolve, reject) => {
            let codTotal = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        $and: [{ deliveryStatus: true }, { paymentMethod: 'COD' }]
                    }
                }, {
                    $group: {
                        _id: 0,
                        profit: {
                            $sum: '$totalAmount'
                        }
                    }
                },
                {
                    $set: { status: 'COD' }
                }
            ]).toArray()
            // console.log(codTotal);
            resolve(codTotal);
        })
    },
    getPaypalTotal:()=>{
        return new Promise(async (resolve, reject) => {
            let payPalTotal = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        $and: [{ deliveryStatus: true }, { paymentMethod: 'PAYPAL' }]
                    }
                }, {
                    $group: {
                        _id: 0,
                        profit: {
                            $sum: '$totalAmount'
                        }
                    }
                },
                {
                    $set: { status: 'PAYPAL' }
                }
            ]).toArray()
            // console.log(payPalTotal);
            resolve(payPalTotal);
        })
    }



} 