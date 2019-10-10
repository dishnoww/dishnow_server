var express = require('express');
var router = express.Router();
var auth = require('../auth')
var mysql = require('../mysql');
module.exports = router;

router.get('/',auth,async (req,res)=>{

    var hostId = req.auth.hostId;

    try{
        var select = 'SELECT storeId FROM store WHERE hostId = ?'
        var result = await mysql.do(select,[hostId])

        if(result.length == 0)
            return res.status(400).end();

        var selectRow = ['name','address','mainPhone','subPhone','keyword','content','facilities',
                         'mondayOpen','mondayClose','tuesdayOpen','tuesdayClose','wednesdayOpen','wednesdayClose','thursdayOpen','thursdayClose','fridayOpen','fridayClose','saturdayOpen','saturdayClose','sundayOpen','sundayClose','breakTime']

        var select = 'SELECT ?? FROM store LEFT JOIN storeBusinessHour ON (storeBusinessHour.storeId = store.storeId) WHERE store.storeId = ?'
        var result = await mysql.do(select,[selectRow,result[0].storeId]);

        return res.json(result[0]);

    }catch(e){
        return res.status(400).json({message: '잠시 후 다시 시도해주세요.'});
    }

})

router.get('/image',auth,async(req,res)=>{

    var hostId = req.auth.hostId;

    try{

        var select = 'SELECT storeId FROM store WHERE hostId = ?'
        var result = await mysql.do(select,[hostId])

        if(result.length == 0)
            return res.status(400).end();

        var select = 'SELECT mainImage,subImage FROM store WHERE storeId = ?'
        var result = await mysql.do(select,[result[0].storeId])

        return res.json(result[0]);

    }catch(e){
        return res.status(400).json({message: '잠시 후 다시 시도해주세요.'});
    }
})

router.put('/',auth,async (req, res) => {

    var subPhone = req.body.subPhone || '';
    var keyword = req.body.keyword || '';
    var content = req.body.content || '';
    var facilities = req.body.facilities || '[]';

    var mondayOpen = req.body.mondayOpen || '00:00:00';
    var mondayClose = req.body.mondayClose || '00:00:00';

    var tuesdayOpen = req.body.tuesdayOpen || '00:00:00';
    var tuesdayClose = req.body.tuesdayClose || '00:00:00';

    var wednesdayOpen = req.body.wednesdayOpen || '00:00:00';
    var wednesdayClose = req.body.wednesdayClose || '00:00:00';

    var thursdayOpen = req.body.thursdayOpen || '00:00:00';
    var thursdayClose = req.body.thursdayClose || '00:00:00';
``
    var fridayOpen = req.body.fridayOpen || '00:00:00';
    var fridayClose = req.body.fridayClose || '00:00:00';

    var saturdayOpen = req.body.saturdayOpen || '00:00:00';
    var saturdayClose = req.body.saturdayClose || '00:00:00';

    var sundayOpen = req.body.sundayOpen || '00:00:00';
    var sundayClose = req.body.sundayClose || '00:00:00';

    var breakTime = req.body.breakTime;

    var hostId = req.auth.hostId;

    try{

        var select = 'SELECT storeId FROM store WHERE hostId = ?'
        var result = await mysql.do(select,[hostId])

        if(result.length == 0)
            return res.status(400).end();

        
        await mysql.beginTransaction();

        var update = 'UPDATE store SET  subPhone = ?,keyword = ?,content = ?,facilities = ? WHERE storeId = ?'
        await mysql.do(update,[subPhone,keyword,content,facilities,result[0].storeId]);

        var update = 'INSERT INTO storeBusinessHour (storeId,mondayOpen,mondayClose,tuesdayOpen,tuesdayClose,wednesdayOpen,wednesdayClose,thursdayOpen,thursdayClose,fridayOpen,fridayClose,saturdayOpen,saturdayClose,sundayOpen,sundayClose,breakTime) '+
                     'VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) '+
                     'ON DUPLICATE KEY UPDATE mondayOpen=?,mondayClose=?,tuesdayOpen=?,tuesdayClose=?,wednesdayOpen=?,wednesdayClose=?,thursdayOpen=?,thursdayClose=?,fridayOpen=?,fridayClose=?,saturdayOpen=?,saturdayClose=?,sundayOpen=?,sundayClose=?,breakTime=?'

        await mysql.do(update,[result[0].storeId,mondayOpen,mondayClose,tuesdayOpen,tuesdayClose,wednesdayOpen,wednesdayClose,thursdayOpen,thursdayClose,fridayOpen,fridayClose,saturdayOpen,saturdayClose,sundayOpen,sundayClose,breakTime,
                               mondayOpen,mondayClose,tuesdayOpen,tuesdayClose,wednesdayOpen,wednesdayClose,thursdayOpen,thursdayClose,fridayOpen,fridayClose,saturdayOpen,saturdayClose,sundayOpen,sundayClose,breakTime]);
        
        await mysql.commitTransaction();

        return res.end();
    }
    catch(e){
        await mysql.commitTransaction();
        return res.status(400).json({message: '잠시 후 다시 시도해주세요.'});
    }

});

router.put('/image',auth,async (req, res) => {

    var mainImage = req.body.mainImage;
    var subImage =req.body.subImage || '[]';
    var hostId = req.auth.hostId;

    if(!mainImage)
        return res.status(400).end();

    try{

        var select = 'SELECT storeId FROM store WHERE hostId = ?'
        var result = await mysql.do(select,[hostId])

        if(result.length == 0)
            return res.status(400).end();

        var update = 'UPDATE store SET mainImage = ?,subImage=? WHERE storeId = ?'
        await mysql.do(update,[mainImage,subImage,result[0].storeId]);
        
        return res.end();
    }
    catch(e){
        return res.status(400).json({message: '잠시 후 다시 시도해주세요.'});
    }

});

router.put('/call',auth,async (req, res) => {

    var hostId = req.auth.hostId;

    try{

        var select = 'SELECT storeId,isCall FROM store WHERE hostId = ?'
        var result = await mysql.do(select,[hostId])

        if(result.length == 0)
            return res.status(400).end();

        if(result[0].isCall == 'true')
            var isCall = "false";
        else
            var isCall = "true";

        var update = 'UPDATE store SET isCall = ? WHERE storeId = ?'        
        await mysql.do(update,[isCall,result[0].storeId]);
        
        return res.json({isCall : isCall});
    }
    catch(e){
        console.log(e);
        return res.status(400).json({message: '잠시 후 다시 시도해주세요.'});
    }

});

