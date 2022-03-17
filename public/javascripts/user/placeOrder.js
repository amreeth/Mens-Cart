$('#ApplyCoupon').submit((e) => {
    e.preventDefault()
    $.ajax({
        url: '/applyCoupon',
        method: 'post',
        data: $('#ApplyCoupon').serialize(),
        success: (response) => {
            if (response.CoupenUsed) {
                document.getElementById('CouponMsg').innerHTML = "Coupon Already Used"
            }
            else if (response.Coupon) {
                let total = document.getElementById('tootal').innerHTML

                document.getElementById('CouponMsg').innerHTML = "Coupon Applied"
                document.getElementById("total").innerHTML=total-response.CoupDiscount

                document.getElementById("coupon").innerHTML = response.CoupDiscount
            }
            else if (response.NoCoupon) {
                document.getElementById('CouponMsg').innerHTML = "No Coupon Found"
            }
            else if (response.OneCouponUsed) {
                document.getElementById('CouponMsg').innerHTML = "Already One Coupon Used"
            }

        }
    })
    
})

function checkWallet(wallet,total){
    if (document.getElementById('wallet').checked) 
  {
      let ttotal = parseFloat(total)-parseFloat(wallet)
    document.getElementById('total').innerHTML = ttotal;
  } else {
    document.getElementById('total').innerHTML = total;
  }
}







$("#checkout-form").submit((e) => {
    e.preventDefault()
    $.ajax({
        url: '/place-order',
        method: 'post',
        data: $('#checkout-form').serialize(),
        success: (response) => {
            // alert(response)
            if (response.codSuccess) {
                location.href = '/order-success'
            } else if(response.paypal) {
                location.href= response.val
            }
            else{
                razorpayPayment(response)
            }
        }
    })

})

function razorpayPayment(order) {

    var options = {
        "key": "rzp_test_U1h7N0iAoqO2Vn", // Enter the Key ID generated from the Dashboard
        "amount": "order.amount", // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
        "currency": "INR",
        "name": "MensCart",
        "description": "Test Transaction",
        "image": "https://example.com/your_logo",
        "order_id": order.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
        "handler": function (response) {
            // alert(response.razorpay_payment_id);
            // alert(response.razorpay_order_id);
            // alert(response.razorpay_signature)

            verifyPayment(response, order)
        },
        "prefill": {
            "name": "Gaurav Kumar",
            "email": "gaurav.kumar@example.com",
            "contact": "9999999999"
        },
        "notes": {
            "address": "Razorpay Corporate Office"
        },
        "theme": {
            "color": "#3399cc"
        }
    };
    var rzp1 = new Razorpay(options);
    rzp1.open();
}
function verifyPayment(payment, order) {
    $.ajax({
        url: '/verify-payment',
        data: {
            payment,
            order
        },
        method: 'post',
        success: (response) => {
            if (response.status) {
                location.href = '/order-success'
            } else {
                alert('payment failed')
            }
        }
    })
}
