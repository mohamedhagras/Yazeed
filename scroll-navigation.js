(function(){
  var actions=document.querySelector(".page-navigation-actions");
  if(!actions){
    actions=document.createElement("div");
    actions.className="page-navigation-actions";
    actions.setAttribute("aria-label","التنقل السريع");
    document.body.appendChild(actions);
  }

  function getButton(id,label,title,path){
    var button=document.getElementById(id);
    if(!button){
      button=document.createElement("button");
      button.className="page-scroll-button";
      button.id=id;
      button.type="button";
      button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+path+'"/></svg>';
      actions.appendChild(button);
    }
    button.setAttribute("aria-label",label);
    button.title=title;
    return button;
  }

  var downButton=getButton("scrollToBottom","انتقل إلى أسفل الصفحة","انتقل إلى أسفل الصفحة","M12 4v15M6 13l6 6 6-6");
  var upButton=getButton("scrollToTop","العودة إلى أعلى الصفحة","العودة إلى أعلى الصفحة","M12 20V5M6 11l6-6 6 6");

  function updateButtons(){
    var scrollTop=window.scrollY||document.documentElement.scrollTop;
    var scrollBottom=scrollTop+window.innerHeight;
    var pageHeight=document.documentElement.scrollHeight;
    upButton.hidden=scrollTop<=160;
    downButton.hidden=scrollBottom>=pageHeight-80;
  }
  function scrollTo(top){
    window.scrollTo({
      top:top,
      behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"
    });
  }

  downButton.addEventListener("click",function(){scrollTo(document.documentElement.scrollHeight);});
  upButton.addEventListener("click",function(){scrollTo(0);});
  window.addEventListener("scroll",updateButtons,{passive:true});
  window.addEventListener("resize",updateButtons);
  updateButtons();
})();
