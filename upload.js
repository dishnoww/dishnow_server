var AWS = require('aws-sdk');
AWS.config.region = 'ap-northeast-2';
var s3 = new AWS.S3();
var express = require('express');
var router = express.Router();
const multer = require('multer');
const multerS3 = require('multer-s3');
const crypto = require('crypto');
var auth = require('./auth');

module.exports = router;

const upload = multer({
  limits: { fileSize: 500 * 1024 * 1024 },
  storage: multerS3({
    s3,
    bucket: process.env.S3_BUCKET,
    acl: 'public-read',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    cacheControl: 'max-age=31536000',
    metadata: (req, file, cb) => {
      cb(null, {fieldName: file.fieldname});
    },
    key: (req, file, cb) => {
      cb(null, crypto.randomBytes(48).toString('hex'));
    }
  })
})

router.post('/upload',upload.array('file',5), (req, res) => {

  var result = [];
  for(var i=0;i<req.files.length;i++){
    result.push(req.files[i].location);
  }
  
  res.json({location : result});
})