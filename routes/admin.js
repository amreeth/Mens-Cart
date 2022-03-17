var express = require('express');
var router = express.Router();
var productHelper = require('../helpers/product-helpers')
var userHelper = require('../helpers/user-helpers')
var categoryHelper = require('../helpers/category-helpers');
var orderHelper = require('../helpers/order-helpers')
var couponHelper = require('../helpers/coupon-helpers')
var offerHelper = require('../helpers/offer-helpers')
var collection = require('../config/collection')
const { response } = require('express');

var adminLogin = {
    name: 'Admin',
    emailId: 'admin@gmail.com',
    password: 'admin'
}


const verifyLogin = (req, res, next) => {
    if (req.session.login) {
        next()
    } else {
        res.redirect('/admin/login')
    }
}
/*GET admin login */
router.get('/login', (req, res) => {
    if (req.session.login) {
        res.redirect('/admin')
    } else {
        res.render('admin/admin-login',)
    }
})

/*Post admin login */
router.post('/login', (req, res) => {
    if (adminLogin.emailId == req.body.email && adminLogin.password == req.body.password) {
        req.session.login = true
        req.session.email = req.body.email
        req.session.password = req.session.password
        req.session.name = adminLogin.name
        let data = req.session.name
        res.redirect('/admin')
    }
    else {
        var error = 'Invalid username or password..'
        res.render('admin/admin-login', { error })
    }
})


/* GET admin home page. */
router.get('/', async function (req, res, next) {
    if (req.session.login) {
        let totalUsers = await userHelper.getAllUsersCount()
        let profit = await orderHelper.getTotalProfit()
        let totalOrders = await orderHelper.TotalOrderCount()
        let totalProductCount = await productHelper.getAllProductsCount()
        let products = await productHelper.getAllProducts()
        let razorPayTotal = await orderHelper.getrazroPayTotal()
        let codTotal = await orderHelper.getCodTotal()
        let paypalTotal = await orderHelper.getPaypalTotal()


        res.render('admin/admin-home', { layout: 'admin-layout.hbs', admin: true, totalUsers, profit, totalOrders, totalProductCount, products, razorPayTotal, codTotal, paypalTotal })
    } else {
        res.redirect('/admin/login')
    }
});


/*get logout */

router.get('/logout', (req, res) => {
    req.session.login = null
    res.redirect('/admin/login')
})

/* get product list*/
router.get('/product', verifyLogin, (req, res) => {
    res.render('admin/product', { layout: 'admin-layout.hbs', admin: true })
});


// GET add product page
router.get('/add-product', verifyLogin, async function (req, res, next) {
    let listCategory = await categoryHelper.getAllCategory()
    // console.log(listCategory,'categories');
    // console.log(listCategory[0].subcategory, 'fsdffdf');
    // console.log(listCategory[1].subcategory,'1111');
    let sub1 = listCategory[0].subcategory;
    let sub2 = listCategory[1].subcategory;
    let listSubcategory = sub1.concat(sub2);

    res.render('admin/add-product', { layout: 'admin-layout.hbs', admin: true, listCategory, listSubcategory })
});


/////*Post add product *//////////

router.post('/add-product', (req, res) => {
    // console.log(req.files.image1,'11111111');
    // console.log(req.body,'11111111111111111');

    productHelper.addProduct(req.body).then((response) => {
        // console.log('response');
        id = response
        // console.log("fdfdfffffffffffffffffffffff",id);
        console.log(req.files.image1);
        // console.log("------------------------------------------------");
        let image = req.files.image1;

        let image2=req.files.image2;

        let image3=req.files.image3;

        image.mv('./public/product-images/' + id + '.jpg')

        image2.mv('./public/product-images/' + id + 'image2.jpg')

        image3.mv('./public/product-images/' + id + 'image3.jpg')

        res.redirect('/admin/product-list')

    })


})

/* get product list*/
router.get('/product-list', verifyLogin, (req, res, next) => {
    productHelper.getAllProducts().then((products) => {
        res.render('admin/product-list', { layout: 'admin-layout.hbs', admin: true, products })
    })
});


/* Get Delete product*/
router.get('/delete-product/:id', verifyLogin, (req, res) => {
    let prodId = req.params.id
    // console.log(prodId);
    productHelper.deleteProduct(prodId).then(() => {
        res.redirect('/admin/product-list')
    })
})

/* Get Edit product*/

router.get('/edit-product/:id', verifyLogin, async (req, res) => {
    let product = await productHelper.getProductDetails(req.params.id)
    let listCategory = await categoryHelper.getAllCategory()
    // console.log(listCategory,'111111111111111');
    // console.log(listCategory[0].subcategory, 'fsdffdf');
    let sub1 = listCategory[0].subcategory;
    let sub2 = listCategory[1].subcategory;
    let listSubcategory = sub1.concat(sub2);
    // console.log(product);
    res.render('admin/edit-product', { layout: 'admin-layout.hbs', admin: true, product, listCategory, listSubcategory })
})

/*Post Edit product */

router.post('/edit-product', (req, res) => {

    // console.log(req.body,'1111111111');
    // console.log(req.query.id);
    let id = req.query.id
    productHelper.updateProduct(req.query.id, req.body).then(() => {
        res.redirect('/admin/product-list')
        if (req.files.image1) {
            let image = req.files.image1
            image.mv('./public/product-images/' + id + '.jpg')
        }
    })
})

/* get user list*/
router.get('/userslist', verifyLogin, (req, res) => {
    userHelper.getAllUsers().then((users) => {
        res.render('admin/userslist', { layout: 'admin-layout.hbs', admin: true, users })
    })
})



/*Get user block */

router.get('/block/:id', verifyLogin, (req, res) => {
    // console.log(req.params.id);
    userHelper.blockUser(req.params.id).then((response) => {
        res.redirect('/admin/userslist')
    })
})


/*Get user unblock */

router.get('/unblock/:id', verifyLogin, (req, res) => {
    // console.log(req.params.id);
    userHelper.unBlockUser(req.params.id).then((response) => {
        res.redirect('/admin/userslist')
    })
})

/*get category*/

router.get('/category', verifyLogin, (req, res) => {
    categoryHelper.getAllCategory().then((category) => {
        // console.log(category);
        res.render('admin/view-category', { layout: "admin-layout.hbs", admin: true, category })
    })
})



/*get add category*/

router.get('/addcategory', verifyLogin, async (req, res) => {

    let listCategory = await categoryHelper.getAllCategory()

    res.render('admin/add-category', { layout: 'admin-layout.hbs', admin: true, listCategory })
})

/*post add category*/
router.post('/addcategory', verifyLogin, (req, res) => {
    categoryHelper.addCategory(req.body).then((response) => {
        res.redirect('/admin/addcategory')
    })
})

/*post subcategory*/
router.post("/addsubcategory", (req, res) => {
    // categoryHelper.addSubCategory(req.body).then((data) => {
    // //   if (data.modifiedCount == 0) {
    // //     req.session.subCatErr = "This Sub Category Already Exists";
    // //     res.redirect("/admin/add-category");
    // //   } else {
    // //     res.redirect("/admin/add-category");
    // //   }
    // })
    // console.log(req.body);
    categoryHelper.addSubCategory(req.body).then((data) => {
        res.redirect('/admin/addcategory')
    })
})

/* get edit category */
router.get('/editcategorey/:id', verifyLogin, async (req, res) => {
    let oneCategorey = await categoryHelper.getCategory(req.params.id)
    // console.log(oneCategorey, 'heloooooooooo');
    res.render('admin/edit-categorey', { layout: 'admin-layout.hbs', admin: true, oneCategorey })
})

/* post edit category*/

router.post('/editcategorey/:id', (req, res) => {
    categoryHelper.updateCategory(req.params.id, req.body).then(() => {
        res.redirect('/admin/category')
    })
})

/*delete category*/

router.get('/deletecategory/:id', (req, res) => {
    let catId = req.params.id
    categoryHelper.deleteCategory(catId).then((response) => {
        res.redirect('/admin/category')
    })
})

router.get("/delete-subcategory", (req, res) => {
    categoryHelper.deletesubCategory(req.query).then(() => {
        res.redirect("/admin/category");
    });
});


/*get all order list */

router.get('/allOrders', verifyLogin, (req, res) => {
    orderHelper.getAllOrders().then((allOrders) => {
        res.render('admin/allOrders', { layout: 'admin-layout.hbs', admin: true, allOrders })
    })
})


/*get change status */

router.get('/status-change', (req, res) => {
    let status = req.query.status
    let id = req.query.id
    orderHelper.changeStatus(status, id).then((data) => {
        res.redirect('/admin/allOrders')
    })
})


/*get coupon */
router.get('/coupons', verifyLogin, (req, res) => {
    couponHelper.getAllCoupons().then((coupons) => {
        res.render('admin/coupons', { layout: 'admin-layout.hbs', admin: true, coupons })
    })
})


/*get add coupon */
router.get('/addcoupn', verifyLogin, (req, res) => {
    res.render('admin/addcoupon', { layout: 'admin-layout.hbs', admin: true })
})

/*post add coupon */
router.post('/addcoupon', verifyLogin, (req, res) => {
    // console.log(req.body);
    couponHelper.addCoupon(req.body).then(() => {
        res.redirect('/admin/coupons')
    })
})


////////////////*get sales report*//////////////////////

router.get('/salesreport', verifyLogin, async (req, res) => {
    let salesreport = await orderHelper.getsalesReport()
    // console.log(salesreport,'sasasssasas');
    res.render('admin/salesreport', { layout: 'admin-layout.hbs', admin: true, salesreport })
})


router.post('/salesreport/report', async (req, res) => {
    // console.log('i reached here')
    let salesReport = await orderHelper.getSalesReport(req.body.from, req.body.to)
    // console.log('salesReport')
    // console.log(salesReport)
    res.json({ report: salesReport })
})


router.post('/salesreport/monthlyreport', async (req, res) => {

    let singleReport = await orderHelper.getNewSalesReport(req.body.type)
    // console.log(singleReport,'sssssssssssssss');
    res.json({ wmyreport: singleReport })
})



///////////////////////////OFFERS////////////////////////////////////////////


////////////////////////////////*category offers*/////////////////////////////



/*get add category offer*/

router.get('/addCategoryOffer',verifyLogin, async (req, res) => {

    let categories = await categoryHelper.getAllCategory()
    console.log(categories, '1111111111111');
  
    res.render('admin/add-categoryOffer', { layout: 'admin-layout.hbs', admin: true,categories })
})


/*post add category offer*/

router.post('/addCategoryOffer',verifyLogin, async (req, res) => {

    console.log(req.body);

    let viewPro = await offerHelper.addCategoryOffer(req.body)
    res.json(viewPro)

    // res.redirect('/admin/category-offer')

});


/*get category offers*/

router.get("/category-offer",verifyLogin, async (req, res) => {
    let offerview = await offerHelper.getCategoryOffer()
    

    res.render('admin/categoryOffers', { layout: 'admin-layout.hbs', admin: true, offerview })
})


/*delete category offers*/

router.post('/deleteOffer',verifyLogin, async (req, res) => {

    console.log(req.body);

    let response = await offerHelper.deleteCategoryOffer(req.body.catOfferId, req.body.offerItem)
    res.json({ status: true })

})








////////////////////////////////product offer///////////////////////////////////////

/*get product offer*/


router.get('/product-offer', verifyLogin, async (req, res) => {

    let productOffers = await offerHelper.viewOfferPro()

    res.render('admin/productOffer', { layout: 'admin-layout.hbs', admin: true, productOffers })

});


/*get add product offer*/

router.get('/add-productoffer', verifyLogin, async (req, res) => {

    let allproducts = await productHelper.getAllProducts()

    let categories = await categoryHelper.getAllCategory()
    console.log(categories, 'herrrrrreee');
    res.render('admin/add-productOffer', { layout: 'admin-layout.hbs', admin: true,categories, allproducts })
})


////////////////*post add product offer */////////////////////

router.post('/add-productoffer', verifyLogin, (req, res) => {
    console.log(req.body);

    offerHelper.addProductOffer(req.body).then((offer) => {
        res.json(offer)
    })
})


///////*delete product offer *//////////

router.post('/deleteOfferPro', (req, res) => {
    console.log(req.body);
    offerHelper.deleteProOffer(req.body.proOfferId, req.body.profferItem)
    res.json({ status: true })
});



/*get all product offer *//////////

router.get('/getAllPro', async (req, res) => {
    let pro = await offerHelper.getProductsByCat(req.query.cat)
    res.json(pro)
})






module.exports = router;
