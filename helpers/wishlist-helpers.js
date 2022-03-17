var db = require('../config/connection')
var collection = require('../config/collection')
const { WISHLIST_COLLLECTION } = require('../config/collection')
const objectId = require('mongodb').ObjectId

module.exports = {
    addtoWishlist: (productId, userId) => {
        // console.log('---------------------');
        let productobj = {
            item: objectId(productId)
        }
        return new Promise(async (resolve, reject) => {
            // console.log('1222222222222222222222');
            let wishlistObj = {
                user: objectId(userId),
                products: [productobj]
            }
            // console.log('-----------');
            let userWishlist = await db.get().collection(collection.WISHLIST_COLLLECTION).findOne({ user: objectId(userId) })

            if (userWishlist) {
                let proExist = userWishlist.products.findIndex(products => products.item == productId)

                if (proExist != -1) {
                    resolve({exist:true })
                    console.log('erororrr');
                } else {
                    db.get().collection(WISHLIST_COLLLECTION).updateOne({ user: objectId(userId) }, {
                        $push: { products: productobj }
                    }).then((response) => {
                        resolve({status:true})
                    })
                }
            } else {
                db.get().collection(collection.WISHLIST_COLLLECTION).insertOne(wishlistObj).then((response) => {
                    resolve({status:true})
                })
            }
        })
    },
    wishlistItems: (userId) => {
        return new Promise(async (resolve, reject) => {
            let allItems = await db.get().collection(collection.WISHLIST_COLLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) },
                }, {
                    $unwind: '$products'
                }, {
                    $project: {
                        item: '$products.item'
                    }
                }, {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                }, {
                    $project: {
                        item: 1, product: {
                            $arrayElemAt: ['$product', 0]
                        }
                    }
                }
            ]).toArray()
            // console.log(allItems,'166666666666666666');
            resolve(allItems)
        })
    },
    removeItem: (productId, userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.WISHLIST_COLLLECTION).updateOne({ user: objectId(userId) },
                {
                    $pull: {
                        products: { item: objectId(productId) }
                    }
                }
            ).then((response) => {
                resolve({ status: true })
            })
        })
    }
}