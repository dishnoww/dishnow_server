var express = require('express');
var router = express.Router();
var jwt = require('../jwt');
var auth = require('../auth')
var mysql = require('../mysql');
var sms = require('../sms');
var sns = require('../sns')

module.exports = router;

router.post('/login', async (req, res) => {
    
    var token = req.body.token;
    var type = req.body.type;
   
    if(!token || !type)
        return res.status(400).end();
    
    try{
        
        switch(type){
            case 'facebook' :
                var id = await sns.facebook(token);
            break;
            case 'kakao' :
                var id = await sns.kakao(token);
            break;
            case 'naver' :
                var id = await sns.naver(token);
            break;
	    case 'email' :
		var id = token;
	    break;
        }

        var select = 'SELECT userId FROM user WHERE id = ? AND type = ?';
        var result = await mysql.do(select,[id,type]);


        if(result.length == 0) 
            return res.json({token:''});
        else
            return res.json({token : await jwt.sign({ userId: result[0].userId })})
            
    }
    catch(e){
        return res.status(400).json({message: '잠시 후 다시 시도해주세요.'});
    }

});

router.post('/register',async (req,res) => {

    var token = req.body.token;
    var type = req.body.type;
    var sex = req.body.sex;
    var birthDate = req.body.birthDate;
    var phone = req.body.phone;
    var name = req.body.name;

    var id = 0;

    if(!token || !type || !sex || !birthDate || !phone || !name)
        return res.status(400).end();

    try{

        switch(type){
            case 'facebook' :
                id = await sns.facebook(token);
            break;
            case 'kakao' :
                id = await sns.kakao(token);
            break;
            case 'naver' :
                id = await sns.naver(token);
            break;
	    case 'email' :
		id = token;
	    break;
        }

        if(id == 0)
            return res.status(400).json({message: '잠시 후 다시 시도해주세요.'});
        
        var insert = 'INSERT INTO user (id,type,sex,birthDate,phone,name) VALUE (?,?,?,?,?,?)'; 
        var result = await mysql.do(insert,[id,type,sex,birthDate,phone,name]);

        return res.json({token : await jwt.sign({ userId: result.insertId })})

    }catch(e){
        return res.status(400).json({message: '잠시 후 다시 시도해주세요.'});
    }
})

router.get('/phoneAuth',async function(req,res){
    var phone = req.query.phone;
    
    if(!phone)
        return res.status(400).end();

    var verifyNumber = Math.floor(Math.random() * 90000) + 9999;
    sms.authAligo(phone,'디쉬나우 회원가입 인증번호 입니다. \n ['+verifyNumber+']');
    return res.json(verifyNumber);
})

router.get('/me',auth,async (req,res) =>{

    var userId = req.auth.userId;

    try{
        var selectRow = ['userId','point','name','phone','image','nickname','isTutorial'];

        var select = 'SELECT ?? FROM user WHERE userId = ?';

        var result = await mysql.do(select,[selectRow,userId]);

        if(result.length ==0)
            return res.status(400).json({message: '잠시 후 다시 시도해주세요.'});

        var select = 'SELECT COUNT(rating) as reviewCount FROM review WHERE userId = ?'
        var reviewCountResult = await mysql.do(select,[userId]);

        result[0].reviewCount = reviewCountResult[0].reviewCount;
        
        return res.json(result[0]);

    }catch(e){
        return res.status(400).json({message: '잠시 후 다시 시도해주세요.'});
    }
})

router.put('/pushToken',auth,async(req,res)=>{

    var userId = req.auth.userId;
    var pushToken = req.body.pushToken;

    try{

        var update = 'UPDATE user SET pushToken = ? WHERE userId = ?'
        await mysql.do(update,[pushToken,userId])

        return res.end();

    }catch(e){
        return res.status(400).json({message: '잠시 후 다시 시도해주세요.'});
    }

})

router.put('/tutorial',auth,async(req,res)=>{

    var userId = req.auth.userId;

    try{

        var update = 'UPDATE user SET isTutorial = "true" WHERE userId = ?'
        await mysql.do(update,[userId])

        return res.end();

    }catch(e){
        return res.status(400).json({message: '잠시 후 다시 시도해주세요.'});
    }
})


router.put('/nickname',auth,async (req,res)=>{

    var userId = req.auth.userId;
    var nickname = req.body.nickname;

    try{
        var update = 'UPDATE user SET nickname = ? WHERE userId = ?';
        await mysql.do(update,[nickname,userId]);

        return res.end();
    
    }catch(e){
        return res.status(400).json({message : '잠시 후 다시 시도해주세요.'});
    }
})

router.put('/profile',auth,async (req,res)=>{

    var userId = req.auth.userId;
    var image = req.body.image;

    if(!image)return res.status(400).end();

    try{
        var update = 'UPDATE user SET image = ? WHERE userId = ?';
        await mysql.do(update,[image,userId]);

        return res.end();
    
    }catch(e){
        return res.status(400).json({message : '잠시 후 다시 시도해주세요.'});
    }
})

router.get('/dishnowPoint',auth,async (req,res) =>{

    var userId = req.auth.userId;

    try{
        var selectRow = ['dishnowPoint.type','dishnowPoint.createdAt','dishnowPoint.name','dishnowPoint.diff'];

        var select = 'SELECT ?? FROM dishnowPoint JOIN user ON(user.userId = dishnowPoint.userId) WHERE user.userId = ? ' +
			'ORDER BY dishnowPoint.pointId DESC '
        var result = await mysql.do(select,[selectRow,userId]);

        return res.json(result);
    }catch(e){
        return res.status(400).json({message: '잠시 후 다시 시도해주세요.'});
    }
});

router.post('/dishnowPoint',auth,async (req,res) => {

    var userId = req.auth.userId;
    var type = req.body.type;
    var diff = req.body.diff;
    var name = req.body.name;
    var phone = req.body.phone;

    if(!type || !diff || !name || !phone) return;

    try{
        var insert = 'INSERT INTO dishnowPoint (userId,type,diff,name,phone) VALUE (?,?,?,?,?)';
        var result = await mysql.do(insert,[userId,type,diff,name,phone]);
        
        var update = 'UPDATE user SET point = point';
        if(type == 'use'){
            update = `${update} - ${diff} WHERE userId = ?`
            await mysql.do(update,userId);
	}
	var select = 'SELECT point from user WHERE userId = ?'
	result = await mysql.do(select,userId);
     
        return res.json(result[0]);

    }catch(e){
        return res.status(400).json({message: '잠시 후 다시 시도해주세요.'});
    }
});

router.delete('/',async (req,res) => {

    var userId = req.auth.userId;
    var deletestate = 'DELETE FROM user WHERE userId = ?';

	try{
        await mysql.do(deletestate,userId);
        return res.end();
	}catch(e){
		return res.status(400).json({message: '잠시 후 다시 시도해주세요.'});
    }
    
});


router.get('/test',async (req,res) => {

	try{
		return res.status(200).json({message: '통신 성공'});
	}catch(e){
		return res.status(400).json({message: '잠시 후 다시 시도해주세요.'});
	}
});
