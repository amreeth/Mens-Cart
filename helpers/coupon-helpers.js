var db = require('../config/connection')
var collection = require('../config/collection')
const objectId = require('mongodb').ObjectId

module.exports = {
    addCoupon: (couponDetails) => {
        couponDetails.price = parseInt(couponDetails.price)
        return new Promise((resolve, reject) => {
            db.get().collection(collection.COUPON_COLLECTION).insertOne(couponDetails).then(() => {
                resolve()
            })
        })
    },
    getAllCoupons: () => {
        return new Promise(async (resolve, reject) => {
            let coupons = await db.get().collection(collection.COUPON_COLLECTION).find().toArray()
            //  console.log(coupons,'111111111111111111111111111');
            resolve(coupons)
        })
    },

    checkCoupon: (AppliedCoupon, UserID) => {
    //    console.log("reached check coupon router");
        // console.log(AppliedCoupon);
        let Coupon=AppliedCoupon.coupon
        // console.log(Coupon,'1111111');
        var UseriD = {
            userID: UserID
        }
        // console.log(UseriD);
        return new Promise(async (resolve, reject) => {
            // console.log("reached prmise");
            Couponapplied = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(UserID) })
            // console.log(Couponapplied,'2222222222222');
            // console.log(Couponapplied.couponamount,'1111111111');
            if (Couponapplied.couponamount) {
                resolve({ OneCouponUsed: true })
            } else {
                CouponOffer = await db.get().collection(collection.COUPON_COLLECTION).findOne({ coupon:Coupon})
                // console.log(CouponOffer,'1111111111111');
                if (CouponOffer) {
                    // console.log("ffffffffffffffff", CouponOffer.users);
                    if (CouponOffer.users) {
                        var CoupenExist = CouponOffer.users.findIndex(users => users.userID == UserID)
                        // console.log("find index checked");
                        console.log(CoupenExist);
                        // console.log('CouponOffer', CouponOffer);
                        if (CoupenExist != -1) {
                            // console.log("CouponOffer.users user undeeeee reject aaaayyeeeee");
                            resolve({ CoupenUsed: true })
                        }else{
                            await db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(UserID)}, { $set: {couponamount: CouponOffer.price}})

                            await db.get().collection(collection.COUPON_COLLECTION).updateOne({ _id:CouponOffer._id }, { $push:{users: UseriD}}).then((response) => {
                                // console.log("fgfgfgfgfgfgfgfggfgffgfgfg");
                                CoupDiscount = CouponOffer.price
                                resolve({ Coupon: true, CoupDiscount })
                            })
                        }
                    }
                    else {
                        // console.log("  f CouponOffer.users   user illleeeeee  aaaayyeeeee");
                        // console.log(Coupon);
                        // console.log("UserID", UserID);
                        // console.log('Coupon.coupondicount', CouponOffer.price);
                        await db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(UserID)}, { $set: {couponamount: CouponOffer.price}})

                        await db.get().collection(collection.COUPON_COLLECTION).updateOne({ _id:CouponOffer._id }, { $push:{users: UseriD}}).then((response) => {
                            // console.log("fgfgfgfgfgfgfgfggfgffgfgfg");
                            CoupDiscount = CouponOffer.price
                            resolve({ Coupon: true, CoupDiscount })
                        })
                    }
                } else {
                    resolve({ NoCoupon: true })
                }
            }
        })
    },
    deleteCoupon:(couponId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.COUPON_COLLECTION).deleteOne({_id:objectId(couponId)}).then(()=>{
                resolve()
            })
        })
    }







}
