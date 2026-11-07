(function(){
  var params=new URLSearchParams(window.location.search);
  var source=params.get("source")||"";
  var station=params.get("station")||"إذاعة القرآن الكريم";
  var token=params.get("token")||"";
  var audio=document.getElementById("floatingAudio");
  var playButton=document.getElementById("playPause");
  var status=document.getElementById("playerStatus");
  var volume=document.getElementById("volume");
  var channel=null;

  if("BroadcastChannel" in window)channel=new BroadcastChannel("yazeed-radio-player");

  function notifyParent(type){
    var message={type:type,token:token};
    if(channel)channel.postMessage(message);
    if(window.opener&&!window.opener.closed){
      window.opener.postMessage({channel:"yazeed-radio-player",type:type,token:token},"*");
    }
  }
  function setPlaying(playing){
    playButton.textContent=playing?"إيقاف مؤقت":"تشغيل";
    status.textContent=playing?"يستمر البث من هذه النافذة أثناء تصفحك للموقع.":"اضغط تشغيل لبدء البث من هذه النافذة.";
    notifyParent(playing?"playing":"paused");
  }
  function startPlayback(){
    audio.play().catch(function(error){
      status.textContent=error&&error.name==="NotAllowedError"
        ?"اضغط تشغيل للسماح للمتصفح ببدء البث."
        :"تعذّر بدء البث. تحقق من اتصال الإنترنت ثم حاول مجددًا.";
      playButton.disabled=false;
    });
  }

  document.getElementById("stationName").textContent=station;
  var volumeParam=params.get("volume");
  var initialVolume=volumeParam===null?0.8:Number(volumeParam);
  audio.volume=Number.isFinite(initialVolume)?Math.max(0,Math.min(1,initialVolume)):0.8;
  volume.value=String(audio.volume);
  if(!/^https:\/\//i.test(source)){
    status.textContent="رابط البث غير صالح.";
    playButton.disabled=true;
    return;
  }
  audio.src=source;
  audio.addEventListener("playing",function(){setPlaying(true);});
  audio.addEventListener("pause",function(){setPlaying(false);});
  audio.addEventListener("error",function(){status.textContent="تعذّر الاتصال بالبث. تحقق من الإنترنت ثم حاول مجددًا.";});
  playButton.addEventListener("click",function(){
    if(audio.paused)startPlayback();
    else audio.pause();
  });
  volume.addEventListener("input",function(){audio.volume=Number(volume.value);});
  document.getElementById("closePlayer").addEventListener("click",function(){
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    notifyParent("closed");
    window.close();
  });
  window.addEventListener("pagehide",function(){notifyParent("closed");});
  if(channel)channel.addEventListener("message",function(event){
    if(event.data&&event.data.type==="stop"){
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
  });
  startPlayback();
})();
