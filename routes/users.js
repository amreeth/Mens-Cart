const { response } = require('express');
var express = require('express');
var router = express.Router();
const paypal = require("paypal-rest-sdk");
const userHelpers = require('../helpers/user-helpers')
const productHelpers = require('../helpers/product-helpers')
const addressHelpers = require('../helpers/address-helpers')
const orderHelpers = require('../helpers/order-helpers')
var categoryHelper = require('../helpers/category-helpers');
const couponHelper = require('../helpers/coupon-helpers')
const wishlistHelper = require('../helpers/wishlist-helpers')
const offerHelper = require('../helpers/offer-helpers')

const dotenv = require('dotenv');
const { Db } = require('mongodb');
dotenv.config()

let isWallet;

// const { accoutnSID, authToken, serviceSID } = require("../config/otp-auth")

const client = require("twilio")(process.env.accoutnSID, process.env.authToken);

paypal.configure({
  mode: "sandbox", //sandbox or live
  client_id: process.env.client_id,

  client_secret: process.env.client_secret
});

const verifyLogin = (req, res, next) => {
  if (req.session.userLoggedIn) {
    next()
  } else {
    res.redirect('/login')
  }
}

/////////////////* GET users listing. */////////////////////

router.get('/', async function (req, res, next) {

  let user = req.session.userLoggedIn
  let home = true;
  let cartCount = null
  if (req.session.userLoggedIn) {
    cartCount = await userHelpers.getCartCount(req.session.userLoggedIn._id)
  }

  let casualShirtFront = await productHelpers.getCasualShirts()
  let jeansFront = await productHelpers.getJeans()
  let tshirtFront = await productHelpers.getTshirt()

  productHelpers.getAllProducts().then((products) => {

    res.render('user/index', { userheader: true, user, products, cartCount, home, casualShirtFront, jeansFront, tshirtFront })
  })

});


////////////////*Get login page*///////////////////

router.get('/login', function (req, res) {

  if (req.session.userLoggedIn) {
    res.redirect('/');
  } else {
    res.render('user/login', { 'loginErr': req.session.loginErr })
    req.session.loginErr = false

  }
});


/////////////////////////*Get signup page*////////////////////


router.get('/signup', function (req, res) {

  // console.log(req.query.valid);
  res.render('user/signup',)
});

//////////////*post signup page*/////////////////////



router.post('/signup', async function (req, res) {
  // console.log(req.session.referId, 'referidddddddddd');
  // console.log(req.body);
  if (req.session.referId) {
    req.body.referId = req.session.referId;
    // console.log(req.session.referId, 'referidddddddddd');
  }
  let numExist = await userHelpers.findUser(req.body.mobno)
  let emailExist = await userHelpers.findEmail(req.body.email)

  if (numExist) {
    // res.redirect('/signup?valid=' + 'true')
    let numExistError = 'Mobile number already exist use another one'
    res.render('user/signup', { numExistError })
  } else if (emailExist) {
    let emailExistError = 'Email Id already exist use another one';
    res.render('user/signup', { emailExistError })
  }
  else {
    userHelpers.doSignup(req.body).then((response) => {
      console.log(response);
      res.redirect('/login')
    })
  }
  // res.redirect('/?valid='+"kj")
});




/////////*sign up with referl*//////////////


router.get('/signup/:id', (req, res) => {

  // console.log(req.params,'qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq');

  req.session.referId = req.params.id;
  // console.log(req.session.referId,'11111111111111111111111');
  console.log(req.session.referId, 'referid signup get');

  res.render('user/signup')
})


//////////////////////*post login page*////////////

router.post('/login', (req, res) => {
  console.log(req.body);
  userHelpers.doLogin(req.body).then((response) => {
    // console.log(response,'jgjhgjgjgjgjhg');
    if (response.status) {
      req.session.userLoggedIn = response.user
      res.redirect('/')
    } else {
      let error = "Ivalid Email ID or Password "
      res.render('user/login', { error })
    }
  }).catch((response) => {
    let error = 'admin blocked you';
    res.render('user/login', { error })

  })
})


/////////////*get logout*///////////////

router.get('/logout', (req, res) => {
  req.session.user = null
  req.session.userLoggedIn = false
  res.redirect('/')
})


///////////*get otp login*/////////////

router.get('/otp-login', (req, res) => {
  res.render('user/otp-login')
})



////////////*OTP check *////////

///////* verify number*////////

router.post("/verify-number", async (req, res) => {
  var userExist = await userHelpers.CheckUserExistsForLoginOTP(req.body.phonenumber)
  // console.log("----------------------------------------------------------------------------------")
  console.log(userExist);;
  // console.log("----------------------------------------------------------------------------------")

  if (userExist) {
    req.session.loginMOB = req.body.phonenumber
    console.log("number", req.body.phonenumber);
    client.verify
      .services(process.env.serviceSID)
      .verifications.create({
        to: `+91${req.body.phonenumber}`,
        channel: "sms",
      })
      .then((resp) => {

        res.render('user/verify-otp')
      });
    console.log("if case worked");
  }
  else {
    let error = "user doesn't exist"
    console.log("else case worked");

    res.render('user/otp-login', { error })
  }

});

////////////////*verify otp */////////////////

router.post("/submit-otp", async (req, res) => {

  var mob = req.session.loginMOB
  var otp = req.body.otp
  var GetUser = await userHelpers.LoginOtpUser(mob)
  console.log('otp', otp);
  console.log('mob', mob);
  client.verify
    .services(process.env.serviceSID)
    .verificationChecks.create({
      to: `+91${mob}`,
      code: otp
    }).then((data) => {

      if (data.status == "approved") {

        req.session.userLoggedIn = GetUser

        res.redirect('/')

      }

    }).catch((errr) => {
      var otp = "OTP failed Try again"

      res.render('user/verify-otp', { otp })
    })
});

/* \\\/otp check*/




//////////*get wishlist */////////////

router.get('/wishlist', verifyLogin, async (req, res) => {

  let user = req.session.userLoggedIn
  let cartCount = null

  if (req.session.userLoggedIn) {
    cartCount = await userHelpers.getCartCount(req.session.userLoggedIn._id)
  }
  let allWishlistItems = await wishlistHelper.wishlistItems(user._id)

  console.log(allWishlistItems, 'wishlist items');

  res.render('user/wishlist', { userheader: true, user, cartCount, allWishlistItems })
})



/////////*get add to wishlist*////////


router.get('/add-to-wishlist/:id', verifyLogin, (req, res) => {
  let userId = req.session.userLoggedIn._id

  // console.log('1111111111111111111111111111111111111111');
  // console.log(req.params.id);

  wishlistHelper.addtoWishlist(req.params.id, userId).then((response) => {
    res.json(response)
  })

})


//////*get remove wishlistt *////////

router.get('/remove-wishlist/:id', verifyLogin, (req, res) => {
  console.log(req.params.id, 'qqqqqqqqqqqqqqqqqq');
  let userId = req.session.userLoggedIn._id;

  wishlistHelper.removeItem(req.params.id, userId).then((response) => {
    res.json(response)
  })
})




////////////////*get cart*////////////

router.get('/cart', verifyLogin, async (req, res) => {
  let user = req.session.userLoggedIn
  let products = await userHelpers.getCartProducts(user._id)
  let cartCount = null

  if (req.session.userLoggedIn) {
    cartCount = await userHelpers.getCartCount(req.session.userLoggedIn._id)
  }
  let cartTotalArr = await userHelpers.getTotalAmount(req.session.userLoggedIn._id)
  // console.log(cartTotalArr);
  // console.log(cartTotalArr);
  // console.log(cartTotalArr.length);
  if (!cartTotalArr.length == 0) {
    if (cartTotalArr[0].total) {
      // console.log("second end fggf");
      let cartTotal = cartTotalArr[0].total
      res.render('user/cart', { userheader: true, user, products, cartTotal, cartCount })
    } else {
      // console.log("ffddfdeeeeee");
      let cartTotal = 0
      res.render('user/cart', { userheader: true, user, products, cartTotal, cartCount })
    }
  }
  else {
    // console.log("kkkkkkkkkkk");
    let cartTotal = 0
    res.render('user/cart', { userheader: true, user, products, cartTotal, cartCount })
  }

})





///////*get add to cart *////////

router.get('/add-to-cart/:id', verifyLogin, (req, res) => {
  // console.log('dasdasdasdsdasddadadadad');
  userHelpers.addToCart(req.params.id, req.session.userLoggedIn._id).then(() => {
    // res.redirect('/')
    res.json({ status: true })
  })
})

////* post change product quantity*/////

router.post('/change-product-quantity', verifyLogin, (req, res, next) => {
  console.log(req.body, 'dasdasdasdddadasd');
  userHelpers.changeProductQuantity(req.body).then(async (response) => {
    totalAmountArr = await userHelpers.getTotalAmount(req.body.user)
    response.total = totalAmountArr[0].total
    res.json(response)

  })
})


/////////////////////*get remove cart item *////////////////////////////////////////////////////

router.get('/removeCartItem/:id', verifyLogin, (req, res) => {
  console.log(req.params.id);
  let userId = req.session.userLoggedIn._id
  // console.log(user);
  userHelpers.removeCartItem(req.params.id, userId).then(() => {
    res.redirect('/cart')
  })
})



/////////////////////////////////*post apply coupon*/////////////////////////////////////////////////////////

router.post('/applyCoupon', verifyLogin, (req, res) => {
  // console.log('apllyyyyyyyyyyy');
  // console.log(req.body);
  let userId = req.session.userLoggedIn._id
  // console.log(userId, '9999999');
  couponHelper.checkCoupon(req.body, userId).then((response) => {
    res.json(response)
  })
})


///////////////////*get place order */////////////////////////////////////////////////////////////////////////

router.get('/place-order', verifyLogin, async (req, res) => {

  let user = req.session.userLoggedIn
  let userId = user._id
  // console.log(user);
  let products = await userHelpers.getCartProductList(userId)
  // console.log(products,'11111111111111111');

  let totalAmount = await userHelpers.getTotalAmount(req.session.userLoggedIn._id)

  console.log(totalAmount, 'totalamount');

  let total = totalAmount[0].total;

  let mrp = totalAmount[0].mrp;

  let mrpDiscount = null;

  if (mrp === 0) {
    mrp = total
    mrpDiscount = 0;
  } else {
    mrpDiscount = mrp - total
    console.log(mrp + "-" + total);
  }
  let address = await addressHelpers.getAlladdress(user)
  let userDetails = await userHelpers.getUserDetials(userId)
  // console.log(userDetails, 'userdetialssssssssssssssss');
  if (userDetails.couponamount) {
    var grandTotal = total - userDetails.couponamount
  } else {
    grandTotal = total
  }
  let discount = userDetails.couponamount;
  let wallet = null
  if (userDetails.wallet != 0) {
    wallet = userDetails.wallet;
  }
  // console.log(discount);
  // console.log(grandTotal);
  res.render('user/place-order', { userheader: true, user, total, grandTotal, mrp, address, discount, wallet, mrpDiscount })
})

//////////////////////////////*post place order *///////////////////////////////////////////////////////////////////////////

router.post('/place-order', verifyLogin, async (req, res) => {
  // console.log(req.body, 'jgjhbhg');
  req.body.userId = req.session.userLoggedIn._id
  let products = await userHelpers.getCartProductList(req.body.userId)
  let totalPriceArr = await userHelpers.getTotalAmount(req.body.userId)
  let totalPrice = totalPriceArr[0].total

  if (req.body.checked) {
    let walletAmount = req.body.checked;
    totalPrice = totalPrice - walletAmount;
    console.log(totalPrice);
  }
  console.log(totalPrice, 'totalprice');
  let userAddress = await userHelpers.getUserAddress(req.body.addressid)

  let discount = null;

  let user = await userHelpers.getUserDetials(req.body.userId)
  if (user.couponamount) {
    discount = user.couponamount;
    totalPrice = totalPrice - discount;
  }
  let tot = parseFloat(totalPrice / 75).toFixed(2)
  // console.log(tot);
  req.session.totalAmount = tot

  userHelpers.placeOrder(req.body, products, totalPrice, userAddress, discount).then((orderId) => {
    // console.log(req.body);
    if (req.body['payment-method'] === 'COD') {
      res.json({ codSuccess: true })
    } else if (req.body['payment-method'] === 'ONLINE') {
      userHelpers.generateRazorpay(orderId, totalPrice).then((response) => {
        res.json(response)
      })
    } else if (req.body['payment-method'] === 'PAYPAL') {

      let orderId=orderId.toString()
      req.session.orderId = orderId;

      console.log(orderId,'hiiiiiiii');

      const create_payment_json = {
        "intent": "sale",
        "payer": {
          "payment_method": "paypal",
        },
        "redirect_urls": {
          "return_url": "https://amreeth.online/success",
          "cancel_url": "https://amreeth.online/cancel",
        },
        "transactions": [
          {
            "item_list": {
              "items": [
                {
                  "name": orderId,
                  "sku": "001",
                  "price": tot,
                  "currency": "USD",
                  "quantity": 1,
                },
              ],
            },
            "amount": {
              "currency": "USD",
              "total": tot,
            },
            "description": "order for Menscart",
          },
        ],
      };

      paypal.payment.create(create_payment_json, function (error, payment) {
        
        console.log('reached here');
        if (error) {
          throw error;
        } else {
          for (let i = 0; i < payment.links.length; i++) {
            if (payment.links[i].rel === "approval_url") {
              console.log('paypal,,,,,,,,,,');
              console.log(payment.links[i]);
              res.json({ paypal: true, 'val': payment.links[i].href });
            }
          }
        }
      });

    }
  })
})


router.get("/success", (req, res) => {
  console.log('2');

  let orderId = req.session.orderId;
  console.log(orderId);

  let tot = req.session.totalAmount
  // let tot = req.query.tot;
  console.log(tot);
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;

  const execute_payment_json = {
    "payer_id": payerId,
    "transactions": [
      {
        "amount": {
          "currency": "USD",
          "total": tot,
        },
      },
    ],
  };

  paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
    if (error) {
      console.log(error.response);
      throw error;
    } else {
      console.log(JSON.stringify(payment));
      // console.log(req.session.orderId + " " + req.session.userLoggedIn._id);
      // console.log("BEFORE STATUS CHANGE");
      userHelpers.changePaymentStatus(req.session.orderId, req.session.userLoggedIn._id).then(() => {
        res.redirect('/order-success')
      })
    }
  });
});

router.get('/cancel', (req, res) => {
  redirect('/')
})

//////////////////////////*post online razro pay payment*///////////////////////////////////

router.post('/verify-payment', (req, res) => {
  console.log(req.body);
  let userId = req.session.userLoggedIn._id;

  userHelpers.verifyPayment(req.body).then(() => {
    userHelpers.changePaymentStatus(req.body['order[receipt]'], userId).then(() => {
      console.log('payment successfull');
      res.json({ status: true })
    })
  }).catch((err) => {
    console.log(err);
    res.json({ status: false, errMsg: 'error occurred' })
  })
})

//////////////*get order success page *//////////////////////

router.get('/order-success', (req, res) => {
  let user = req.session.userLoggedIn
  // console.log(req.body);
  res.render('user/order-success', { user, userheader: true })
})

//////////////////////*get order status page*/////////////////

router.get('/order-status', verifyLogin, async (req, res) => {

  let user = req.session.userLoggedIn
  let cartCount = null
  if (req.session.userLoggedIn) {
    cartCount = await userHelpers.getCartCount(req.session.userLoggedIn._id)
  }
  await orderHelpers.getUserAllOrders(user).then((userAllOrders) => {
    res.render('user/orderstatus', { userheader: true, user, userAllOrders, cartCount })
  })
})

////////////////////////* get user order details*////////////////////////////

router.get('/order-details/:id', verifyLogin, async (req, res) => {
  let user = req.session.userLoggedIn
  let cartCount = null
  if (req.session.userLoggedIn) {
    cartCount = await userHelpers.getCartCount(req.session.userLoggedIn._id)
  }
  // console.log(req.params.id);
  await orderHelpers.getOrderDetails(req.params.id).then((orderDetails) => {
    address = orderDetails[0].deliveryDetails
    orderId = orderDetails[0]._id;
    orderStatus = orderDetails[0].status;
    cancelStatus = orderDetails[0].cancelStatus;
    deliveryStatus = orderDetails[0].deliveryStatus
    shippedStatus = orderDetails[0].shippedStatus
    if (orderStatus == 'placed') {
      orderStatus = true
    }

    res.render('user/one-order-details', { userheader: true, user, orderDetails, address, cartCount, orderId, orderStatus, cancelStatus, deliveryStatus, shippedStatus })
  })
})


//////////////////////*get cancel order*////////////////////////

router.get('/cancel-order', (req, res) => {
  console.log(req.query.id);
  console.log(req.query.status);

  orderHelpers.changeStatus(req.query.status, req.query.id).then((response) => {
    res.redirect('/order-status')
  })
})



////////////////////* get profile*////////////////////////

router.get('/profile', verifyLogin, async (req, res) => {
  let user = req.session.userLoggedIn
  var userid = user._id
  // console.log(user, 'fdfdffdffdf');
  let cartCount = null
  if (req.session.userLoggedIn) {
    user = await userHelpers.getUserDetials(userid)
    cartCount = await userHelpers.getCartCount(req.session.userLoggedIn._id)
  }
  res.render('user/user-profile', { userheader: true, user, cartCount })
})

////////*get edit profile*////////////
router.get('/edit-profile/:id', verifyLogin, async (req, res) => {
  let user = req.session.userLoggedIn
  let cartCount = null
  if (req.session.userLoggedIn) {
    cartCount = await userHelpers.getCartCount(req.session.userLoggedIn._id)
  }
  let userDetails = await userHelpers.getUserDetials(req.params.id)
  console.log(userDetails, 'userdetilas');
  res.render('user/editProfile', { userheader: true, user, cartCount, userDetails })
})


/*post edit profile*/
router.post('/edit-profile', verifyLogin, (req, res) => {
  // let userId = req.session.userLoggedIn._id
  // console.log(userId);
  console.log(req.body, 'sadfgbhnmj,kl');
  userHelpers.updateProfile(req.body).then(() => {
    res.redirect('/profile')
  })
})

/////////*get change password *//////////

router.get('/change-password', verifyLogin, (req, res) => {
  let user = req.session.userLoggedIn
  if (req.query.valid) {
    var passwordError = req.query.valid
  }
  res.render('user/change-password', { userheader: true, user, passwordError })
})

/////////*post change password *//////

router.post('/change-password', (req, res) => {
  userHelpers.changePassword(req.body).then((response) => {
    if (response.status) {
      req.session.user = null
      req.session.userLoggedIn = false
      res.redirect('/')
    }
    else {
      var string = encodeURIComponent('Enter the correct password');
      res.redirect('/change-password?valid=' + string)
    }
  })
})


///////*get view address*///////

router.get('/view-address', verifyLogin, async (req, res) => {
  let user = req.session.userLoggedIn
  // console.log(user);
  let cartCount = null
  if (req.session.userLoggedIn) {
    cartCount = await userHelpers.getCartCount(req.session.userLoggedIn._id)
  }
  await addressHelpers.getAlladdress(user).then((address) => {
    console.log(address);
    res.render('user/view-address', { userheader: true, user, address, cartCount })
  })

})


//////* get add address*/////////

router.get('/add-address', verifyLogin, async (req, res) => {
  let user = req.session.userLoggedIn
  let cartCount = null
  if (req.session.userLoggedIn) {
    cartCount = await userHelpers.getCartCount(req.session.userLoggedIn._id)
  }
  console.log(user);
  res.render('user/add-address', { userheader: true, user, cartCount })
})

///////*post add adress*///

router.post('/add-address', verifyLogin, (req, res) => {
  console.log(req.body);
  addressHelpers.addAddress(req.body).then((response) => {
    console.log(response);
    res.redirect('/view-address')
  })
})

/*get edit address*/
router.get('/edit-address/:id', verifyLogin, async (req, res) => {
  let user = req.session.userLoggedIn

  await addressHelpers.getOneAddress(req.params.id).then((addressDetails) => {
    res.render('user/edit-address', { userheader: true, user, addressDetails })
  })
})

/*post edit address */
router.post('/edit-address', verifyLogin, (req, res) => {
  console.log(req.body);
  addressHelpers.updateAddress(req.body).then(() => {
    res.redirect('/view-address')
  })
})


/*post delete address*/

router.get('/delete-address/:id', verifyLogin, (req, res) => {

  addressHelpers.deleteAddress(req.params.id).then(() => {
    res.redirect('/view-address')
  })
})

/*get product view*/

router.get('/product-view/:id', verifyLogin, async (req, res) => {

  console.log(req.params.id);
  let user = req.session.userLoggedIn
  let cartCount = null
  if (req.session.userLoggedIn) {
    cartCount = await userHelpers.getCartCount(req.session.userLoggedIn._id)
  }
  productHelpers.getProductDetails(req.params.id).then((product) => {
    console.log(product);
    res.render('user/product-view', { userheader: true, product, user, cartCount })
  })
})


/*get topwear*/

router.get('/topwears', async (req, res) => {
  let cartCount = null
  let user = req.session.userLoggedIn
  if (req.session.userLoggedIn) {
    cartCount = await userHelpers.getCartCount(req.session.userLoggedIn._id)
  }
  productHelpers.getTopwears().then((topwears) => {
    res.render('user/topwears', { userheader: true, topwears, cartCount, user })
  })
})


/*get bottam wear*/

router.get('/bottamwear', async (req, res) => {


  let cartCount = null
  let user = req.session.userLoggedIn
  if (req.session.userLoggedIn) {
    cartCount = await userHelpers.getCartCount(req.session.userLoggedIn._id)
  }
  productHelpers.getBottamwears().then((bottamwear) => {
    res.render('user/bottamwear', { userheader: true, bottamwear, cartCount, user })
  })
})

//////////////////////////subcategories products////////////////////

/*get casual shirt */

router.get('/casual-shirt', async (req, res) => {
  let cartCount = null
  let user = req.session.userLoggedIn
  if (req.session.userLoggedIn) {
    cartCount = await userHelpers.getCartCount(req.session.userLoggedIn._id)
  }
  let casualShirt = await productHelpers.getCasualShirts()
  res.render('user/casualShirts', { userheader: true, casualShirt, cartCount, user })
})

/*get formal shirt*/

router.get('/formal-shirt', async (req, res) => {
  let cartCount = null
  let user = req.session.userLoggedIn
  if (req.session.userLoggedIn) {
    cartCount = await userHelpers.getCartCount(req.session.userLoggedIn._id)
  }
  let formalshirt = await productHelpers.getFormalshirt()
  res.render('user/formalShirts', { userheader: true, formalshirt, cartCount, user })
})


/*get T shirt*/

router.get('/tshirt', async (req, res) => {
  let cartCount = null
  let user = req.session.userLoggedIn
  if (req.session.userLoggedIn) {
    cartCount = await userHelpers.getCartCount(req.session.userLoggedIn._id)
  }
  let tshirt = await productHelpers.getTshirt()
  res.render('user/tShirt', { userheader: true, tshirt, cartCount, user })
})

/*get Jeans */
router.get('/jeans', async (req, res) => {
  let cartCount = null
  let user = req.session.userLoggedIn
  if (req.session.userLoggedIn) {
    cartCount = await userHelpers.getCartCount(req.session.userLoggedIn._id)
  }
  let jeans = await productHelpers.getJeans()
  res.render('user/jeans', { userheader: true, jeans, cartCount, user })

})

/*get Jeans */
router.get('/formal-trousers', async (req, res) => {
  let cartCount = null
  let user = req.session.userLoggedIn
  if (req.session.userLoggedIn) {
    cartCount = await userHelpers.getCartCount(req.session.userLoggedIn._id)
  }
  let formalTrouser = await productHelpers.getFormalTrousers()
  res.render('user/formalTrousers', { userheader: true, formalTrouser, cartCount, user })

})

/*get Jeans */
router.get('/casual-trousers', async (req, res) => {
  let cartCount = null
  let user = req.session.userLoggedIn
  if (req.session.userLoggedIn) {
    cartCount = await userHelpers.getCartCount(req.session.userLoggedIn._id)
  }
  let casualTrousers = await productHelpers.getCasualTrousers()
  res.render('user/casualTrousers', { userheader: true, casualTrousers, cartCount, user })

})


///////////////////OFFERS////////////

//////////*get coupons and offers *///////////////

router.get('/coupons-offers', verifyLogin, async (req, res) => {
  let user = req.session.userLoggedIn
  let coupons = await couponHelper.getAllCoupons()
  let productoffer = await offerHelper.viewOfferPro()
  let categoryoffer = await offerHelper.getCategoryOffer()

  // console.log(coupons, '111111111111');
  res.render('user/coupons-offers', { userheader: true, user, coupons, productoffer, categoryoffer })
})


///////////*get wallet */////////////////

router.get('/wallet', verifyLogin, async (req, res) => {
  let user = req.session.userLoggedIn
  let referId = user._id;
  let userId = user._id;

  let referLink = `https://amreeth.online/signup/${referId}`;


  if (req.session.userLoggedIn) {
    cartCount = await userHelpers.getCartCount(req.session.userLoggedIn._id)
  }
  let userDetails = await userHelpers.getUserWallet(userId)

  let wallet = null;

  if (userDetails.wallet) {
    wallet = userDetails.wallet
  }
  res.render('user/wallet', { userheader: true, user, cartCount, wallet, referLink })

})

///////////////////seach//////////////////////////

router.post('/search', async (req, res) => {
  let user = req.session.userLoggedIn
  let cartCount = null;
  if (req.session.userLoggedIn) {
    cartCount = await userHelpers.getCartCount(req.session.userLoggedIn._id)
  }
  let searchedproducts = await productHelpers.searchProducts(req.body.item)
  // console.log(searchedproducts,'seachrddddddddddddddd itemss');
  res.render('user/search', { userheader: true, user, cartCount, searchedproducts })
})









module.exports = router;
