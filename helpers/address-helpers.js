var db = require('../config/connection')
var collection = require('../config/collection')
const objectId = require('mongodb').ObjectId

module.exports={
    addAddress:(address)=>{
        address.userId=objectId(address.userId)
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ADDRESS_COLLECTION).insertOne(address).then((data)=>{
                resolve(data)
            })
        })
    },
    getAlladdress:(user)=>{
        console.log(user);
        let userid=objectId(user._id)
        return new Promise(async(resolve,reject)=>{
            let address= await db.get().collection(collection.ADDRESS_COLLECTION).find({userId:userid}).toArray()
            resolve(address)
        })
    },
    getOneAddress:(addressId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ADDRESS_COLLECTION).findOne(
                { _id:objectId(addressId) }).then((addressDetails)=>{
                    resolve(addressDetails)
                })
        })
    },
    updateAddress:(upAddress)=>{
        upAddress.id=objectId(upAddress.id)
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ADDRESS_COLLECTION).updateOne(
                {_id:upAddress.id},{
                    $set:{
                        firstname:upAddress.firstname,
                        lastname:upAddress.lastname,
                        email:upAddress.email,
                        address:upAddress.address,
                        city:upAddress.city,
                        country:upAddress.country,
                        zipcode:upAddress.zipcode,
                        tel:upAddress.tel
                    }
                },{upsert:true}
            ).then((response)=>{
                resolve()
            })
        })
    },

    deleteAddress:(addressId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ADDRESS_COLLECTION).deleteOne({_id:objectId(addressId)}).then((response)=>{
                resolve(response)
            })
        })
    }

}