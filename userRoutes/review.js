var express = require('express');
var router = express.Router();
var auth = require('../auth')
var mysql = require('../mysql');
var onesignal =require('../hostRoutes/onesignal')

module.exports = router;


//isUpdate = true,false
router.put('/',auth,async (req,res)=>{

    var userId = req.auth.userId;

    var reviewId = req.body.reviewId;
    var rating = req.body.rating;
    var content = req.body.content;
    var image = req.body.image || '[]';
    var createdAt = new Date();
    var isUpdate = req.body.isUpdate;

    if(!reviewId || !rating || !content || !isUpdate)
        return res.status(400).end();

    try{

        await mysql.beginTransaction();

        //리뷰
        var update = 'UPDATE review SET rating = ?,content =?,createdAt =?,image =?,isUpdate = ? WHERE reviewId =? AND userId = ? '
        await mysql.do(update,[rating,content,createdAt,image,isUpdate,reviewId,userId]);

        var select = 'SELECT store.storeId,store.rating,host.pushToken FROM review '+
                     'JOIN store ON(review.storeId = store.storeId) '+
                     'JOIN host ON(review.storeId = store.storeId) ' +
                     'WHERE review.reviewId = ?'
        var storeResult =  await mysql.do(select,[reviewId])

        //평점
        var select = 'SELECT round(avg(rating),1) as avg FROM review WHERE storeId = ? AND rating IS NOT NULL '
        var result = await mysql.do(select,[storeResult[0].storeId])

        var update = 'UPDATE store SET rating = ? WHERE storeId = ?'
        await mysql.do(update,[result[0].avg,storeResult[0].storeId])

        if(isUpdate == 'false'){ //수정한것이 아니라면 
            //포인트
            var update = 'UPDATE user SET point = point + 500 WHERE userId = ?'
            await mysql.do(update,[userId]);
		update = 'UPDATE user SET reviewCount = reviewCount + 1 WHERE userId = ?'
		await mysql.do(update,[userId]);
            //사장님에게 전송
            onesignal.pushTarget('리뷰가 등록 되었습니다. 답변을 남겨보세요! ',[storeResult[0].pushToken],{type :'review'});
        }
       
        await mysql.commitTransaction();

        return res.end();

    }catch(e){
        console.log(e);
        await mysql.rollbackTransaction();
        return res.status(400).json({message: '잠시 후 다시 시도해주세요.'});
    }

})

router.get('/',auth,async (req,res)=>{

    var userId = req.auth.userId;

    try{

        var selectRow = ['reservation.createdAt','store.name','review.rating','review.reviewId','review.isUpdate','review.storeId','review.reservationId','store.latitude','store.longitude'];

        var select = 'SELECT ?? FROM review ' +
                     'JOIN store ON (review.storeId = store.storeId) '+
                     'JOIN reservation ON (reservation.reservationId = review.reservationId) ' +
                     'WHERE review.userId = ?  ' + 
		     'ORDER BY review.reviewId DESC '

        var result = await mysql.do(select,[selectRow,userId])

        return res.json(result);

    }catch(e){
        return res.status(400).json({message: '잠시 후 다시 시도해주세요.'});
    }

})

router.delete('/',auth,async (req,res)=>{

    var userId = req.auth.userId;
    var reviewId = req.query.reviewId;

    try{

        var select = 'SELECT point FROM user WHERE userId = ?'
        var result = await mysql.do(select,[userId])

        if(result.length == 0)
            return res.status(400).end();

        if(result[0].point < 500)
            return res.status(400).json({message : '포인트가 부족하여 리뷰를 삭제할수 없습니다.'})

        await mysql.beginTransaction();

        var del = 'DELETE FROM review WHERE reviewId = ? AND userId = ?'
        await mysql.do(del,[reviewId,userId])

        var update = 'UPDATE user SET point = point - 500 WHERE userId = ?'
        await mysql.do(update,[userId]);

	update = 'UPDATE user SET reviewCount = reviewCount - 1 WHERE userId = ?'
	await mysql.do(update,[userId]);

        await mysql.commitTransaction();

        return res.end();

    }catch(e){
        await mysql.rollbackTransaction();
        return res.status(400).json({message: '잠시 후 다시 시도해주세요.'});
    }

})

router.get('/me',auth,async (req,res)=>{

    var userId = req.auth.userId;

    try{

        var selectRow = ['review.reviewId','store.name','review.createdAt','review.image','review.rating','review.content','review.answer'];

        var select = 'SELECT ?? FROM review ' +
                    'JOIN store ON (review.storeId = store.storeId) ' +
                    'WHERE userId = ? AND review.rating IS NOT NULL ' +
		    'ORDER BY review.reviewId DESC '

        var result = await mysql.do(select,[selectRow,userId]);

        return res.json(result);

    }catch(e){
        return res.status(400).json({message: '잠시 후 다시 시도해주세요.'})
    }

})
