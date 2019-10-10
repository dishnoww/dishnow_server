var mysql = require('mysql');

var connection = mysql.createConnection({
  host     : process.env.MYSQL_HOST,
  user     : process.env.MYSQL_USER,
  password : process.env.MYSQL_PASSWORD,
  database : process.env.MYSQL_DATABASE,
  dateStrings : 'true',
  port     : process.env.MYSQL_PORT,
  acquireTimeout: 30000, //30 secs
});

connection.connect();

module.exports = {
    async do(query,value) {
        return new Promise((resolve, reject) => {
            connection.query(query,value, function(err, rows, fields)
            {
              if (err) {
                console.log(err);
                return reject(err);
              }
               
              return resolve(rows);
            })
          });
    },
    async beginTransaction(){
      return new Promise((resolve, reject) => {
        connection.beginTransaction(function(err){
          if(err) return reject(err);
          return resolve();
        })
      });
    },
    async commitTransaction(){
      return new Promise((resolve, reject) => {
        connection.commit();
        return resolve();
      });
    },
    async rollbackTransaction(){
      return new Promise((resolve, reject) => {
        connection.rollback();
        return resolve();
      });
    },
    nest(key,values,rows){
  
        for(var i=0;i<rows.length;i++){

          var str = new Object();
          str.id = rows[i][key];

          for(var j=0;j<values.length;j++){
            str[values[j]] = rows[i][values[j]];
            delete rows[i][values[j]];
          }
          rows[i][key] = str;
        }

       return rows;
    },
    jsonify(key,rows){
      for(var i=0;i<rows.length;i++){
        rows[i][key] = JSON.parse(rows[i][key]);
      }

      return rows;
    }
    
  }