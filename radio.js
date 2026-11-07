(function(){
  var audio=document.getElementById("radioAudio");
  var reactiveAudio=null;
  var activeAudio=audio;
  var panel=document.querySelector(".radio-player-panel");
  var nowPlaying=document.getElementById("radioNowPlaying");
  var status=document.getElementById("radioStatus");
  var playPause=document.getElementById("radioPlayPause");
  var stopButton=document.getElementById("radioStop");
  var floatingPlayerButton=document.getElementById("radioFloatingPlayer");
  var volume=document.getElementById("radioVolume");
  var transcript=document.getElementById("radioTranscript");
  var activeTranscriptionSocket=null;
  var activeStationButton=null;
  var reciterGrid=document.getElementById("radioReciterGrid");
  var reciterStatus=document.getElementById("radioReciterStatus");
  var sunnahPlayer=document.getElementById("sunnahPlayer");
  var sunnahFrame=sunnahPlayer.querySelector("iframe");
  var sunnahUrl="https://saudiatv.sba.sa/Channel-%D9%82%D9%86%D8%A7%D8%A9-%D8%A7%D9%84%D8%B3%D9%86%D8%A9-%D8%A7%D9%84%D9%86%D8%A8%D9%88%D9%8A%D8%A9-5";
  var activeKind="";
  var audioContext=null;
  var analyser=null;
  var waveformFrame=0;
  var waveformBars=Array.prototype.slice.call(document.querySelectorAll("#radioWaveform i"));
  var floatingWindow=null;
  var floatingToken="";
  var floatingChannel=null;

  if("BroadcastChannel" in window)floatingChannel=new BroadcastChannel("yazeed-radio-player");

  function getReactiveAudio(){
    if(!reactiveAudio){
      reactiveAudio=new Audio();
      reactiveAudio.preload="none";
      reactiveAudio.crossOrigin="anonymous";
      reactiveAudio.volume=Number(volume.value);
      var AudioContextType=window.AudioContext||window.webkitAudioContext;
      if(AudioContextType){
        audioContext=new AudioContextType();
        analyser=audioContext.createAnalyser();
        analyser.fftSize=64;
        var source=audioContext.createMediaElementSource(reactiveAudio);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
      }
      bindAudioEvents(reactiveAudio);
    }
    return reactiveAudio;
  }
  function stopWaveform(){
    if(waveformFrame)cancelAnimationFrame(waveformFrame);
    waveformFrame=0;
    panel.classList.remove("is-reactive-waveform");
  }
  function animateWaveform(){
    if(!analyser||activeAudio!==reactiveAudio||activeAudio.paused){
      stopWaveform();
      return;
    }
    var samples=new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteTimeDomainData(samples);
    waveformBars.forEach(function(bar,index){
      var sample=samples[Math.floor(index*samples.length/waveformBars.length)]||128;
      var height=Math.max(5,Math.min(48,5+Math.abs(sample-128)*0.72));
      bar.style.height=height+"px";
    });
    waveformFrame=requestAnimationFrame(animateWaveform);
  }
  function startWaveform(){
    stopWaveform();
    if(!analyser||activeAudio!==reactiveAudio)return;
    panel.classList.add("is-reactive-waveform");
    animateWaveform();
  }

  function setSelectedCard(card){
    document.querySelectorAll(".radio-station-card").forEach(function(item){item.classList.toggle("is-selected",item===card);});
  }
  function stopTranscription(message){
    if(activeTranscriptionSocket){
      var socket=activeTranscriptionSocket;
      activeTranscriptionSocket=null;
      socket.close(1000,"Playback stopped");
    }
    if(message&&transcript)transcript.textContent=message;
  }
  function startTranscription(button){
    if(!transcript)return;
    stopTranscription();
    var station=button.getAttribute("data-transcription-station");
    var baseUrl=String(window.YAZEED_TRANSCRIPTION_API_URL||"").trim().replace(/\/+$/,"");
    if(!station)return;
    if(!baseUrl){
      transcript.textContent="لفتح التفريغ الحي، افتح الموقع من رابط الخادم المؤقت. تعليمات تشغيله موجودة في README.md.";
      return;
    }
    var socketUrl=baseUrl.replace(/^https:/i,"wss:").replace(/^http:/i,"ws:")+"/transcribe";
    var socket;
    try{
      socket=new WebSocket(socketUrl);
    }catch(error){
      transcript.textContent="تعذّر الاتصال بخادم التفريغ. تحقق من رابط الخادم.";
      return;
    }
    activeTranscriptionSocket=socket;
    var hasTranscript=false;
    transcript.textContent="جارٍ الاتصال بخدمة التفريغ…";
    socket.addEventListener("open",function(){
      if(activeTranscriptionSocket===socket)socket.send(JSON.stringify({station:station}));
    });
    socket.addEventListener("message",function(event){
      if(activeTranscriptionSocket!==socket)return;
      var data;
      try{data=JSON.parse(event.data);}catch(error){
        transcript.textContent="وصلت استجابة غير صالحة من خدمة التفريغ.";
        stopTranscription();
        return;
      }
      if(data.type==="error"){
        transcript.textContent=data.text||"حدث خطأ أثناء التفريغ.";
        stopTranscription();
      }else if(data.type==="transcript"&&data.text){
        var nextText=(hasTranscript?transcript.textContent+" ":"")+data.text;
        hasTranscript=true;
        transcript.textContent=nextText.slice(-1600);
      }else if(data.type==="status"&&data.text){
        transcript.textContent=data.text;
      }else if(data.type==="done"){
        stopTranscription();
      }
    });
    socket.addEventListener("error",function(){
      if(activeTranscriptionSocket===socket){
        transcript.textContent="تعذّر الاتصال بخادم التفريغ. تأكد أن جهاز الخادم متصل وأنك تستخدم الرابط المؤقت الحالي.";
        stopTranscription();
      }
    });
    socket.addEventListener("close",function(){
      if(activeTranscriptionSocket===socket){
        activeTranscriptionSocket=null;
        if(activeKind==="audio"&&!activeAudio.paused){
          transcript.textContent="انقطع الاتصال بخدمة التفريغ. أعد اختيار المحطة للمحاولة مجددًا.";
        }
      }
    });
  }
  function updatePlayback(isPlaying){
    panel.classList.toggle("is-playing",isPlaying);
    playPause.textContent=isPlaying?"إيقاف مؤقت":"تشغيل";
    playPause.setAttribute("aria-label",isPlaying?"إيقاف مؤقت":"تشغيل");
    playPause.disabled=activeKind!=="audio";
    stopButton.disabled=!activeKind;
    floatingPlayerButton.disabled=!activeAudio.src||activeKind==="official";
    if(isPlaying)startWaveform();
    else stopWaveform();
  }
  function closeFloatingPlayer(){
    if(floatingChannel&&floatingToken)floatingChannel.postMessage({type:"stop",token:floatingToken});
    if(floatingWindow&&!floatingWindow.closed)floatingWindow.close();
    floatingWindow=null;
    floatingToken="";
  }
  function handleFloatingPlayerMessage(message){
    if(!message||message.token!==floatingToken)return;
    if(message.type==="playing"){
      activeKind="floating";
      if(!activeAudio.paused)activeAudio.pause();
      status.textContent="يستمر البث من المشغل العائم أثناء تصفحك للموقع.";
      updatePlayback(false);
    }else if(message.type==="paused"||message.type==="closed"){
      if(activeKind==="floating")activeKind="audio";
      status.textContent=message.type==="closed"?"أُغلق المشغل العائم. يمكنك متابعة الاستماع من هنا.":"تم إيقاف المشغل العائم مؤقتًا.";
      updatePlayback(false);
      if(message.type==="closed")floatingWindow=null;
    }
  }
  if(floatingChannel)floatingChannel.addEventListener("message",function(event){handleFloatingPlayerMessage(event.data);});
  window.addEventListener("message",function(event){
    if(event.source===floatingWindow&&event.data&&event.data.channel==="yazeed-radio-player"){
      handleFloatingPlayerMessage(event.data);
    }
  });
  floatingPlayerButton.addEventListener("click",function(){
    if(!activeAudio.src||activeKind==="official")return;
    if(floatingWindow&&!floatingWindow.closed){
      floatingWindow.focus();
      return;
    }
    floatingToken=String(Date.now())+"-"+Math.random().toString(36).slice(2);
    var playerUrl=new URL("radio-player.html",window.location.href);
    playerUrl.searchParams.set("source",activeAudio.src);
    playerUrl.searchParams.set("station",nowPlaying.textContent);
    playerUrl.searchParams.set("token",floatingToken);
    playerUrl.searchParams.set("volume",String(activeAudio.volume));
    floatingWindow=window.open(playerUrl.href,"yazeedRadioPlayer","popup=yes,width=380,height=260,resizable=yes");
    if(!floatingWindow){
      status.textContent="سمح بفتح النوافذ المنبثقة لفتح المشغل العائم.";
      return;
    }
    status.textContent="افتح المشغل العائم وابدأ البث منه قبل الانتقال إلى صفحة أخرى.";
  });
  function stopAll(){
    closeFloatingPlayer();
    stopTranscription("اختر محطة صوتية لبدء التفريغ المباشر.");
    activeStationButton=null;
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    if(reactiveAudio){
      reactiveAudio.pause();
      reactiveAudio.removeAttribute("src");
      reactiveAudio.load();
    }
    activeAudio=audio;
    sunnahFrame.removeAttribute("src");
    sunnahPlayer.hidden=true;
    activeKind="";
    nowPlaying.textContent="اختر إذاعة للاستماع";
    status.textContent="تم إيقاف التشغيل.";
    setSelectedCard(null);
    updatePlayback(false);
  }
  function playAudioStation(button){
    var source=button.getAttribute("data-station-src");
    if(!source)return;
    closeFloatingPlayer();
    var useReactiveAudio=button.getAttribute("data-audio-reactive")==="true";
    var nextAudio=useReactiveAudio?getReactiveAudio():audio;
    var otherAudio=nextAudio===audio?reactiveAudio:audio;
    if(otherAudio){
      otherAudio.pause();
      otherAudio.removeAttribute("src");
      otherAudio.load();
    }
    activeAudio=nextAudio;
    stopTranscription();
    activeStationButton=button;
    sunnahFrame.removeAttribute("src");
    sunnahPlayer.hidden=true;
    activeKind="audio";
    nowPlaying.textContent=button.getAttribute("data-station-name");
    status.textContent="جارٍ الاتصال بالمحطة…";
    setSelectedCard(button.closest(".radio-station-card"));
    nextAudio.src=source;
    nextAudio.load();
    updatePlayback(false);
    var resumeContext=useReactiveAudio&&audioContext?audioContext.resume():Promise.resolve();
    Promise.resolve(resumeContext).then(function(){return nextAudio.play();}).catch(function(){
      status.textContent="تعذّر تشغيل المحطة. تحقق من اتصال الإنترنت أو جرّب محطة أخرى.";
      updatePlayback(false);
    });
  }
  function createReciterCards(surahs){
    var reciters=Array.isArray(window.YAZEED_RECITERS)?window.YAZEED_RECITERS:[];
    if(!reciterGrid)return;
    reciters.forEach(function(reciter,index){
      var card=document.createElement("article");
      card.className="radio-station-card radio-reciter-card";
      card.style.setProperty("--station-hue",String((index*31+176)%360));
      var icon=document.createElement("span");
      icon.className="radio-card-icon";
      icon.setAttribute("aria-hidden","true");
      icon.textContent="📖";
      card.appendChild(icon);
      var tag=document.createElement("span");
      tag.className="radio-card-tag";
      tag.textContent="مصحف كامل · "+reciter.rewaya;
      card.appendChild(tag);
      var title=document.createElement("h3");
      title.textContent=reciter.name;
      card.appendChild(title);
      var select=document.createElement("select");
      select.className="radio-reciter-select";
      select.setAttribute("aria-label","اختر سورة للقارئ "+reciter.name);
      surahs.forEach(function(surah){
        var option=document.createElement("option");
        option.value=String(surah.number);
        option.textContent=surah.name;
        select.appendChild(option);
      });
      card.appendChild(select);
      var button=document.createElement("button");
      button.className="radio-card-action";
      button.type="button";
      button.textContent="تشغيل السورة";
      button.setAttribute("data-station-name",reciter.name);
      button.addEventListener("click",function(){
        var selected=select.options[select.selectedIndex];
        var surahNumber=Number(select.value);
        if(!Number.isInteger(surahNumber)||surahNumber<1||surahNumber>114){
          status.textContent="اختر سورة صحيحة أولًا.";
          return;
        }
        button.setAttribute("data-station-name",reciter.name+" — "+selected.textContent);
        button.setAttribute("data-station-src",reciter.server+"/"+String(surahNumber).padStart(3,"0")+".mp3");
        if(activeStationButton===button&&activeKind==="audio"&&!activeAudio.paused&&activeAudio.src===button.getAttribute("data-station-src")){
          activeAudio.pause();
          return;
        }
        playAudioStation(button);
      });
      card.appendChild(button);
      reciterGrid.appendChild(card);
    });
  }
  function updateReciterSurahOptions(surahs){
    reciterGrid.querySelectorAll(".radio-reciter-select").forEach(function(select){
      var selectedValue=select.value;
      var options=document.createDocumentFragment();
      surahs.forEach(function(surah){
        var option=document.createElement("option");
        option.value=String(surah.number);
        option.textContent=surah.name;
        options.appendChild(option);
      });
      select.replaceChildren(options);
      if(surahs.some(function(surah){return String(surah.number)===selectedValue;})){
        select.value=selectedValue;
      }
    });
  }
  function loadReciterCards(){
    var fallbackSurahs=Array.from({length:114},function(_,index){
      return {number:index+1,name:"السورة "+(index+1)};
    });
    createReciterCards(fallbackSurahs);
    fetch("https://api.alquran.cloud/v1/surah")
      .then(function(response){
        if(!response.ok)throw new Error("تعذر تحميل قائمة السور.");
        return response.json();
      })
      .then(function(payload){
        if(!payload||!Array.isArray(payload.data)||payload.data.length!==114)throw new Error("قائمة السور غير مكتملة.");
        updateReciterSurahOptions(payload.data);
        reciterStatus.textContent="";
      })
      .catch(function(){
        reciterStatus.textContent="تعذر تحميل أسماء السور؛ يمكنك اختيارها من القائمة المرقمة.";
      });
  }
  loadReciterCards();

  function openSunnah(){
    closeFloatingPlayer();
    stopTranscription("التفريغ المباشر متاح حاليًا لمحطات الصوت فقط.");
    activeStationButton=null;
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    if(reactiveAudio){
      reactiveAudio.pause();
      reactiveAudio.removeAttribute("src");
      reactiveAudio.load();
    }
    activeAudio=audio;
    activeKind="official";
    nowPlaying.textContent="قناة السنة النبوية — البث الرسمي";
    status.textContent="يُفتح مشغّل القناة الرسمي أدناه. يمكنك فتح موقع الهيئة إذا لم يظهر المشغّل.";
    setSelectedCard(document.getElementById("playSunnah").closest(".radio-station-card"));
    sunnahPlayer.hidden=false;
    sunnahFrame.src=sunnahUrl;
    updatePlayback(false);
    sunnahPlayer.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});
  }
  document.querySelectorAll("[data-station-src]").forEach(function(button){
    button.addEventListener("click",function(){
      if(button.closest(".radio-station-card").classList.contains("is-selected")&&activeKind==="audio"&&!activeAudio.paused){
        activeAudio.pause();
        return;
      }
      playAudioStation(button);
    });
  });
  document.getElementById("playSunnah").addEventListener("click",openSunnah);
  document.getElementById("closeSunnahPlayer").addEventListener("click",stopAll);
  playPause.addEventListener("click",function(){
    if(activeKind!=="audio")return;
    if(activeAudio.paused){
      var resumeContext=activeAudio===reactiveAudio&&audioContext?audioContext.resume():Promise.resolve();
      Promise.resolve(resumeContext).then(function(){return activeAudio.play();}).catch(function(){status.textContent="تعذّر استئناف البث. حاول اختيار المحطة مرة أخرى.";});
    }else activeAudio.pause();
  });
  stopButton.addEventListener("click",stopAll);
  volume.addEventListener("input",function(){
    audio.volume=Number(volume.value);
    if(reactiveAudio)reactiveAudio.volume=Number(volume.value);
  });
  audio.volume=Number(volume.value);
  function bindAudioEvents(player){
    player.addEventListener("playing",function(){
      if(player!==activeAudio)return;
      status.textContent="البث يعمل الآن.";
      updatePlayback(true);
      if(activeStationButton)startTranscription(activeStationButton);
    });
    player.addEventListener("pause",function(){
      if(player!==activeAudio||activeKind!=="audio")return;
      status.textContent="تم إيقاف البث مؤقتًا.";
      updatePlayback(false);
      stopTranscription("تم إيقاف التفريغ مؤقتًا مع البث.");
    });
    player.addEventListener("error",function(){
      if(player!==activeAudio||activeKind!=="audio")return;
      status.textContent="تعذّر الاتصال بهذه المحطة. تحقق من اتصال الإنترنت أو اختر محطة أخرى.";
      updatePlayback(false);
    });
  }
  bindAudioEvents(audio);
  document.getElementById("radioLiveIndicator").setAttribute("title","مؤشر حالة البث");
  updatePlayback(false);

  var root=document.documentElement;
  var themeButton=document.getElementById("theme");
  function isDark(){
    var theme=root.getAttribute("data-theme");
    return theme?theme==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  function paintTheme(){
    themeButton.innerHTML=isDark()
      ?'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg>'
      :'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 15.5A8.5 8.5 0 0 1 8.5 3.5 8.5 8.5 0 1 0 20.5 15.5Z"/></svg>';
    themeButton.setAttribute("aria-label",isDark()?"تفعيل الوضع الفاتح":"تفعيل الوضع الداكن");
  }
  try{
    var savedTheme=localStorage.getItem("theme");
    if(savedTheme==="dark"||savedTheme==="light")root.setAttribute("data-theme",savedTheme);
  }catch(error){}
  paintTheme();
  themeButton.addEventListener("click",function(){
    root.setAttribute("data-theme",isDark()?"light":"dark");
    try{localStorage.setItem("theme",root.getAttribute("data-theme"));}catch(error){}
    paintTheme();
  });

  var nav=document.querySelector(".motion-nav");
  var navLinks=document.getElementById("primaryNavLinks");
  var menuToggle=document.getElementById("navMenuToggle");
  function setMenuExpanded(expanded,restoreFocus){
    navLinks.classList.toggle("is-expanded",expanded);
    menuToggle.setAttribute("aria-expanded",String(expanded));
    menuToggle.setAttribute("aria-label",expanded?"إغلاق قائمة التنقل":"فتح قائمة التنقل");
    if(restoreFocus)menuToggle.focus();
  }
  menuToggle.addEventListener("click",function(){setMenuExpanded(menuToggle.getAttribute("aria-expanded")!=="true");});
  document.addEventListener("pointerdown",function(event){
    if(window.innerWidth<=760&&menuToggle.getAttribute("aria-expanded")==="true"&&!nav.contains(event.target))setMenuExpanded(false);
  });
  navLinks.addEventListener("keydown",function(event){
    if(event.key==="Escape"&&menuToggle.getAttribute("aria-expanded")==="true"){
      event.preventDefault();
      setMenuExpanded(false,true);
    }
  });
  window.addEventListener("resize",function(){if(window.innerWidth>760)setMenuExpanded(false);});
  navLinks.querySelectorAll("a").forEach(function(link){
    link.addEventListener("click",function(){if(window.innerWidth<=760)setMenuExpanded(false);});
  });
})();
