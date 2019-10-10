var express = require('express');
var router = express.Router();
var auth = require('../auth')
var mysql = require('../mysql');
var onesignal = require('../userRoutes/onesignal')

module.exports = router;

router.get('/',auth,async (req,res)=>{

    var hostId = req.auth.hostId;
    var page = req.query.page || 0;

    try{

        var select = 'SELECT storeId FROM store WHERE hostId = ?'
        var result = await mysql.do(select,[hostId])

        if(result.length == 0)
            return res.status(400).end();

        
        var selectRow = ['reservation.reservationId','reservation.createdAt','reservation.peopleNumber','reservation.time',
                         'user.name']
        var select = 'SELECT ?? FROM reservation JOIN user ON (reservation.userId = user.userId) WHERE storeId = ? AND reservation.state = "arrive" ORDER BY reservation.createdAt DESC LIMIT ?,? '
        var result = await mysql.do(select,[selectRow,result[0].storeId,page*20,20]);

        return res.json(result);
        

    }catch(e){
        return res.status(400).json({message: '잠시 후 다시 시도해주세요.'});
    }
})

router.get('/request',auth,async (req,res)=>{

    var hostId = req.auth.hostId;

    try{

        var select = 'SELECT storeId FROM store WHERE hostId = ?'
        var result = await mysql.do(select,[hostId])

        if(result.length == 0)
            return res.status(400).end();

        var select = 'SELECT reservationId,time,reservation.createdAt,peopleNumber,name FROM reservation JOIN user ON(reservation.userId = user.userId) WHERE storeId =? AND state = "request" AND reservation.createdAt > (NOW() - INTERVAL 2 MINUTE) ' //2분
        return res.json(await mysql.do(select,[result[0].storeId]));
    }catch(e){
        return res.status(400).json({message: '잠시 후 다시 시도해주세요.'});
    }
})

router.get('/accept',auth,async(req,res)=>{

    var hostId = req.auth.hostId;

    try{

        var select = 'SELECT storeId FROM store WHERE hostId = ?'
        var result = await mysql.do(select,[hostId])

        if(result.length == 0)
            return res.status(400).end();

        var selectRow = ['reservationId','time','reservation.createdAt','peopleNumber','user.name']
        var select = 'SELECT ?? FROM reservation JOIN user ON (reservation.userId = user.userId ) WHERE storeId =? AND state = "accept" AND reservation.time > (NOW() - INTERVAL 10 MINUTE) ' // 10분


        return res.json(await mysql.do(select,[selectRow,result[0].storeId]));
    }catch(e){
        return res.status(400).json({message: '잠시 후 다시 시도해주세요.'});
    }
    
})

router.get('/confirm',auth,async(req,res)=>{

    var hostId = req.auth.hostId;

    try{

        var select = 'SELECT storeId FROM store WHERE hostId = ?'
        var result = await mysql.do(select,[hostId])

        if(result.length == 0)
            return res.status(400).end();

        var selectRow = ['reservationId','time','reservation.createdAt','peopleNumber','user.name','user.phone']
        var select = 'SELECT ?? FROM reservation JOIN user ON (reservation.userId = user.userId ) WHERE storeId =? AND state = "confirm" ORDER BY time DESC' 


        return res.json(await mysql.do(select,[selectRow,result[0].storeId]));
    }catch(e){
        return res.status(400).json({message: '잠시 후 다시 시도해주세요.'});
    }

})

router.put('/reject',auth,async (req,res)=>{

    var hostId = req.auth.hostId;
    var reservationId = req.body.reservationId;

    if(!reservationId)
        return res.status(400).end();

    try{

        var select = 'SELECT storeId FROM store WHERE hostId = ?'
        var result = await mysql.do(select,[hostId])

        var update = 'UPDATE reservation SET state = "reject" WHERE storeId = ? AND reservationId = ?'
        await mysql.do(update,[result[0].storeId,reservationId]);

        return res.end();
    }catch(e){
        return res.status(400).json({message: '잠시 후 다시 시도해주세요.'});
    }

})

router.put('/accept',auth,async(req,res)=>{

    var hostId = req.auth.hostId;
    var reservationId = req.body.reservationId;

    if(!reservationId)
        return res.status(400).end();

    try{

        var select = 'SELECT storeId FROM store WHERE hostId = ?'
        var result = await mysql.do(select,[hostId])
        var createdAt = new Date();

        if(result.length == 0)
            return res.status(400).end();

        var update = 'UPDATE reservation SET state = "accept", createdAt = ? WHERE storeId = ? AND reservationId = ?'
		     
        await mysql.do(update,[createdAt,result[0].storeId,reservationId]);

        //사용자에게 푸시
        var selectRow = ['reservationId', 'reservation.storeId', 'store.name', 'store.mainImage', 'store.latitude', 'store.longitude','user.pushToken']
        var select = 'SELECT ?? FROM reservation '+
                     'JOIN store ON (store.storeId=reservation.storeId) '+
                     'JOIN user ON(reservation.userId = user.userId) ' + 
                     'WHERE reservationId = ? '
        var result = await mysql.do(select,[selectRow,reservationId]);

        onesignal.pushTarget('예약 가능 식당이 있습니다.',[result[0].pushToken],{reservationId : result[0].reservationId,
            storeId : result[0].storeId,
            name :result[0].name,
            mainImage : result[0].mainImage,
            latitude : result[0].latitude,
            longitude : result[0].longitude,
            type : 'accept'
           });

        return res.end();
    }catch(e){
        return res.status(400).json({message: '잠시 후 다시 시도해주세요.'});
    }
})

router.put('/arrive',auth,async(req,res)=>{

    var hostId = req.auth.hostId;
    var reservationId = req.body.reservationId;

    if(!reservationId)
        return res.status(400).end();

    try{

        var select = 'SELECT storeId,name  FROM store WHERE hostId = ?'
        var storeResult = await mysql.do(select,[hostId])

        if(storeResult.length == 0)
            return res.status(400).end();
        
        var select = 'SELECT userId FROM reservation WHERE reservationId = ?'
        var userResult = await mysql.do(select,[reservationId])

        var select = 'SELECT state FROM reservation WHERE storeId = ? AND reservationId = ?'
        var result = await mysql.do(select,[storeResult[0].storeId,reservationId]);

        var select = 'SELECT phone FROM user WHERE userId = ?'
        var userResult2 = await mysql.do(select,[userResult[0].userId]);
        userResult[0].phone = userResult2[0].phone;

        if(result[0].state != 'confirm')
            return res.status(400).end();

        await mysql.beginTransaction();

        var update = 'UPDATE reservation SET state = "arrive" WHERE storeId = ? AND reservationId = ?'
        await mysql.do(update,[storeResult[0].storeId,reservationId]);

        //포인트
        var update = 'UPDATE user SET point = point + 500 WHERE userId = ?'
        await mysql.do(update,[userResult[0].userId]);
        console.log(storeResult[0],userResult[0]);

        var insert = 'INSERT INTO dishnowPoint (userId,type,diff,name,phone) VALUE (?,?,?,?,?)'
        await mysql.do(insert,[userResult[0].userId,"save",500,storeResult[0].name,userResult[0].phone])

        //리뷰
        var insert = 'INSERT INTO review (userId,storeId,reservationId) VALUE (?,?,?)'
        await mysql.do(insert,[userResult[0].userId,storeResult[0].storeId,reservationId])

        await mysql.commitTransaction();
        return res.end();

    }catch(e){
        await mysql.rollbackTransaction();
        return res.status(400).json({message: '잠시 후 다시 시도해주세요.'});
    }
})

router.put('/noShow',auth,async(req,res)=>{

    var hostId = req.auth.hostId;
    var reservationId = req.body.reservationId;

    if(!reservationId)
        return res.status(400).end();

    try{

        var select = 'SELECT storeId FROM store WHERE hostId = ?'
        var result = await mysql.do(select,[hostId])

        if(result.length == 0)
            return res.status(400).end();

        var update = 'UPDATE reservation SET state = "noShow" WHERE storeId = ? AND reservationId = ?'
        await mysql.do(update,[result[0].storeId,reservationId]);
       
        return res.end();

    }catch(e){
        return res.status(400).json({message: '잠시 후 다시 시도해주세요.'});
    }
})
