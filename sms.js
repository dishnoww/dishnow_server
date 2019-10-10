var request = require("request"); 

module.exports = {
    authAligo(phoneNumber,message){
        request.post("https://apis.aligo.in/send/")
               .form({
                    key : process.env.ALIGO_KEY,
                    user_id : process.env.ALIGO_USERID,
                    sender : process.env.ALIGO_SENDER,
                    receiver : phoneNumber,
                    msg_type : 'sms',
                    msg: message
                })  
    }
    
}

