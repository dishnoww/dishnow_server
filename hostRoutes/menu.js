var express = require('express');
var router = express.Router();
var auth = require('../auth')
var mysql = require('../mysql');

module.exports = router;

router.get('/main',auth, async (req, res) => {

    var hostId = req.auth.hostId;
 
    try{

        var select = 'SELECT storeId FROM store WHERE hostId = ?'
        var storeResult = await mysql.do(select,[hostId])

        if(storeResult.length == 0)
            return res.status(400).end();

        var select = 'SELECT mainMenu FROM store WHERE storeId = ?'
        var result = await mysql.do(select,[storeResult[0].storeId]);

        return res.json(result[0]);
    }
    catch(e){
        console.log(e);
        return res.status(400).json({message: '잠시 후 다시 시도해주세요.'});
    }

});

router.get('/sub',auth, async (req, res) => {

    var hostId = req.auth.hostId;
 
    try{

        var select = 'SELECT storeId FROM store WHERE hostId = ?'
        var storeResult = await mysql.do(select,[hostId])

        if(storeResult.length == 0)
            return res.status(400).end();

        var select = 'SELECT subMenu FROM store WHERE storeId = ?'
        var result = await mysql.do(select,[storeResult[0].storeId]);

        return res.json(result[0]);
    }
    catch(e){
        return res.status(400).json({message: '잠시 후 다시 시도해주세요.'});
    }

});

router.put('/main',auth, async (req, res) => {

    var mainMenu = req.body.mainMenu;
    var hostId = req.auth.hostId;
 
    if(!mainMenu)
        return res.status(400).end();

    try{

        var select = 'SELECT storeId FROM store WHERE hostId = ?'
        var storeResult = await mysql.do(select,[hostId])

        if(storeResult.length == 0)
            return res.status(400).end();

        var update = 'UPDATE store SET mainMenu = ? WHERE storeId = ?'
        await mysql.do(update,[mainMenu,storeResult[0].storeId]);

        return res.end();
    }
    catch(e){
        return res.status(400).json({message: '잠시 후 다시 시도해주세요.'});
    }

});

router.put('/sub',auth,async (req, res) => {

    var subMenu = req.body.subMenu;
    var hostId = req.auth.hostId;
  
    try{

        var select = 'SELECT storeId FROM store WHERE hostId = ?'
        var storeResult = await mysql.do(select,[hostId])

        if(storeResult.length == 0)
            return res.status(400).end();

        var update = 'UPDATE store SET subMenu = ? WHERE storeId = ?'
        await mysql.do(update,[subMenu,storeResult[0].storeId]);
        
        return res.end();
    }
    catch(e){
        return res.status(400).json({message: '잠시 후 다시 시도해주세요.'});
    }

});