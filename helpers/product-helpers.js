var db = require('../config/connection')
var collection = require('../config/collection');
// const { ObjectId } = require('mongodb');
const objectId = require('mongodb').ObjectID

module.exports = {
    addProduct: (product) => {
        product.price = parseInt(product.price)
        product.quantity = parseInt(product.quantity)
        product.offer = false;
        product.ProductOffer = false;
        // product.discount = parseInt(product.discount)
        // let disco=product.price*product.discount/100;
        // product.newPrice=product.price-disco;
        // product.newPrice=parseInt(product.newPrice)
        // console.log(product.newPrice,'sasassssa');

        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then((data) => {
                // console.log(data);
                var id = data.insertedId
                // console.log("gfdgfgffffffffffffffffffffffff",id);
                resolve(id)
            })

        })
    },

    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },
    deleteProduct: (prodId) => {
        return new Promise((resolve, reject) => {
            // console.log(objectId(prodId));
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({ _id: objectId(prodId) }).then((response) => {
                resolve(response)
            })
        })
    },
    getProductDetails: (prodId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(prodId) }).then((product) => {
                resolve(product)
            })
        })
    },
    updateProduct: (prodId, proDetails) => {
        proDetails.price = parseInt(proDetails.price)
        proDetails.quantity = parseInt(proDetails.quantity)
        // proDetails.discount = parseInt(proDetails.discount)
        // let disco=proDetails.price*proDetails.discount/100;
        // newPrice=proDetails.price-disco;
        // newPrice=parseInt(newPrice)
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(prodId) }, {
                $set: {
                    name: proDetails.name,
                    brand: proDetails.brand,
                    description: proDetails.description,
                    price: proDetails.price,
                    category: proDetails.category,
                    subcategory: proDetails.subcategory,
                    quantity: proDetails.quantity,

                }
            }, { upsert: true }
            ).then((response) => {
                console.log(response);
                resolve()
            })
        })
    },
    getTopwears: () => {
        return new Promise(async (resolve, reject) => {
            let topwears = await db.get().collection(collection.PRODUCT_COLLECTION).find({ category: 'Top wear' }).toArray()
            // console.log(topwears);
            resolve(topwears)
        })
    },
    getBottamwears: () => {
        return new Promise(async (resolve, reject) => {
            let bottamwears = await db.get().collection(collection.PRODUCT_COLLECTION).find({ category: 'Bottam wear' }).toArray()
            // console.log(bottamwears);
            resolve(bottamwears)
        })
    },
    getAllProductsCount: () => {
        return new Promise(async (resolve, reject) => {
            let totalProduct = await db.get().collection(collection.PRODUCT_COLLECTION).find().count()
            // console.log(totalProduct);
            resolve(totalProduct)
        })
    },


    getCasualShirts: () => {
        return new Promise(async (resolve, reject) => {
            let casualShirt = await db.get().collection(collection.PRODUCT_COLLECTION).find({ subcategory: 'casual shirt' }).toArray()
            resolve(casualShirt)
        })
    },

    getJeans: () => {
        return new Promise(async (resolve, reject) => {
            let jeans = await db.get().collection(collection.PRODUCT_COLLECTION).find({ subcategory: 'jeans' }).toArray()
            resolve(jeans)
        })
    },

    getTshirt: () => {
        return new Promise(async (resolve, reject) => {
            let tshirt = await db.get().collection(collection.PRODUCT_COLLECTION).find({ subcategory: 't shirt' }).toArray()
            resolve(tshirt)
        })
    },
    getFormalshirt: () => {
        return new Promise(async (resolve, reject) => {
            let formalshirt = await db.get().collection(collection.PRODUCT_COLLECTION).find({ subcategory: 'Formal shirt' }).toArray()
            resolve(formalshirt)
        })
    },
    getCasualTrousers: () => {
        return new Promise(async (resolve, reject) => {
            let casualTrousers = await db.get().collection(collection.PRODUCT_COLLECTION).find({ subcategory: 'Casual Trousers' }).toArray()
            resolve(casualTrousers)
        })
    },
    getFormalTrousers: () => {
        return new Promise(async (resolve, reject) => {
            let formalTrousers = await db.get().collection(collection.PRODUCT_COLLECTION).find({ subcategory: 'Formal Trousers' }).toArray()
            resolve(formalTrousers)
        })
    },
    searchProducts: (items) => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).aggregate([
                {
                    $match: {
                        $or: [
                            { 'name': { $regex: items, $options: 'i' } },
                            { 'brand': { $regex: items, $options: 'i' } },
                        ]
                    }
                }
            ]).toArray()
            resolve(products)
        })
    },






}