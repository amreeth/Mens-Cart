function addToCart(proId) {
    $.ajax({
        url: '/add-to-cart/' + proId,
        method: 'get',
        success: (response) => {

            if (response.status) {
                Swal.fire(
                    'Item added to Cart!',
                  )
                let count = $('#cart-count').html()
                count = parseInt(count) + 1
                $('#cart-count').html(count)
            }else{
                Swal.fire(
                    'Login First!',
                  )
            }
        }
    })
}

function addToWishlist(proId) {
    
    $.ajax({
        url: '/add-to-wishlist/' + proId,
        method: 'get',
        success: (response) => {
            if(response.status){
                Swal.fire( 'Item added to Wishlist', )
            }
            else if(response.exist){
                Swal.fire( 'Item already Exist in wishlist', )
            }
            else{
                Swal.fire( 'Login first!', )
            }
        }
    })
}