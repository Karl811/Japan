/* TK13: two opt-in 2.5D scenes around the original TK12 learning engine. */
(function(){
  'use strict';
  var nav=window.HP05Navigation;
  var scenes={
    1:{name:'Cổng Làng',subtitle:'Việt Nam · Trước ngày lên đường',image:'./assets/village.webp',
      start:{x:490,y:1190},warm:{x:470,y:1060},
      path:[[520,1285],[490,1190],[440,1100],[410,1010],[470,930],[550,875],[600,830],[530,760],[430,700],[430,635],[540,570],[680,515],[745,475],[700,430],[625,395],[510,355],[430,305],[450,250]],
      points:[
        {id:'a11',x:550,y:875,role:'guide',label:'Gặp người dẫn đường',place:'Bên quán nước đầu làng',ic:'people'},
        {id:'a12',x:430,y:635,role:'stranger',label:'Lời mời ở cổng làng',place:'Con đường bên hồ sen',ic:'ask'},
        {id:'a13',x:745,y:475,role:'receipt',label:'Kiểm tra biên nhận',place:'Quầy tư vấn chính thức',ic:'scroll'}
      ],exit:{x:450,y:250},tip:'Đi cùng tôi nhé. Chạm vào đường để bước đi.'},
    5:{name:'Phố Phường',subtitle:'Nhật Bản · Một vòng quanh phố',image:'./assets/street.webp',
      start:{x:505,y:1190},warm:{x:490,y:1080},
      path:[[505,1280],[505,1190],[490,1080],[480,995],[420,910],[340,825],[345,735],[370,665],[405,620],[520,620],[655,625],[690,580],[650,515],[640,435],[675,355],[735,300],[800,270]],
      points:[
        {id:'a51',x:655,y:625,role:'tan',label:'Khám phá những góc phố',place:'Trước cửa hàng trong phố',ic:'map'},
        {id:'a52',x:340,y:825,role:'bike',label:'Hai bánh xe',place:'Bãi đỗ xe đạp',ic:'bike'},
        {id:'a53',x:640,y:435,role:'guide',label:'Phép lịch sự nơi công cộng',place:'Lối đi bên vườn hoa',ic:'people'}
      ],exit:{x:800,y:270},tip:'Chậm một chút, quan sát phố phường cùng tôi nhé.'}
  };
  Object.keys(scenes).forEach(function(n){scenes[n].path=scenes[n].path.map(function(p){return{x:p[0],y:p[1]};});});
  var active=null,menuOpen=false,oldRender=render,oldSettings=nbSettings,oldAiOpen=aiOpen,oldPointToast=pointToast;
  var reduced=noMotion(),lastFocus=null;
  function prefs(){return S.d.gm||(S.d.gm={enabled:false,positions:{}});}
  function enabled(){return prefs().enabled===true;}
  function sceneNumber(){return V.v==='ai'?+V.n:V.v==='act'&&ACTS[V.id]?ACTS[V.id].ai:null;}
  function eligible(){return S.onb&&S.gate&&enabled()&&!!scenes[sceneNumber()]&&(V.v==='ai'||V.v==='act');}
  pointToast=function(xp,ins,msg){
    if(eligible()){if(msg){toastShownAt=Date.now();toast(esc(msg),2400);}return;}
    oldPointToast(xp,ins,msg);
  };
  function htmlButton(action,label,ic,extra){return '<button type="button" data-gm="'+action+'" '+(extra||'')+'>'+icon(ic||'next',19)+'<span>'+esc(label)+'</span></button>';}
  function personSVG(role){
    var isPlayer=role==='player',police=role==='tan',stranger=role==='stranger';
    var shirt=isPlayer?'#344faa':police?'#41688f':stranger?'#a2734a':'#68815b';
    var face=police?'<svg x="7" y="-5" width="66" height="70" viewBox="0 0 120 120">'+tanaka('hi').replace(/^<svg[^>]*>|<\/svg>$/g,'')+'</svg>':
      '<ellipse cx="40" cy="32" rx="21" ry="23" fill="#f0c399"/><path d="M19 30Q15 3 40 6q26-1 22 27l-8-13q-18 8-33 1z" fill="'+(stranger?'#544333':'#2d3034')+'"/><ellipse cx="32" cy="33" rx="2" ry="2.5" fill="#33302e"/><ellipse cx="48" cy="33" rx="2" ry="2.5" fill="#33302e"/><path d="M35 44q5 4 10-1" stroke="#9e5f4d" fill="none" stroke-width="2" stroke-linecap="round"/><ellipse cx="25" cy="41" rx="4" ry="2" fill="#df947f" opacity=".6"/><ellipse cx="54" cy="41" rx="4" ry="2" fill="#df947f" opacity=".6"/>';
    return '<svg viewBox="0 0 80 120" aria-hidden="true"><g class="gm-leg-left"><path d="M30 83l-3 24" stroke="#3a414c" stroke-width="12" stroke-linecap="round"/><path d="M20 109h14" stroke="#252d32" stroke-width="9" stroke-linecap="round"/></g><g class="gm-leg-right"><path d="M49 83l3 24" stroke="#3a414c" stroke-width="12" stroke-linecap="round"/><path d="M47 109h14" stroke="#252d32" stroke-width="9" stroke-linecap="round"/></g><g class="gm-hero-body">'+
      (isPlayer?'<rect x="45" y="54" width="25" height="34" rx="10" fill="#b98947" stroke="#8a663c" stroke-width="2"/>':'')+
      '<path d="M23 61l-7 22M57 61l8 22" stroke="'+shirt+'" stroke-width="12" stroke-linecap="round"/><circle cx="16" cy="85" r="6" fill="#efc196"/><circle cx="65" cy="85" r="6" fill="#efc196"/><path d="M25 54q15-7 30 0l5 34q-20 10-40 0z" fill="'+shirt+'"/><path d="M40 57v32" stroke="#ffffff20" stroke-width="2"/>'+
      (isPlayer?'<path d="M27 52q13 11 26 0l-1 10q-15 5-26-2z" fill="#f2c75f"/><path d="M45 60l9 15 4-7-5-12z" fill="#f2c75f"/>':'')+face+'</g></svg>';
  }
  function propSVG(role){
    if(role==='receipt')return '<svg viewBox="0 0 90 100" aria-hidden="true"><path d="M22 97V65M69 97V65" stroke="#8e6942" stroke-width="7"/><path d="M12 62h67l8 13H5z" fill="#c49a5f"/><rect x="23" y="10" width="45" height="53" rx="4" fill="#fff7df" stroke="#c3a06e" stroke-width="2"/><path d="M32 23h26M32 31h23M32 39h21" stroke="#808b76" stroke-width="3"/><rect x="46" y="46" width="13" height="10" rx="2" fill="#c8372d" opacity=".8"/></svg>';
    if(role==='bike')return '<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="23" cy="72" r="19" fill="#eaf0e388" stroke="#53666b" stroke-width="4"/><circle cx="77" cy="72" r="19" fill="#eaf0e388" stroke="#53666b" stroke-width="4"/><path d="M23 72l20-32 16 32H23l32-32h11l11 32M40 34h15M65 40l-3-14h12" stroke="#3a65a3" stroke-width="4" fill="none" stroke-linejoin="round" stroke-linecap="round"/><circle cx="59" cy="72" r="4" fill="#576473"/></svg>';
    if(role==='chest')return '<svg viewBox="0 0 90 100" aria-hidden="true"><rect x="12" y="47" width="66" height="42" rx="7" fill="#9b673e" stroke="#654a36" stroke-width="3"/><path d="M12 52v-7q0-23 33-23t33 23v7z" fill="#b7864c" stroke="#654a36" stroke-width="3"/><path d="M27 28v59M64 28v59" stroke="#e6bc63" stroke-width="8"/><path d="M13 55h64" stroke="#e6bc63" stroke-width="5"/><rect x="36" y="48" width="18" height="20" rx="4" fill="#f4c75d"/><circle cx="45" cy="57" r="3" fill="#82552c"/></svg>';
    return personSVG(role);
  }
  function nextPoint(n){
    var config=scenes[n];
    return config.points.find(function(p){return !actDone(p.id);})||{id:'chest',label:S.seals[n]?'Bí kíp đã ở trong sổ tay':'Nhận bí kíp của ải',x:config.exit.x,y:config.exit.y};
  }
  function pointStatus(p,n){return p.id==='warm'?'warm':p.id==='chest'?(S.seals[n]?'done':aiDone(n)?'next':'locked'):actDone(p.id)?'done':actOpen(p.id)?'next':'locked';}
  function sceneHTML(n){
    var c=scenes[n];
    return '<section class="gm-shell" aria-label="Màn khám phá '+esc(c.name)+'">'+
      '<canvas class="gm-canvas" aria-label="Chạm vào đường để di chuyển. Có thể dùng bàn phím hoặc chọn điểm đến trong menu."></canvas><div class="gm-world"></div><div class="gm-vignette"></div>'+
      '<header class="gm-hud"><div class="gm-location"><small>'+esc(c.subtitle)+'</small><h1>'+esc(c.name)+'</h1></div><button class="gm-circle" data-gm="menu" aria-label="Mở menu màn chơi">'+icon('book',21)+'</button></header>'+
      '<div class="gm-compass" aria-hidden="true"><svg width="36" height="36" viewBox="0 0 40 40"><path d="M20 2l5 13 13 5-13 5-5 13-5-13L2 20l13-5z" fill="none" stroke="currentColor"/><path d="M20 7v26M7 20h26" stroke="currentColor" opacity=".5"/><circle cx="20" cy="20" r="3" fill="currentColor"/></svg></div>'+
      '<div class="gm-hint">Chạm để đi · Kéo để đổi hướng</div><button class="gm-quest" data-gm="next"><span class="gm-quest-face">'+hau('hi')+'</span><span class="gm-quest-copy"></span><span class="gm-quest-arrow">'+icon('next',18)+'</span></button>'+
      '<div class="gm-layer"></div><div class="gm-loading" role="status"><div class="gm-loader"></div><span>Đang mở trang du ký…</span></div><span class="sr gm-announcement" aria-live="polite"></span></section>';
  }
  function Scene(n){
    var self=this,c=scenes[n];this.n=n;this.config=c;this.shell=$('.gm-shell');this.canvas=$('.gm-canvas');this.ctx=this.canvas.getContext('2d');this.world=$('.gm-world');
    var stored=(prefs().positions||{})[n];
    this.player=nav.project(stored&&Number.isFinite(stored.x)&&Number.isFinite(stored.y)?stored:c.start,c.path);
    c.points.forEach(function(p){if(nav.distance(self.player,p)<55)self.player=nav.project(nav.at(nav.project(p,c.path).along-70,c.path),c.path);});
    this.follow={x:this.player.x-45,y:this.player.y+35};this.camera={x:this.player.x,y:this.player.y};this.route=[];this.target=null;this.keys={};this.pointer=null;this.stopped=false;this.ready=false;this.elapsed=0;this.menu=false;
    this.image=new Image();
    this.resizeHandler=function(){self.resize();};
    this.keyDown=function(e){
      if(self.paused()||/^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(e.target.tagName))return;
      if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','W','A','S','D'].indexOf(e.key)>=0){e.preventDefault();self.keys[e.key.toLowerCase()]=true;}
    };
    this.keyUp=function(e){delete self.keys[e.key.toLowerCase()];};
    this.blurHandler=function(){self.keys={};self.pointer=null;self.persist();};
    this.visibility=function(){if(document.hidden)self.blurHandler();};
    window.addEventListener('resize',this.resizeHandler);window.addEventListener('keydown',this.keyDown);window.addEventListener('keyup',this.keyUp);window.addEventListener('blur',this.blurHandler);document.addEventListener('visibilitychange',this.visibility);
    this.canvas.addEventListener('pointerdown',function(e){if(!self.ready||self.paused()||e.button>0)return;e.preventDefault();self.canvas.setPointerCapture(e.pointerId);self.pointer={id:e.pointerId,x:e.clientX,y:e.clientY};self.travel(self.toWorld(e.clientX,e.clientY));});
    this.canvas.addEventListener('pointermove',function(e){if(!self.pointer||e.pointerId!==self.pointer.id||self.paused())return;if(Math.hypot(e.clientX-self.pointer.x,e.clientY-self.pointer.y)>6){self.travel(self.toWorld(e.clientX,e.clientY));self.pointer.x=e.clientX;self.pointer.y=e.clientY;}});
    ['pointerup','pointercancel','lostpointercapture'].forEach(function(evt){self.canvas.addEventListener(evt,function(){self.pointer=null;self.persist();});});
    this.resize();this.refreshNodes();
    this.image.onload=function(){if(self.stopped)return;self.ready=true;var loader=$('.gm-loading',self.shell);if(loader){loader.classList.add('is-ready');setTimeout(function(){if(loader.isConnected)loader.remove();},400);}};
    this.image.onerror=function(){if(self.stopped)return;$('.gm-loading',self.shell).innerHTML='<span>Chưa tải được cảnh. Bạn có thể thử lại.</span><button class="gm-load-error" data-gm="retry">Tải lại cảnh</button><button class="gm-load-error" data-gm="classic">Học bằng giao diện quen thuộc</button>';};
    this.image.src=c.image;
    var last=performance.now();
    function frame(now){if(self.stopped)return;var dt=Math.min((now-last)/1000,1);last=now;self.update(dt);self.draw();self.frame=requestAnimationFrame(frame);}
    this.frame=requestAnimationFrame(frame);
    this.hintTimer=setTimeout(function(){var hint=$('.gm-hint',self.shell);if(hint)hint.classList.add('is-hidden');},6500);
  }
  Scene.prototype.paused=function(){return V.v==='act'||menuOpen||nbOpen||askOpen||!!$('.ov')||document.hidden;};
  Scene.prototype.resize=function(){
    var r=this.shell.getBoundingClientRect();this.width=r.width;this.height=r.height;this.dpr=Math.min(window.devicePixelRatio||1,1.75);
    this.canvas.width=Math.round(r.width*this.dpr);this.canvas.height=Math.round(r.height*this.dpr);
    this.scale=Math.max(r.width/1000,r.height/1120);this.shell.style.setProperty('--gm-scale',this.scale);
    this.camera={x:this.player.x,y:this.player.y};this.adjustCamera(1);
  };
  Scene.prototype.adjustCamera=function(amount){
    var halfX=this.width/this.scale/2,halfY=this.height/this.scale/2;
    var tx=Math.max(halfX,Math.min(1000-halfX,this.player.x));
    var ty=Math.max(halfY,Math.min(1333-halfY,this.player.y-80));
    this.camera.x+=(tx-this.camera.x)*amount;this.camera.y+=(ty-this.camera.y)*amount;
    this.offsetX=this.width/2-this.camera.x*this.scale;this.offsetY=this.height/2-this.camera.y*this.scale;
  };
  Scene.prototype.toWorld=function(x,y){var r=this.canvas.getBoundingClientRect();return{x:(x-r.left-this.offsetX)/this.scale,y:(y-r.top-this.offsetY)/this.scale};};
  Scene.prototype.travel=function(point,target){
    this.route=nav.route(this.player,point,this.config.path);this.target=target||null;this.keys={};
    var hint=$('.gm-hint',this.shell);if(hint)hint.classList.add('is-hidden');
  };
  Scene.prototype.persist=function(){prefs().positions=prefs().positions||{};prefs().positions[this.n]={x:Math.round(this.player.x),y:Math.round(this.player.y)};save(true);};
  Scene.prototype.update=function(dt){
    this.elapsed+=dt;var walking=false;
    if(this.ready&&!this.paused()){
      var dx=(this.keys.arrowright||this.keys.d?1:0)-(this.keys.arrowleft||this.keys.a?1:0),dy=(this.keys.arrowdown||this.keys.s?1:0)-(this.keys.arrowup||this.keys.w?1:0);
      if(dx||dy){var projected=nav.project({x:this.player.x+dx*240*dt,y:this.player.y+dy*240*dt},this.config.path);this.route=[projected];this.target=null;}
      var remaining=185*dt;
      while(remaining>0&&this.route.length){var p=this.route[0],dist=nav.distance(this.player,p);var step=Math.min(dist,remaining);if(dist>.1){this.facing=p.x-this.player.x;this.player.x+=(p.x-this.player.x)/dist*step;this.player.y+=(p.y-this.player.y)/dist*step;walking=true;}remaining-=step;if(dist<=step+.1)this.route.shift();else break;}
      if(!this.route.length&&this.target){var target=this.target;this.target=null;this.persist();activate(target);return;}
    }
    this.adjustCamera(reduced?1:Math.min(1,dt*5));
    this.world.style.transform='translate('+this.offsetX+'px,'+this.offsetY+'px) scale('+this.scale+')';
    this.hero.style.left=this.player.x+'px';this.hero.style.top=this.player.y+'px';this.hero.style.zIndex=Math.round(this.player.y);
    this.hero.classList.toggle('is-walking',walking&&!reduced);if(walking)this.hero.classList.toggle('is-left',this.facing<-.1);
    this.follow.x+=(this.player.x-50-this.follow.x)*Math.min(1,dt*3);this.follow.y+=(this.player.y+25-this.follow.y)*Math.min(1,dt*3);
    this.companion.style.left=this.follow.x+'px';this.companion.style.top=(this.follow.y+(reduced?0:Math.sin(this.elapsed*2)*4))+'px';this.companion.style.zIndex=Math.round(this.follow.y);
  };
  Scene.prototype.draw=function(){
    var ctx=this.ctx;ctx.setTransform(this.dpr,0,0,this.dpr,0,0);ctx.clearRect(0,0,this.width,this.height);ctx.fillStyle='#d9e1cd';ctx.fillRect(0,0,this.width,this.height);
    if(!this.ready)return;
    ctx.save();ctx.translate(this.offsetX,this.offsetY);ctx.scale(this.scale,this.scale);ctx.drawImage(this.image,0,0,1000,1333);
    if(this.route.length){var p=this.route[this.route.length-1];ctx.strokeStyle='#fff8db';ctx.lineWidth=3;ctx.globalAlpha=.85;ctx.beginPath();ctx.ellipse(p.x,p.y,16+(reduced?0:Math.sin(this.elapsed*4)*2),7,0,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}
    ctx.restore();
    if(!reduced){for(var i=0;i<12;i++){var t=this.elapsed*.012*(1+(i%3)*.2),px=((i*83.17+t*330)%1100-50)/1000*this.width,py=((i*117.3+t*500)%1500-80)/1333*this.height;ctx.save();ctx.translate(px,py);ctx.rotate(this.elapsed*.3+i);ctx.fillStyle=this.n===5?'rgba(255,218,220,.7)':'rgba(255,244,194,.55)';ctx.beginPath();ctx.ellipse(0,0,this.n===5?3:1.5,this.n===5?1.5:1,0,0,Math.PI*2);ctx.fill();ctx.restore();}}
  };
  Scene.prototype.refreshNodes=function(){
    var self=this,c=this.config,np=nextPoint(this.n),all=c.points.concat([{id:'warm',x:c.warm.x,y:c.warm.y,role:'hau',label:'Gặp Ngộ Không',ic:'ask'},{id:'chest',x:c.exit.x,y:c.exit.y,role:'chest',label:'Rương bí kíp',ic:'seal'}]);
    var oldHero=this.hero,oldCompanion=this.companion;
    this.world.innerHTML=all.map(function(p){var status=pointStatus(p,self.n),figure=p.role==='hau'?hau('hi'):propSVG(p.role);return '<button class="gm-node is-'+status+'" style="left:'+p.x+'px;top:'+p.y+'px;z-index:'+p.y+'" data-gm="point" data-point="'+p.id+'" aria-label="'+esc(p.label+(status==='locked'?' · Chưa mở':status==='done'?' · Đã hoàn thành':''))+'"><span class="gm-node-badge">'+icon(status==='done'?'check':status==='locked'?'lock':p.ic,20)+'</span><span class="gm-node-figure'+(p.role==='hau'?' gm-face':'')+'">'+figure+'</span><span class="gm-node-label">'+esc(p.label)+'</span></button>';}).join('');
    this.hero=oldHero||document.createElement('div');this.hero.className='gm-player';if(!oldHero)this.hero.innerHTML=personSVG('player')+'<span class="gm-player-label">'+esc(GAME_PREVIEW?'Bạn':given())+'</span>';
    this.companion=oldCompanion||document.createElement('div');this.companion.className='gm-companion';if(!oldCompanion)this.companion.innerHTML=hau('hi');
    this.world.appendChild(this.hero);this.world.appendChild(this.companion);
    $('.gm-quest-copy',this.shell).innerHTML='<small>'+ (aiDone(this.n)?'Một trang du ký đã trọn vẹn':'Chặng tiếp theo')+'</small><b>'+esc(np.label)+'</b>';
  };
  Scene.prototype.destroy=function(){this.persist();this.stopped=true;cancelAnimationFrame(this.frame);clearTimeout(this.hintTimer);window.removeEventListener('resize',this.resizeHandler);window.removeEventListener('keydown',this.keyDown);window.removeEventListener('keyup',this.keyUp);window.removeEventListener('blur',this.blurHandler);document.removeEventListener('visibilitychange',this.visibility);this.image.onload=this.image.onerror=null;};
  function stop(){if(active){active.destroy();active=null;}menuOpen=false;document.body.classList.remove('gm-active');}
  function sceneLayer(){return active&&$('.gm-layer',active.shell);}
  function setLayer(html){
    var layer=sceneLayer();if(!layer)return;
    layer.innerHTML=html;
    ['.gm-hud','.gm-quest','.gm-world'].forEach(function(q){var e=$(q,active.shell);if(e)e.inert=!!html;});
    if(html){lastFocus=document.activeElement;var focus=$('button:not([disabled]),input,select,textarea,[tabindex="0"]',layer);if(focus)focus.focus({preventScroll:true});}
    else if(lastFocus&&lastFocus.isConnected){lastFocus.focus({preventScroll:true});lastFocus=null;}
  }
  function showMenu(){
    if(!active)return;menuOpen=true;
    var n=active.n,points=active.config.points;
    var h='<div class="gm-dialog-scrim" data-gm="dismiss"></div><section class="gm-menu" role="dialog" aria-modal="true" aria-label="Sổ tay hành trình"><button class="gm-circle gm-menu-close" data-gm="dismiss" aria-label="Đóng menu">'+icon('close',17)+'</button><h2>Nghỉ chân</h2><p>Một chút ngơi nghỉ giữa hành trình.</p>'+
      htmlButton('dismiss','Tiếp tục khám phá','next')+htmlButton('notebook','Mở sổ tay','book')+htmlButton('ask','Hỏi chú Tanaka','ask')+htmlButton('home','Về bản đồ hành trình','map');
    h+='<h3>Các điểm trong màn</h3>'+points.map(function(p){return htmlButton('visit',p.label,actDone(p.id)?'check':actOpen(p.id)?p.ic:'lock','data-point="'+p.id+'"');}).join('');
    if(GAME_PREVIEW)h+='<h3>Hai màn trải nghiệm</h3>'+htmlButton('scene','Cổng Làng','gate','data-scene="1"')+htmlButton('scene','Phố Phường','building','data-scene="5"');
    h+='<h3>Cách học</h3>'+htmlButton('classic','Chuyển về giao diện quen thuộc','scroll')+'<p class="gm-menu-note">'+(GAME_PREVIEW?'Bản trải nghiệm riêng · Bài làm chính của bạn được giữ riêng.':'Bài làm được lưu trên trình duyệt này.')+'</p></section>';
    setLayer(h);
  }
  function dismiss(){menuOpen=false;setLayer('');if(active)active.keys={};}
  function announce(message){var e=$('.gm-announcement');if(e)e.textContent=message;toast(esc(message),3500);}
  function activate(id){
    if(!active)return;var n=active.n;
    if(id==='warm'){menuOpen=true;setLayer('<div class="gm-dialog-scrim" data-gm="dismiss"></div><section class="gm-menu" role="dialog" aria-modal="true" aria-label="Ngộ Không chỉ đường"><div style="width:80px;margin:auto">'+hau('cheer')+'</div><h2>Đi cùng tôi nhé!</h2><p>'+esc(active.config.tip)+' Gặp người, xem kỹ, rồi chọn cách xử lý của mình. Chọn sai thì cùng nghĩ lại.</p>'+htmlButton('dismiss','Bắt đầu khám phá','next')+htmlButton('warm','Khởi động 30 giây','bulb')+'</section>');return;}
    if(id==='chest'){
      if(!aiDone(n)){announce('Hoàn thành các cuộc gặp trong ải rồi quay lại nhận bí kíp nhé.');return;}
      if(S.seals[n]){openChest(n);return;}
      victory(n);return;
    }
    if(!actOpen(id)){announce('Cùng hoàn thành cuộc gặp trước để mở chặng này nhé.');return;}
    go('act',{id:id});
  }
  function visit(id){
    if(!active||!active.ready)return;dismiss();
    var c=active.config,p=id==='warm'?c.warm:id==='chest'?c.exit:c.points.find(function(x){return x.id===id;});
    if(!p)return;
    if(id!=='warm'&&id!=='chest'&&!actOpen(id)){announce('Cùng hoàn thành cuộc gặp trước để mở chặng này nhé.');return;}
    if(nav.distance(active.player,p)<90){activate(id);return;}
    var destination=nav.project(p,c.path),from=nav.project(active.player,c.path);
    var stopAt=nav.at(destination.along+(from.along<destination.along?-65:65),c.path);
    active.travel(stopAt,id);$('.gm-announcement').textContent='Đang đi tới '+(p.label||'điểm đến');
  }
  function setMode(on){
    if(nbOpen)closeNb(true);if(askOpen)closeAsk(true);
    prefs().enabled=on;save(true);menuOpen=false;
    if(on&&!scenes[sceneNumber()]&&aiOpen(1)){go('ai',{n:1});return;}
    render(true);
    if(on&&!eligible())toast('Đã bật chế độ khám phá. Hoàn thành Lên đường để vào Cổng Làng.');
  }
  aiOpen=function(n){if(GAME_PREVIEW&&scenes[n])return true;return oldAiOpen(n);};
  nbSettings=function(){
    var h=oldSettings(),feature='<details class="gm-settings"><summary>Trải nghiệm thử nghiệm</summary><p>Khám phá Cổng Làng và Phố Phường trong thế giới 2.5D. Chạm để đi, gặp nhân vật và tiếp tục bài học. Các ải còn lại dùng giao diện quen thuộc.</p><div class="gm-status">'+(enabled()?'Chế độ khám phá đang bật':'Chế độ khám phá đang tắt')+'</div><button class="btn btn--sm btn--soft" data-gm="toggle">'+(enabled()?'Tắt chế độ khám phá':'Bật chế độ khám phá')+'</button>'+(GAME_PREVIEW?'<p><a href="./index.html">Vào khóa học chính</a></p>':'')+'</details>';
    return h.replace('<p class="ver">',feature+'<p class="ver">');
  };
  render=function(enter){
    if(!eligible()){stop();oldRender(enter);return;}
    var n=sceneNumber();
    if(!aiOpen(n)){stop();oldRender(enter);return;}
    if(V.v==='act'&&!actOpen(V.id)){V={v:'ai',n:n};}
    document.body.classList.add('gm-active');
    if(!active||active.n!==n||!active.shell.isConnected){if(active)active.destroy();APP.innerHTML=sceneHTML(n);active=new Scene(n);}
    else active.refreshNodes();
    updateNav();menuOpen=false;
    if(V.v==='act'){
      var point=scenes[n].points.find(function(p){return p.id===V.id;});
      var lesson= vAct(V.id);
      setLayer('<div class="gm-dialog-scrim" data-gm="close-lesson"></div><section class="gm-lesson" role="dialog" aria-modal="true" aria-label="'+esc(ACTS[V.id].t)+'"><header class="gm-lesson-top"><span>'+esc(point?point.place:'Gặp Ngộ Không')+'</span><button class="gm-circle" data-gm="close-lesson" aria-label="Quay lại cảnh chơi">'+icon('close',18)+'</button></header><div class="gm-lesson-scroll">'+lesson+'</div></section>');
      wireAct();
      if(enter){var scroller=$('.gm-lesson-scroll');if(scroller)scroller.scrollTop=0;}
    }else setLayer('');
  };
  document.addEventListener('click',function(e){
    var t=e.target.closest('[data-gm]');if(!t)return;e.preventDefault();var action=t.dataset.gm;
    switch(action){
      case 'toggle':setMode(!enabled());break;
      case 'classic':setMode(false);break;
      case 'menu':showMenu();break;
      case 'dismiss':dismiss();break;
      case 'next':if(active)visit(nextPoint(active.n).id);break;
      case 'point':case 'visit':visit(t.dataset.point);break;
      case 'close-lesson':if(active)go('ai',{n:active.n});break;
      case 'notebook':dismiss();openNb();break;
      case 'ask':dismiss();openAsk();break;
      case 'home':dismiss();go('home');break;
      case 'scene':if(GAME_PREVIEW&&scenes[t.dataset.scene]){dismiss();go('ai',{n:+t.dataset.scene});}break;
      case 'warm':if(active){var id=aiOf(active.n).warm;dismiss();go('act',{id:id});}break;
      case 'retry':if(active){var n=active.n;active.destroy();active=null;V={v:'ai',n:n};render(true);}break;
    }
  });
  document.addEventListener('keydown',function(e){
    if(!active||nbOpen||askOpen||$('.ov'))return;
    if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();if(menuOpen){dismiss();}else if(V.v==='act'){go('ai',{n:active.n});}else showMenu();return;}
    if(e.key==='Tab'){
      var layer=sceneLayer();if(!layer||!layer.firstElementChild)return;
      var candidates=Array.from(layer.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]')).filter(function(el){return el.getClientRects().length>0;});
      var first=candidates[0],last=candidates[candidates.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    }
  },true);
  window.addEventListener('pagehide',function(){if(active)active.persist();});
  window.HP05Game={version:'TK13-step1',scenes:[1,5],getState:function(){return{enabled:enabled(),preview:GAME_PREVIEW,scene:active?active.n:null,position:active?{x:active.player.x,y:active.player.y}:null,ready:!!(active&&active.ready)};}};
  if(GAME_PREVIEW){V={v:'ai',n:new URLSearchParams(location.search).get('scene')==='5'?5:1};try{history.replaceState(V,'','');}catch(e){}}
  render(false);
})();
