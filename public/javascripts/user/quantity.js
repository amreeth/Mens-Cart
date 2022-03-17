function changeQuantity(cartId, proId, userId, count) {
    let total = parseInt(document.getElementById('total').innerHTML)
    let price = parseInt(document.getElementById('price'))
    let quantity = parseInt(document.getElementById(proId).innerHTML)
    count = parseInt(count)
    $.ajax({
        url: '/change-product-quantity',
        data: {
            user: userId,
            cart: cartId,
            product: proId,
            count: count,
            quantity: quantity
        },
        method: 'post',
        success: (response) => {
            if (response.removeProduct) {
                alert('product removed from cart')
                location.reload()
            } else {
                // console.log(response)
                document.getElementById(proId).innerHTML = quantity + count
                document.getElementById('total').innerHTML = response.total
            }
        }
    })
}