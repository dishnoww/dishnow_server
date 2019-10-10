const request = require('request-promise-native')
var FB = require('fb');

module.exports = {
  async kakao(accessToken) {
    const reply = await request('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-type': 'application/x-www-form-urlencoded;charset=utf-8'
      },
      json: true
    });
    return reply.id;
  },
   async facebook(accessToken) {
    var result = await FB.api('me', { fields: ['id'], access_token: accessToken })
    return result.id;
  },
  async naver(accessToken){
    const reply = await request('https://openapi.naver.com/v1/nid/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-type': 'application/x-www-form-urlencoded;charset=utf-8'
      },
      json: true
    });
    return reply.response.id;
  }
}
