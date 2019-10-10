var express = require('express');
var router = express.Router();
var auth = require('../auth')
var mysql = require('../mysql');
var onesignal = require('../hostRoutes/onesignal')
var sms = require('../sms')

module.exports = router;

router.post('/',auth, async (req, res) => {

    var storeTypeId = req.body.storeTypeId;
    var peopleNumber = req.body.peopleNumber;
    var minutes = req.body.minutes;
    var latitude = req.body.latitude;
    var longitude = req.body.longitude;
    var userId = req.auth.userId;

    if(!storeTypeId || !peopleNumber || !minutes || !latitude || !longitude)
        return res.status(400).end();

    try{
        var select = 'SELECT name FROM user WHERE userId = ?'
        var name = await mysql.do(select,[userId]);

        var select,storeResult;

        if(storeTypeId == 0 || storeTypeId == 1 || storeTypeId == 2 || storeTypeId ==3 || storeTypeId ==4 ||storeTypeId ==5|| storeTypeId ==6|| storeTypeId == '0,0,0,0,0,0'){
            select = 'SELECT storeId,pushToken FROM store JOIN host ON(store.hostId = host.hostId) '+
            'WHERE isCall ="true" AND ST_Distance_Sphere(POINT(longitude,latitude), POINT(?,?)) < 300' // m
            storeResult = await mysql.do(select,[longitude,latitude]);
        }else{
            storeTypeId = storeTypeId.split(',');
            select = 'SELECT storeId,pushToken FROM store JOIN host ON(store.hostId = host.hostId) '+
                        'WHERE (storeTypeId = ? OR storeTypeId2 = ? OR storeTypeId3 = ? OR storeTypeId4 = ? OR storeTypeId5 = ? OR storeTypeId6 = ?) ' +
                        'AND isCall ="true" AND ST_Distance_Sphere(POINT(longitude,latitude), POINT(?,?)) < 300' // m
            storeResult = await mysql.do(select,[storeTypeId[0],storeTypeId[1],storeTypeId[2],storeTypeId[3],storeTypeId[4],storeTypeId[5],longitude,latitude]);
        }

        var createdAt = new Date();
        var time = new Date(createdAt.getTime);
        time.setTime(createdAt.getTime() + (minutes*60*1000));

        for(var i =0; i<storeResult.length;i++){
            var insert = 'INSERT INTO reservation (userId,storeId,peopleNumber,time,state,createdAt) VALUE (?,?,?,?,?,?)'
            var insertResult = await mysql.do(insert,[userId,storeResult[i].storeId,peopleNumber,time,'request',createdAt])
		storeResult[i].createdAt = createdAt
            //사장님에게 전송.
            onesignal.pushTarget('예약 요청이 왔습니다.',[storeResult[i].pushToken],{reservationId : insertResult.insertId,
                                                               time : time,
                                                               createdAt :createdAt,
                                                               peopleNumber : peopleNumber,
                                                               name : name[0].name,
                                                               type : 'request'
                                                              });
        }
        return res.json(createdAt);
    }
    catch(e){
        return res.status(400).json({message: '잠시 후 다시 시도해주세요.'});
    }

});

router.post('/request',auth, async (req, res) => {

    var storeId = req.body.storeId;
    var peopleNumber = req.body.peopleNumber;
    var minutes = req.body.minutes;
    var userId = req.auth.userId;

    if(!storeId || !peopleNumber || !minutes)
        return res.status(400).end();

    try{
        var select = 'SELECT name FROM user WHERE userId = ?'
        var name = await mysql.do(select,[userId]);

        var select,storeResult;
         
        select = 'SELECT pushToken FROM store JOIN host ON(store.hostId = host.hostId) '+
                        'WHERE storeId = ? ';
        storeResult = await mysql.do(select,[storeId]);

        var createdAt = new Date();
        var time = new Date(createdAt.getTime);
        time.setTime(createdAt.getTime() + (minutes*60*1000));
        
            var insert = 'INSERT INTO reservation (userId,storeId,peopleNumber,time,state,createdAt) VALUE (?,?,?,?,?,?)'
            var insertResult = await mysql.do(insert,[userId,storeId,peopleNumber,time,'request',createdAt])
            //사장님에게 전송.
            onesignal.pushTarget('예약 요청이 왔습니다.',[storeResult[0].pushToken],{reservationId : insertResult.insertId,
                                                               time : time,
                                                               createdAt :createdAt,
                                                               peopleNumber : peopleNumber,
                                                               name : name[0].name,
                                                               type : 'request'
                                                              });
        
        return res.json(insertResult);
    }
    catch(e){
        return res.status(400).json({message: '잠시 후 다시 시도해주세요.'});
    }

});

router.get('/accept',auth,async (req, res) => {

    var userId = req.auth.userId;

    try{
        
        var selectRow = ['store.keyword','reservationId', 'reservation.storeId', 'store.name', 'store.mainImage', 'store.latitude', 'store.longitude', 'store.mainMenu']
        var select = 'SELECT ?? FROM reservation '+
                     'JOIN store ON (store.storeId=reservation.storeId) ' +
                     'WHERE userId = ? AND reservation.state = "accept" AND reservation.createdAt > (NOW() - INTERVAL 2 MINUTE) ORDER BY reservation.createdAt '
        var result = await mysql.do(select,[selectRow,userId]);

        return res.json(result);
    }
    catch(e){
        return res.status(400).json({message: '잠시 후 다시 시도해주세요.'});
    }
});

router.get('/newAccept',auth,async (req, res) => {

    var userId = req.auth.userId;

    try{
        
        var selectRow = ['store.keyword','reservationId', 'reservation.storeId', 'store.name', 'store.mainImage', 'store.latitude', 'store.longitude', 'store.mainMenu']
        var select = 'SELECT ?? FROM reservation '+
                     'JOIN store ON (store.storeId=reservation.storeId) ' +
                     'WHERE userId = ? AND reservation.state = "accept" AND reservation.createdAt > (NOW() - INTERVAL 2 MINUTE) ORDER BY reservation.createdAt '
        var result = await mysql.do(select,[selectRow,userId]);

        return res.json(result);
    }
    catch(e){
        return res.status(400).json({message: '잠시 후 다시 시도해주세요.'});
    }
});



router.get('/acceptBack',auth,async (req, res) => {

    var userId = req.auth.userId;

    try{
        
        var selectRow = ['store.keyword','reservationId', 'reservation.storeId', 'store.name', 'store.mainImage', 'store.latitude', 'store.longitude', 'store.mainMenu']
        var select = 'SELECT ?? FROM reservation '+
                     'JOIN store ON (store.storeId=reservation.storeId) ' +
                     'WHERE userId = ? AND reservation.state = "accept" AND reservation.createdAt > (NOW() - INTERVAL 7 MINUTE) ORDER BY reservation.createdAt '
        var result = await mysql.do(select,[selectRow,userId]);

        return res.json(result);
    }
    catch(e){
        return res.status(400).json({message: '잠시 후 다시 시도해주세요.'});
    }

});

router.put('/confirm',auth,async (req, res) => {

    var reservationId = req.body.reservationId;
    var storeId = req.body.storeId;
    var userId = req.auth.userId;

    if(!reservationId || !storeId)
        return res.status(400).end();

    try{
        var update = 'UPDATE reservation SET state = "confirm" WHERE reservationId = ? AND storeId = ?'
        await mysql.do(update,[reservationId,storeId]);

        var selectRow = ['reservationId','reservation.time','reservation.createdAt','peopleNumber','user.name','user.phone','host.pushToken','store.latitude','store.longitude','store.mainPhone','store.storeId']

        var select = 'SELECT ?? FROM reservation ' +
                     'JOIN user ON (reservation.userId = user.userId ) '+
                     'JOIN store ON (reservation.storeId = store.storeId) '+
                     'JOIN host ON (store.hostId = host.hostId ) ' +
                     'WHERE reservationId = ? AND reservation.storeId = ? AND state = "confirm" ' 

        var result = await mysql.do(select,[selectRow,reservationId,storeId]);
        var select = 'SELECT phone FROM user WHERE userId = ? ';
        var phone = await mysql.do(select,userId);
        var select = 'SELECT name FROM store WHERE storeId = ? ';
        var store = await mysql.do(select,result[0].storeId);
        var map = `https://map.kakao.com/link/to/${store[0].name},${result[0].latitude},${result[0].longitude}`;
  
        var message = `<디쉬나우>
예약이 완료되었습니다!

-업장명: ${store[0].name}
-전화번호: ${result[0].mainPhone}
-지도로 보기: ${map}

* 지도를 보실 때는 '도보'를 클릭해주세요!        
* 도착 후, 사장님께 도착을 요청하세요 :-)`;

        sms.authAligo(phone[0].phone,message);

        //사장님에게 전송
        onesignal.pushTarget('예약이 완료되었습니다.',[result[0].pushToken],
                                            {    reservationId : result[0].reservationId,
                                                 time : result[0].time,
                                                 createdAt : result[0].createdAt,
                                                 peopleNumber : result[0].peopleNumber,
                                                 name : result[0].name,
                                                 phone : result[0].phone,
                                                 type : 'confirm'
                                            });

        return res.end();
    }
    catch(e){
        return res.status(400).json({message: '잠시 후 다시 시도해주세요.'});
    }

});

router.put('/cancel',auth,async(req,res) => {
	var userId = req.auth.userId;

	try{
		var update = 'UPDATE user SET isCall = "false" WHERE userId = ? ';
		await mysql.do(update,[userId]);
		return res.end();
	}
	catch(e){
		return res.status(400).json({message : '잠시 후 다시 시도해주세요.'});
	}
});

router.put('/revert',auth,async(req,res) => {
        var userId = req.auth.userId;

        try{
                var update = 'UPDATE user SET isCall = "true" WHERE userId = ? ';
                await mysql.do(update,[userId]);
                return res.end();
        }
        catch(e){
                return res.status(400).json({message : '잠시 후 다시 시도해주세요.'});
        }
});

