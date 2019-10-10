var express = require('express');
var router = express.Router();
var auth = require('../auth')
var mysql = require('../mysql');
module.exports = router;


router.put('/',auth,async (req,res)=>{

    var hostId = req.auth.hostId;
    var reviewId = req.body.reviewId;
    var answer = req.body.answer || null;

    if(!reviewId)
        return res.status(400).end();
        
    try{

        var select = 'SELECT storeId FROM store WHERE hostId = ?'
        var storeResult = await mysql.do(select,[hostId])

        if(storeResult.length == 0)
            return res.status(400).end();

        var update = 'UPDATE review SET answer = ? WHERE reviewId = ? AND storeId = ? '
        await mysql.do(update,[answer,reviewId,storeResult[0].storeId])
    
        return res.end();

    }catch(e){
        return res.status(400).json({message: '잠시 후 다시 시도해주세요.'});
    }

})

router.get('/answer',auth,async (req,res)=>{

    var hostId = req.auth.hostId;
    var page = req.query.page || 0 ;

    try{

        var select = 'SELECT storeId FROM store WHERE hostId = ?'
        var result = await mysql.do(select,[hostId])

        if(result.length == 0)
            return res.status(400).end();

     
        var selectRow = ['user.name','review.rating','review.content','review.createdAt','review.image','review.reviewId','review.answer'];
        var select = 'SELECT ?? FROM review '+ 
                     'JOIN user ON (review.userId = user.userId) '  +
                     'JOIN store ON (review.storeId = store.storeId) '+
                     'WHERE review.storeId = ? AND review.rating IS NOT NULL AND answer IS NOT NULL ORDER BY review.createdAt DESC LIMIT ?,?  '  
        var result = await mysql.do(select,[selectRow,result[0].storeId,page*20,20])

        return res.json(result);

    }catch(e){
        return res.status(400).json({message: '잠시 후 다시 시도해주세요.'});
    }

})

router.get('/noAnswer',auth,async (req,res)=>{

    var hostId = req.auth.hostId;
    var page = req.query.page || 0 ;

    try{

        var select = 'SELECT storeId FROM store WHERE hostId = ?'
        var result = await mysql.do(select,[hostId])

        if(result.length == 0)
            return res.status(400).end();

    
        var selectRow = ['user.name','review.rating','review.content','review.createdAt','review.image','review.reviewId'];
        var select = 'SELECT ?? FROM review '+ 
                     'JOIN user ON (review.userId = user.userId) '  +
                     'JOIN store ON (review.storeId = store.storeId) '+
                     'WHERE review.storeId = ? AND review.rating IS NOT NULL AND answer IS NULL ORDER BY review.createdAt DESC LIMIT ?,?  '
                    
        var result = await mysql.do(select,[selectRow,result[0].storeId,page*20,20])
             
        return res.json(result);

    }catch(e){
        return res.status(400).json({message: '잠시 후 다시 시도해주세요.'});
    }

})

router.get('/count',auth,async (req,res)=>{

    var hostId = req.auth.hostId;

    try{

        var select = 'SELECT storeId FROM store WHERE hostId = ?'
        var storeResult = await mysql.do(select,[hostId])

        if(storeResult.length == 0)
            return res.status(400).end();

        var result = new Object();
        var select = 'SELECT COUNT(*) as count FROM review WHERE storeId = ? AND review.rating IS NOT NULL AND answer IS NULL'
        var countResult =  await mysql.do(select,[storeResult[0].storeId]);
        result.noAnswer = countResult[0].count;

        var select = 'SELECT COUNT(*) as count FROM review WHERE storeId = ? AND review.rating IS NOT NULL AND answer IS NOT NULL'
        var countResult =  await mysql.do(select,[storeResult[0].storeId]);
        result.answer = countResult[0].count;
    
        return res.json(result);

    }catch(e){
        return res.status(400).json({message: '잠시 후 다시 시도해주세요.'});
    }

})

