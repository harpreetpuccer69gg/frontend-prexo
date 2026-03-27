export const getLocation = () => {

return new Promise((resolve,reject)=>{

navigator.geolocation.getCurrentPosition(
(pos)=>{

resolve({
latitude:pos.coords.latitude,
longitude:pos.coords.longitude
});

},
(err)=>reject(err)

);

});

};