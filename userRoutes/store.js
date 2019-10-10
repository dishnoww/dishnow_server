var express = require('express');
var router = express.Router();
var auth = require('../auth')
var mysql = require('../mysql');
require('date-utils');

module.exports = router;

router.get('/detail',auth,async (req, res) => {

    var storeId = req.query.storeId;

    if(!storeId)
        return res.status(400).end();

    try{
      
        var selectRow = ['name','mainPhone','mainMenu','subMenu','content','address','facilities','mainImage','subImage','rating','latitude','longitude']
        var select = 'SELECT ?? FROM store WHERE storeId = ?'
        var storeResult = await mysql.do(select,[selectRow,storeId]);

        var selectRow = ['mondayOpen','mondayClose','tuesdayOpen','tuesdayClose','wednesdayOpen','wednesdayClose','thursdayOpen','thursdayClose','fridayOpen','fridayClose','saturdayOpen','saturdayClose','sundayOpen','sundayClose','breakTime']
        var select = 'SELECT ?? FROM storeBusinessHour WHERE storeId = ?'
        var businessHourResult = await mysql.do(select,[selectRow,storeId]);

        storeResult[0].businessHour = businessHourResult[0];

        return res.json(storeResult[0]);

    }catch(e){
        return res.status(400).json({message: '잠시 후 다시 시도해주세요.'});
    }
});

router.get('/review',auth,async(req,res)=>{

    var storeId = req.query.storeId;
    var page = req.query.page;

    if(!storeId)
        return res.status(400).end();

    try{

        var select = 'SELECT COUNT(reviewId) as totalCount FROM review WHERE storeId = ? AND rating IS NOT NULL'
        var result = await mysql.do(select,[storeId]);

        if(result[0].totalCount != 0 ){
            var selectRow = ['user.name','user.image','review.rating','review.answer','review.createdAt','review.image','review.content','review.reviewId'];
            var select = 'SELECT user.name, user.image as profile, review.rating, review.answer, review.createdAt, review.image as image, review.content, review.reviewId FROM review JOIN user ON (review.userId = user.userId) WHERE storeId = ? AND rating IS NOT NULL ORDER BY review.createdAt DESC LIMIT ?,?';
            var reviewResult = await mysql.do(select,[storeId,page*100,100]);
		
            result[0].review = reviewResult;
        }

        return res.json(result[0]);
    
    }catch(e){
        return res.status(400).json({message: '잠시 후 다시 시도해주세요.'});
    }

})

router.get('/',auth, async (req, res) => {
    var latitude = req.query.latitude;
    var longitude = req.query.longitude;

    if(!latitude || !longitude)
        return res.status(400).end();


    try{
        var select = 'SELECT * FROM store '+
        'WHERE isCall = "true" AND ST_Distance_Sphere(POINT(longitude,latitude), POINT(?,?)) < 400 ' // m
        var storeResult = await mysql.do(select,[longitude,latitude]);
        
        return res.json(storeResult);
    }
    catch(e){
        return res.status(400).json({message: '잠시 후 다시 시도해주세요.'});
    }
});