//Check that newly entered password meets standards
// $('#inputNewPassword').on()

$('#button-save').on("click",(data)=>{
    data.preventDefault();
    let newPassword = $('#inputNewPassword').val();
    let retypePassword = $('#retypePassword').val();
    $('.passwordTooShortAlert').addClass("hideElement")
    $('.passwordsNotMatchingAlert').addClass("hideElement")

    //Get key from url
    const fullUrl = window.location.href;
    const queryParam = fullUrl.split("resetKey=")[1]
    
    //Return if no key is in the url
    if(queryParam === undefined || queryParam.length < 20){
        $(".resetKeyExpired").removeClass("hideElement")
        console.warn("script catch1")
        return
    }

    if(newPassword !== retypePassword){
        $('.passwordsNotMatchingAlert').removeClass("hideElement")
        return
    }

    //If password is correct length, send password and key
    if(newPassword.length < 8){
        $('.passwordTooShortAlert').removeClass("hideElement")
    }else{
        $.ajax({
            method: "POST",
            url: "./newPassword",
            data: {
                newPassword: newPassword,
                key: queryParam
            }
        }).done((data)=>{
            if(!data.message || data.message === false){ //reset key doesn't exist
                $('.resetKeyExpired').removeClass('hideElement');
                console.warn("returned false")
            }else{ //password reset succeeded
                window.location = '/passwordChanged'; //redirect
            }
        }).fail((err)=>{
            console.warn("ajax error:" + err)
        });
    }
});