(function(){
  var pageType=document.body.getAttribute("data-content-type");
  var pageConfig={
    reels:{empty:"لا توجد فيديوهات منشورة بعد."},
    posts:{empty:"لا توجد منشورات مضافة بعد."},
    hadith:{empty:"لا توجد أحاديث مضافة بعد."}
  }[pageType];
  var list=document.getElementById("contentList");
  if(!pageConfig||!list)return;

  if(pageType==="reels"){
    list.addEventListener("play",function(event){
      var activeVideo=event.target;
      if(!activeVideo||activeVideo.tagName!=="VIDEO")return;
      list.querySelectorAll("video").forEach(function(video){
        if(video!==activeVideo&&!video.paused)video.pause();
      });
    },true);
  }

  function isDark(){
    var theme=document.documentElement.getAttribute("data-theme");
    return theme?theme==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  function paintTheme(){
    var button=document.getElementById("theme");
    if(!button)return;
    var dark=isDark();
    button.innerHTML=dark
      ?'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg>'
      :'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 15.5A8.5 8.5 0 0 1 8.5 3.5 8.5 8.5 0 1 0 20.5 15.5Z"/></svg>';
    button.setAttribute("aria-label",dark?"تفعيل الوضع الفاتح":"تفعيل الوضع الداكن");
  }
  try{
    var savedTheme=localStorage.getItem("theme");
    if(savedTheme==="dark"||savedTheme==="light")document.documentElement.setAttribute("data-theme",savedTheme);
  }catch(error){}
  paintTheme();
  var themeButton=document.getElementById("theme");
  if(themeButton){
    themeButton.addEventListener("click",function(){
      var value=isDark()?"light":"dark";
      document.documentElement.setAttribute("data-theme",value);
      try{localStorage.setItem("theme",value);}catch(error){}
      paintTheme();
    });
  }

  var nav=document.querySelector(".motion-nav");
  var navLinks=document.getElementById("primaryNavLinks");
  var menuToggle=document.getElementById("navMenuToggle");
  if(nav&&navLinks&&menuToggle){
    function setMenuExpanded(expanded,restoreFocus){
      navLinks.classList.toggle("is-expanded",expanded);
      menuToggle.setAttribute("aria-expanded",String(expanded));
      menuToggle.setAttribute("aria-label",expanded?"إغلاق قائمة التنقل":"فتح قائمة التنقل");
      if(restoreFocus)menuToggle.focus();
    }
    menuToggle.addEventListener("click",function(){
      setMenuExpanded(menuToggle.getAttribute("aria-expanded")!=="true");
    });
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
  }

  function safeLink(value){
    if(typeof value!=="string"||!value.trim())return "";
    try{
      var url=new URL(value.trim(),window.location.href);
      return url.protocol==="https:"||(url.origin===window.location.origin&&(url.protocol==="http:"||url.protocol==="file:"))?url.href:"";
    }catch(error){return "";}
  }
  function addText(parent,tag,className,text){
    var element=document.createElement(tag);
    if(className)element.className=className;
    element.textContent=text||"";
    parent.appendChild(element);
    return element;
  }
  function addExternalLink(parent,url,label){
    var link=document.createElement("a");
    link.className="content-external-link";
    link.href=url;
    link.target="_blank";
    link.rel="noopener noreferrer";
    link.textContent=label;
    parent.appendChild(link);
  }
  function youtubeEmbed(value){
    try{
      var url=new URL(value),host=url.hostname.toLowerCase(),id="";
      if(host==="youtu.be"||host==="www.youtu.be")id=url.pathname.split("/").filter(Boolean)[0]||"";
      else if(host==="youtube.com"||host==="www.youtube.com"||host==="m.youtube.com"){
        if(url.pathname==="/watch")id=url.searchParams.get("v")||"";
        else if(/^\/(shorts|embed)\/[A-Za-z0-9_-]+/.test(url.pathname))id=url.pathname.split("/")[2]||"";
      }
      return /^[A-Za-z0-9_-]{11}$/.test(id)?"https://www.youtube-nocookie.com/embed/"+id+"?rel=0":"";
    }catch(error){return "";}
  }
  function renderReel(item,card){
    var videoUrl=item.url||item.media_url||"",embed=youtubeEmbed(videoUrl),safe=safeLink(videoUrl),media=document.createElement("div");
    media.className="reel-media";
    if(embed){
      var frame=document.createElement("iframe");
      frame.src=embed;
      frame.title=item.title||"فيديو ريل";
      frame.loading="lazy";
      frame.allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      frame.allowFullscreen=true;
      frame.referrerPolicy="strict-origin-when-cross-origin";
      media.appendChild(frame);
    }else if(safe&&/\.(mp4|webm|ogg|mov)(?:$|[?#])/i.test(videoUrl)){
      var video=document.createElement("video");
      video.src=safe;
      video.controls=true;
      video.playsInline=true;
      video.preload="metadata";
      video.setAttribute("aria-label",item.title||"فيديو ريل");
      media.appendChild(video);
    }else{
      media.classList.add("reel-link-placeholder");
      addText(media,"span","reel-play-icon","▶");
      addText(media,"span","reel-link-label","شاهد الفيديو على المنصة");
      if(safe)addExternalLink(media,safe,"فتح الفيديو");
    }
    card.appendChild(media);
    addText(card,"h2","content-card-title",item.title||"ريل جديد");
    addText(card,"p","content-card-description",item.description||item.body||"");
  }
  function renderPost(item,card){
    var imageUrl=safeLink(item.image||item.media_url||"");
    if(imageUrl){
      var image=document.createElement("img");
      image.className="post-image";
      image.src=imageUrl;
      image.alt=item.title||"صورة المنشور";
      image.loading="lazy";
      image.referrerPolicy="no-referrer";
      card.appendChild(image);
    }
    addText(card,"h2","content-card-title",item.title||"منشور جديد");
    addText(card,"p","content-card-description post-copy",item.text||item.body||"");
    if(item.publishedAt)addText(card,"time","content-card-date",formatDate(item.publishedAt));
  }
  function formatDate(value){
    var date=new Date(value);
    return Number.isNaN(date.getTime())?"":date.toLocaleDateString("ar-EG",{day:"numeric",month:"long",year:"numeric"});
  }
  function renderHadith(item,card){
    addText(card,"h2","content-card-title","حديث نبوي");
    addText(card,"blockquote","hadith-text",item.text||item.body||"");
    addText(card,"p","hadith-source",item.source||"");
    if(item.explanation)addText(card,"p","content-card-description",item.explanation);
    if(item.publishedAt)addText(card,"time","content-card-date",formatDate(item.publishedAt));
  }
  function render(){
    list.replaceChildren();
    var items=window.YAZEED_CONTENT&&Array.isArray(window.YAZEED_CONTENT[pageType])?window.YAZEED_CONTENT[pageType]:[];
    if(!items.length){addText(list,"p","content-empty",pageConfig.empty);return;}
    items.forEach(function(item){
      if(!item||typeof item!=="object")return;
      var card=document.createElement("article");
      card.className="content-card";
      if(pageType==="reels")renderReel(item,card);
      else if(pageType==="posts")renderPost(item,card);
      else renderHadith(item,card);
      list.appendChild(card);
    });
    if(!list.children.length)addText(list,"p","content-empty",pageConfig.empty);
  }
  render();
})();
