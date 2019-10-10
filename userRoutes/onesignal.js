var OneSignal = require('onesignal-node');

var client = new OneSignal.Client({    
  userAuthKey: 'OWY1NTkwZTEtMzlhMi00NjEzLWFjMzYtOTRkZmFkM2NjMWZj',    
  app: { appAuthKey: 'ZDFlMDc0ZmItYzcyMC00OTNkLTg4NmQtZWZhNjcyNTZhNjg0', appId: 'f4abb3da-4d13-467a-a552-53a642ef0bfb' }    
}); 

module.exports = {
  async pushAll(contents) {  
    var firstNotification = new OneSignal.Notification({contents:{en: contents}});  
    firstNotification.postBody["included_segments"] = ["Active Users"];    
    firstNotification.postBody["excluded_segments"] = ["Banned Users"];    
    //firstNotification.postBody["data"] = {"abc": "123", "foo": "bar"};    
    client.sendNotification(firstNotification, function (err, httpResponse,data) { 
    });
  },
  async pushTarget(contents,target,data){

    var firstNotification = new OneSignal.Notification({    
        contents: {en: contents},
        include_player_ids: target   
      }); 

    firstNotification.postBody["data"] = data;    
    
    client.sendNotification(firstNotification, function (err, httpResponse,data) {    
      console.log(data);
      console.log(err);
    });  
  },
  async pushSegments(contents,segment){

    var firstNotification = new OneSignal.Notification({    
        contents: {en: contents}
      }); 
    
    firstNotification.postBody["included_segments"] = [segment];
    firstNotification.postBody["excluded_segments"] = ["Banned Users"];

    client.sendNotification(firstNotification, function (err, httpResponse,data) {    
          
    });  
  }

}