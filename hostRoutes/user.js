var express = require('express');
var router = express.Router();
var jwt = require('../jwt');
var auth = require('../auth')
var mysql = require('../mysql');
const bcrypt = require('bcryptjs')
var sms = require('../sms');

module.exports = router;

router.post('/', async (req, res) => {

    var businessNumber = req.body.businessNumber;
    var userName = req.body.userName;
    var userPhone = req.body.userPhone;
    var password = req.body.password;

    var hostName = req.body.hostName;
    var storeName = req.body.storeName;
    var storePhone = req.body.storePhone;
    var address = req.body.address;
    var zipCode = req.body.zipCode;

    var latitude = req.body.latitude;
    var longitude = req.body.longitude;
    
    var businessLicenseImage = req.body.businessLicenseImage;

    if(!businessNumber || !userName || !userPhone || !password || !hostName || !storeName || !storePhone || !address || !zipCode || !businessLicenseImage|| !latitude || !longitude)
        return res.status(400).end();

    await new Promise((resolve, reject) => {
        bcrypt.hash(req.body.password, 8, (err, hash) => {
          if (err) return reject(err);
          password = hash;
          resolve();
        });
    });

    try{

        var select = 'SELECT * FROM host WHERE businessNumber = ?';
        var result = await mysql.do(select,[businessNumber]);
        if(result.length != 0) 
            return res.status(400).json({message: '이미 가입된 사업장 입니다.'});

        await mysql.beginTransaction();

        var insert= 'INSERT INTO host (businessNumber,name,phone,password,zipCode) VALUE  (?,?,?,?,?)'; 
        var userResult = await mysql.do(insert,[businessNumber,userName,userPhone,password,zipCode]);

        var insert = 'INSERT INTO store (name,mainPhone,address,host,hostId,businessLicenseImage,latitude,longitude) VALUE (?,?,?,?,?,?,?,?)';
        await mysql.do(insert,[storeName,storePhone,address,hostName,userResult.insertId,businessLicenseImage,latitude,longitude]);

        await mysql.commitTransaction();

        return res.json({token : await jwt.sign({ hostId: userResult.insertId })})    
   
    }
    catch(e){
        await mysql.rollbackTransaction();
        return res.status(400).json({message: '잠시 후 다시 시도해주세요.'});
    }

});

router.get('/login',async (req,res) => {
    var businessNumber = req.query.businessNumber;
    var password = req.query.password;

    if(!businessNumber || !password) 
        return res.status(400).end();

    try{
        var select = 'SELECT hostId,password FROM host WHERE businessNumber = ?';
        var result = await mysql.do(select,[businessNumber]);

        if(result.length == 0)
            return res.status(400).json({message: '사업자번호 혹은 비밀번호를 확인해 주세요.'});
       
        bcrypt.compare(password,  result[0].password, async (err, flag) => {
            if (err || flag === false) return res.status(400).json({message: '사업자번호 혹은 비밀번호를 확인해 주세요.'});
            return res.json({ token: await jwt.sign({ hostId: result[0].hostId })});     
        });
           
    }catch(e){
        return res.status(400).json({message: '잠시 후 다시 시도해주세요.'});
    }
})

router.get('/me',auth,async (req,res) =>{
    
    var hostId = req.auth.hostId;

    try{
        var selectRow = ['host.hostId','isCall'];

        var select = 'SELECT ?? FROM host JOIN store ON (host.hostId = store.hostId) WHERE host.hostId = ?';
        var result = await mysql.do(select,[selectRow,hostId]);


        if(result.length ==0)
            return res.status(400).json({message: '잠시 후 다시 시도해주세요.'});
        
        return res.json(result[0]);

    }catch(e){
        return res.status(400).json({message: '잠시 후 다시 시도해주세요.'});
    }
})

router.get('/phoneAuth',async function(req,res){
    var phone = req.query.phone;
    
    if(!phone)
        return res.status(400).end();

    var verifyNumber = Math.floor(Math.random() * 90000) + 9999;
    sms.authAligo(phone,'디쉬나우 사장님 회원가입 인증번호 입니다. \n ['+verifyNumber+']');
    return res.json(verifyNumber);
})


router.put('/pushToken',auth,async(req,res)=>{

    var hostId = req.auth.hostId;
    var pushToken = req.body.pushToken;

    try{

        var update = 'UPDATE host SET pushToken = ? WHERE hostId = ?'
        await mysql.do(update,[pushToken,hostId])

        return res.end();

    }catch(e){
        return res.status(400).json({message: '잠시 후 다시 시도해주세요.'});
    }

})

router.put('/passwordChange',async(req,res)=>{
    var hostId = req.body.hostId;
    var password = req.body.password;

    await new Promise((resolve, reject) => {
        bcrypt.hash(password, 8, (err, hash) => {
          if (err) return reject(err);
          password = hash;
          resolve();
        });
    });
    try{
        var update = 'UPDATE host SET password = ? WHERE hostId = ?'; 
        await mysql.do(update,[password,hostId]);
        return res.end();
    }catch(e){
        return res.status(400).json({message: '잠시 후 다시 시도해주세요.'});
    }
})
