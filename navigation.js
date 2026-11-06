/* Pure navigation along connected walking paths. Shared by the scene and tests. */
(function(root){
  'use strict';
  function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
  function project(point,path){
    var best=null,along=0;
    for(var i=0;i<path.length-1;i++){
      var a=path[i],b=path[i+1],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);
      var t=len?Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.y-a.y)*dy)/(len*len))):0;
      var p={x:a.x+t*dx,y:a.y+t*dy,along:along+t*len,segment:i};
      p.distance=distance(point,p);
      if(!best||p.distance<best.distance)best=p;
      along+=len;
    }
    return best;
  }
  function route(from,to,path){
    var a=project(from,path),b=project(to,path),out=[],sum=0,vertices=[];
    for(var i=0;i<path.length;i++){
      if(i)sum+=distance(path[i-1],path[i]);
      if(sum>Math.min(a.along,b.along)+.1&&sum<Math.max(a.along,b.along)-.1)vertices.push({x:path[i].x,y:path[i].y});
    }
    if(b.along<a.along)vertices.reverse();
    if(distance(from,a)>1)out.push({x:a.x,y:a.y});
    return out.concat(vertices,[{x:b.x,y:b.y}]);
  }
  function at(along,path){
    var left=Math.max(0,along);
    for(var i=0;i<path.length-1;i++){
      var a=path[i],b=path[i+1],length=distance(a,b);
      if(left<=length)return{x:a.x+(b.x-a.x)*(length?left/length:0),y:a.y+(b.y-a.y)*(length?left/length:0)};
      left-=length;
    }
    var last=path[path.length-1];return{x:last.x,y:last.y};
  }
  var api={distance:distance,project:project,route:route,at:at};
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.HP05Navigation=api;
})(typeof window!=='undefined'?window:globalThis);
