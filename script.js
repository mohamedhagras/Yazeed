(function(){
  var TZ="Africa/Cairo", LAT=30.0444, LON=31.2357;
  var CITIES={cairo:{name:"القاهرة",lat:30.0444,lon:31.2357},giza:{name:"الجيزة",lat:30.0131,lon:31.2089},alex:{name:"الإسكندرية",lat:31.2001,lon:29.9187},mansoura:{name:"المنصورة",lat:31.0409,lon:31.3785},tanta:{name:"طنطا",lat:30.7865,lon:31.0004},aswan:{name:"أسوان",lat:24.0889,lon:32.8998}};
  var OFF = (location.hash==="#iftar") ? (new Date("2027-02-08T00:00:00+02:00").getTime()-Date.now()+10*3600000) : 0;
  // Dates are expected; edit them here if the official announcement differs.
  var EVENTS=[
    {tab:"رمضان",title:"باقي على رمضان",sub:"رمضان كريم، نسأل الله أن يبلغنا إياه ونحن بخير",t:new Date("2027-02-08T00:00:00+02:00"),hj:"١ رمضان ١٤٤٨ هـ",done:"رمضان كريم 🌙"},
    {tab:"ليلة القدر",title:"باقي على ليلة القدر",sub:"ليلة خير من ألف شهر",t:new Date("2027-03-05T18:00:00+02:00"),hj:"ليلة ٢٧ رمضان ١٤٤٨ هـ",done:"تقبّل الله منا ومنكم"},
    {tab:"عيد الفطر",title:"باقي على عيد الفطر",sub:"كل عام وأنتم بخير",t:new Date("2027-03-10T00:00:00+02:00"),hj:"١ شوال ١٤٤٨ هـ",done:"عيد مبارك 🌙"},
    {tab:"عيد الأضحى",title:"باقي على عيد الأضحى",sub:"كل عام وأنتم بخير",t:new Date("2027-05-16T00:00:00+03:00"),hj:"١٠ ذو الحجة ١٤٤٨ هـ",done:"عيد مبارك 🌙"}
  ];
  var VERSES=[
    ["رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ","البقرة ٢٠١"],
    ["وَقُلْ رَبِّ زِدْنِي عِلْمًا","طه ١١٤"],
    ["فَإِنَّ مَعَ الْعُسْرِ يُسْرًا إِنَّ مَعَ الْعُسْرِ يُسْرًا","الشرح ٥–٦"],
    ["رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي","طه ٢٥–٢٦"],
    ["وَمَنْ يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ","الطلاق ٣"],
    ["فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ","البقرة ١٥٢"],
    ["رَبَّنَا تَقَبَّلْ مِنَّا إِنَّكَ أَنْتَ السَّمِيعُ الْعَلِيمُ","البقرة ١٢٧"],
    ["أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ","الرعد ٢٨"],
    ["وَرَحْمَتِي وَسِعَتْ كُلَّ شَيْءٍ","الأعراف ١٥٦"],
    ["رَبِّ إِنِّي لِمَا أَنْزَلْتَ إِلَيَّ مِنْ خَيْرٍ فَقِيرٌ","القصص ٢٤"],
    ["وَقُولُوا لِلنَّاسِ حُسْنًا","البقرة ٨٣"],
    ["إِنَّ اللَّهَ مَعَ الصَّابِرِينَ","البقرة ١٥٣"],
    ["رَبَّنَا لَا تُؤَاخِذْنَا إِنْ نَسِينَا أَوْ أَخْطَأْنَا","البقرة ٢٨٦"],
    ["حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ","آل عمران ١٧٣"],
    ["وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ","هود ٨٨"],
    ["رَبِّ هَبْ لِي مِنَ الصَّالِحِينَ","الصافات ١٠٠"],
    ["لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ","الأنبياء ٨٧"],
    ["رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِنْ ذُرِّيَّتِي رَبَّنَا وَتَقَبَّلْ دُعَاءِ","إبراهيم ٤٠"],
  ];
  var ZIKR=[
    ["سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ","كلمتان خفيفتان على اللسان — متفق عليه"],
    ["سُبْحَانَ اللَّهِ وَبِحَمْدِهِ","مئة مرة في اليوم — متفق عليه"],
    ["لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ","مئة مرة في اليوم — متفق عليه"],
    ["أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ","كان النبي ﷺ يكثر منه — مسلم"],
    ["لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ","كنز من كنوز الجنة — متفق عليه"],
    ["سُبْحَانَ اللَّهِ، وَالْحَمْدُ لِلَّهِ، وَلَا إِلَهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ","أحب الكلام إلى الله — مسلم"],
    ["بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ","ثلاث مرات صباحًا ومساءً — أبو داود والترمذي"],
    ["رَضِيتُ بِاللَّهِ رَبًّا وَبِالْإِسْلَامِ دِينًا وَبِمُحَمَّدٍ نَبِيًّا","ثلاث مرات صباحًا ومساءً — أبو داود"]
  ];
  var DUAS=[
    ["اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي","دعاء ليلة القدر — الترمذي"],
    ["ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ وَثَبَتَ الْأَجْرُ إِنْ شَاءَ اللَّهُ","عند الإفطار — أبو داود"],
    ["اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ","أبو داود والنسائي"],
    ["رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ","أبو داود والترمذي"],
    ["اللَّهُمَّ إِنِّي أَسْأَلُكَ الْهُدَى وَالتُّقَى وَالْعَفَافَ وَالْغِنَى","مسلم"],
    ["اللَّهُمَّ آتِ نَفْسِي تَقْوَاهَا وَزَكِّهَا أَنْتَ خَيْرُ مَنْ زَكَّاهَا أَنْتَ وَلِيُّهَا وَمَوْلَاهَا","مسلم"],
    ["يَا مُقَلِّبَ الْقُلُوبِ ثَبِّتْ قَلْبِي عَلَى دِينِكَ","الترمذي"],
    ["اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ وَالْعَجْزِ وَالْكَسَلِ وَالْبُخْلِ وَالْجُبْنِ وَضَلَعِ الدَّيْنِ وَغَلَبَةِ الرِّجَالِ","البخاري"]
  ];
  // أقوال متداولة منسوبة إلى علماء وزهّاد مسلمين؛ ذُكرت المراجع حيث أمكن،
  // وبعض الأقوال المشهورة تحتاج إلى التحقق من ثبوت لفظها قبل اعتمادها توثيقيًا.
  var QUOTES=[
    ["يا ابن آدم، إنما أنت أيام، كلما ذهب يوم ذهب بعضك","الحسن البصري — يُروى في كتب الزهد"],
    ["ما ندمت على شيء ندمي على يوم غربت شمسه، نقص فيه أجلي ولم يزد فيه عملي","ابن مسعود — أثر مشهور، يُتداول في كتب الزهد"],
    ["ما عالجت شيئًا أشد عليّ من نيتي؛ لأنها تتقلب عليّ","سفيان الثوري — منقول في سير أعلام النبلاء"],
    ["إذا خلوت الدهر يومًا فلا تقل خلوت، ولكن قل عليّ رقيب","من شعر الإمام الشافعي — يُنسب إليه"],
    ["العلم ما نفع، ليس العلم ما حُفظ","الإمام الشافعي — مقولة مشهورة منسوبة إليه"],
    ["من أراد الدنيا فعليه بالعلم، ومن أراد الآخرة فعليه بالعلم","يُروى عن الإمام الشافعي"],
    ["اغتنم خمسًا قبل خمس: حياتك قبل موتك...","يُروى عن ابن عباس؛ والمعنى وارد في حديث مشهور"],
    ["في القلب شعث لا يلمه إلا الإقبال على الله","ابن القيم — الفوائد"],
    ["من أصلح سريرته أصلح الله علانيته","مقولة مأثورة في كتب الزهد"],
    ["قيمة كل امرئ ما يحسنه","علي بن أبي طالب — يُنسب إليه"],
    ["ليس الزهد ألا تملك شيئًا، بل ألا يملكك شيء","مقولة مشهورة في معنى الزهد؛ لا تُنسب هنا لشخص بعينه"],
    ["دواء القلب خمسة أشياء: قراءة القرآن بالتدبر، وخلاء البطن، وقيام الليل، والتضرع عند السحر، ومجالسة الصالحين","منقول عن إبراهيم الخواص؛ يُتداول في كتب الرقائق"]
  ];
  var PN=["الفجر","الشروق","الظهر","العصر","المغرب","العشاء"];
  var $=function(id){return document.getElementById(id);};
  var f=function(n){return n.toLocaleString("ar-EG");};
  var f2=function(n){return (n<10?"٠":"")+n.toLocaleString("ar-EG");};
  function put(id,txt){var e=$(id); if(e.textContent!==txt){e.textContent=txt; e.classList.remove("t"); void e.offsetWidth; e.classList.add("t");}}
  $("copyrightYear").textContent=new Date().getFullYear().toLocaleString("ar-EG",{useGrouping:false});
  Array.prototype.forEach.call(document.querySelectorAll("[data-social-link]"),function(link){
    var profileUrl=(link.getAttribute("data-social-url")||"").trim();
    if(/^https?:\/\//i.test(profileUrl)){
      link.href=profileUrl;link.target="_blank";link.rel="noopener noreferrer";link.removeAttribute("aria-disabled");
      link.title="فتح "+link.getAttribute("aria-label");
    }else{
      link.href="#";link.setAttribute("aria-disabled","true");
      link.addEventListener("click",function(event){event.preventDefault();});
    }
  });

  var hfmt=null,gfmt=null,tfmt=null;
  try{
    hfmt=new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn",{year:"numeric",month:"numeric",day:"numeric",timeZone:TZ});
    gfmt=new Intl.DateTimeFormat("en-CA-u-nu-latn",{year:"numeric",month:"numeric",day:"numeric",timeZone:TZ});
    tfmt=new Intl.DateTimeFormat("en-GB-u-nu-latn",{hour:"numeric",minute:"numeric",second:"numeric",hour12:false,timeZone:TZ});
  }catch(e){}
  function parts(fm,d){var o={}; fm.formatToParts(d).forEach(function(p){if(p.type!=="literal"&&p.type!=="era")o[p.type]=parseInt(p.value,10);}); return o;}
  // Build expected Islamic-event dates from the browser's Umm al-Qura calendar.
  // These are estimates; the official Egyptian moon-sighting announcement takes precedence.
  function cairoDate(y,m,d,hour){
    var base=Date.UTC(y,m-1,d,hour||0,0,0), guess=new Date(base), gp=parts(gfmt,guess), tp=parts(tfmt,guess);
    var observed=Date.UTC(gp.year,gp.month-1,gp.day,(tp.hour||0)%24,tp.minute||0,tp.second||0);
    return new Date(base+(base-observed));
  }
  function findHijriDate(hYear,hMonth,hDay,startDate,endDate){
    var a=parts(gfmt,startDate), b=parts(gfmt,endDate);
    var first=Date.UTC(a.year,a.month-1,a.day,12), last=Date.UTC(b.year,b.month-1,b.day,12);
    for(var ts=first;ts<=last;ts+=86400000){
      var scan=new Date(ts), hp=parts(hfmt,scan);
      if(hp.year===hYear&&hp.month===hMonth&&hp.day===hDay){var gp=parts(gfmt,scan);return cairoDate(gp.year,gp.month,gp.day,0);}
    }
    return null;
  }
  function findNextRamadan(now){
    var a=parts(gfmt,now), start=Date.UTC(a.year,a.month-1,a.day,12), last=start+410*86400000;
    for(var ts=start;ts<=last;ts+=86400000){
      var scan=new Date(ts), hp=parts(hfmt,scan);
      if(hp.month===9&&hp.day===1){var gp=parts(gfmt,scan), candidate=cairoDate(gp.year,gp.month,gp.day,0);if(candidate>now)return candidate;}
    }
    return null;
  }
  function buildEvents(now){
    var todayHijri=parts(hfmt,now), ramStart=null;
    // Keep the current Ramadan cycle through Eid al-Adha; after it, move to the next cycle.
    var useCurrentCycle=todayHijri.month===9||todayHijri.month===10||todayHijri.month===11||(todayHijri.month===12&&todayHijri.day<=10);
    if(useCurrentCycle){ramStart=findHijriDate(todayHijri.year,9,1,new Date(now.getTime()-330*86400000),now);}
    if(!ramStart)ramStart=findNextRamadan(now);
    if(!ramStart){var fallback=new Date(now.getTime()+100*86400000);ramStart=cairoDate(fallback.getFullYear(),fallback.getMonth()+1,fallback.getDate(),0);}
    var rh=parts(hfmt,new Date(ramStart.getTime()+12*3600000));
    var eidFitr=findHijriDate(rh.year,10,1,new Date(ramStart.getTime()+27*86400000),new Date(ramStart.getTime()+36*86400000));
    var eidAdha=findHijriDate(rh.year,12,10,new Date(ramStart.getTime()+85*86400000),new Date(ramStart.getTime()+130*86400000));
    if(!eidFitr)eidFitr=new Date(ramStart.getTime()+30*86400000);
    if(!eidAdha)eidAdha=new Date(ramStart.getTime()+98*86400000);
    var qadr=new Date(ramStart.getTime()+25*86400000);qadr=cairoDate(parts(gfmt,qadr).year,parts(gfmt,qadr).month,parts(gfmt,qadr).day,18);
    var hy=rh.year.toLocaleString("ar-EG",{useGrouping:false});
    return [
      {tab:"رمضان",title:"باقي على رمضان",sub:"رمضان كريم، نسأل الله أن يبلغنا إياه ونحن بخير",t:ramStart,hj:"١ رمضان "+hy+" هـ",done:"رمضان كريم 🌙"},
      {tab:"ليلة القدر",title:"باقي على ليلة القدر",sub:"ليلة خير من ألف شهر",t:qadr,hj:"ليلة ٢٧ رمضان "+hy+" هـ",done:"تقبّل الله منا ومنكم"},
      {tab:"عيد الفطر",title:"باقي على عيد الفطر",sub:"كل عام وأنتم بخير",t:eidFitr,hj:"١ شوال "+hy+" هـ",done:"عيد مبارك 🌙"},
      {tab:"عيد الأضحى",title:"باقي على عيد الأضحى",sub:"كل عام وأنتم بخير",t:eidAdha,hj:"١٠ ذو الحجة "+hy+" هـ",done:"عيد مبارك 🌙"}
    ];
  }
  EVENTS=buildEvents(new Date(Date.now()+OFF));
  function sod(d){var p=parts(tfmt,d); return (p.hour%24)*3600+p.minute*60+p.second;}
  function addMonths(d,k){var x=new Date(d.getTime()),day=x.getDate(); x.setDate(1); x.setMonth(x.getMonth()+k); var last=new Date(x.getFullYear(),x.getMonth()+1,0).getDate(); x.setDate(Math.min(day,last)); return x;}

  // ---- prayer times: Cairo governorate, Egyptian General Authority of Survey method (Fajr 19.5°, Isha 17.5°) ----
  var R=Math.PI/180;
  function norm(x,m){return ((x%m)+m)%m;}
  function prayers(y,m,d){
    var jd=Date.UTC(y,m-1,d,12)/86400000+2440587.5, n=jd-2451545;
    var L=norm(280.46+0.9856474*n,360), g=norm(357.528+0.9856003*n,360)*R;
    var lam=(L+1.915*Math.sin(g)+0.02*Math.sin(2*g))*R, eps=(23.439-4e-7*n)*R;
    var dec=Math.asin(Math.sin(eps)*Math.sin(lam));
    var ra=norm(Math.atan2(Math.cos(eps)*Math.sin(lam),Math.cos(lam))/R/15,24);
    var eqt=norm(L/15-ra+12,24)-12, noon=12-LON/15-eqt, la=LAT*R;
    function ha(alt){var c=(Math.sin(alt*R)-Math.sin(la)*Math.sin(dec))/(Math.cos(la)*Math.cos(dec)); return Math.acos(Math.max(-1,Math.min(1,c)))/R/15;}
    var asrAlt=Math.atan(1/(1+Math.tan(Math.abs(la-dec))))/R;
    var h=[noon-ha(-19.5),noon-ha(-0.833),noon,noon+ha(asrAlt),noon+ha(-0.833),noon+ha(-17.5)];
    return h.map(function(x,i){return new Date((i===2?Math.floor:Math.round)((Date.UTC(y,m-1,d)+x*3600000)/60000)*60000);});
  }
  var TF=new Intl.DateTimeFormat("ar-EG",{hour:"numeric",minute:"2-digit",hour12:true,timeZone:TZ});
  var vi=0,zi=0,di=0,qi=0,rot=0;
  var pc={key:"",a:null,b:null};
  function dayPrayers(now){
    var g=parts(gfmt,now), key=g.year+"-"+g.month+"-"+g.day;
    if(pc.key!==key){
      pc.key=key; setToday(now); pc.a=prayers(g.year,g.month,g.day); pc.b=prayers(g.year,g.month,g.day+1);
      var tf=new Intl.DateTimeFormat("ar-EG",{hour:"numeric",minute:"2-digit",hour12:true,timeZone:TZ});
      $("pg").innerHTML=pc.a.map(function(t,i){return "<div><small>"+PN[i]+"</small><b>"+tf.format(t)+"</b></div>";}).join("");
      var dn=Math.floor(Date.UTC(g.year,g.month-1,g.day)/86400000);
      vi=dn%VERSES.length; zi=dn%ZIKR.length; di=(dn+3)%DUAS.length;
      $("vt").textContent=VERSES[vi][0]; $("vr").textContent=VERSES[vi][1];
      $("zt").textContent=ZIKR[zi][0]; $("zr").textContent=ZIKR[zi][1];
      $("dt").textContent=DUAS[di][0]; $("dr").textContent=DUAS[di][1];
      qi=dn%QUOTES.length;
      $("qt").textContent=QUOTES[qi][0]; $("qr").textContent=QUOTES[qi][1];
    }
    return pc;
  }
  function hms(ms){var s=Math.max(0,Math.floor(ms/1000)); return [f2(Math.floor(s/3600)),f2(Math.floor(s%3600/60)),f2(s%60)];}

  // ---- state ----
  var cur=0,T=null,prevLen=30,todT=0,mode="normal";
  function setEvent(i,skipTick){
    cur=i; var ev=EVENTS[i];
    $("title").textContent=ev.title; $("sub").textContent=ev.sub; $("hdate").textContent=ev.hj;
    document.title="يَزِيد";
    try{$("gdate").textContent=ev.t.toLocaleDateString("ar-EG",{day:"numeric",month:"long",year:"numeric",timeZone:TZ});}catch(e){}
    if(hfmt){T=parts(hfmt,ev.t); prevLen=parts(hfmt,new Date(ev.t.getTime()-T.day*86400000)).day; todT=sod(ev.t);}
    Array.prototype.forEach.call($("tabs").children,function(b,k){b.className=(k===i)?"on":"";});
    var nb=$("nights");
    if(i===1){
      var b0=EVENTS[0].t.getTime(), df=new Intl.DateTimeFormat("ar-EG",{weekday:"long",day:"numeric",month:"long",timeZone:TZ});
      nb.innerHTML="<p>الليالي الوترية في العشر الأواخر (متوقعة)</p>"+[21,23,25,27,29].map(function(n){return "<div"+(n===27?" class=\"q\"":"")+"><b>ليلة "+f(n)+"</b><span>مساء "+df.format(new Date(b0+(n-2)*86400000))+"</span></div>";}).join("");
    }else nb.innerHTML="";
    if(!skipTick)tick();
  }
  function autoEventIndex(now){
    if(now<EVENTS[0].t)return 0;
    if(now<EVENTS[2].t)return 0;
    if(now<EVENTS[2].t.getTime()+2*86400000)return 2;
    return 3;
  }
  EVENTS.forEach(function(ev,i){var b=document.createElement("button"); b.textContent=ev.tab; b.onclick=function(){setEvent(i);}; $("tabs").appendChild(b);});
  function setToday(now){
    try{
      var g=now.toLocaleDateString("ar-EG",{weekday:"long",day:"numeric",month:"long",year:"numeric",timeZone:TZ});
      var h=now.toLocaleDateString("ar-EG-u-ca-islamic-umalqura",{day:"numeric",month:"long",year:"numeric",timeZone:TZ});
      $("today").innerHTML="اليوم "+g+" م<br>"+h;
    }catch(e){}
  }

  function maybeRefreshSchedule(now){
    if(now.getTime()<=EVENTS[3].t.getTime()+86400000)return;
    var next=buildEvents(now);
    if(next[0].t.getTime()>EVENTS[3].t.getTime()){
      EVENTS=next;
      buildCalendar();
      setEvent(cur,true);
    }
  }
  function tick(){
    var now=new Date(Date.now()+OFF);
    maybeRefreshSchedule(now);
    var ev=EVENTS[cur], target=ev.t, p=dayPrayers(now);
    var ramadanDate=parts(gfmt,EVENTS[0].t),todayDate=parts(gfmt,now);
    var ramadanDayCount=Math.max(0,Math.round((Date.UTC(ramadanDate.year,ramadanDate.month-1,ramadanDate.day)-Date.UTC(todayDate.year,todayDate.month-1,todayDate.day))/86400000));
    put("ramadanDaysRemaining",f(ramadanDayCount));
    checkNotifications(now,p);
    var ram=(cur===0&&now>=target&&now<target.getTime()+30*86400000);
    mode=ram?"ram":(now>=target?"done":"normal");
    $("pair").style.display=(mode==="normal")?"":"none";
    $("rmday").style.display=ram?"block":"none";
    $("ift").style.display=(mode==="normal")?"":"none";
    $("done").style.display=(mode==="done")?"block":"none";
    if(mode==="done")$("done").textContent=ev.done;

    if(mode==="normal"){
      var m=(target.getFullYear()-now.getFullYear())*12+(target.getMonth()-now.getMonth());
      if(addMonths(now,m)>target)m--; if(m<0)m=0;
      var rest=target-addMonths(now,m), d=Math.floor(rest/86400000);
      put("gm",f(m)); put("gd",f(d));
      if(T){
        var H=parts(hfmt,now), hmo=(T.year-H.year)*12+(T.month-H.month), hdy=T.day-H.day-(todT<sod(now)?1:0), gd=0;
        while(hdy<0&&gd++<3){hmo--; hdy+=prevLen;}
        put("hm",f(Math.max(0,hmo))); put("hd",f(Math.max(0,hdy)));
      }
    }else if(ram){
      var n=Math.floor((now-target)/86400000)+1;
      $("rmday").textContent="اليوم "+f(n)+" رمضان";
    }

    // next prayer
    var idx=-1,i; for(i=0;i<6;i++){if(p.a[i]>now){idx=i;break;}}
    var nt=(idx<0)?p.b[0]:p.a[idx], nn=PN[idx<0?0:idx], x2=hms(nt-now);
    $("nextp").innerHTML="الصلاة القادمة: <strong>"+nn+"</strong> بعد "+x2.join(" : ");
    Array.prototype.forEach.call($("pg").children,function(e,k){e.className=(k===(idx<0?0:idx))?"nx":"";});
    var nextPrayerTime=nt;
    var nextPrayerLabel=PN[idx<0?0:idx];
    var nextPrayerClock=TF.format(nextPrayerTime);
    var remaining=hms(Math.max(0,nextPrayerTime-now));
    $("ift").innerHTML="الصلاة القادمة: <strong>"+nextPrayerLabel+"</strong> — الساعة <strong>"+nextPrayerClock+"</strong><span class='next-prayer-remaining'>متبقي "+remaining.join(" : ")+"</span>";
  }

  // ---- city selection, Ramadan calendar, and copy actions ----
  var citySelect=$("citySelect");
  try{var savedCity=localStorage.getItem("ramadan-city"); if(savedCity&&CITIES[savedCity])citySelect.value=savedCity;}catch(e){}
  function applyCity(){var c=CITIES[citySelect.value]||CITIES.cairo; LAT=c.lat; LON=c.lon; try{localStorage.setItem("ramadan-city",citySelect.value);}catch(e){} pc.key=""; tick();}
  citySelect.addEventListener("change",applyCity);
  window.addEventListener("ramadan-location-changed",function(ev){
    var d=ev.detail||{}; if(!Number.isFinite(Number(d.latitude))||!Number.isFinite(Number(d.longitude)))return;
    LAT=Number(d.latitude); LON=Number(d.longitude); if(d.timezone)TZ=d.timezone;
    try{hfmt=new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn",{year:"numeric",month:"numeric",day:"numeric",timeZone:TZ});gfmt=new Intl.DateTimeFormat("en-CA-u-nu-latn",{year:"numeric",month:"numeric",day:"numeric",timeZone:TZ});tfmt=new Intl.DateTimeFormat("en-GB-u-nu-latn",{hour:"numeric",minute:"numeric",second:"numeric",hour12:false,timeZone:TZ});TF=new Intl.DateTimeFormat("ar-EG",{hour:"numeric",minute:"2-digit",hour12:true,timeZone:TZ});}catch(e){TZ="Africa/Cairo";}
    window.currentRamadanLocationName=d.name||"المدينة المختارة"; pc.key=""; tick(); try{buildCalendar();buildCurrentCalendar();}catch(e){}
  });
  function buildCalendar(){
    var grid=$("calGrid"); grid.innerHTML="";
    var ramHijri=parts(hfmt,EVENTS[0].t);$("calendarTitle").textContent="تقويم رمضان "+ramHijri.year.toLocaleString("ar-EG",{useGrouping:false})+" هـ";
    if($("ramadanCalendarOption"))$("ramadanCalendarOption").textContent=$("calendarTitle").textContent;
    ["س","ح","ن","ث","ر","خ","ج"].forEach(function(day){var el=document.createElement("div");el.className="cal-cell";el.style.fontWeight="700";el.textContent=day;grid.appendChild(el);});
    var start=new Date(EVENTS[0].t.getTime());
    var startParts=parts(gfmt,start),first=new Date(Date.UTC(startParts.year,startParts.month-1,startParts.day,12));
    var offset=(first.getUTCDay()+1)%7;
    for(var blank=0;blank<offset;blank++){var empty=document.createElement("div");empty.className="cal-cell";empty.style.visibility="hidden";grid.appendChild(empty);}
    var todayParts=parts(gfmt,new Date());
    for(var d=1;d<=30;d++){
      var date=new Date(Date.UTC(startParts.year,startParts.month-1,startParts.day+d-1,12));
      var cell=document.createElement("div");cell.className="cal-cell"+(d>=21?" last10":"")+(date.getUTCDay()===5?" friday":"");
      var dp=parts(gfmt,date); if(dp.year===todayParts.year&&dp.month===todayParts.month&&dp.day===todayParts.day)cell.className+=" today";
      var main=document.createElement("span");main.textContent=f(d);var sub=document.createElement("small");sub.textContent=date.toLocaleDateString("ar-EG",{day:"numeric",month:"short",timeZone:TZ});
      cell.appendChild(main);cell.appendChild(sub);
      grid.appendChild(cell);
    }
  }
  function buildCurrentCalendar(){
    var grid=$("currentCalendarGrid"),nowParts=parts(gfmt,new Date()),year=nowParts.year,month=nowParts.month,today=nowParts.day;
    grid.innerHTML="";
    $("currentCalendarTitle").textContent=new Date(Date.UTC(year,month-1,1,12)).toLocaleDateString("ar-EG",{month:"long",year:"numeric",timeZone:"UTC"});
    ["س","ح","ن","ث","ر","خ","ج"].forEach(function(day){var el=document.createElement("div");el.className="cal-cell";el.style.fontWeight="700";el.textContent=day;grid.appendChild(el);});
    var offset=(new Date(Date.UTC(year,month-1,1,12)).getUTCDay()+1)%7;
    for(var blank=0;blank<offset;blank++){var empty=document.createElement("div");empty.className="cal-cell";empty.style.visibility="hidden";grid.appendChild(empty);}
    var daysInMonth=new Date(Date.UTC(year,month,0,12)).getUTCDate();
    for(var dayNumber=1;dayNumber<=daysInMonth;dayNumber++){
      var cell=document.createElement("div");cell.className="cal-cell"+(dayNumber===today?" today":"");if(dayNumber===today)cell.setAttribute("aria-current","date");
      var day=document.createElement("span");day.textContent=f(dayNumber);cell.appendChild(day);grid.appendChild(cell);
    }
  }
  buildCalendar();
  buildCurrentCalendar();
  var calendarDialog=$("calendar"),calendarMenuToggle=$("calendarMenuToggle"),calendarMenu=$("calendarMenu");
  document.body.appendChild(calendarMenu);
  function closeCalendarMenu(){calendarMenu.hidden=true;calendarMenuToggle.setAttribute("aria-expanded","false");}
  function positionNavMenu(toggle,menu,padding){
    var rect=toggle.getBoundingClientRect(),menuRect=menu.getBoundingClientRect();
    var width=document.documentElement.clientWidth,height=document.documentElement.clientHeight;
    var left=Math.max(padding,Math.min(width-menuRect.width-padding,rect.left+rect.width/2-menuRect.width/2));
    var top=rect.bottom+8;
    if(top+menuRect.height>height-8&&rect.top-menuRect.height-8>=8)top=rect.top-menuRect.height-8;
    else top=Math.max(8,Math.min(height-menuRect.height-8,top));
    menu.style.top=Math.round(top)+"px";
    menu.style.left=Math.round(left)+"px";
  }
  function bindNavMenuKeyboard(toggle,menu,open,close){
    function focusMenuItem(last){
      var items=menu.querySelectorAll("button:not(:disabled)");
      if(items.length)items[last?items.length-1:0].focus();
    }
    toggle.addEventListener("keydown",function(event){
      if(event.key==="ArrowDown"||event.key==="ArrowUp"){
        event.preventDefault();
        if(menu.hidden)open();
        focusMenuItem(event.key==="ArrowUp");
      }else if(event.key==="Enter"||event.key===" "){
        event.preventDefault();
        if(menu.hidden){open();focusMenuItem(false);}
        else close();
      }else if(event.key==="Tab"&&!event.shiftKey&&!menu.hidden){
        event.preventDefault();
        focusMenuItem(false);
      }else if(event.key==="Escape"&&!menu.hidden){
        event.preventDefault();
        close();
        toggle.focus();
      }
    });
    menu.addEventListener("keydown",function(event){
      var items=Array.prototype.slice.call(menu.querySelectorAll("button:not(:disabled)"));
      var index=items.indexOf(document.activeElement);
      if(event.key==="Escape"){
        event.preventDefault();
        close();
        toggle.focus();
      }else if(event.key==="ArrowDown"||event.key==="ArrowUp"){
        event.preventDefault();
        if(items.length)items[(index+(event.key==="ArrowDown"?1:-1)+items.length)%items.length].focus();
      }else if(event.key==="Home"||event.key==="End"){
        event.preventDefault();
        if(items.length)items[event.key==="Home"?0:items.length-1].focus();
      }else if(event.key==="Tab"&&event.shiftKey&&index===0){
        event.preventDefault();
        toggle.focus();
      }
    });
    document.addEventListener("focusin",function(event){
      if(!menu.hidden&&!toggle.contains(event.target)&&!menu.contains(event.target))close();
    });
  }
  bindNavMenuKeyboard(calendarMenuToggle,calendarMenu,openCalendarMenu,closeCalendarMenu);
  function openCalendarMenu(){
    calendarMenu.hidden=false;
    calendarMenuToggle.setAttribute("aria-expanded","true");
    positionNavMenu(calendarMenuToggle,calendarMenu,8);
  }
  calendarMenuToggle.addEventListener("click",function(){if(calendarMenu.hidden)openCalendarMenu();else closeCalendarMenu();});
  $("ramadanCalendarOption").addEventListener("click",function(){closeCalendarMenu();if(!calendarDialog.open)calendarDialog.showModal();});
  $("calendarClose").addEventListener("click",function(){calendarDialog.close();});
  calendarDialog.addEventListener("click",function(event){if(event.target===calendarDialog)calendarDialog.close();});
  document.addEventListener("keydown",function(event){if(event.key==="Escape"&&calendarDialog.open)calendarDialog.close();});
  var currentCalendarDialog=$("current-calendar");
  $("currentCalendarOption").addEventListener("click",function(){closeCalendarMenu();buildCurrentCalendar();if(!currentCalendarDialog.open)currentCalendarDialog.showModal();});
  $("currentCalendarClose").addEventListener("click",function(){currentCalendarDialog.close();});
  currentCalendarDialog.addEventListener("click",function(event){if(event.target===currentCalendarDialog)currentCalendarDialog.close();});
  document.addEventListener("click",function(event){if(!calendarMenu.hidden&&!calendarMenu.contains(event.target)&&!calendarMenuToggle.contains(event.target))closeCalendarMenu();});
  document.addEventListener("keydown",function(event){if(event.key==="Escape"&&!calendarMenu.hidden)closeCalendarMenu();});
  window.addEventListener("resize",function(){if(!calendarMenu.hidden)openCalendarMenu();});
  window.addEventListener("scroll",function(){if(!calendarMenu.hidden)openCalendarMenu();},{passive:true});
  Array.prototype.forEach.call(document.querySelectorAll("[data-copy]"),function(btn){btn.addEventListener("click",function(){var text=$(btn.getAttribute("data-copy")).textContent;function done(){var old=btn.textContent;btn.textContent="تم النسخ ✓";setTimeout(function(){btn.textContent=old;},1400);}if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(text).then(done).catch(function(){fallbackCopy(text,done);});}else fallbackCopy(text,done);});});
  function fallbackCopy(text,done){var area=document.createElement("textarea");area.value=text;area.style.position="fixed";area.style.opacity="0";document.body.appendChild(area);area.select();try{document.execCommand("copy");done();}catch(e){}document.body.removeChild(area);}

  // ---- user-controlled notifications (scheduled checks run while this page is open) ----
  var notifyEnabled=false;
  var notifyButton=$("notifyToggle");
  var notifyPrefs={prayer:true,iftar:true,adhkar:true,verse:false,sound:false};
  try{
    notifyEnabled=localStorage.getItem("ramadan-prayer-notifications")==="1" && "Notification" in window && Notification.permission==="granted";
    var savedPrefs=JSON.parse(localStorage.getItem("ramadan-notification-prefs")||"null");
    if(savedPrefs&&typeof savedPrefs==="object")Object.keys(notifyPrefs).forEach(function(k){if(typeof savedPrefs[k]==="boolean")notifyPrefs[k]=savedPrefs[k];});
  }catch(e){}
  var prefIds={prayer:"prefPrayer",iftar:"prefIftar",adhkar:"prefAdhkar",verse:"prefVerse",sound:"prefSound"};
  var notificationAudio=null;
  function prepareNotificationAudio(){
    var AudioContextType=window.AudioContext||window.webkitAudioContext;
    if(!AudioContextType){$("notifyStatus").textContent="النغمة غير مدعومة في هذا المتصفح؛ ستظل الإشعارات متاحة.";return;}
    try{
      if(!notificationAudio)notificationAudio=new AudioContextType();
      if(notificationAudio.state==="suspended")notificationAudio.resume().catch(function(){$("notifyStatus").textContent="تعذّر تشغيل النغمة.";});
    }catch(e){$("notifyStatus").textContent="تعذّر تشغيل النغمة؛ ستظل الإشعارات متاحة.";}
  }
  function scheduleNotificationSound(){
    if(!notificationAudio||notificationAudio.state!=="running")return;
    var start=notificationAudio.currentTime;
    [0,0.2].forEach(function(offset,index){
      var oscillator=notificationAudio.createOscillator(),gain=notificationAudio.createGain(),at=start+offset;
      oscillator.type="sine";oscillator.frequency.value=index?880:660;
      gain.gain.setValueAtTime(0.0001,at);gain.gain.exponentialRampToValueAtTime(0.14,at+0.02);gain.gain.exponentialRampToValueAtTime(0.0001,at+0.16);
      oscillator.connect(gain);gain.connect(notificationAudio.destination);oscillator.start(at);oscillator.stop(at+0.17);
    });
  }
  function playNotificationSound(){
    if(!notifyPrefs.sound)return;
    prepareNotificationAudio();
    if(!notificationAudio)return;
    if(notificationAudio.state==="suspended")notificationAudio.resume().then(scheduleNotificationSound).catch(function(){$("notifyStatus").textContent="تعذّر تشغيل النغمة.";});
    else scheduleNotificationSound();
  }
  function saveNotifyPrefs(){try{localStorage.setItem("ramadan-notification-prefs",JSON.stringify(notifyPrefs));}catch(e){}}
  function paintNotifyButton(){
    notifyButton.textContent=notifyEnabled?"إيقاف التنبيهات":"تفعيل التنبيهات";
    notifyButton.setAttribute("aria-pressed",String(notifyEnabled));
    $("notifyStatus").textContent=notifyEnabled?"التنبيهات مفعّلة حسب اختياراتك":"التنبيهات متوقفة";
  }
  Object.keys(prefIds).forEach(function(k){var el=$(prefIds[k]);el.checked=notifyPrefs[k];el.addEventListener("change",function(){notifyPrefs[k]=el.checked;saveNotifyPrefs();if(k==="sound"&&el.checked&&notifyEnabled)prepareNotificationAudio();});});
  notifyButton.addEventListener("click",function(){
    if(!("Notification" in window)){ $("notifyStatus").textContent="المتصفح لا يدعم الإشعارات";return; }
    if(notifyEnabled){notifyEnabled=false;try{localStorage.setItem("ramadan-prayer-notifications","0");}catch(e){}paintNotifyButton();return;}
    if(notifyPrefs.sound)prepareNotificationAudio();
    if(Notification.permission==="granted"){
      notifyEnabled=true;try{localStorage.setItem("ramadan-prayer-notifications","1");}catch(e){}paintNotifyButton();return;
    }
    Notification.requestPermission().then(function(permission){
      if(permission==="granted"){notifyEnabled=true;try{localStorage.setItem("ramadan-prayer-notifications","1");}catch(e){}paintNotifyButton();}
      else{$("notifyStatus").textContent="لم يتم السماح بالإشعارات.";}
    }).catch(function(){$("notifyStatus").textContent="تعذّر تفعيل الإشعارات في هذا المتصفح.";});
  });
  paintNotifyButton();
  var sentNotifications={};
  function fireNotification(key,title,body){
    if(!notifyEnabled||!("Notification" in window)||Notification.permission!=="granted")return;
    if(sentNotifications[key])return;
    var storageKey="ramadan-notified-"+key;
    try{if(localStorage.getItem(storageKey)==="1"){sentNotifications[key]=true;return;}}catch(e){}
    var notification;
    try{notification=new Notification(title,{body:body,tag:key});}
    catch(e){$("notifyStatus").textContent="تعذّر عرض الإشعار." ;return;}
    window.setTimeout(function(){notification.close();},10000);
    sentNotifications[key]=true;
    try{localStorage.setItem(storageKey,"1");}catch(e){}
    playNotificationSound();
  }
  function dateKeyFor(d){var q=parts(gfmt,d);return q.year+"-"+String(q.month).padStart(2,"0")+"-"+String(q.day).padStart(2,"0");}
  function checkNotifications(now,p){
    if(!notifyEnabled||!("Notification" in window)||Notification.permission!=="granted"||!p||!p.a||!p.b)return;
    var dk=dateKeyFor(now), city=window.currentRamadanLocationName||(CITIES[citySelect.value]||CITIES.cairo).name;
    var locationKey=LAT.toFixed(3)+","+LON.toFixed(3);
    if(notifyPrefs.prayer){
      var idx=-1;for(var j=0;j<6;j++){if(p.a[j]>now){idx=j;break;}}
      var target=idx<0?p.b[0]:p.a[idx], name=PN[idx<0?0:idx], left=target.getTime()-now.getTime();
      if(left>0&&left<=5*60*1000){fireNotification("prayer-"+locationKey+"-"+target.toISOString().slice(0,10)+"-"+name,"اقترب موعد الصلاة", "متبقي أقل من ٥ دقائق على صلاة "+name+" في "+city+".");}
    }
    var ramadanNow=now>=EVENTS[0].t&&now<EVENTS[2].t;
    if(notifyPrefs.iftar&&ramadanNow){var maghrib=p.a[4], toIftar=maghrib.getTime()-now.getTime();if(toIftar>0&&toIftar<=10*60*1000)fireNotification("iftar-"+locationKey+"-"+dk,"اقترب الإفطار 🌙","متبقي ١٠ دقائق أو أقل على أذان المغرب في "+city+".");}
    var t=parts(tfmt,now);
    if(t.minute===0&&t.second<=8){
      if(notifyPrefs.adhkar&&t.hour===8)fireNotification("morning-adhkar-"+dk,"حان وقت أذكار الصباح 🌤️","أذكار الصباح.");
      if(notifyPrefs.adhkar&&t.hour===17)fireNotification("evening-adhkar-"+dk,"حان وقت أذكار المساء 🌙","خصص دقائق لأذكار المساء.");
      if(notifyPrefs.verse&&t.hour===9)fireNotification("daily-verse-"+dk,"آية اليوم 📖",$("vt").textContent);
    }
  }

  // ---- theme ----
  var SUN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  var MOON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/></svg>';
  var root=document.documentElement;
  function isDark(){var t=root.getAttribute("data-theme"); return t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;}
  function paint(){$("theme").innerHTML=isDark()?SUN:MOON;}
  try{var sv=localStorage.getItem("theme"); if(sv)root.setAttribute("data-theme",sv);}catch(e){}
  $("theme").onclick=function(){var v=isDark()?"light":"dark"; root.setAttribute("data-theme",v); try{localStorage.setItem("theme",v);}catch(e){} paint();};
  paint();
  // ورد قرآني يومي: صفحة واحدة ثابتة لليوم، دون أزرار تقديم أو رجوع.
  function localDateKey(){var d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
  function calendarDayNumber(d){return Math.floor(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/86400000);}
  // يبدأ التسلسل من الصفحة الأولى بتاريخ 29 أكتوبر 2026، ثم صفحة واحدة بالترتيب كل يوم.
  var quranStartDay=calendarDayNumber(new Date(2026,9,29));
  var quranDaysElapsed=Math.max(0,calendarDayNumber(new Date())-quranStartDay);
  var quranPageNumber=(quranDaysElapsed%604)+1;
  var quranPageEl=$("quranPageText"), quranCompleteBtn=$("quranComplete"), quranStatus=$("quranStatus");
  $("quranPageLabel").textContent="صفحة رقم "+f(quranPageNumber)+" من ٦٠٤";
  $("quranDateLabel").textContent="ورد يوم "+new Date().toLocaleDateString("ar-EG",{weekday:"long",day:"numeric",month:"long"});
  $("quranSource").href="https://quran.com/page/"+quranPageNumber;
  var quranReadKey="ramadan-quran-read-"+localDateKey();
  function paintQuranRead(){var read=false;try{read=localStorage.getItem(quranReadKey)==="1";}catch(e){}quranCompleteBtn.classList.toggle("is-done",read);quranCompleteBtn.textContent=read?"تم تسجيل ورد اليوم ✓":"أنهيت ورد اليوم ✓";quranStatus.textContent=read?"تم تسجيل إنجاز ورد اليوم على هذا الجهاز.":"";}
  quranCompleteBtn.addEventListener("click",function(){try{localStorage.setItem(quranReadKey,"1");}catch(e){}paintQuranRead();showFloatingToast("بارك الله فيك","تقبّل الله منك، وجعل القرآن نورًا لقلبك.");});
  paintQuranRead();
  fetch("https://api.alquran.cloud/v1/page/"+quranPageNumber+"/quran-uthmani").then(function(r){if(!r.ok)throw new Error("quran fetch failed");return r.json();}).then(function(payload){
    if(!payload||payload.code!==200||!payload.data||!Array.isArray(payload.data.ayahs))throw new Error("invalid Quran response");
    quranPageEl.innerHTML="";
    payload.data.ayahs.forEach(function(ayah){var span=document.createElement("span");span.className="quran-ayah";span.textContent=ayah.text+" ";quranPageEl.appendChild(span);var mark=document.createElement("span");mark.className="ayah-number";mark.textContent=ayah.numberInSurah.toLocaleString("ar-EG");mark.setAttribute("aria-label","رقم الآية");quranPageEl.appendChild(mark);quranPageEl.appendChild(document.createTextNode(" "));});
    var refs=payload.data.ayahs.map(function(a){return a.surah.name;}).filter(function(v,i,a){return a.indexOf(v)===i;});
    quranStatus.textContent="من المصحف الشريف — "+refs.join("، ");
  }).catch(function(){quranPageEl.textContent="تعذّر تحميل النص القرآني الآن بسبب الاتصال.";quranStatus.textContent="تعذّر تحميل الصفحة.";});
  $("copyQuran").addEventListener("click",function(){var text=quranPageEl.innerText;function copied(){var old=$("copyQuran").textContent;$("copyQuran").textContent="تم النسخ ✓";setTimeout(function(){$("copyQuran").textContent=old;},1400);}if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(text).then(copied).catch(function(){fallbackCopy(text,copied);});else fallbackCopy(text,copied);});

  // إشعار عائم عند تسجيل كل صلاة، ودعاء بالصلاة على النبي عند اكتمال الخمس.
  var prayerNames={fajr:"الفجر",dhuhr:"الظهر",asr:"العصر",maghrib:"المغرب",isha:"العشاء"};
  var scholarQuotes=[
    ["يا ابن آدم، إنما أنت أيام، كلما ذهب يوم ذهب بعضك","الحسن البصري — قول مشهور يُروى في كتب الزهد"],
    ["ما ندمت على شيء ندمي على يوم غربت شمسه، نقص فيه أجلي ولم يزد فيه عملي","أثر مشهور يُنسب إلى ابن مسعود"],
    ["العلم ما نفع، ليس العلم ما حُفظ","مقولة مشهورة منسوبة إلى الإمام الشافعي"],
    ["من أصلح سريرته أصلح الله علانيته","مقولة مأثورة في كتب الزهد"]
  ];
  var toastTimer=null;
  function showFloatingToast(title,message){
    var toast=$("floatingToast");if(!toast)return;
    toast.querySelector("strong").textContent=title;toast.querySelector("p").textContent=message;
    var nav=document.querySelector(".motion-nav"),navBottom=nav?nav.getBoundingClientRect().bottom:0;
    toast.style.top=Math.max(12,navBottom+12)+"px";
    toast.classList.add("show");
    if(toastTimer)clearTimeout(toastTimer);
    toastTimer=setTimeout(function(){toast.classList.remove("show");},10000);
  }
  var prayerChecks=Array.prototype.slice.call(document.querySelectorAll("[data-prayer-check]"));
  function prayerKey(){return "ramadan-prayers-"+localDateKey();}
  function loadPrayerChecks(){var saved={};try{saved=JSON.parse(localStorage.getItem(prayerKey())||"{}");}catch(e){}prayerChecks.forEach(function(el){el.checked=saved[el.getAttribute("data-prayer-check")]===true;});paintPrayerChecks(false);}
  function paintPrayerChecks(showCompletion){var checked=prayerChecks.filter(function(el){return el.checked;}).length;$("prayerCheckCount").textContent=f(checked)+" من ٥";var allKey=prayerKey()+"-completion-toast";if(checked===5&&showCompletion){var already=false;try{already=localStorage.getItem(allKey)==="1";if(!already)localStorage.setItem(allKey,"1");}catch(e){}if(!already)showFloatingToast("ما شاء الله، أتممت الصلوات الخمس","اللهم صلِّ وسلم وبارك على سيدنا محمد، وعلى آله وصحبه أجمعين.");}}
  prayerChecks.forEach(function(el){el.addEventListener("change",function(){var saved={};try{saved=JSON.parse(localStorage.getItem(prayerKey())||"{}");}catch(e){}saved[el.getAttribute("data-prayer-check")]=el.checked;try{localStorage.setItem(prayerKey(),JSON.stringify(saved));}catch(e){}if(el.checked){var quote=scholarQuotes[Math.floor(Math.random()*scholarQuotes.length)];showFloatingToast("أحسنت — صلاة "+prayerNames[el.getAttribute("data-prayer-check")],"«"+quote[0]+"» — "+quote[1]);}paintPrayerChecks(true);});});
  loadPrayerChecks();

  function more(bid,tid,rid,list,getI,setI){
    var r=0;
    $(bid).onclick=function(){
      var k; do{k=Math.floor(Math.random()*list.length);}while(k===getI());
      setI(k); put(tid,list[k][0]); put(rid,list[k][1]);
      r+=360; $(bid).firstChild.style.transform="rotate("+r+"deg)";
    };
  }
  more("znext","zt","zr",ZIKR,function(){return zi;},function(k){zi=k;});
  more("dnext","dt","dr",DUAS,function(){return di;},function(k){di=k;});
  more("qnext","qt","qr",QUOTES,function(){return qi;},function(k){qi=k;});

  // ---- share as image ----
  function css(n){return getComputedStyle(root).getPropertyValue(n).trim();}
  var shareStyle=$("shareStyle"),shareSize=$("shareSize");
  try{var savedShareStyle=localStorage.getItem("ramadan-share-style");if(savedShareStyle&&["classic","night","light"].indexOf(savedShareStyle)>=0)shareStyle.value=savedShareStyle;}catch(e){}
  try{var savedShareSize=localStorage.getItem("yazeed-share-size");if(savedShareSize&&["vertical","square"].indexOf(savedShareSize)>=0)shareSize.value=savedShareSize;}catch(e){}
  shareStyle.addEventListener("change",function(){try{localStorage.setItem("ramadan-share-style",shareStyle.value);}catch(e){}});
  shareSize.addEventListener("change",function(){try{localStorage.setItem("yazeed-share-size",shareSize.value);}catch(e){showFloatingToast("تعذر حفظ المقاس","سيعمل الاختيار الحالي حتى إغلاق الصفحة.");}});
  var capturePopover=$("captureStylePopover"),captureAction=null,currentShareCanvas=null;
  function imagePalette(){
    return shareStyle.value==="night"?{bg2:"#263329",bg:"#111A14",ink:"#F7F0DE",accent:"#D6B96D",muted:"#D1C8B2"}:
      shareStyle.value==="light"?{bg2:"#FFFFFF",bg:"#F7F0DF",ink:"#344737",accent:"#718B5E",muted:"#747C6D"}:
      {bg2:css("--bg2"),bg:css("--bg"),ink:css("--ink"),accent:css("--accent"),muted:css("--muted")};
  }
  function closeCapturePopover(){
    if(captureAction&&captureAction.button)captureAction.button.setAttribute("aria-expanded","false");
    capturePopover.hidden=true;captureAction=null;
  }
  function showCapturePopover(button,kind){
    if(!capturePopover.hidden&&captureAction&&captureAction.button===button){closeCapturePopover();return;}
    if(captureAction&&captureAction.button)captureAction.button.setAttribute("aria-expanded","false");
    captureAction={button:button,kind:kind};button.setAttribute("aria-expanded","true");
    var rect=button.getBoundingClientRect(),width=280,left=Math.max(12,Math.min(rect.left+(rect.width-width)/2,window.innerWidth-width-12));
    capturePopover.style.left=left+"px";capturePopover.style.top=Math.max(12,Math.min(rect.bottom+8,window.innerHeight-310))+"px";
    updateCaptureSelections();capturePopover.hidden=false;
  }
  var lastImageVerseIndex=-1;
  function makeImage(){
    if(shareSize.value==="square")return makeSquareImage();
    var W=1080,H=1920,c=document.createElement("canvas");c.width=W;c.height=H;
    var x=c.getContext("2d");if(!x)throw new Error("تعذّر إنشاء لوحة الرسم.");
    var palette=imagePalette(),ev=EVENTS[cur],ink=palette.ink,acc=palette.accent,muted=palette.muted;
    var gradient=x.createLinearGradient(0,0,W,H);gradient.addColorStop(0,palette.bg2);gradient.addColorStop(1,palette.bg);
    x.fillStyle=gradient;x.fillRect(0,0,W,H);
    x.fillStyle=acc;x.globalAlpha=.07;x.beginPath();x.arc(980,135,270,0,Math.PI*2);x.fill();x.beginPath();x.arc(70,1740,300,0,Math.PI*2);x.fill();x.globalAlpha=1;
    x.textAlign="center";x.textBaseline="alphabetic";x.direction="rtl";
    function txAt(text,position,y,size,color,weight,family){
      x.font=(weight||400)+" "+size+"px "+(family||"'Readex Pro'")+", Tahoma, sans-serif";
      x.fillStyle=color;x.fillText(text,position,y,W-120);
    }
    function tx(text,y,size,color,weight,family){txAt(text,W/2,y,size,color,weight,family);}
    tx("يَزِيد",145,42,acc,700,"'Reem Kufi'");
    tx("رفيقك اليومي للعبادة",192,24,muted,400);
    tx($("title").textContent,365,78,ink,700,"'Reem Kufi'");
    tx(ev.sub,425,31,muted,400);
    tx(new Date().toLocaleDateString("ar-EG",{weekday:"long",day:"numeric",month:"long",year:"numeric",timeZone:TZ}),492,23,muted,400);

    roundedRect(x,565,900,570,38);x.fillStyle="rgba(255,255,255,.035)";x.fill();x.strokeStyle=acc;x.globalAlpha=.48;x.lineWidth=2;x.stroke();x.globalAlpha=1;
    if(mode==="normal"){
      tx("العدّ التنازلي",650,31,acc,600,"'Reem Kufi'");
      x.beginPath();x.moveTo(W/2,710);x.lineTo(W/2,1035);x.strokeStyle=acc;x.globalAlpha=.28;x.lineWidth=2;x.stroke();x.globalAlpha=1;
      txAt("ميلادي",790,765,30,muted,500,"'Reem Kufi'");
      txAt($("gm").textContent+" شهر · "+$("gd").textContent+" يوم",790,865,48,ink,700);
      txAt($("gdate").textContent,790,920,23,muted,400);
      txAt("هجري",290,765,30,muted,500,"'Reem Kufi'");
      txAt($("hm").textContent+" شهر · "+$("hd").textContent+" يوم",290,865,48,ink,700);
      txAt(ev.hj,290,920,23,muted,400);
    }else if(mode==="ram"){
      tx("رمضان كريم",740,34,muted,500,"'Reem Kufi'");
      tx($("rmday").textContent,875,76,acc,700,"'Reem Kufi'");
      tx(ev.hj,950,25,muted,400);
    }else{
      tx("بكل المحبة",755,32,muted,500,"'Reem Kufi'");
      tx(ev.done,890,66,acc,700,"'Reem Kufi'");
      tx(ev.hj,970,25,muted,400);
    }

    var verseIndex=Math.floor(Math.random()*VERSES.length);
    if(VERSES.length>1&&verseIndex===lastImageVerseIndex)verseIndex=(verseIndex+1+Math.floor(Math.random()*(VERSES.length-1)))%VERSES.length;
    lastImageVerseIndex=verseIndex;
    var verse=VERSES[verseIndex];
    roundedRect(x,1200,900,500,34);x.fillStyle="rgba(255,255,255,.035)";x.fill();x.strokeStyle=acc;x.globalAlpha=.32;x.lineWidth=2;x.stroke();x.globalAlpha=1;
    tx("آية ترافق يومك",1285,29,acc,600,"'Reem Kufi'");
    var verseFont=verse[0].length>95?30:(verse[0].length>68?34:38);
    x.font="400 "+verseFont+"px Amiri, 'Noto Naskh Arabic', Tahoma, sans-serif";x.fillStyle=ink;
    var verseLines=wrapCanvasText(x,verse[0],800),verseY=1385,lineHeight=Math.round(verseFont*1.5);
    verseLines.forEach(function(line){x.fillText(line,W/2,verseY);verseY+=lineHeight;});
    tx(verse[1],Math.min(1650,verseY+42),23,muted,400);
    tx("يَزِيد",1770,24,muted,500,"'Reem Kufi'");
    return c;
  }
  function makeSquareImage(){
    var W=1080,H=1080,c=document.createElement("canvas");c.width=W;c.height=H;
    var x=c.getContext("2d");if(!x)throw new Error("تعذّر إنشاء لوحة الرسم.");
    var palette=imagePalette(),ev=EVENTS[cur],ink=palette.ink,acc=palette.accent,muted=palette.muted;
    var gradient=x.createLinearGradient(0,0,W,H);gradient.addColorStop(0,palette.bg2);gradient.addColorStop(1,palette.bg);
    x.fillStyle=gradient;x.fillRect(0,0,W,H);
    x.fillStyle=acc;x.globalAlpha=.07;x.beginPath();x.arc(980,135,270,0,Math.PI*2);x.fill();x.beginPath();x.arc(70,1020,220,0,Math.PI*2);x.fill();x.globalAlpha=1;
    x.textAlign="center";x.textBaseline="alphabetic";x.direction="rtl";
    function tx(text,y,size,color,weight,family,maxWidth){
      x.font=(weight||400)+" "+size+"px "+(family||"'Readex Pro'")+", Tahoma, sans-serif";
      x.fillStyle=color;x.fillText(text,W/2,y,maxWidth||960);
    }
    function txAt(text,position,y,size,color,weight,family,maxWidth){
      x.font=(weight||400)+" "+size+"px "+(family||"'Readex Pro'")+", Tahoma, sans-serif";
      x.fillStyle=color;x.fillText(text,position,y,maxWidth||430);
    }
    tx("يَزِيد",78,40,acc,700,"'Reem Kufi'");
    tx("رفيقك اليومي للعبادة",112,21,muted,400);
    tx($("title").textContent,184,60,ink,700,"'Reem Kufi'");
    tx(ev.sub,220,21,muted,400);
    tx(new Date().toLocaleDateString("ar-EG",{weekday:"long",day:"numeric",month:"long",year:"numeric",timeZone:TZ}),253,19,muted,400);
    roundedRect(x,280,900,340,32);x.fillStyle="rgba(255,255,255,.035)";x.fill();x.strokeStyle=acc;x.globalAlpha=.48;x.lineWidth=2;x.stroke();x.globalAlpha=1;
    if(mode==="normal"){
      tx("العدّ التنازلي",326,25,acc,600,"'Reem Kufi'");
      x.beginPath();x.moveTo(W/2,348);x.lineTo(W/2,515);x.strokeStyle=acc;x.globalAlpha=.28;x.lineWidth=2;x.stroke();x.globalAlpha=1;
      txAt("ميلادي",W/2+220,385,26,muted,500,"'Reem Kufi'");
      txAt($("gm").textContent+" شهر · "+$("gd").textContent+" يوم",W/2+220,433,34,ink,700);
      txAt($("gdate").textContent,W/2+220,465,18,muted,400);
      txAt("هجري",W/2-220,385,26,muted,500,"'Reem Kufi'");
      txAt($("hm").textContent+" شهر · "+$("hd").textContent+" يوم",W/2-220,433,34,ink,700);
      txAt(ev.hj,W/2-220,465,18,muted,400);
      tx("الأيام المتبقية لرمضان: "+$("ramadanDaysRemaining").textContent+" يومًا",W/2,568,22,acc,600);
    }else if(mode==="ram"){
      tx("رمضان كريم",365,29,muted,500,"'Reem Kufi'");
      tx($("rmday").textContent,455,64,acc,700,"'Reem Kufi'");
      tx(ev.hj,510,21,muted,400);
    }else{
      tx("بكل المحبة",365,28,muted,500,"'Reem Kufi'");
      tx(ev.done,455,48,acc,700,"'Reem Kufi'");
      tx(ev.hj,510,21,muted,400);
    }
    var verseIndex=Math.floor(Math.random()*VERSES.length);
    if(VERSES.length>1&&verseIndex===lastImageVerseIndex)verseIndex=(verseIndex+1+Math.floor(Math.random()*(VERSES.length-1)))%VERSES.length;
    lastImageVerseIndex=verseIndex;
    var verse=VERSES[verseIndex];
    roundedRect(x,646,900,300,30);x.fillStyle="rgba(255,255,255,.035)";x.fill();x.strokeStyle=acc;x.globalAlpha=.32;x.lineWidth=2;x.stroke();x.globalAlpha=1;
    tx("آية ترافق يومك",696,25,acc,600,"'Reem Kufi'");
    var verseFont=verse[0].length>95?26:(verse[0].length>68?29:32);
    x.font="400 "+verseFont+"px Amiri, 'Noto Naskh Arabic', Tahoma, sans-serif";x.fillStyle=ink;
    var verseLines=wrapCanvasText(x,verse[0],800),verseY=758,lineHeight=Math.round(verseFont*1.35);
    verseLines.forEach(function(line){x.fillText(line,W/2,verseY);verseY+=lineHeight;});
    tx(verse[1],Math.min(910,verseY+24),18,muted,400);
    tx("يَزِيد",1000,20,muted,500,"'Reem Kufi'");
    return c;
  }
  function wrapCanvasText(ctx,text,maxWidth){
    var lines=[];
    String(text||"").split(/\n/).forEach(function(paragraph){
      var words=paragraph.split(/\s+/).filter(Boolean),line="";
      words.forEach(function(word){
        var candidate=line?line+" "+word:word;
        if(ctx.measureText(candidate).width<=maxWidth){line=candidate;return;}
        if(line)lines.push(line);
        line="";
        if(ctx.measureText(word).width<=maxWidth){line=word;return;}
        var characters=Array.from(word),clusters=[];
        characters.forEach(function(character){
          if(/[\u064B-\u065F\u0670]/.test(character)&&clusters.length)clusters[clusters.length-1]+=character;
          else clusters.push(character);
        });
        clusters.forEach(function(character){
          if(line&&ctx.measureText(line+character).width>maxWidth){lines.push(line);line=character;}
          else line+=character;
        });
      });
      if(line)lines.push(line);
      if(!words.length)lines.push("");
    });
    return lines;
  }
  function readCaptureSection(card){
    var heading=card.querySelector(".vh"),body=card.querySelector("p"),reference=card.querySelector(".vrow small");
    return {heading:heading?heading.textContent.trim():"",body:body?body.textContent.trim():"",reference:reference?reference.textContent.trim():""};
  }
  function captureSections(kind){
    if(kind==="daily"){
      return Array.prototype.map.call(document.querySelectorAll(".content-cards .verse"),readCaptureSection);
    }
    if(kind.indexOf("daily-card:")===0){
      var card=$(kind.slice("daily-card:".length));
      if(!card)throw new Error("تعذّر العثور على البطاقة المطلوبة.");
      return [readCaptureSection(card)];
    }
    var quranText=$("quranPageText").innerText.trim();
    if(!quranText||quranText.indexOf("جارٍ تحميل")===0||quranText.indexOf("تعذّر تحميل")===0)throw new Error("انتظر حتى يكتمل تحميل ورد القرآن ثم أعد المحاولة.");
    return [{heading:$("quranPageLabel").textContent+" — "+$("quranDateLabel").textContent,body:quranText,reference:""}];
  }
  function roundedRect(ctx,x,y,width,height,radius){
    ctx.beginPath();ctx.moveTo(x+radius,y);ctx.lineTo(x+width-radius,y);ctx.quadraticCurveTo(x+width,y,x+width,y+radius);
    ctx.lineTo(x+width,y+height-radius);ctx.quadraticCurveTo(x+width,y+height,x+width-radius,y+height);
    ctx.lineTo(x+radius,y+height);ctx.quadraticCurveTo(x,y+height,x,y+height-radius);
    ctx.lineTo(x,y+radius);ctx.quadraticCurveTo(x,y,x+radius,y);ctx.closePath();
  }
  function makeSectionImage(kind){
    var square=shareSize.value==="square",W=1080,pad=64,inner=W-pad*2,isQuran=kind==="quran",isSingle=kind.indexOf("daily-card:")===0,gridSquare=square&&!isQuran&&!isSingle;
    var bodySize=square?(isQuran?24:(isSingle?30:22)):(isQuran?32:(isSingle?36:31));
    var lineHeight=square?(isQuran?39:(isSingle?44:31)):(isQuran?58:(isSingle?58:50));
    var sections=captureSections(kind),measure=document.createElement("canvas").getContext("2d");
    if(!measure)throw new Error("تعذّر إنشاء لوحة الرسم.");
    measure.direction="rtl";measure.textAlign="center";
    var cardWidth=gridSquare?(inner-20)/2:inner,contentWidth=cardWidth-(gridSquare?34:72);
    var prepared=sections.map(function(section){
      if(!section.body)throw new Error("لا يوجد محتوى جاهز في هذه البطاقة لإنشاء الصورة.");
      measure.font="400 "+bodySize+"px Amiri, 'Noto Naskh Arabic', Tahoma, sans-serif";
      section.bodyLines=wrapCanvasText(measure,section.body,contentWidth);
      measure.font="700 "+(square?24:28)+"px 'Reem Kufi', Tahoma, sans-serif";
      section.headingLines=wrapCanvasText(measure,section.heading,contentWidth);
      measure.font="400 "+(square?18:23)+"px Readex Pro, Tahoma, sans-serif";
      section.referenceLines=wrapCanvasText(measure,section.reference,contentWidth);
      section.height=30+section.headingLines.length*(square?32:40)+12+section.bodyLines.length*lineHeight+(section.referenceLines.length?12+section.referenceLines.length*(square?25:32):0)+28;
      return section;
    });
    var contentHeight=0;
    if(gridSquare){
      for(var row=0;row<prepared.length;row+=2)contentHeight+=Math.max(prepared[row].height,prepared[row+1]?prepared[row+1].height:0)+18;
    }else contentHeight=prepared.reduce(function(total,section){return total+section.height+24;},0);
    var naturalHeight=220+contentHeight+90,H=square?1080:Math.max(1920,naturalHeight);
    if(naturalHeight>H&&square)throw new Error("لا توجد مساحة كافية للمقاس المربع لهذا المحتوى؛ جرّب المقاس الرأسي.");
    if(H>12000)throw new Error("الصورة طويلة جدًا لإنشائها.");
    var canvas=document.createElement("canvas");canvas.width=W;canvas.height=H;
    var ctx=canvas.getContext("2d");if(!ctx)throw new Error("تعذّر إنشاء لوحة الرسم.");
    var palette=imagePalette(),gradient=ctx.createLinearGradient(0,0,W,H);
    gradient.addColorStop(0,palette.bg2);gradient.addColorStop(1,palette.bg);ctx.fillStyle=gradient;ctx.fillRect(0,0,W,H);
    ctx.textAlign="center";ctx.textBaseline="alphabetic";ctx.direction="rtl";
    ctx.fillStyle=palette.accent;ctx.font="700 "+(square?44:58)+"px 'Reem Kufi', Tahoma, sans-serif";
    ctx.fillText(isQuran?"ورد القرآن اليومي":"زادك اليومي",W/2,square?68:96);
    ctx.fillStyle=palette.muted;ctx.font="400 "+(square?19:23)+"px Readex Pro, Tahoma, sans-serif";
    ctx.fillText(new Date().toLocaleDateString("ar-EG",{weekday:"long",day:"numeric",month:"long",year:"numeric"}),W/2,square?104:142,inner);
    var y=190+(H-naturalHeight)/2;
    function drawSection(section,x,width,top){
      roundedRect(ctx,x,top,width,section.height,square?18:24);ctx.fillStyle=palette.bg2;ctx.fill();
      ctx.strokeStyle=palette.accent;ctx.lineWidth=2;ctx.stroke();
      var textY=top+(square?36:44),center=x+width/2;
      ctx.fillStyle=palette.accent;ctx.font="700 "+(square?24:28)+"px 'Reem Kufi', Tahoma, sans-serif";
      section.headingLines.forEach(function(line){ctx.fillText(line,center,textY,width-32);textY+=square?32:40;});
      textY+=square?12:18;ctx.fillStyle=palette.ink;ctx.font="400 "+bodySize+"px Amiri, 'Noto Naskh Arabic', Tahoma, sans-serif";
      section.bodyLines.forEach(function(line){ctx.fillText(line,center,textY,width-32);textY+=lineHeight;});
      if(section.referenceLines.length){textY+=square?12:16;ctx.fillStyle=palette.muted;ctx.font="400 "+(square?18:23)+"px Readex Pro, Tahoma, sans-serif";section.referenceLines.forEach(function(line){ctx.fillText(line,center,textY,width-32);textY+=square?25:32;});}
    }
    if(gridSquare){
      for(var gridRow=0;gridRow<prepared.length;gridRow+=2){
        var rowHeight=Math.max(prepared[gridRow].height,prepared[gridRow+1]?prepared[gridRow+1].height:0);
        for(var col=0;col<2&&prepared[gridRow+col];col++){
          var cardX=pad+(col===0?inner-cardWidth:0);
          drawSection(prepared[gridRow+col],cardX,cardWidth,y);
        }
        y+=rowHeight+18;
      }
    }else prepared.forEach(function(section){drawSection(section,pad,inner,y);y+=section.height+24;});
    ctx.fillStyle=palette.muted;ctx.font="600 "+(square?19:24)+"px 'Reem Kufi', Tahoma, sans-serif";ctx.fillText("يَزِيد",W/2,H-42);
    return canvas;
  }
  function downloadCanvas(canvas,filename){
    canvas.toBlob(function(blob){
      if(!blob){showFloatingToast("تعذّر إنشاء الصورة","لم يتمكن المتصفح من تحويل الصورة إلى ملف PNG.");return;}
      var url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();
      window.setTimeout(function(){URL.revokeObjectURL(url);},1000);
      showFloatingToast("الصورة جاهزة","بدأ تنزيل ملف الصورة بصيغة PNG.");
    },"image/png");
  }
  var currentShareFilename="yazeed-ramadan-countdown-story.png",currentShareTitle="يَزِيد";
  function showImagePreview(canvas,filename,title){
    currentShareCanvas=canvas;currentShareFilename=filename;currentShareTitle=title;
    $("img").src=canvas.toDataURL("image/png");$("img").alt="معاينة صورة "+title;$("img").dataset.ready="1";$("ov").className="ov on";
  }
  function finishCapture(){
    if(!captureAction)return;
    var action=captureAction;closeCapturePopover();
    var ready=document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve();
    ready.then(function(){
      try{
        var suffix=shareSize.value==="square"?"square":"story";
        if(action.kind==="share"){
          showImagePreview(makeImage(),"yazeed-ramadan-countdown-"+suffix+".png",$("title").textContent);
          return;
        }
        var image=makeSectionImage(action.kind),filename,title;
        if(action.kind==="daily"){filename="yazeed-daily-content-"+suffix+".png";title="زادك اليومي";}
        else if(action.kind==="quran"){filename="yazeed-quran-page-"+suffix+".png";title="ورد القرآن اليومي";}
        else{filename="yazeed-"+action.kind.slice("daily-card:".length)+"-"+suffix+".png";title=captureSections(action.kind)[0].heading;}
        showImagePreview(image,filename,title||"يَزِيد");
      }catch(error){showFloatingToast("تعذّر إنشاء الصورة",error.message||"حدث خطأ أثناء إنشاء الصورة.");}
    });
  }
  $("share").addEventListener("click",function(){showCapturePopover(this,"share");});
  $("captureDaily").addEventListener("click",function(){showCapturePopover(this,"daily");});
  $("captureQuran").addEventListener("click",function(){showCapturePopover(this,"quran");});
  Array.prototype.forEach.call(document.querySelectorAll("[data-capture-card]"),function(button){
    button.addEventListener("click",function(){showCapturePopover(button,"daily-card:"+button.getAttribute("data-capture-card"));});
  });
  function updateCaptureSelections(){
    Array.prototype.forEach.call(capturePopover.querySelectorAll("[data-style]"),function(button){button.setAttribute("aria-pressed",String(button.getAttribute("data-style")===shareStyle.value));});
    Array.prototype.forEach.call(capturePopover.querySelectorAll("[data-size]"),function(button){button.setAttribute("aria-pressed",String(button.getAttribute("data-size")===shareSize.value));});
  }
  Array.prototype.forEach.call(capturePopover.querySelectorAll("[data-style]"),function(button){
    button.addEventListener("click",function(){shareStyle.value=button.getAttribute("data-style");shareStyle.dispatchEvent(new Event("change"));updateCaptureSelections();});
  });
  Array.prototype.forEach.call(capturePopover.querySelectorAll("[data-size]"),function(button){
    button.addEventListener("click",function(){shareSize.value=button.getAttribute("data-size");shareSize.dispatchEvent(new Event("change"));updateCaptureSelections();});
  });
  $("captureCreateButton").addEventListener("click",finishCapture);
  $("captureStyleCancel").addEventListener("click",closeCapturePopover);
  document.addEventListener("pointerdown",function(event){
    if(capturePopover.hidden)return;
    if(capturePopover.contains(event.target)||(captureAction&&captureAction.button.contains(event.target)))return;
    closeCapturePopover();
  });
  window.addEventListener("scroll",function(){if(!capturePopover.hidden)closeCapturePopover();},{passive:true});
  document.addEventListener("keydown",function(event){if(event.key==="Escape"&&!capturePopover.hidden)closeCapturePopover();});
  $("close").onclick=function(){$("ov").className="ov";};
  $("send").onclick=function(){
    if(!currentShareCanvas){showFloatingToast("لا توجد صورة للمشاركة","أنشئ صورة العدّ التنازلي أولًا.");return;}
    currentShareCanvas.toBlob(function(blob){
      if(!blob){showFloatingToast("تعذّرت المشاركة","لم يتمكن المتصفح من تجهيز الصورة.");return;}
      var file=new File([blob],currentShareFilename,{type:"image/png"});
      if(navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){
        navigator.share({files:[file],title:currentShareTitle,text:currentShareTitle+" — من موقع يَزِيد"}).catch(function(error){if(error.name!=="AbortError")showFloatingToast("لم تتم المشاركة","تعذّرت مشاركة الصورة.");});
      }else downloadCanvas(currentShareCanvas,currentShareFilename);
    },"image/png");
  };
  $("downloadImage").addEventListener("click",function(){
    if(!currentShareCanvas){showFloatingToast("لا توجد صورة لتنزيلها","أنشئ الصورة أولًا ثم حاول تنزيلها.");return;}
    downloadCanvas(currentShareCanvas,currentShareFilename);
  });
  $("ov").addEventListener("click",function(event){if(event.target===$("ov"))$("ov").className="ov";});
  document.addEventListener("keydown",function(event){if(event.key==="Escape"&&$("ov").classList.contains("on"))$("ov").className="ov";});

  setEvent(autoEventIndex(new Date(Date.now()+OFF)),true); applyCity(); setInterval(tick,1000);
})();

(function(){
  var nav = document.querySelector('.motion-nav');
  if (!nav) return;
  var links = Array.prototype.slice.call(nav.querySelectorAll('.motion-links a, .calendar-nav-toggle'));
  var navLinks=nav.querySelector('.motion-links'),navMenuToggle=document.getElementById('navMenuToggle');
  function setMobileNavExpanded(expanded,restoreFocus){
    navLinks.classList.toggle('is-expanded',expanded);
    navMenuToggle.setAttribute('aria-expanded',String(expanded));
    navMenuToggle.setAttribute('aria-label',expanded?'إغلاق قائمة التنقل':'فتح قائمة التنقل');
    if(restoreFocus)navMenuToggle.focus();
  }
  var navGroups=Array.prototype.slice.call(navLinks.querySelectorAll('.nav-group'));
  navGroups.forEach(function(group){
    group.addEventListener('toggle',function(){
      if(!group.open)return;
      navGroups.forEach(function(other){if(other!==group)other.open=false;});
    });
    group.addEventListener('keydown',function(event){
      if(event.key!=='Escape'||!group.open)return;
      event.preventDefault();
      group.open=false;
      group.querySelector('summary').focus();
    });
    group.querySelectorAll('.nav-group-menu a').forEach(function(link){
      link.addEventListener('click',function(){
        navGroups.forEach(function(item){item.open=false;});
      });
    });
  });
  document.addEventListener('pointerdown',function(event){
    navGroups.forEach(function(group){
      if(group.open&&!group.contains(event.target))group.open=false;
    });
  });
  navMenuToggle.addEventListener('click',function(){
    setMobileNavExpanded(navMenuToggle.getAttribute('aria-expanded')!=='true');
  });
  document.addEventListener('pointerdown',function(event){
    if(window.innerWidth>760||navMenuToggle.getAttribute('aria-expanded')!=='true')return;
    if(nav.contains(event.target)||event.target.closest('.calendar-nav-menu,.radio-nav-menu'))return;
    setMobileNavExpanded(false);
  });
  navLinks.addEventListener('keydown',function(event){
    if(event.key==='Escape'&&navMenuToggle.getAttribute('aria-expanded')==='true'){
      var openDropdown=event.target.closest('.calendar-nav-toggle[aria-expanded="true"],.radio-nav-toggle[aria-expanded="true"]');
      if(openDropdown)return;
      event.preventDefault();
      setMobileNavExpanded(false,true);
    }
  });
  window.addEventListener('resize',function(){if(window.innerWidth>760)setMobileNavExpanded(false);});
  links.forEach(function(link){
    link.addEventListener('click',function(event){
      if(link.tagName==='A'&&window.innerWidth<=760&&navLinks.classList.contains('is-expanded')){
        var href=link.getAttribute('href');
        if(href&&href.charAt(0)==='#'&&link.target!=='_blank'){
          event.preventDefault();
          setMobileNavExpanded(false);
          var target=document.getElementById(href.slice(1));
          if(target){
            window.history.pushState(null,'',href);
            window.setTimeout(function(){
              var top=target.getBoundingClientRect().top+window.scrollY-nav.getBoundingClientRect().height-12;
              window.scrollTo({top:Math.max(0,top),behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
            },380);
          }
        }else{
          setMobileNavExpanded(false);
        }
          navGroups.forEach(function(group){group.open=false;});
        }
    });
  });
  function updateNavDensity(){nav.classList.toggle("is-compact",window.scrollY>24);}
  window.addEventListener("scroll",updateNavDensity,{passive:true});
  window.addEventListener("resize",updateNavDensity);
  updateNavDensity();
  if ('IntersectionObserver' in window) {
    var revealItems = document.querySelectorAll(
      '.dashboard-primary > *, .dashboard-secondary > *, .content-cards > *, .daily-content-section, .clock, .pair, .nights, .pray, .automation-panel'
    );
    revealItems.forEach(function(el, i){
      if (el.closest('.motion-nav')) return;
      el.classList.add('motion-reveal');
      el.style.transitionDelay = (Math.min(i % 5, 4) * 55) + 'ms';
    });
    var revealObserver = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, {threshold:0.08, rootMargin:'0px 0px -35px 0px'});
    revealItems.forEach(function(el){ revealObserver.observe(el); });

    var navSections = [
      { id: 'home', el: document.querySelector('.hero') || document.getElementById('home') },
      { id: 'daily-content', el: document.getElementById('daily-content') },
      { id: 'prayer', el: document.getElementById('prayer') },
      { id: 'notifications', el: document.getElementById('notifications') },
      { id: 'quran', el: document.getElementById('quran') }
    ].filter(function(item){ return !!item.el; }).sort(function(a,b){
      return a.el.compareDocumentPosition(b.el)&Node.DOCUMENT_POSITION_FOLLOWING?-1:1;
    });
    var navTicking = false;
    function updateActiveNav(){
      navTicking = false;
      var marker = Math.max(120, (nav.getBoundingClientRect().height || 70) + 120);
      var currentIndex = 0;
      navSections.forEach(function(item,index){
        var rect = item.el.getBoundingClientRect();
        if (rect.top <= marker + 8) currentIndex = index;
      });
      var current = navSections[currentIndex], currentTop = current.el.getBoundingClientRect().top;
      var activeIds = [current.id];
      navSections.forEach(function(item){
        if (item.id !== current.id && Math.abs(item.el.getBoundingClientRect().top-currentTop) <= 24) activeIds.push(item.id);
      });
      links.forEach(function(a){
        var href = a.getAttribute('href');
        var isActive=activeIds.indexOf(href && href.slice(1))!==-1;
        a.classList.toggle('active',isActive);
        if(isActive)a.setAttribute('aria-current','location');
        else a.removeAttribute('aria-current');
      });
      navGroups.forEach(function(group){
        group.classList.toggle('has-active',!!group.querySelector('a.active'));
      });
    }
    function requestNavUpdate(){ if(!navTicking){ navTicking=true; window.requestAnimationFrame(updateActiveNav); } }
    window.addEventListener('scroll', requestNavUpdate, {passive:true});
    window.addEventListener('resize', requestNavUpdate);
    links.forEach(function(a){ a.addEventListener('click', function(){ window.setTimeout(requestNavUpdate, 250); }); });
    updateActiveNav();
  } else {
    document.querySelectorAll('.motion-reveal').forEach(function(el){el.classList.add('is-visible');});
  }
})();

(function(){
  var currentLocation={name:'القاهرة',country:'مصر',latitude:30.0444,longitude:31.2357,timezone:'Africa/Cairo'};
  var labels={0:['صافي','☀️'],1:['غالبًا صافي','🌤️'],2:['غائم جزئيًا','⛅'],3:['غائم','☁️'],45:['شبورة','🌫️'],48:['شبورة كثيفة','🌫️'],51:['رذاذ خفيف','🌦️'],53:['رذاذ','🌦️'],55:['رذاذ كثيف','🌧️'],56:['رذاذ متجمد','🌧️'],57:['رذاذ متجمد كثيف','🌧️'],61:['أمطار خفيفة','🌦️'],63:['أمطار','🌧️'],65:['أمطار غزيرة','🌧️'],71:['ثلوج خفيفة','🌨️'],73:['ثلوج','🌨️'],75:['ثلوج كثيفة','❄️'],80:['زخات مطر','🌦️'],81:['زخات مطر','🌧️'],82:['زخات غزيرة','⛈️'],95:['عاصفة رعدية','⛈️'],96:['عاصفة رعدية وبَرَد','⛈️'],99:['عاصفة قوية وبَرَد','⛈️']};
  var $=function(id){return document.getElementById(id);};
  function setStatus(t){if($('citySearchStatus'))$('citySearchStatus').textContent=t;}
  var weatherRequest=0,locationLabelRequest=0;
  function getLocationLabel(loc){
    if(loc.name==='موقعك الحالي')return loc.resolvedName?'موقعك الحالي: '+loc.resolvedName:'موقعك الحالي';
    return [loc.name,loc.admin1&&loc.admin1!==loc.name?loc.admin1:'',loc.country||''].filter(Boolean).join('، ');
  }
  function updatePrayerLocation(loc){
    var label=getLocationLabel(loc);
    $('selectedLocationLabel').textContent=loc.name==='موقعك الحالي'?label:'الموقع الحالي: '+label;
    window.dispatchEvent(new CustomEvent('ramadan-location-changed',{detail:{latitude:loc.latitude,longitude:loc.longitude,timezone:loc.timezone||'Africa/Cairo',name:label}}));
    return label;
  }
  function lookupLocationName(loc,request){
    var url='https://api.bigdatacloud.net/data/reverse-geocode-client?latitude='+encodeURIComponent(loc.latitude)+'&longitude='+encodeURIComponent(loc.longitude)+'&localityLanguage=ar';
    fetch(url).then(function(response){if(!response.ok)throw new Error('reverse geocoding failed');return response.json();}).then(function(data){
      if(request!==locationLabelRequest||loc!==currentLocation)return;
      var locality=data.locality||data.city||data.principalSubdivision||'';
      var country=data.countryName||'';
      var resolved=[locality,country].filter(function(value,index,all){return value&&all.indexOf(value)===index;}).join('، ');
      if(!resolved)resolved='الإحداثيات '+loc.latitude.toFixed(4)+'، '+loc.longitude.toFixed(4);
      loc.resolvedName=resolved;
      var label=updatePrayerLocation(loc);
      setStatus('تم تحديد الموقع: '+resolved+'؛ جارٍ تحديث مواقيت الصلاة والطقس…');
      var weatherStatus=$('weatherStatus');
      if(weatherStatus&&currentLocation===loc)weatherStatus.textContent='الطقس الآن · '+label;
    }).catch(function(){
      if(request!==locationLabelRequest||loc!==currentLocation)return;
      var coords='الإحداثيات '+loc.latitude.toFixed(4)+'، '+loc.longitude.toFixed(4);
      loc.resolvedName=coords;
      updatePrayerLocation(loc);
      setStatus('تم تحديد الموقع ('+coords+')؛ جارٍ تحديث مواقيت الصلاة والطقس…');
    });
  }
  function loadWeather(loc){loc=loc||currentLocation;var status=$('weatherStatus');if(status)status.textContent='جارٍ تحديث الطقس…';
    var request=++weatherRequest;
    var url='https://api.open-meteo.com/v1/forecast?latitude='+encodeURIComponent(loc.latitude)+'&longitude='+encodeURIComponent(loc.longitude)+'&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=1';
    fetch(url).then(function(r){if(!r.ok)throw new Error('weather');return r.json();}).then(function(d){if(request!==weatherRequest||loc!==currentLocation)return;var cur=d.current||{},day=d.daily||{},code=cur.weather_code,info=labels[code]||['حالة الطقس','🌤️'];
      if(d.timezone&&d.timezone!==loc.timezone){loc.timezone=d.timezone;updatePrayerLocation(loc);}
      $('weatherIcon').textContent=info[1];$('weatherTemp').textContent=Math.round(cur.temperature_2m)+'°';$('weatherDesc').textContent=info[0]+' · المحسوس '+Math.round(cur.apparent_temperature)+'°';$('weatherRange').textContent='العظمى '+Math.round((day.temperature_2m_max||[])[0])+'° / الصغرى '+Math.round((day.temperature_2m_min||[])[0])+'°';$('weatherWind').textContent='الرياح '+Math.round(cur.wind_speed_10m)+' كم/س';if(status)status.textContent='الطقس الآن · '+getLocationLabel(loc);
    }).catch(function(){if(request!==weatherRequest)return;if(status)status.textContent='تعذّر تحديث الطقس';$('weatherDesc').textContent='تعذّر تحميل بيانات الطقس';});
  }
  function chooseLocation(loc){currentLocation=loc;var request=++locationLabelRequest,label=updatePrayerLocation(loc);
    $('citySearch').value=loc.name==='موقعك الحالي'?'':loc.name;$('cityResults').innerHTML='';setStatus('تم تحديد الموقع: '+label+'؛ جارٍ تحديث مواقيت الصلاة والطقس…');
    if(loc.name==='موقعك الحالي')lookupLocationName(loc,request);
    loadWeather(loc);
  }
  function detectLocation(){var button=$('detectLocation');if(!navigator.geolocation){setStatus('المتصفح لا يدعم تحديد الموقع.');return;}
    button.disabled=true;button.textContent='جارٍ تحديد الموقع…';setStatus('بانتظار إذن الموقع من المتصفح…');
    navigator.geolocation.getCurrentPosition(function(position){var timezone='Africa/Cairo';try{timezone=Intl.DateTimeFormat().resolvedOptions().timeZone||timezone;}catch(e){}
      button.disabled=false;button.textContent='تحديث موقعي';chooseLocation({name:'موقعك الحالي',latitude:position.coords.latitude,longitude:position.coords.longitude,timezone:timezone});
    },function(error){button.disabled=false;button.textContent='إعادة تحديد موقعي';var message;
      if(!window.isSecureContext)message='يلزم فتح الموقع عبر HTTPS للسماح بتحديد الموقع.';
      else if(error.code===1)message='لم يتم السماح بالوصول إلى موقعك.';
      else if(error.code===2)message='تعذّر معرفة موقعك الحالي.';
      else message='انتهت مهلة تحديد الموقع.';
      setStatus(message);
    },{enableHighAccuracy:false,timeout:12000,maximumAge:300000});
  }
  function searchCities(){var query=$('citySearch').value.trim();if(query.length<2){setStatus('اسم المدينة غير صالح.');return;}
    setStatus('جارٍ البحث عن المدن…');$('cityResults').innerHTML='';var url='https://geocoding-api.open-meteo.com/v1/search?name='+encodeURIComponent(query)+'&count=10&language=ar&format=json';
    fetch(url).then(function(r){if(!r.ok)throw new Error('geocode');return r.json();    }).then(function(d){var results=d.results||[];if(!results.length){setStatus('لم يتم العثور على المدينة.');return;}setStatus('نتائج البحث عن المدن:');results.forEach(function(r){var b=document.createElement('button');b.type='button';b.className='city-result';b.setAttribute('role','option');var place=[r.name,r.admin1,r.country].filter(function(x,i,a){return x&&a.indexOf(x)===i;}).join('، ');b.textContent=place;var small=document.createElement('small');small.textContent=(r.feature_code==='PPLC'?'العاصمة · ':'')+(r.timezone||'');b.appendChild(small);b.addEventListener('click',function(){chooseLocation({name:r.name,country:r.country,admin1:r.admin1,latitude:r.latitude,longitude:r.longitude,timezone:r.timezone});});$('cityResults').appendChild(b);});
    }).catch(function(){setStatus('تعذّر البحث عن المدن.');});
  }
  document.addEventListener('DOMContentLoaded',function(){loadWeather(currentLocation);detectLocation();$('detectLocation').addEventListener('click',detectLocation);$('searchCityBtn').addEventListener('click',searchCities);$('citySearch').addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();searchCities();}});
  });
})();