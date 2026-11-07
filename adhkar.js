(function(){
  var morningTab=document.getElementById("morningTab");
  var eveningTab=document.getElementById("eveningTab");
  var list=document.getElementById("adhkarList");
  var title=document.getElementById("adhkarPeriodTitle");
  var progressText=document.getElementById("adhkarProgressText");
  var progressBar=document.querySelector(".adhkar-progress-track");
  var progressFill=document.querySelector(".adhkar-progress-fill");
  var storageStatus=document.getElementById("adhkarStorageStatus");
  var dateLabel=document.getElementById("adhkarDate");
  var period="morning";
  var progress={};
  var currentEntries=[];
  var activeDate="";
  var arabicNumber=new Intl.NumberFormat("ar-EG");
  var selectedEntries={
    fatir:{
      text:"اللهم فاطر السماوات والأرض، عالم الغيب والشهادة، لا إله إلا أنت، رب كل شيء ومليكه، أعوذ بك من شر نفسي ومن شر الشيطان وشركه، وأن أقترف على نفسي سوءًا أو أجره إلى مسلم.",
      repeat:1,
      repeatLabel:"صباحًا ومساءً",
      actionLabel:"سجّل القراءة",
      source:"جامع الترمذي، ٣٥٢٩",
      sourceUrl:"https://sunnah.com/tirmidhi:3529"
    },
    afiyah:{
      text:"اللهم إني أسألك العافية في الدنيا والآخرة. اللهم إني أسألك العفو والعافية في ديني ودنياي وأهلي ومالي. اللهم استر عوراتي، وآمن روعاتي، واحفظني من بين يدي ومن خلفي، وعن يميني وعن شمالي ومن فوقي، وأعوذ بعظمتك أن أُغتال من تحتي.",
      repeat:1,
      repeatLabel:"مرة واحدة",
      actionLabel:"سجّل القراءة",
      source:"سنن أبي داود، ٥٠٧٤",
      sourceUrl:"https://sunnah.com/abudawud:5074"
    },
    health:{
      text:"اللهم عافني في بدني، اللهم عافني في سمعي، اللهم عافني في بصري، لا إله إلا أنت.",
      repeat:3,
      repeatLabel:"٣ مرات",
      source:"سنن أبي داود، ٥٠٩٠",
      sourceUrl:"https://sunnah.com/abudawud:5090"
    },
    refuge:{
      text:"اللهم إني أعوذ بك من الكفر والفقر، اللهم إني أعوذ بك من عذاب القبر، لا إله إلا أنت.",
      repeat:3,
      repeatLabel:"٣ مرات",
      source:"سنن أبي داود، ٥٠٩٠",
      sourceUrl:"https://sunnah.com/abudawud:5090"
    },
    tawhid:{
      text:"لا إله إلا الله وحده لا شريك له، له الملك وله الحمد، وهو على كل شيء قدير.",
      repeat:100,
      repeatLabel:"١٠٠ مرة",
      actionLabel:"سجّل القراءة",
      source:"صحيح البخاري، ٣٢٩٣ (١٠٠ مرة في اليوم) · سنن أبي داود، ٥٠٧٧ (صباحًا ومساءً)",
      sourceUrl:"https://sunnah.com/bukhari:3293"
    },
    protectionAtHome:{
      text:"بسم الله، توكلت على الله، ولا حول ولا قوة إلا بالله.",
      repeat:1,
      repeatLabel:"عند الخروج من المنزل",
      actionLabel:"سجّل القراءة",
      source:"جامع الترمذي، ٣٤٢٦",
      sourceUrl:"https://sunnah.com/tirmidhi:3426"
    },
    protectionFromMisguidance:{
      text:"اللهم إني أعوذ بك أن أضل أو أُضل، أو أزل أو أُزل، أو أظلم أو أُظلم، أو أجهل أو يُجهل عليّ.",
      repeat:1,
      repeatLabel:"عند الخروج من المنزل",
      actionLabel:"سجّل القراءة",
      source:"سنن أبي داود، ٥٠٩٤",
      sourceUrl:"https://sunnah.com/abudawud:5094"
    },
    refugeWords:{
      text:"أعوذ بكلمات الله التامات من شر ما خلق.",
      repeat:1,
      repeatLabel:"عند النزول بمكان",
      actionLabel:"سجّل القراءة",
      source:"صحيح مسلم، ٢٧٠٨"
    },
    subhanAllah100:{
      text:"سبحان الله وبحمده.",
      repeat:100,
      repeatLabel:"١٠٠ مرة",
      actionLabel:"سجّل القراءة",
      source:"صحيح مسلم، ٢٦٩٢",
      sourceUrl:"https://sunnah.com/muslim:2692"
    },
    salawat100:{
      text:"اللهم صل وسلم وبارك على نبينا محمد.",
      repeat:100,
      repeatLabel:"١٠٠ مرة",
      actionLabel:"سجّل القراءة",
      source:"الأمر بالصلاة على النبي ﷺ: سورة الأحزاب، الآية ٥٦",
      sourceUrl:"https://quran.com/33/56"
    },
    subhanAzim100:{
      text:"سبحان الله وبحمده، سبحان الله العظيم.",
      repeat:100,
      repeatLabel:"١٠٠ مرة",
      actionLabel:"سجّل القراءة",
      source:"صحيح البخاري، ٦٦٨٢",
      sourceUrl:"https://sunnah.com/bukhari:6682"
    },
    hasbiyallah:{
      text:"حسبي الله لا إله إلا هو، عليه توكلت، وهو رب العرش العظيم.",
      repeat:7,
      repeatLabel:"٧ مرات",
      source:"سنن أبي داود، ٥٠٨١",
      sourceUrl:"https://sunnah.com/abudawud:5081"
    },
    subhanCreation:{
      text:"سبحان الله وبحمده، عدد خلقه، ورضا نفسه، وزنة عرشه، ومداد كلماته.",
      repeat:3,
      repeatLabel:"٣ مرات",
      source:"صحيح مسلم، ٢٧٢٦",
      sourceUrl:"https://sunnah.com/muslim:2726"
    },
    hayyQayyum:{
      text:"يا حي يا قيوم، برحمتك أستغيث، أصلح لي شأني كله، ولا تكلني إلى نفسي طرفة عين.",
      repeat:1,
      repeatLabel:"مرة واحدة",
      actionLabel:"سجّل القراءة",
      source:"دعاء مأثور"
    },
    baqarahLastVerses:{
      text:"ءَامَنَ ٱلرَّسُولُ بِمَآ أُنزِلَ إِلَيْهِ مِن رَّبِّهِۦ وَٱلْمُؤْمِنُونَ ۚ كُلٌّ ءَامَنَ بِٱللَّهِ وَمَلَٰٓئِكَتِهِۦ وَكُتُبِهِۦ وَرُسُلِهِۦ لَا نُفَرِّقُ بَيْنَ أَحَدٍۢ مِّن رُّسُلِهِۦ ۚ وَقَالُوا۟ سَمِعْنَا وَأَطَعْنَا ۖ غُفْرَانَكَ رَبَّنَا وَإِلَيْكَ ٱلْمَصِيرُ ﴿٢٨٥﴾ لَا يُكَلِّفُ ٱللَّهُ نَفْسًا إِلَّا وُسْعَهَا ۚ لَهَا مَا كَسَبَتْ وَعَلَيْهَا مَا ٱكْتَسَبَتْ ۗ رَبَّنَا لَا تُؤَاخِذْنَآ إِن نَّسِينَآ أَوْ أَخْطَأْنَا ۚ رَبَّنَا وَلَا تَحْمِلْ عَلَيْنَآ إِصْرًۭا كَمَا حَمَلْتَهُۥ عَلَى ٱلَّذِينَ مِن قَبْلِنَا ۚ رَبَّنَا وَلَا تُحَمِّلْنَا مَا لَا طَاقَةَ لَنَا بِهِۦ ۖ وَٱعْفُ عَنَّا وَٱغْفِرْ لَنَا وَٱرْحَمْنَآ ۚ أَنتَ مَوْلَىٰنَا فَٱنصُرْنَا عَلَى ٱلْقَوْمِ ٱلْكَٰفِرِينَ ﴿٢٨٦﴾",
      repeat:1,
      repeatLabel:"مرة واحدة",
      actionLabel:"سجّل القراءة",
      source:"سورة البقرة، الآيتان ٢٨٥–٢٨٦ · صحيح البخاري، ٥٠٠٩",
      sourceUrl:"https://quran.com/2/285-286"
    }
  };
  var entries={
    morning:[
      {text:"أصبحنا وأصبح الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له، له الملك وله الحمد، وهو على كل شيء قدير. رب أسألك خير ما في هذا اليوم وخير ما بعده، وأعوذ بك من شر ما في هذا اليوم وشر ما بعده. رب أعوذ بك من الكسل وسوء الكبر، رب أعوذ بك من عذاب في النار وعذاب في القبر.",repeat:1,source:"صحيح مسلم، ٢٧٢٣"},
      {text:"اللهم بك أصبحنا، وبك أمسينا، وبك نحيا، وبك نموت، وإليك النشور.",repeat:1,source:"سنن أبي داود، ٥٠٦٨ · جامع الترمذي، ٣٣٩١"},
      {text:"اللهم أنت ربي لا إله إلا أنت، خلقتني وأنا عبدك، وأنا على عهدك ووعدك ما استطعت. أعوذ بك من شر ما صنعت، أبوء لك بنعمتك عليّ، وأبوء لك بذنبي، فاغفر لي؛ فإنه لا يغفر الذنوب إلا أنت.",repeat:1,source:"صحيح البخاري، ٦٣٠٦"},
      {text:"قل هو الله أحد، وقل أعوذ برب الفلق، وقل أعوذ برب الناس. تُقرأ السور الثلاث ثلاث مرات.",repeat:3,source:"سنن أبي داود، ٥٠٨٢ · جامع الترمذي، ٣٥٧٥"},
      {text:"رضيت بالله رباً، وبالإسلام ديناً، وبمحمد ﷺ نبياً.",repeat:3,source:"سنن أبي داود، ٥٠٧٢ · جامع الترمذي، ٣٣٨٩"},
      {text:"بسم الله الذي لا يضر مع اسمه شيء في الأرض ولا في السماء، وهو السميع العليم.",repeat:3,source:"سنن أبي داود، ٥٠٨٨ · جامع الترمذي، ٣٣٨٨"},
      {text:"آية الكرسي: الله لا إله إلا هو الحي القيوم لا تأخذه سنة ولا نوم له ما في السماوات وما في الأرض من ذا الذي يشفع عنده إلا بإذنه يعلم ما بين أيديهم وما خلفهم ولا يحيطون بشيء من علمه إلا بما شاء وسع كرسيه السماوات والأرض ولا يؤوده حفظهما وهو العلي العظيم.",repeat:1,source:"سورة البقرة، الآية ٢٥٥"},
      selectedEntries.fatir,
      selectedEntries.afiyah,
      selectedEntries.health,
      selectedEntries.refuge,
      selectedEntries.tawhid,
      selectedEntries.protectionAtHome,
      selectedEntries.protectionFromMisguidance,
      selectedEntries.refugeWords,
      selectedEntries.subhanAllah100,
      selectedEntries.salawat100,
      selectedEntries.subhanAzim100,
      selectedEntries.hasbiyallah,
      selectedEntries.subhanCreation,
      selectedEntries.hayyQayyum
    ],
    evening:[
      {text:"أمسينا وأمسى الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له، له الملك وله الحمد، وهو على كل شيء قدير. رب أسألك خير ما في هذه الليلة وخير ما بعدها، وأعوذ بك من شر ما في هذه الليلة وشر ما بعدها. رب أعوذ بك من الكسل وسوء الكبر، رب أعوذ بك من عذاب في النار وعذاب في القبر.",repeat:1,source:"صحيح مسلم، ٢٧٢٣"},
      {text:"اللهم بك أمسينا، وبك أصبحنا، وبك نحيا، وبك نموت، وإليك المصير.",repeat:1,source:"سنن أبي داود، ٥٠٦٨ · جامع الترمذي، ٣٣٩١"},
      {text:"اللهم أنت ربي لا إله إلا أنت، خلقتني وأنا عبدك، وأنا على عهدك ووعدك ما استطعت. أعوذ بك من شر ما صنعت، أبوء لك بنعمتك عليّ، وأبوء لك بذنبي، فاغفر لي؛ فإنه لا يغفر الذنوب إلا أنت.",repeat:1,source:"صحيح البخاري، ٦٣٠٦"},
      {text:"قل هو الله أحد، وقل أعوذ برب الفلق، وقل أعوذ برب الناس. تُقرأ السور الثلاث ثلاث مرات.",repeat:3,source:"سنن أبي داود، ٥٠٨٢ · جامع الترمذي، ٣٥٧٥"},
      {text:"رضيت بالله رباً، وبالإسلام ديناً، وبمحمد ﷺ نبياً.",repeat:3,source:"سنن أبي داود، ٥٠٧٢ · جامع الترمذي، ٣٣٨٩"},
      {text:"بسم الله الذي لا يضر مع اسمه شيء في الأرض ولا في السماء، وهو السميع العليم.",repeat:3,source:"سنن أبي داود، ٥٠٨٨ · جامع الترمذي، ٣٣٨٨"},
      {text:"آية الكرسي: الله لا إله إلا هو الحي القيوم لا تأخذه سنة ولا نوم له ما في السماوات وما في الأرض من ذا الذي يشفع عنده إلا بإذنه يعلم ما بين أيديهم وما خلفهم ولا يحيطون بشيء من علمه إلا بما شاء وسع كرسيه السماوات والأرض ولا يؤوده حفظهما وهو العلي العظيم.",repeat:1,source:"سورة البقرة، الآية ٢٥٥"},
      selectedEntries.fatir,
      selectedEntries.afiyah,
      selectedEntries.health,
      selectedEntries.refuge,
      selectedEntries.tawhid,
      selectedEntries.baqarahLastVerses,
      selectedEntries.protectionAtHome,
      selectedEntries.protectionFromMisguidance,
      selectedEntries.refugeWords,
      selectedEntries.subhanAllah100,
      selectedEntries.salawat100,
      selectedEntries.subhanAzim100,
      selectedEntries.hasbiyallah,
      selectedEntries.hayyQayyum
    ]
  };
  Object.keys(entries).forEach(function(key){
    entries[key]=entries[key].map(function(entry,index){
      return Object.assign({},entry,{id:key+"-"+(index+1)});
    });
  });
  var originalEntries={
    morning:entries.morning.slice(),
    evening:entries.evening.slice()
  };
  var fixedOrder={
    morning:[13,14,1,2,3,15,8,9,21,19,10,11,6,5,4,7,12,16,17,18,20],
    evening:entries.evening.map(function(entry,index){return index+1;})
  };
  Object.keys(entries).forEach(function(key){
    entries[key]=fixedOrder[key].map(function(position){return originalEntries[key][position-1];});
  });
  function localDateKey(){
    var now=new Date();
    return now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0")+"-"+String(now.getDate()).padStart(2,"0");
  }
  function updateDateLabel(){
    dateLabel.textContent=new Intl.DateTimeFormat("ar-EG",{weekday:"long",day:"numeric",month:"long"}).format(new Date());
  }
  function refreshDate(){
    var today=localDateKey();
    if(today===activeDate)return false;
    activeDate=today;
    updateDateLabel();
    progress=readProgress();
    render();
    return true;
  }
  function storageKey(){
    return "yazeed-adhkar-"+activeDate+"-"+period;
  }
  function setStorageMessage(message,isError){
    storageStatus.textContent=message;
    storageStatus.classList.toggle("is-error",Boolean(isError));
  }
  function readProgress(){
    try{
      var saved=JSON.parse(localStorage.getItem(storageKey())||"{}");
      if(Array.isArray(saved)){
        return originalEntries[period].reduce(function(result,entry,index){
          var count=saved[index];
          result[entry.id]=Number.isInteger(count)?Math.max(0,Math.min(entry.repeat,count)):0;
          return result;
        },{});
      }
      if(saved&&typeof saved==="object"){
        return entries[period].reduce(function(result,entry){
          var count=saved[entry.id];
          result[entry.id]=Number.isInteger(count)?Math.max(0,Math.min(entry.repeat,count)):0;
          return result;
        },{});
      }
      setStorageMessage("تعذر قراءة التقدم المحفوظ؛ ستبدأ هذه الفترة من جديد.",true);
    }catch(error){
      setStorageMessage("تعذر الوصول إلى الحفظ على هذا الجهاز؛ يمكنك متابعة الأذكار دون حفظ.",true);
    }
    return entries[period].reduce(function(result,entry){result[entry.id]=0;return result;},{});
  }
  function saveProgress(){
    try{
      localStorage.setItem(storageKey(),JSON.stringify(progress));
      setStorageMessage("يُحفظ تقدمك على هذا الجهاز لهذا اليوم.",false);
    }catch(error){
      setStorageMessage("تعذر حفظ التقدم على هذا الجهاز؛ سيبقى متاحاً حتى إغلاق الصفحة.",true);
    }
  }
  function updateSummary(){
    var completed=currentEntries.filter(function(entry){return progress[entry.id]>=entry.repeat;}).length;
    var total=currentEntries.length;
    progressText.textContent=arabicNumber.format(completed)+" من "+arabicNumber.format(total)+" أذكار";
    progressBar.setAttribute("aria-valuemax",String(total));
    progressBar.setAttribute("aria-valuenow",String(completed));
    progressFill.style.width=(completed/total*100)+"%";
  }
  function render(focusId){
    list.replaceChildren();
    currentEntries.forEach(function(entry,index){
      var count=progress[entry.id]||0;
      var complete=count>=entry.repeat;
      var card=document.createElement("article");
      card.className="adhkar-card"+(complete?" is-complete":"");
      var heading=document.createElement("div");
      heading.className="adhkar-card-heading";
      var number=document.createElement("span");
      number.className="adhkar-card-number";
      number.textContent=arabicNumber.format(index+1);
      var countLabel=document.createElement("span");
      countLabel.className="adhkar-repeat";
      countLabel.textContent=entry.repeatLabel||(entry.repeat===1?"مرة واحدة":"٣ مرات");
      heading.append(number,countLabel);
      var text=document.createElement("p");
      text.className="adhkar-text";
      text.textContent=entry.text;
      var source=document.createElement(entry.sourceUrl?"a":"small");
      source.className="adhkar-source";
      source.textContent="المصدر: "+entry.source;
      if(entry.sourceUrl){
        source.href=entry.sourceUrl;
        source.target="_blank";
        source.rel="noopener noreferrer";
      }
      var controls=document.createElement("div");
      controls.className="adhkar-card-controls";
      var countButton=document.createElement("button");
      countButton.className="adhkar-count-button";
      countButton.type="button";
      countButton.disabled=complete;
      countButton.textContent=complete?"أُنجز الذكر ✓":"سجّل الترديد · "+arabicNumber.format(count)+" / "+arabicNumber.format(entry.repeat);
      countButton.setAttribute("aria-label",complete?"أُنجز الذكر":"سجّل ترديد الذكر، "+arabicNumber.format(count)+" من "+arabicNumber.format(entry.repeat));
      countButton.setAttribute("data-adhkar-id",entry.id);
      countButton.addEventListener("click",function(){
        refreshDate();
        progress[entry.id]=Math.min(entry.repeat,(progress[entry.id]||0)+1);
        saveProgress();
        render(entry.id,false);
      });
      controls.appendChild(countButton);
      if(count>0){
        var undoButton=document.createElement("button");
        undoButton.className="adhkar-undo-button";
        undoButton.type="button";
        undoButton.textContent="تراجع";
        undoButton.setAttribute("aria-label","التراجع عن آخر ترديد لهذا الذكر");
        undoButton.setAttribute("data-adhkar-id",entry.id);
        undoButton.addEventListener("click",function(){
          if(refreshDate())return;
          progress[entry.id]=Math.max(0,(progress[entry.id]||0)-1);
          saveProgress();
          render(entry.id,false);
        });
        controls.appendChild(undoButton);
      }
      card.append(heading,text,source,controls);
      list.appendChild(card);
    });
    updateSummary();
    if(typeof focusId==="string"){
      var focusButton=list.querySelector('.adhkar-count-button[data-adhkar-id="'+focusId+'"]:not(:disabled)')
        ||list.querySelector('.adhkar-undo-button[data-adhkar-id="'+focusId+'"]');
      if(focusButton)focusButton.focus();
    }
  }
  function selectPeriod(value){
    refreshDate();
    period=value;
    var morning=value==="morning";
    morningTab.setAttribute("aria-selected",String(morning));
    morningTab.tabIndex=morning?0:-1;
    eveningTab.setAttribute("aria-selected",String(!morning));
    eveningTab.tabIndex=morning?-1:0;
    title.textContent=morning?"أذكار الصباح":"أذكار المساء";
    list.setAttribute("aria-labelledby",morning?"morningTab":"eveningTab");
    currentEntries=entries[period];
    progress=readProgress();
    render();
  }
  morningTab.addEventListener("click",function(){selectPeriod("morning");});
  eveningTab.addEventListener("click",function(){selectPeriod("evening");});
  [morningTab,eveningTab].forEach(function(tab){
    tab.addEventListener("keydown",function(event){
      if(event.key==="ArrowLeft"||event.key==="ArrowRight"){
        event.preventDefault();
        var next=tab===morningTab?eveningTab:morningTab;
        selectPeriod(next===morningTab?"morning":"evening");
        next.focus();
      }
    });
  });
  activeDate=localDateKey();
  updateDateLabel();
  try{
    var savedTheme=localStorage.getItem("theme");
    if(savedTheme==="dark"||savedTheme==="light")document.documentElement.setAttribute("data-theme",savedTheme);
  }catch(error){}
  function isDark(){
    var theme=document.documentElement.getAttribute("data-theme");
    return theme?theme==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  function paintTheme(){
    var button=document.getElementById("theme");
    var dark=isDark();
    button.innerHTML=dark
      ?'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg>'
      :'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 15.5A8.5 8.5 0 0 1 8.5 3.5 8.5 8.5 0 1 0 20.5 15.5Z"/></svg>';
    button.setAttribute("aria-label",dark?"تفعيل الوضع الفاتح":"تفعيل الوضع الداكن");
  }
  var themeButton=document.getElementById("theme");
  themeButton.addEventListener("click",function(){
    var value=isDark()?"light":"dark";
    document.documentElement.setAttribute("data-theme",value);
    try{localStorage.setItem("theme",value);}catch(error){}
    paintTheme();
  });
  paintTheme();
  var nav=document.querySelector(".motion-nav");
  var navLinks=document.getElementById("primaryNavLinks");
  var menuToggle=document.getElementById("navMenuToggle");
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
  window.setInterval(refreshDate,60000);
  var requestedPeriod=new URLSearchParams(window.location.search).get("period");
  selectPeriod(requestedPeriod==="evening"?"evening":"morning");
})();
