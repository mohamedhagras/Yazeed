(function(){
  var pageInput=document.getElementById("readerPageNumber");
  var pageLabel=document.getElementById("readerPageLabel");
  var pageText=document.getElementById("readerQuranPage");
  var status=document.getElementById("readerStatus");
  var surahSelect=document.getElementById("readerSurahSelect");
  var previousButton=document.getElementById("readerPrevious");
  var nextButton=document.getElementById("readerNext");
  if(!pageInput||!pageLabel||!pageText||!status||!surahSelect||!previousButton||!nextButton)return;

  function toArabicDigits(value){return Number(value).toLocaleString("ar-EG");}
  var requestId=0;
  function loadPage(value){
    var page=Number(value);
    if(!Number.isInteger(page)||page<1||page>604){
      status.textContent="رقم الصفحة من ١ إلى ٦٠٤.";
      return;
    }
    var currentRequest=++requestId;
    pageInput.value=String(page);
    pageLabel.textContent="صفحة "+toArabicDigits(page)+" من ٦٠٤";
    pageText.textContent="جارٍ تحميل صفحة المصحف…";
    status.textContent="";
    previousButton.disabled=page===1;
    nextButton.disabled=page===604;

    fetch("https://api.alquran.cloud/v1/page/"+page+"/quran-uthmani")
      .then(function(response){
        if(!response.ok)throw new Error("تعذّر تحميل صفحة المصحف.");
        return response.json();
      })
      .then(function(payload){
        if(currentRequest!==requestId)return;
        if(!payload||payload.code!==200||!payload.data||!Array.isArray(payload.data.ayahs)||payload.data.ayahs.length===0)throw new Error("تعذّر تحميل صفحة المصحف.");
        var fragment=document.createDocumentFragment(),lastSurahNumber=0,firstSurah=payload.data.ayahs[0].surah;
        payload.data.ayahs.forEach(function(ayah){
          if(ayah.surah.number!==lastSurahNumber){
            var heading=document.createElement("h3");
            heading.className="reader-surah-heading";
            heading.textContent=ayah.surah.name;
            fragment.appendChild(heading);
            lastSurahNumber=ayah.surah.number;
          }
          var text=document.createElement("span");
          text.className="quran-ayah";
          text.textContent=ayah.text+" ";
          fragment.appendChild(text);
          var mark=document.createElement("span");
          mark.className="ayah-number";
          mark.textContent=toArabicDigits(ayah.numberInSurah);
          mark.setAttribute("aria-label","رقم الآية");
          fragment.appendChild(mark);
          fragment.appendChild(document.createTextNode(" "));
        });
        pageText.replaceChildren(fragment);
        if(firstSurah&&surahSelect.querySelector('option[value="'+firstSurah.number+'"]'))surahSelect.value=String(firstSurah.number);
        status.textContent=payload.data.ayahs[0].surah.name;
      })
      .catch(function(){
        if(currentRequest!==requestId)return;
        pageText.textContent="تعذّر تحميل صفحة المصحف.";
        status.textContent="تعذّر تحميل الصفحة.";
      });
  }

  previousButton.addEventListener("click",function(){loadPage(Number(pageInput.value)-1);});
  nextButton.addEventListener("click",function(){loadPage(Number(pageInput.value)+1);});
  pageInput.addEventListener("change",function(){loadPage(pageInput.value);});
  pageInput.addEventListener("keydown",function(event){
    if(event.key==="Enter"){
      event.preventDefault();
      loadPage(pageInput.value);
      pageInput.blur();
    }
  });
  surahSelect.addEventListener("change",function(){
    var surahNumber=Number(surahSelect.value);
    if(!Number.isInteger(surahNumber)||surahNumber<1||surahNumber>114)return;
    var currentRequest=++requestId;
    status.textContent="جارٍ الانتقال إلى السورة…";
    fetch("https://api.alquran.cloud/v1/ayah/"+surahNumber+":1/quran-uthmani")
      .then(function(response){
        if(!response.ok)throw new Error("تعذّر تحديد صفحة السورة.");
        return response.json();
      })
      .then(function(payload){
        if(currentRequest!==requestId)return;
        if(!payload||payload.code!==200||!payload.data||!Number.isInteger(payload.data.page))throw new Error("تعذّر تحديد صفحة السورة.");
        loadPage(payload.data.page);
      })
      .catch(function(){
        if(currentRequest!==requestId)return;
        status.textContent="تعذّر الانتقال إلى السورة.";
      });
  });
  fetch("https://api.alquran.cloud/v1/surah")
    .then(function(response){
      if(!response.ok)throw new Error("تعذّر تحميل قائمة السور.");
      return response.json();
    })
    .then(function(payload){
      if(!payload||payload.code!==200||!Array.isArray(payload.data))throw new Error("تعذّر تحميل قائمة السور.");
      var options=document.createDocumentFragment();
      payload.data.forEach(function(surah){
        var option=document.createElement("option");
        option.value=String(surah.number);
        option.textContent=surah.name;
        options.appendChild(option);
      });
      surahSelect.replaceChildren(options);
    })
    .catch(function(){
      surahSelect.replaceChildren();
      var option=document.createElement("option");
      option.value="";
      option.textContent="تعذّر تحميل السور";
      surahSelect.appendChild(option);
      status.textContent="تعذّر تحميل قائمة السور.";
    });
  loadPage(1);

  var themeButton=document.getElementById("theme");
  var root=document.documentElement;
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
    var theme=isDark()?"light":"dark";
    root.setAttribute("data-theme",theme);
    try{localStorage.setItem("theme",theme);}catch(error){}
    paintTheme();
  });

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
})();
