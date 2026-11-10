/* Installation help and safe updates. Learning data remains in the TK13 store. */
(function(){
  'use strict';
  var deferredPrompt=null,installedThisSession=false,offlineReady=false,registration=null,refreshRequested=false;
  var dialogFocus=null,background=[],bodyOverflow='',updateDismissed=false;
  var standaloneQuery=window.matchMedia('(display-mode: standalone)');
  function standalone(){return standaloneQuery.matches||window.navigator.standalone===true;}
  function installed(){return standalone()||installedThisSession;}
  function isIOS(){return /iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);}
  function isAndroid(){return /Android/i.test(navigator.userAgent);}
  function escText(value){return String(value).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function closeIcon(){return '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>';}
  function refreshButtons(){
    document.body.classList.toggle('pwa-installed',installed());
    Array.from(document.querySelectorAll('[data-pwa="install"]')).forEach(function(button){
      var label=button.querySelector('[data-pwa-label]');
      if(label)label.textContent=installed()?(standalone()?'Đang dùng ứng dụng':'Đã cài ứng dụng'):'Cài ứng dụng';
    });
  }
  function closeDialog(){
    var el=document.getElementById('pwa-dialog');if(!el)return;
    el.remove();background.forEach(function(item){if(item.element.isConnected)item.element.inert=item.inert;});background=[];
    document.body.style.overflow=bodyOverflow;
    if(dialogFocus&&dialogFocus.isConnected)dialogFocus.focus({preventScroll:true});dialogFocus=null;
  }
  function steps(){
    if(isIOS())return '<ol><li>Mở khóa học bằng <b>Safari</b> hoặc Chrome trên iPhone.</li><li>Chạm nút <b>Chia sẻ</b>, chọn <b>Thêm vào màn hình chính</b>.</li><li>Nếu có tùy chọn <b>Mở dưới dạng ứng dụng web</b> (Open as Web App), hãy bật. Chạm <b>Thêm</b>.</li><li>Mở biểu tượng <b>Nhật Bản Du Ký</b> trên màn hình chính để học như một ứng dụng.</li></ol><p>Nếu chưa thấy mục thêm vào màn hình chính, hãy mở liên kết này bằng Safari.</p>';
    if(isAndroid())return '<ol><li>Mở khóa học bằng <b>Chrome</b>.</li><li>Chạm menu <b>⋮</b> → <b>Cài đặt và tạo lối tắt</b> → <b>Cài đặt</b>. Một số máy hiển thị <b>Thêm vào màn hình chính</b>.</li><li>Xác nhận theo hướng dẫn, rồi mở biểu tượng <b>Nhật Bản Du Ký</b> trên điện thoại.</li></ol><p>Nếu nút cài chưa xuất hiện, hãy học trên trang một lúc rồi kiểm tra lại menu Chrome.</p>';
    return '<ol><li>Mở khóa học bằng <b>Chrome</b> hoặc Edge.</li><li>Chọn biểu tượng <b>Cài đặt</b> ở thanh địa chỉ, hoặc tìm mục cài trang này thành ứng dụng trong menu trình duyệt.</li><li>Trên điện thoại, dùng Chrome cho Android hoặc Chia sẻ → Thêm vào màn hình chính trên iPhone.</li></ol>';
  }
  function showHelp(){
    closeDialog();
    var localFile=location.protocol==='file:';
    var intro=installed()?(standalone()?'Bạn đang mở khóa học bằng ứng dụng.':'Ứng dụng đã được cài. Hãy mở biểu tượng Nhật Bản Du Ký trên thiết bị để học.'):'Thêm khóa học vào màn hình chính để mở nhanh, có biểu tượng riêng và học trong cửa sổ ứng dụng.';
    var html='<section class="pwa-panel"><button class="pwa-panel-close" data-pwa="close" aria-label="Đóng hướng dẫn cài ứng dụng">'+closeIcon()+'</button><div class="pwa-panel-top"><img src="./icons/app-192.png" alt=""><div><small>NHẬT BẢN DU KÝ · HP05</small><h2 id="pwa-dialog-title">'+(installed()?'Ứng dụng của bạn':'Cài ứng dụng')+'</h2></div></div><p>'+intro+'</p>';
    if(localFile)html+='<p>Để cài ứng dụng, hãy mở <b>đường dẫn website của khóa học</b> do thầy cô gửi. Tệp HTML đang mở trên máy chưa dùng để cài được.</p>';
    else if(!installed())html+=steps();
    if(!installed())html+='<p class="pwa-backup-note">Đã học trước đó? Tải bản sao lưu trong Sổ tay để mang bài làm sang ứng dụng khi cần.</p>';
    if(offlineReady)html+='<p class="pwa-offline-ready">Khóa học đã được lưu để mở lại khi mất mạng. Game Phố Phường dùng ngoại tuyến sau khi bạn đã mở và tải cảnh game.</p><p class="pwa-footnote">Video và bài đọc trên website khác vẫn cần mạng.</p>';
    else if(!localFile)html+='<p class="pwa-footnote">Giữ kết nối trong lần mở đầu để ứng dụng lưu nội dung. Video và bài đọc trên website khác vẫn cần mạng.</p>';
    if(deferredPrompt&&!installed())html+='<button class="btn" data-pwa="native-install">Cài trên thiết bị này</button>';
    html+='<button class="btn btn--soft" data-pwa="close">'+(deferredPrompt&&!installed()?'Để sau':'Đã hiểu')+'</button><p class="pwa-footnote">Bài làm tiếp tục lưu trên trình duyệt hoặc ứng dụng của thiết bị này. Khi cần chuyển, dùng Sao lưu và Khôi phục trong Sổ tay.</p></section>';
    var overlay=document.createElement('div');overlay.id='pwa-dialog';overlay.className='pwa-overlay';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','pwa-dialog-title');overlay.innerHTML=html;
    dialogFocus=document.activeElement;bodyOverflow=document.body.style.overflow;
    ['app','nav','nb','ask'].forEach(function(id){var el=document.getElementById(id);if(el){background.push({element:el,inert:el.inert});el.inert=true;}});
    document.body.style.overflow='hidden';document.body.appendChild(overlay);overlay.querySelector('button').focus({preventScroll:true});
  }
  async function nativeInstall(){
    var event=deferredPrompt;
    if(!event){showHelp();return;}
    deferredPrompt=null;
    try{
      await event.prompt();
      var choice=await event.userChoice;
      if(choice&&choice.outcome==='accepted'){installedThisSession=true;closeDialog();}
    }catch(error){showHelp();}
    refreshButtons();
  }
  function installAction(){if(deferredPrompt&&!installed())nativeInstall();else showHelp();}
  function showUpdate(){
    if(!registration||!registration.waiting||updateDismissed||document.getElementById('pwa-update'))return;
    var el=document.createElement('div');el.id='pwa-update';el.className='pwa-update-notice';el.setAttribute('role','status');
    el.innerHTML='<span>Có phiên bản khóa học mới.</span><button data-pwa="update">Cập nhật</button><button class="pwa-update-later" data-pwa="later" aria-label="Để sau">'+closeIcon()+'</button>';
    document.body.appendChild(el);
  }
  function startUpdate(){
    if(!registration||!registration.waiting)return;
    if(typeof save==='function')save(true);
    refreshRequested=true;registration.waiting.postMessage({type:'ACTIVATE_UPDATE'});
    var button=document.querySelector('[data-pwa="update"]');if(button){button.disabled=true;button.textContent='Đang cập nhật…';}
  }
  function preserveOpenedGame(){
    var entry=window.HP05StreetEntry;
    if(!window.HP05StreetGame&&(!entry||['game','loading'].indexOf(entry.getMode())<0))return;
    var worker=navigator.serviceWorker.controller||(registration&&registration.active);if(!worker||!worker.postMessage)return;
    var script=document.querySelector('script[src*="navigation.js"]'),version='20261110-1';
    if(script)version=new URL(script.src).searchParams.get('v')||version;
    var urls=['navigation.js','street-game.js','street-game.css'].map(function(file){return new URL('./'+file+'?v='+encodeURIComponent(version),location.href).href;});
    urls.push(new URL('./assets/street.webp',location.href).href);
    worker.postMessage({type:'CACHE_OPENED_GAME',urls:urls});
  }
  function watchRegistration(reg){
    registration=reg;if(reg.waiting)showUpdate();
    reg.addEventListener('updatefound',function(){
      var worker=reg.installing;if(!worker)return;
      worker.addEventListener('statechange',function(){if(worker.state==='installed'&&navigator.serviceWorker.controller)showUpdate();});
    });
    return navigator.serviceWorker.ready.then(function(){offlineReady=true;document.body.dataset.pwaOfflineReady='1';preserveOpenedGame();});
  }
  function register(){
    if(!('serviceWorker' in navigator)||!window.isSecureContext||location.protocol==='file:')return;
    navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).then(watchRegistration).catch(function(){offlineReady=false;});
  }
  window.addEventListener('beforeinstallprompt',function(event){event.preventDefault();deferredPrompt=event;refreshButtons();});
  window.addEventListener('appinstalled',function(){installedThisSession=true;deferredPrompt=null;closeDialog();refreshButtons();});
  if(standaloneQuery.addEventListener)standaloneQuery.addEventListener('change',refreshButtons);
  else if(standaloneQuery.addListener)standaloneQuery.addListener(refreshButtons);
  if('serviceWorker' in navigator)navigator.serviceWorker.addEventListener('controllerchange',function(){
    if(refreshRequested){if(typeof save==='function')save(true);location.reload();}
    else preserveOpenedGame();
  });
  document.addEventListener('click',function(event){
    var button=event.target.closest('[data-pwa]');if(!button)return;event.preventDefault();
    switch(button.dataset.pwa){
      case 'install':installAction();break;
      case 'native-install':nativeInstall();break;
      case 'close':closeDialog();break;
      case 'update':startUpdate();break;
      case 'later':updateDismissed=true;var el=document.getElementById('pwa-update');if(el)el.remove();break;
    }
  });
  document.addEventListener('keydown',function(event){
    var dialog=document.getElementById('pwa-dialog');if(!dialog)return;
    if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();closeDialog();return;}
    if(event.key==='Tab'){
      var focusables=Array.from(dialog.querySelectorAll('button:not([disabled]),a[href]')),first=focusables[0],last=focusables[focusables.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
  },true);
  if(typeof render==='function'){var courseRender=render;render=function(enter){courseRender(enter);refreshButtons();};}
  refreshButtons();
  if(document.readyState==='complete')register();else window.addEventListener('load',register,{once:true});
  window.HP05PWA={showHelp:showHelp,version:'20261110-pwa-2'};
})();
