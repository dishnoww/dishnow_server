var express = require('express');
var router = express.Router();
var auth = require('../auth')
var mysql = require('../mysql');
require('date-utils');

module.exports = router;

router.get('/',auth,async (req, res) => {

    var page = req.query.page || 0;

    try{
      
        var selectRow = ['noticeId','title','createdAt']
        var select = 'SELECT ?? FROM notice LIMIT ?,?'
        var result = await mysql.do(select,[selectRow,page*20,20]);
        return res.json(result);

    }catch(e){
        return res.status(400).json({message: '잠시 후 다시 시도해주세요.'});
    }
});

router.get('/detail',auth,async (req, res) => {

    var noticeId = req.query.noticeId;

    if(!noticeId)
        return res.status(400).end();

    try{

        var selectRow = ['noticeId','title','createdAt','content']
        var select = 'SELECT ?? FROM notice WHERE noticeId = ?'
        var result = await mysql.do(select,[selectRow,noticeId]);
        return res.json(result);

    }catch(e){
        return res.status(400).json({message: '잠시 후 다시 시도해주세요.'});
    }
});
