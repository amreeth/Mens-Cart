var db = require('../config/connection')
var collection = require('../config/collection')
const objectId = require('mongodb').ObjectId

module.exports = {
    addCategory: (categorey) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).insertOne(categorey).then((data) => {
                console.log(data);
                resolve(data.insertedId)
            })

        })
    },
    getAllCategory: () => {
        return new Promise(async (resolve, reject) => {
            let categorey = await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
            // console.log(categorey, 'dasdadaddasca');
            resolve(categorey)

        })
    },
    getCategory: (categoreyId) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).findOne({ _id: objectId(categoreyId) }).then((oneCategorey) => {
                resolve(oneCategorey)
            })
        })
    },

    updateCategory: (categoreyId, categorey) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).updateOne({ _id: objectId(categoreyId) }, {
                $set: { catname: categorey.catname }
            }).then((response)=>{
                resolve()
            })
        })
    },
    deleteCategory:(catId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTION).deleteOne({_id:objectId(catId)}).then((response)=>{
                resolve(response)
            })
        })
    },
    addSubCategory: (catDetails) => {
        return new Promise((resolve, reject) => {
          db.get()
            .collection(collection.CATEGORY_COLLECTION)
            .updateOne(
              { catname: catDetails.category },
              { $addToSet: { subcategory: catDetails.subcategory } }
            )
            .then((data) => {
              resolve(data);
            })
        })
      },
      deletesubCategory:(data)=>{
        //   console.log(data,'adasdadaddsadad');
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.CATEGORY_COLLECTION).updateOne({ catname: data.category },{ $pull: { subcategory: data.subcategory } }).then((data) => {
                resolve();
              })
          })
      },
      getAllSubCategory:()=>{
          return new Promise(async(resolve,reject)=>{
              let categories=await db.get().collection(collection.CATEGORY_COLLECTION).find({},{subcategory:1}).toArray()
            //   console.log(categories,'11111111111111111111111')
             
              resolve(categories)
          })
      },

}