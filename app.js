var express = require('express');
var app = express();
var dotenv = require('dotenv');
var bodyParser = require('body-parser');


dotenv.config();

app.use(bodyParser.urlencoded({ extended: true })); 
app.use(bodyParser.json());

app.use('/api/host/user', require('./hostRoutes/user'));
app.use('/api/host/menu', require('./hostRoutes/menu'));
app.use('/api/host/store', require('./hostRoutes/store'));
app.use('/api/host/reservation', require('./hostRoutes/reservation'));
app.use('/api/host/review', require('./hostRoutes/review'));

app.use('/api/user/user', require('./userRoutes/user'));
app.use('/api/user/store', require('./userRoutes/store'));
app.use('/api/user/reservation', require('./userRoutes/reservation'));
app.use('/api/user/review', require('./userRoutes/review'));
app.use('/api/user/notice', require('./userRoutes/notice'));


app.use('/api', require('./upload')); 

app.listen(process.env.SERVER_PORT, async function () {
  console.log('Successfully Conneted');
});



