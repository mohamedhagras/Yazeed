(function(){
  "use strict";

  var MAX_FILE_BYTES=20*1024*1024,MAX_ROWS=50000,MAX_COLUMNS=16384,MAX_CELLS=1000000;
  var $=function(id){return document.getElementById(id);};
  var fileInput=$("analysisFile"),fileName=$("fileName"),fileStatus=$("fileStatus");
  var workbookOptions=$("workbookOptions"),sheetSelect=$("sheetSelect"),columnPanel=$("columnPanel");
  var columnList=$("columnList"),columnCount=$("columnCount"),runPanel=$("runPanel");
  var processingMode=$("processingMode"),runButton=$("runAnalysis"),analysisStatus=$("analysisStatus");
  var analysisResults=$("analysisResults"),comparisonResults=$("comparisonResults");
  var currentFile=null,currentWorkbook=null,currentRows=[],currentHeaders=[];
  var currentTypes=[],activeFilters=[],resultRows=[],baseResultRows=[],dashboardSelections=[];
  var parseDuration=0,workbookReadDuration=0,loadRequest=0,parseRequest=0,chart=null,columnCharts=[],columnChartPage=0,latestSummary=null;
  var dashboardConfigs=[],nextDashboardChartId=1,draggedChartId=null,dashboardStorageKey="";
  var COLUMN_CHART_PAGE_SIZE=12;
  var apiBase=resolveApiBase();

  function resolveApiBase(){
    var value=String(window.YAZEED_TRANSCRIPTION_API_URL||"").trim();
    if(!value)return "";
    try{
      var url=new URL(value,window.location.href);
      return url.protocol==="http:"||url.protocol==="https:"?url.href.replace(/\/+$/,""):"";
    }catch(error){return "";}
  }
  function setStatus(element,message,isError){
    element.textContent=message||"";
    element.classList.toggle("is-error",Boolean(isError));
  }
  function isMissing(value){return value===null||value===undefined||(typeof value==="string"&&!value.trim());}
  function displayValue(value){
    if(value instanceof Date)return value.toISOString().replace(".000Z","Z");
    if(typeof value==="boolean")return value?"true":"false";
    return String(value);
  }
  function parseDateValue(value){
    if(value instanceof Date&&!Number.isNaN(value.getTime()))return value;
    if(typeof value!=="string"||! /^\d{4}-\d{2}-\d{2}(?:$|T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?$)/.test(value.trim()))return null;
    var normalized=value.trim();
    if(normalized.indexOf("T")!==-1&&!/(?:Z|[+-]\d{2}:\d{2})$/.test(normalized))normalized+="Z";
    var parsed=new Date(normalized);
    return Number.isNaN(parsed.getTime())?null:parsed;
  }
  function excelDateLabel(sheet,range,rowIndex,columnIndex){
    var address=XLSX.utils.encode_cell({r:range.s.r+rowIndex,c:range.s.c+columnIndex});
    var cell=sheet[address];
    if(!cell||cell.t!=="n"||!cell.z||!XLSX.SSF.is_date(cell.z))return null;
    var workbookProperties=currentWorkbook.Workbook&&currentWorkbook.Workbook.WBProps;
    var date=XLSX.SSF.parse_date_code(cell.v,{date1904:Boolean(workbookProperties&&workbookProperties.date1904)});
    if(!date)return null;
    var seconds=Math.floor(date.S),milliseconds=Math.round((date.S-seconds)*1000);
    var label=String(date.y).padStart(4,"0")+"-"+String(date.m).padStart(2,"0")+"-"+String(date.d).padStart(2,"0")
      +"T"+String(date.H).padStart(2,"0")+":"+String(date.M).padStart(2,"0")+":"+String(seconds).padStart(2,"0");
    if(milliseconds)label+="."+String(milliseconds).padStart(3,"0");
    return label+"Z";
  }
  function formatNumber(value){
    if(!Number.isFinite(value))return "—";
    return new Intl.NumberFormat("ar-EG",{maximumFractionDigits:2}).format(value);
  }
  function resetResults(){
    analysisResults.hidden=true;
    comparisonResults.hidden=true;
    comparisonResults.replaceChildren();
    if(chart){chart.destroy();chart=null;}
    columnCharts.forEach(function(item){item.destroy();});
    columnCharts=[];
    columnChartPage=0;
    dashboardConfigs=[];
    nextDashboardChartId=1;
    draggedChartId=null;
    dashboardSelections=[];
    dashboardStorageKey="";
    resultRows=[];
    baseResultRows=[];
    $("columnCharts").replaceChildren();
    $("columnChartCount").textContent="";
    $("showMoreCharts").hidden=true;
    $("columnChartsEmpty").hidden=true;
    $("dashboardFilterBar").hidden=true;
    $("dashboardFilterChips").replaceChildren();
    $("dashboardStatus").textContent="";
    $("dashboardStatus").classList.remove("is-error");
    ["saveDashboard","exportDashboardImage","printDashboard"].forEach(function(id){$(id).disabled=true;});
    latestSummary=null;
  }
  function setBusy(busy){
    runButton.disabled=busy||!selectedColumns().length;
    runButton.textContent=busy?"جارٍ التحليل…":"حلّل الأعمدة المحددة";
    fileInput.disabled=busy;
    sheetSelect.disabled=busy;
    columnList.querySelectorAll("input").forEach(function(input){input.disabled=busy;});
    $("filterColumn").disabled=busy;
    $("addFilter").disabled=busy||!$("filterColumn").options.length;
    $("clearFilters").disabled=busy||!activeFilters.length;
    $("filterList").querySelectorAll("input,button").forEach(function(input){input.disabled=busy;});
  }
  function selectedColumns(){
    return Array.prototype.map.call(columnList.querySelectorAll("input[type=checkbox]:checked"),function(input){return Number(input.value);});
  }
  function inferColumnTypes(rows,width){
    var states=Array.from({length:width},function(){return {count:0,numeric:true,date:true};});
    rows.forEach(function(row){
      for(var index=0;index<width;index++){
        var value=row[index];
        if(isMissing(value))continue;
        var state=states[index];
        state.count++;
        if(typeof value!=="number"||!Number.isFinite(value))state.numeric=false;
        if(!parseDateValue(value))state.date=false;
      }
    });
    return states.map(function(state){
      if(state.count&&state.numeric)return "numeric";
      if(state.count&&state.date)return "date";
      return "category";
    });
  }
  function typeLabel(type){return type==="numeric"?"رقمي":type==="date"?"تاريخ":"تصنيفي";}
  function getFilteredRows(){
    return currentRows.filter(function(row){
      return activeFilters.every(function(filter){
        var value=row[filter.index];
        if(filter.kind==="category"&&!filter.values.length)return true;
        if(filter.kind!=="category"&&!filter.from&&!filter.to)return true;
        if(isMissing(value))return false;
        if(filter.kind==="category")return filter.values.indexOf(displayValue(value))!==-1;
        if(filter.kind==="numeric"){
          var number=Number(value);
          return Number.isFinite(number)&&(!filter.from||number>=Number(filter.from))&&(!filter.to||number<=Number(filter.to));
        }
        var date=parseDateValue(value);
        if(!date)return false;
        var day=date.toISOString().slice(0,10);
        return (!filter.from||day>=filter.from)&&(!filter.to||day<=filter.to);
      });
    });
  }
  function refreshFilterPreview(){
    if(!currentRows.length)return;
    var filtered=getFilteredRows();
    $("filterPreview").textContent=activeFilters.length
      ?formatNumber(filtered.length)+" من "+formatNumber(currentRows.length)+" صف بعد تطبيق الفلاتر. اضغط «حلّل الأعمدة المحددة» لتحديث اللوحة."
      :"لم تتم إضافة فلاتر؛ ستُحلّل جميع الصفوف.";
    runButton.disabled=!selectedColumns().length;
  }
  function updateFilterFieldOptions(){
    var select=$("filterColumn"),used=new Set(activeFilters.map(function(filter){return filter.index;}));
    var available=currentHeaders.map(function(name,index){return {name:name,index:index,type:currentTypes[index]};})
      .filter(function(column){return !used.has(column.index);});
    select.replaceChildren();
    available.forEach(function(column){
      var option=document.createElement("option");
      option.value=String(column.index);
      option.textContent=column.name+" · "+typeLabel(column.type);
      select.appendChild(option);
    });
    $("addFilter").disabled=!available.length;
    $("clearFilters").disabled=!activeFilters.length;
    if(!available.length)select.innerHTML='<option value="">تمت إضافة فلاتر لكل الأعمدة</option>';
  }
  function renderCategoryChoices(filter,host){
    host.replaceChildren();
    var search=document.createElement("input");
    search.type="search";
    search.className="analysis-filter-search";
    search.placeholder="ابحث عن قيمة…";
    search.setAttribute("aria-label","ابحث عن قيم العمود "+currentHeaders[filter.index]);
    search.value=filter.search||"";
    var values=Array.from(new Set(currentRows.map(function(row){return row[filter.index];})
      .filter(function(value){return !isMissing(value);}).map(displayValue)));
    var matches=values.filter(function(value){return value.toLocaleLowerCase().includes(search.value.trim().toLocaleLowerCase());});
    var list=document.createElement("div");
    list.className="analysis-filter-values";
    matches.slice(0,150).forEach(function(value){
      var label=document.createElement("label");
      var checkbox=document.createElement("input");
      checkbox.type="checkbox";
      checkbox.checked=filter.values.indexOf(value)!==-1;
      checkbox.addEventListener("change",function(){
        if(checkbox.checked&&filter.values.indexOf(value)===-1)filter.values.push(value);
        else if(!checkbox.checked)filter.values=filter.values.filter(function(item){return item!==value;});
        refreshFilterPreview();
      });
      var text=document.createElement("span");
      text.textContent=value;
      label.append(checkbox,text);
      list.appendChild(label);
    });
    if(matches.length>150){
      var note=document.createElement("small");
      note.textContent="تظهر أول ١٥٠ قيمة مطابقة؛ استخدم البحث لتضييق القائمة.";
      list.appendChild(note);
    }else if(!matches.length){
      var noteEmpty=document.createElement("small");
      noteEmpty.textContent="لا توجد قيم مطابقة.";
      list.appendChild(noteEmpty);
    }
    search.addEventListener("input",function(){
      filter.search=search.value;
      var selected=filter.values.slice();
      renderCategoryChoices(filter,host);
      filter.values=selected;
      var nextSearch=host.querySelector("input[type=search]");
      nextSearch.focus();
      nextSearch.setSelectionRange(nextSearch.value.length,nextSearch.value.length);
    });
    host.append(search,list);
  }
  function addFilter(){
    var index=Number($("filterColumn").value);
    if(!Number.isInteger(index)||activeFilters.some(function(filter){return filter.index===index;}))return;
    var filter={index:index,kind:currentTypes[index],values:[],from:"",to:"",search:""};
    activeFilters.push(filter);
    var card=document.createElement("article");
    card.className="analysis-filter-card";
    card.dataset.columnIndex=String(index);
    var heading=document.createElement("div");
    heading.className="analysis-filter-heading";
    var title=document.createElement("strong");
    title.textContent=currentHeaders[index]+" · "+typeLabel(filter.kind);
    var remove=document.createElement("button");
    remove.type="button";
    remove.className="analysis-text-button";
    remove.textContent="إزالة";
    remove.setAttribute("aria-label","إزالة فلتر "+currentHeaders[index]);
    remove.addEventListener("click",function(){
      activeFilters=activeFilters.filter(function(item){return item!==filter;});
      card.remove();
      updateFilterFieldOptions();
      refreshFilterPreview();
    });
    heading.append(title,remove);
    card.appendChild(heading);
    if(filter.kind==="category"){
      var choices=document.createElement("div");
      choices.className="analysis-category-filter";
      renderCategoryChoices(filter,choices);
      card.appendChild(choices);
    }else{
      var range=document.createElement("div");
      range.className="analysis-range-filter";
      [["من","from"],["إلى","to"]].forEach(function(item){
        var label=document.createElement("label");
        label.className="analysis-field";
        var caption=document.createElement("span");
        caption.textContent=item[0];
        var input=document.createElement("input");
        input.type=filter.kind==="date"?"date":"number";
        if(input.type==="number")input.step="any";
        input.addEventListener("input",function(){
          filter[item[1]]=input.value;
          refreshFilterPreview();
        });
        label.append(caption,input);
        range.appendChild(label);
      });
      card.appendChild(range);
    }
    $("filterList").appendChild(card);
    updateFilterFieldOptions();
    refreshFilterPreview();
  }
  function buildColumnChoices(){
    columnList.replaceChildren();
    currentTypes=inferColumnTypes(currentRows,currentHeaders.length);
    currentHeaders.forEach(function(name,index){
      var label=document.createElement("label");
      label.className="analysis-column-choice";
      var checkbox=document.createElement("input");
      checkbox.type="checkbox";
      checkbox.value=String(index);
      checkbox.checked=true;
      var title=document.createElement("span");
      title.className="analysis-column-name";
      title.textContent=name;
      var type=document.createElement("small");
      type.textContent=typeLabel(currentTypes[index]);
      label.append(checkbox,title,type);
      columnList.appendChild(label);
      checkbox.addEventListener("change",updateSelection);
    });
    activeFilters=[];
    $("filterList").replaceChildren();
    updateFilterFieldOptions();
    updateSelection();
    refreshFilterPreview();
  }
  function updateSelection(){
    var count=selectedColumns().length;
    columnCount.textContent=count+" من "+currentHeaders.length+" عمود محدد";
    runButton.disabled=count===0;
    resetResults();
  }
  function parseSelectedSheet(){
    var request=++parseRequest;
    resetResults();
    columnPanel.hidden=true;
    $("filtersPanel").hidden=true;
    runPanel.hidden=true;
    workbookOptions.hidden=false;
    setStatus(fileStatus,"جارٍ تجهيز قراءة ورقة العمل…");
    var started=performance.now();
    try{
      var sheet=currentWorkbook.Sheets[sheetSelect.value];
      if(!sheet)throw new Error("تعذّر العثور على ورقة العمل المحددة.");
      if(!sheet["!ref"])throw new Error("ورقة العمل فارغة أو لا تحتوي على صف عناوين.");
      var range=XLSX.utils.decode_range(sheet["!ref"]);
      var width=range.e.c-range.s.c+1;
      var dataRowCount=range.e.r-range.s.r;
      if(!width)throw new Error("لم يتم العثور على رؤوس للأعمدة.");
      if(width>MAX_COLUMNS)throw new Error("الحد الأقصى للأعمدة هو "+MAX_COLUMNS+".");
      if(dataRowCount>MAX_ROWS||dataRowCount*width>MAX_CELLS)throw new Error("الورقة تتجاوز الحد المسموح للصفوف أو الخلايا.");
      var headerRow=Array.from({length:width},function(_,columnIndex){
        var cell=sheet[XLSX.utils.encode_cell({r:range.s.r,c:range.s.c+columnIndex})];
        return cell?cell.v:null;
      });
      if(!headerRow.length)throw new Error("ورقة العمل فارغة أو لا تحتوي على صف عناوين.");
      currentHeaders=headerRow.map(function(value,index){
        var title=isMissing(value)?"عمود "+(index+1):displayValue(value).trim();
        return title||"عمود "+(index+1);
      });
      var rows=[],nextRow=range.s.r+1;
      var rowsPerBatch=Math.max(1,Math.min(500,Math.floor(10000/width)));
      function fail(error){
        if(request!==parseRequest)return;
        currentRows=[];
        currentHeaders=[];
        currentTypes=[];
        activeFilters=[];
        columnPanel.hidden=true;
        $("filtersPanel").hidden=true;
        runPanel.hidden=true;
        setStatus(fileStatus,error.message||"تعذّرت قراءة الورقة.",true);
      }
      function readBatch(){
        if(request!==parseRequest)return;
        try{
          var batchEnd=Math.min(range.e.r+1,nextRow+rowsPerBatch);
          for(;nextRow<batchEnd;nextRow++){
            var row=Array.from({length:width},function(_,columnIndex){
              var cell=sheet[XLSX.utils.encode_cell({r:nextRow,c:range.s.c+columnIndex})];
              if(!cell)return null;
              return excelDateLabel(sheet,range,nextRow-range.s.r,columnIndex)||cell.v;
            });
            if(row.some(function(value){return !isMissing(value);}))rows.push(row);
          }
          if(nextRow<=range.e.r){
            var completedRows=nextRow-range.s.r-1;
            setStatus(fileStatus,"جارٍ تجهيز البيانات: "+formatNumber(completedRows)+" من "+formatNumber(dataRowCount)+" صف.");
            window.setTimeout(readBatch,0);
            return;
          }
          if(!rows.length)throw new Error("لا توجد بيانات أسفل صف العناوين.");
          currentRows=rows;
          parseDuration=workbookReadDuration+performance.now()-started;
          buildColumnChoices();
          columnPanel.hidden=false;
          $("filtersPanel").hidden=false;
          runPanel.hidden=false;
          fileName.textContent=currentFile.name;
          $("fileMeta").textContent=formatNumber(currentRows.length)+" صف · "+formatNumber(currentHeaders.length)+" عمود · قراءة الملف "+formatNumber(parseDuration)+" مللي ثانية";
          setStatus(fileStatus,"تم تحميل البيانات محليًا. اختر الأعمدة وطريقة التحليل.");
        }catch(error){fail(error);}
      }
      readBatch();
    }catch(error){
      currentRows=[];
      currentHeaders=[];
      currentTypes=[];
      activeFilters=[];
      columnPanel.hidden=true;
      $("filtersPanel").hidden=true;
      runPanel.hidden=true;
      setStatus(fileStatus,error.message||"تعذّرت قراءة الملف.",true);
    }
  }
  function loadWorkbook(file){
    var request=++loadRequest;
    parseRequest++;
    resetResults();
    currentFile=file;
    currentRows=[];
    currentHeaders=[];
    currentTypes=[];
    activeFilters=[];
    $("filterList").replaceChildren();
    currentWorkbook=null;
    workbookOptions.hidden=true;
    columnPanel.hidden=true;
    $("filtersPanel").hidden=true;
    runPanel.hidden=true;
    setStatus(analysisStatus,"");
    if(!file)return;
    fileName.textContent=file.name;
    if(file.size>MAX_FILE_BYTES){
      setStatus(fileStatus,"حجم الملف يتجاوز الحد الأقصى (٢٠ ميجابايت).",true);
      return;
    }
    if(!/\.(xlsx|csv)$/i.test(file.name)){
      setStatus(fileStatus,"اختر ملفًا بصيغة .xlsx أو .csv.",true);
      return;
    }
    if(!window.XLSX){
      setStatus(fileStatus,"تعذّر تحميل قارئ ملفات Excel. تحقق من اتصال الإنترنت ثم أعد تحميل الصفحة.",true);
      return;
    }
    setStatus(fileStatus,"جارٍ فتح الملف على جهازك…");
    var started=performance.now();
    file.arrayBuffer().then(function(buffer){
      if(request!==loadRequest)return;
      currentWorkbook=XLSX.read(buffer,{type:"array",cellNF:true});
      if(!currentWorkbook.SheetNames.length)throw new Error("الملف لا يحتوي على أوراق عمل.");
      workbookReadDuration=performance.now()-started;
      sheetSelect.replaceChildren();
      currentWorkbook.SheetNames.forEach(function(name){
        var option=document.createElement("option");
        option.value=name;
        option.textContent=name;
        sheetSelect.appendChild(option);
      });
      if(/\.csv$/i.test(file.name)){
        sheetSelect.value=currentWorkbook.SheetNames[0];
        $("sheetSelect").parentElement.hidden=true;
      }else{
        $("sheetSelect").parentElement.hidden=false;
      }
      parseSelectedSheet();
    }).catch(function(error){
      if(request!==loadRequest)return;
      currentWorkbook=null;
      setStatus(fileStatus,error.message||"تعذّر فتح الملف. تأكد من سلامته وصيغته.",true);
    });
  }
  function analyzeLocal(indices,rows){
    var started=performance.now(),columns=[];
    indices.forEach(function(index){
      var allValues=rows.map(function(row){return index<row.length?row[index]:null;});
      var values=allValues.filter(function(value){return !isMissing(value);});
      var numeric=values.filter(function(value){return typeof value==="number"&&Number.isFinite(value);});
      var isNumeric=values.length>0&&numeric.length===values.length;
      var isDate=!isNumeric&&values.length>0&&values.every(function(value){return Boolean(parseDateValue(value));});
      var summary={
        index:index,
        name:currentHeaders[index],
        kind:isNumeric?"numeric":isDate?"date":"category",
        nonEmptyCount:values.length,
        missingCount:allValues.length-values.length,
        uniqueCount:new Set(values.map(displayValue)).size
      };
      if(isNumeric){
        var sorted=numeric.slice().sort(function(a,b){return a-b;});
        var middle=Math.floor(sorted.length/2);
        var median=sorted.length%2?sorted[middle]:(sorted[middle-1]+sorted[middle])/2;
        var total=numeric.reduce(function(sum,value){return sum+value;},0);
        var lowerHalf=sorted.slice(0,Math.floor(sorted.length/2));
        var upperHalf=sorted.slice(Math.ceil(sorted.length/2));
        var q1=lowerHalf.length?lowerHalf[Math.floor((lowerHalf.length-1)/2)]:sorted[0];
        var q3=upperHalf.length?upperHalf[Math.floor((upperHalf.length-1)/2)]:sorted[sorted.length-1];
        var iqr=q3-q1;
        summary.sum=Number(total.toFixed(6));
        summary.average=Number((total/numeric.length).toFixed(6));
        summary.median=Number(median.toFixed(6));
        summary.min=sorted[0];
        summary.max=sorted[sorted.length-1];
        summary.outlierCount=sorted.filter(function(value){return value<q1-1.5*iqr||value>q3+1.5*iqr;}).length;
      }else if(isDate){
        var dates=values.map(parseDateValue).sort(function(a,b){return a-b;});
        summary.minDate=dates[0].toISOString().slice(0,10);
        summary.maxDate=dates[dates.length-1].toISOString().slice(0,10);
      }else{
        var counts=new Map();
        values.forEach(function(value){
          var label=displayValue(value);
          counts.set(label,(counts.get(label)||0)+1);
        });
        summary.topValues=Array.from(counts.entries()).map(function(entry){return {label:entry[0],count:entry[1]};})
          .sort(function(a,b){return b.count-a.count;}).slice(0,8);
      }
      columns.push(summary);
    });
    return {
      rowCount:rows.length,
      selectedCount:indices.length,
      columns:columns,
      computeMs:performance.now()-started
    };
  }
  function renderResults(summary){
    latestSummary=summary;
    analysisResults.hidden=false;
    renderKpis(summary);
    var metricSelect=$("chartMetric");
    metricSelect.replaceChildren();
    var countOption=document.createElement("option");
    countOption.value="";
    countOption.textContent="عدد السجلات";
    metricSelect.appendChild(countOption);
    summary.columns.filter(function(column){return column.kind==="numeric";}).forEach(function(column){
      var option=document.createElement("option");
      option.value=String(column.index);
      option.textContent=column.name;
      metricSelect.appendChild(option);
    });
    metricSelect.value=summary.columns.some(function(column){return column.kind==="numeric";})
      ?String(summary.columns.filter(function(column){return column.kind==="numeric";})[0].index):"";
    var dimensionSelect=$("chartDimension");
    dimensionSelect.replaceChildren();
    var noDimension=document.createElement("option");
    noDimension.value="";
    noDimension.textContent="بدون تجميع";
    dimensionSelect.appendChild(noDimension);
    currentHeaders.forEach(function(name,index){
      if(currentTypes[index]!=="category"&&currentTypes[index]!=="date")return;
      var option=document.createElement("option");
      option.value=String(index);
      option.textContent=name+" · "+typeLabel(currentTypes[index]);
      dimensionSelect.appendChild(option);
    });
    $("chartAggregation").value="sum";
    $("chartAggregation").disabled=!metricSelect.value||!dimensionSelect.value;
    $("chartDimension").value="";
    $("chartType").value="auto";
    renderSummaryTable(summary.columns);
    dashboardConfigs=summary.columns.map(function(column){return makeDashboardConfig(column,summary.columns);});
    loadDashboardLayout(summary.columns);
    renderDashboardFilters();
    renderColumnDashboard(summary.columns);
    renderChart(summary.columns);
  }
  function renderKpis(summary){
    var missing=summary.columns.reduce(function(total,column){return total+column.missingCount;},0);
    var numericCount=summary.columns.filter(function(column){return column.kind==="numeric";}).length;
    var dateCount=summary.columns.filter(function(column){return column.kind==="date";}).length;
    var categoryCount=summary.columns.filter(function(column){return column.kind==="category";}).length;
    var kpis=[
      ["الصفوف بعد الفلترة",formatNumber(summary.rowCount)],
      ["الأعمدة المحددة",formatNumber(summary.selectedCount)],
      ["القيم الفارغة",formatNumber(missing)],
      ["مقاييس رقمية",formatNumber(numericCount)],
      ["أعمدة تاريخية",formatNumber(dateCount)],
      ["أعمدة تصنيفية",formatNumber(categoryCount)]
    ];
    var kpiContainer=$("analysisKpis");
    kpiContainer.replaceChildren();
    kpis.forEach(function(item){
      var card=document.createElement("article");
      card.className="analysis-kpi";
      var label=document.createElement("span");
      label.textContent=item[0];
      var value=document.createElement("strong");
      value.textContent=item[1];
      card.append(label,value);
      kpiContainer.appendChild(card);
    });
  }
  function renderSummaryTable(columns){
    var body=$("summaryTable");
    body.replaceChildren();
    columns.forEach(function(column){
      var row=document.createElement("tr");
      var values=[
        column.name,
        typeLabel(column.kind),
        formatNumber(column.nonEmptyCount),
        formatNumber(column.missingCount),
        formatNumber(column.uniqueCount),
        column.kind==="numeric"
          ?"المجموع "+formatNumber(column.sum)+" · المتوسط "+formatNumber(column.average)+" · الوسيط "+formatNumber(column.median)+" · النطاق "+formatNumber(column.min)+"–"+formatNumber(column.max)+" · قيم شاذة "+formatNumber(column.outlierCount||0)
          :column.kind==="date"
            ?"من "+column.minDate+" إلى "+column.maxDate
            :(column.topValues||[]).slice(0,3).map(function(item){return item.label+" ("+formatNumber(item.count)+")";}).join("، ")||"لا توجد قيم"
      ];
      values.forEach(function(value,index){
        var cell=document.createElement(index===0?"th":"td");
        if(index===0)cell.scope="row";
        cell.textContent=value;
        row.appendChild(cell);
      });
      body.appendChild(row);
    });
  }
  function aggregateRows(rows,dimensionIndex,metricIndex,aggregation){
    var groups=new Map();
    rows.forEach(function(row){
      var raw=dimensionIndex===null?null:row[dimensionIndex];
      if(dimensionIndex!==null&&isMissing(raw))return;
      var key=dimensionIndex===null?"كل البيانات":displayValue(raw);
      if(dimensionIndex!==null&&currentTypes[dimensionIndex]==="date"){
        var date=parseDateValue(raw);
        if(!date)return;
        key=date.toISOString().slice(0,10);
      }
      var group=groups.get(key)||{sum:0,count:0,rows:0};
      group.rows++;
      if(metricIndex!==null&&!isMissing(row[metricIndex])){
        var value=Number(row[metricIndex]);
        if(Number.isFinite(value)){group.sum+=value;group.count++;}
      }
      groups.set(key,group);
    });
    var entries=Array.from(groups.entries()).map(function(entry){
      var group=entry[1],value;
      if(aggregation==="count"||metricIndex===null)value=group.rows;
      else if(aggregation==="average")value=group.count?group.sum/group.count:0;
      else value=group.sum;
      return {label:entry[0],value:value,rows:group.rows,sum:group.sum,count:group.count};
    });
    if(dimensionIndex!==null&&currentTypes[dimensionIndex]==="date"){
      entries.sort(function(a,b){return a.label.localeCompare(b.label);});
      if(entries.length>40){
        var monthly=new Map();
        entries.forEach(function(entry){
          var month=entry.label.slice(0,7),group=monthly.get(month)||{label:month,value:0,rows:0,sum:0,count:0};
          group.sum+=entry.sum;
          group.count+=entry.count;
          group.rows+=entry.rows;
          group.value=aggregation==="count"||metricIndex===null?group.rows:aggregation==="average"?(group.count?group.sum/group.count:0):group.sum;
          monthly.set(month,group);
        });
        entries=Array.from(monthly.values()).sort(function(a,b){return a.label.localeCompare(b.label);});
      }
      if(entries.length>36)entries=entries.slice(-36);
    }else{
      entries.sort(function(a,b){return b.value-a.value;});
      entries=entries.slice(0,12);
    }
    return entries;
  }
  function chartModel(columns){
    var metricValue=$("chartMetric").value;
    var dimensionValue=$("chartDimension").value;
    var metricIndex=metricValue===""?null:Number(metricValue);
    var dimensionIndex=dimensionValue===""?null:Number(dimensionValue);
    var aggregation=$("chartAggregation").value;
    if(metricIndex!==null&&dimensionIndex===null){
      var column=columns.find(function(item){return item.index===metricIndex;});
      if(!column)return null;
      if(column.kind==="date"){
        return {labels:["أقدم تاريخ","أحدث تاريخ"],data:[column.minDate,column.maxDate],title:column.name,type:"date"};
      }
      if(column.kind==="numeric"){
        return {labels:["أدنى قيمة","المتوسط","الوسيط","أعلى قيمة"],data:[column.min,column.average,column.median,column.max],title:column.name,type:"numeric"};
      }
    }
    var entries=aggregateRows(resultRows,dimensionIndex,metricIndex,aggregation);
    if(!entries.length)return null;
    var dimensionName=dimensionIndex===null?"كل البيانات":currentHeaders[dimensionIndex];
    var metricName=metricIndex===null?"عدد السجلات":currentHeaders[metricIndex];
    return {labels:entries.map(function(item){return item.label;}),data:entries.map(function(item){return item.value;}),title:metricName+" حسب "+dimensionName,type:"grouped",dimensionIndex:dimensionIndex,metricIndex:metricIndex};
  }
  function columnChartData(column,rows){
    var values=rows.map(function(row){return row[column.index];}).filter(function(value){return !isMissing(value);});
    if(column.kind==="numeric"){
      var numbers=values.filter(function(value){return typeof value==="number"&&Number.isFinite(value);});
      if(!numbers.length)return null;
      var minimum=numbers.reduce(function(value,current){return Math.min(value,current);},Infinity);
      var maximum=numbers.reduce(function(value,current){return Math.max(value,current);},-Infinity);
      if(minimum===maximum)return {type:"bar",labels:[formatNumber(minimum)],values:[numbers.length],filters:[{index:column.index,kind:"numeric",min:minimum,max:maximum,includeMax:true}],caption:formatNumber(numbers.length)+" قيم متساوية عند "+formatNumber(minimum)};
      var bucketCount=Math.min(10,Math.max(4,Math.ceil(Math.sqrt(numbers.length))));
      var size=(maximum-minimum)/bucketCount,buckets=Array.from({length:bucketCount},function(){return 0;});
      numbers.forEach(function(value){buckets[Math.min(bucketCount-1,Math.floor((value-minimum)/size))]++;});
      return {
        type:"bar",
        labels:buckets.map(function(value,index){return formatNumber(minimum+index*size)+" – "+formatNumber(index===bucketCount-1?maximum:minimum+(index+1)*size);}),
        values:buckets,
        filters:buckets.map(function(value,index){return {
          index:column.index,kind:"numeric",min:minimum+index*size,
          max:index===bucketCount-1?maximum:minimum+(index+1)*size,
          includeMax:index===bucketCount-1
        };}),
        caption:formatNumber(numbers.length)+" قيمة · المتوسط "+formatNumber(column.average)+" · قيم شاذة "+formatNumber(column.outlierCount||0)
      };
    }
    if(column.kind==="date"){
      var counts=new Map();
      values.forEach(function(value){
        var date=parseDateValue(value);
        if(!date)return;
        var key=date.toISOString().slice(0,10);
        counts.set(key,(counts.get(key)||0)+1);
      });
      var entries=Array.from(counts.entries()).sort(function(a,b){return a[0].localeCompare(b[0]);});
      if(!entries.length)return null;
      if(entries.length>45){
        var months=new Map();
        entries.forEach(function(entry){
          var month=entry[0].slice(0,7);
          months.set(month,(months.get(month)||0)+entry[1]);
        });
        entries=Array.from(months.entries()).sort(function(a,b){return a[0].localeCompare(b[0]);});
      }
      return {
        type:"line",
        labels:entries.map(function(entry){return entry[0];}),
        values:entries.map(function(entry){return entry[1];}),
        filters:entries.map(function(entry){return {index:column.index,kind:"date",period:entry[0]};}),
        caption:formatNumber(values.length)+" سجل · "+column.minDate+" إلى "+column.maxDate
      };
    }
    var categories=new Map();
    values.forEach(function(value){
      var label=displayValue(value);
      categories.set(label,(categories.get(label)||0)+1);
    });
    var ranked=Array.from(categories.entries()).sort(function(a,b){return b[1]-a[1];});
    if(!ranked.length)return null;
    var top=ranked.slice(0,10),others=ranked.slice(10).reduce(function(total,entry){return total+entry[1];},0);
    if(others)top.push(["بقية القيم ("+formatNumber(ranked.length-10)+")",others]);
    return {
      type:"bar",
      labels:top.map(function(entry){return entry[0];}),
      values:top.map(function(entry){return entry[1];}),
      filters:top.map(function(entry){
        return entry[0].indexOf("بقية القيم (")===0
          ?{index:column.index,kind:"category-exclude",values:ranked.slice(0,10).map(function(item){return item[0];})}
          :{index:column.index,kind:"category",value:entry[0]};
      }),
      caption:formatNumber(values.length)+" سجل · "+formatNumber(ranked.length)+" قيمة مختلفة"
    };
  }
  function makeDashboardConfig(column,columns){
    var dimension=column.kind==="category"||column.kind==="date"
      ?column.index
      :(columns.find(function(item){return item.kind==="category"||item.kind==="date";})||{}).index;
    var metric=column.kind==="numeric"
      ?column.index
      :(columns.find(function(item){return item.kind==="numeric";})||{}).index;
    return {
      id:nextDashboardChartId++,
      sourceIndex:column.index,
      title:column.name,
      dimensionIndex:Number.isInteger(dimension)?dimension:null,
      metricIndex:Number.isInteger(metric)?metric:null,
      aggregation:Number.isInteger(metric)?"sum":"count",
      chartType:"auto",
      size:"medium",
      controlsOpen:false,
      customized:false
    };
  }
  function makeCustomDashboardConfig(columns){
    var dimension=(columns.find(function(item){return item.kind==="category"||item.kind==="date";})||{}).index;
    var metric=(columns.find(function(item){return item.kind==="numeric";})||{}).index;
    return {
      id:nextDashboardChartId++,
      sourceIndex:null,
      title:"رسم مخصص",
      dimensionIndex:Number.isInteger(dimension)?dimension:null,
      metricIndex:Number.isInteger(metric)?metric:null,
      aggregation:Number.isInteger(metric)?"sum":"count",
      chartType:"auto",
      size:"medium",
      controlsOpen:false,
      customized:true
    };
  }
  function dashboardDatasetKey(){
    var source=JSON.stringify([currentFile&&currentFile.name,sheetSelect.value,currentHeaders,currentTypes,currentRows.length]);
    var first=2166136261,second=2246822519;
    for(var index=0;index<source.length;index++){
      var code=source.charCodeAt(index);
      first=Math.imul(first^code,16777619);
      second=Math.imul(second^code,3266489917);
    }
    return "yazeed-dashboard-v1-"+(first>>>0).toString(36)+"-"+(second>>>0).toString(36);
  }
  function validDashboardIndex(value,allowedTypes){
    return Number.isInteger(value)&&value>=0&&value<currentHeaders.length&&allowedTypes.indexOf(currentTypes[value])!==-1;
  }
  function loadDashboardLayout(columns){
    dashboardStorageKey=dashboardDatasetKey();
    try{
      var raw=localStorage.getItem(dashboardStorageKey);
      if(!raw)return;
      var saved=JSON.parse(raw);
      if(!saved||saved.version!==1||!Array.isArray(saved.charts))throw new Error("صيغة تصميم اللوحة المحفوظ غير صالحة.");
      var skipped=0;
      dashboardConfigs=saved.charts.reduce(function(configs,item){
        if(!item||typeof item!=="object"){skipped++;return configs;}
        var sourceIndex=item.sourceIndex===null?null:Number(item.sourceIndex);
        if(sourceIndex!==null&&!columns.some(function(column){return column.index===sourceIndex;})){skipped++;return configs;}
        var dimensionIndex=item.dimensionIndex===null?null:Number(item.dimensionIndex);
        if(dimensionIndex!==null&&!validDashboardIndex(dimensionIndex,["category","date"])){skipped++;return configs;}
        var metricIndex=item.metricIndex===null?null:Number(item.metricIndex);
        if(metricIndex!==null&&!validDashboardIndex(metricIndex,["numeric"])){skipped++;return configs;}
        var aggregation=["sum","average","count"].indexOf(item.aggregation)!==-1?item.aggregation:"count";
        var chartType=["auto","bar","line","doughnut"].indexOf(item.chartType)!==-1?item.chartType:"auto";
        var size=["small","medium","wide","large"].indexOf(item.size)!==-1?item.size:"medium";
        var sourceColumn=sourceIndex===null?null:columns.find(function(column){return column.index===sourceIndex;});
        configs.push({
          id:nextDashboardChartId++,
          sourceIndex:sourceIndex,
          title:sourceColumn?sourceColumn.name:typeof item.title==="string"?item.title:"رسم مخصص",
          dimensionIndex:dimensionIndex,
          metricIndex:metricIndex,
          aggregation:aggregation,
          chartType:chartType,
          size:size,
          controlsOpen:false,
          customized:Boolean(item.customized)||sourceIndex===null
        });
        return configs;
      },[]);
      $("dashboardStatus").textContent=skipped
        ?"تم استعادة التصميم مع تجاوز "+formatNumber(skipped)+" رسم غير متوافق مع الأعمدة المحددة."
        :"تم استعادة تصميم اللوحة من هذا المتصفح.";
    }catch(error){
      $("dashboardStatus").textContent="تعذّر استعادة تصميم اللوحة: "+error.message;
      $("dashboardStatus").classList.add("is-error");
    }
  }
  function saveDashboardLayout(){
    try{
      localStorage.setItem(dashboardStorageKey,JSON.stringify({
        version:1,
        charts:dashboardConfigs.map(function(config){
          return {
            sourceIndex:config.sourceIndex,
            title:config.title,
            dimensionIndex:config.dimensionIndex,
            metricIndex:config.metricIndex,
            aggregation:config.aggregation,
            chartType:config.chartType,
            size:config.size,
            customized:config.customized
          };
        })
      }));
      $("dashboardStatus").classList.remove("is-error");
      $("dashboardStatus").textContent="تم حفظ تصميم اللوحة محليًا في هذا المتصفح.";
    }catch(error){
      $("dashboardStatus").classList.add("is-error");
      $("dashboardStatus").textContent="تعذّر حفظ تصميم اللوحة: "+error.message;
    }
  }
  function dashboardSelectionMatches(row,selection){
    var value=row[selection.index];
    if(isMissing(value))return false;
    if(selection.kind==="category")return displayValue(value)===selection.value;
    if(selection.kind==="category-exclude")return selection.values.indexOf(displayValue(value))===-1;
    if(selection.kind==="numeric"){
      var number=Number(value);
      return Number.isFinite(number)&&number>=selection.min&&(selection.includeMax?number<=selection.max:number<selection.max);
    }
    if(selection.kind==="date"){
      var date=parseDateValue(value);
      return Boolean(date)&&date.toISOString().slice(0,selection.period.length)===selection.period;
    }
    return true;
  }
  function renderDashboardFilters(){
    var bar=$("dashboardFilterBar"),chips=$("dashboardFilterChips");
    chips.replaceChildren();
    dashboardSelections.forEach(function(selection){
      var chip=document.createElement("span");
      chip.className="analysis-dashboard-filter-chip";
      var label=selection.kind==="category-exclude"
        ?"بقية القيم (باستثناء "+selection.values.slice(0,3).join("، ")+(selection.values.length>3?"…":"")+")"
        :selection.value||selection.period||(selection.kind==="numeric"?formatNumber(selection.min)+" – "+formatNumber(selection.max):"");
      chip.textContent=currentHeaders[selection.index]+": "+label;
      chips.appendChild(chip);
    });
    bar.hidden=!dashboardSelections.length;
  }
  function setDashboardSelection(selection){
    if(!selection)return;
    var existingIndex=dashboardSelections.findIndex(function(item){return item.index===selection.index;});
    if(existingIndex!==-1&&JSON.stringify(dashboardSelections[existingIndex])===JSON.stringify(selection)){
      dashboardSelections.splice(existingIndex,1);
    }else if(existingIndex!==-1){
      dashboardSelections[existingIndex]=selection;
    }else{
      dashboardSelections.push(selection);
    }
    resultRows=baseResultRows.filter(function(row){
      return dashboardSelections.every(function(active){return dashboardSelectionMatches(row,active);});
    });
    latestSummary=analyzeLocal(latestSummary.columns.map(function(column){return column.index;}),resultRows);
    renderKpis(latestSummary);
    renderSummaryTable(latestSummary.columns);
    renderDashboardFilters();
    renderColumnDashboard(latestSummary.columns,false,Math.max(1,columnChartPage||1));
    renderChart(latestSummary.columns);
    $("dashboardStatus").classList.remove("is-error");
    $("dashboardStatus").textContent=dashboardSelections.length
      ?"تُطبّق التحديدات على جميع الرسوم والملخصات. انقر على الجزء المحدد مرة أخرى أو ألغِ الفلاتر للرجوع."
      :"تم إلغاء فلاتر الرسوم.";
  }
  function customDashboardData(config,rows){
    var entries=aggregateRows(rows,config.dimensionIndex,config.metricIndex,config.aggregation);
    if(!entries.length)return null;
    var dimensionName=config.dimensionIndex===null?"كل البيانات":currentHeaders[config.dimensionIndex];
    var metricName=config.metricIndex===null?"عدد السجلات":currentHeaders[config.metricIndex];
    var title=metricName+" حسب "+dimensionName;
    var dimensionType=config.dimensionIndex===null?null:currentTypes[config.dimensionIndex];
    var type=config.chartType==="auto"
      ?dimensionType==="date"?"line":config.metricIndex===null?"doughnut":"bar"
      :config.chartType;
    if(type==="doughnut"&&entries.length>12)entries=entries.slice(0,12);
    return {
      type:type,
      indexAxis:type==="bar"&&dimensionType==="category"?"y":"x",
      labels:entries.map(function(item){return item.label;}),
      values:entries.map(function(item){return item.value;}),
      filters:entries.map(function(item){
        if(config.dimensionIndex===null)return null;
        return dimensionType==="date"
          ?{index:config.dimensionIndex,kind:"date",period:item.label}
          :{index:config.dimensionIndex,kind:"category",value:item.label};
      }),
      caption:formatNumber(rows.length)+" سجل · "+title,
      title:title
    };
  }
  function addDashboardSelect(host,label,options,value,onChange){
    var wrapper=document.createElement("label");
    wrapper.className="analysis-field";
    var title=document.createElement("span");
    title.textContent=label;
    var select=document.createElement("select");
    options.forEach(function(optionData){
      var option=document.createElement("option");
      option.value=optionData.value;
      option.textContent=optionData.label;
      select.appendChild(option);
    });
    select.value=value;
    select.addEventListener("change",onChange);
    wrapper.append(title,select);
    host.appendChild(wrapper);
    return select;
  }
  function dashboardPages(){
    return Math.max(1,Math.ceil(dashboardConfigs.length/COLUMN_CHART_PAGE_SIZE));
  }
  function refreshDashboard(){
    if(!latestSummary)return;
    renderColumnDashboard(latestSummary.columns,false,Math.max(1,columnChartPage||1));
  }
  function moveDashboardChart(sourceId,targetId,placeAfter){
    var sourceIndex=dashboardConfigs.findIndex(function(config){return config.id===sourceId;});
    var targetIndex=dashboardConfigs.findIndex(function(config){return config.id===targetId;});
    if(sourceIndex<0||targetIndex<0||sourceIndex===targetIndex)return;
    var item=dashboardConfigs.splice(sourceIndex,1)[0];
    targetIndex=dashboardConfigs.findIndex(function(config){return config.id===targetId;});
    dashboardConfigs.splice(targetIndex+(placeAfter?1:0),0,item);
    refreshDashboard();
  }
  function createColumnChart(config,columns,columnIndex){
    var sourceColumn=columns.find(function(column){return column.index===config.sourceIndex;});
    var data=config.customized?customDashboardData(config,resultRows):sourceColumn?columnChartData(sourceColumn,resultRows):customDashboardData(config,resultRows);
    var card=document.createElement("article");
    card.className="analysis-column-chart-card analysis-chart-size-"+config.size;
    card.dataset.chartId=String(config.id);
    var heading=document.createElement("div");
    heading.className="analysis-column-chart-heading";
    var titleWrap=document.createElement("div");
    titleWrap.className="analysis-column-chart-title-wrap";
    var title=document.createElement("h4");
    title.textContent=config.customized&&data?data.title:config.title;
    var kind=document.createElement("span");
    kind.textContent=config.customized?"مخصص":sourceColumn?typeLabel(sourceColumn.kind):"مخصص";
    titleWrap.append(title,kind);
    var actions=document.createElement("div");
    actions.className="analysis-column-chart-actions";
    var dragHandle=document.createElement("button");
    dragHandle.type="button";
    dragHandle.className="analysis-drag-handle";
    dragHandle.textContent="⠿";
    dragHandle.draggable=true;
    dragHandle.setAttribute("aria-label","اسحب لترتيب الرسم "+config.title);
    dragHandle.title="اسحب لترتيب الرسم";
    dragHandle.addEventListener("dragstart",function(event){
      draggedChartId=config.id;
      event.dataTransfer.effectAllowed="move";
      event.dataTransfer.setData("text/plain",String(config.id));
    });
    dragHandle.addEventListener("dragend",function(){draggedChartId=null;});
    var upButton=document.createElement("button");
    upButton.type="button";
    upButton.textContent="أعلى";
    upButton.setAttribute("aria-label","تحريك الرسم لأعلى");
    upButton.disabled=columnIndex===0;
    upButton.addEventListener("click",function(){
      if(columnIndex>0)moveDashboardChart(config.id,dashboardConfigs[columnIndex-1].id);
    });
    var downButton=document.createElement("button");
    downButton.type="button";
    downButton.textContent="أسفل";
    downButton.setAttribute("aria-label","تحريك الرسم لأسفل");
    downButton.disabled=columnIndex===dashboardConfigs.length-1;
    downButton.addEventListener("click",function(){
      if(columnIndex<dashboardConfigs.length-1)moveDashboardChart(config.id,dashboardConfigs[columnIndex+1].id,true);
    });
    var removeButton=document.createElement("button");
    removeButton.type="button";
    removeButton.textContent="حذف";
    removeButton.setAttribute("aria-label","حذف الرسم "+config.title);
    removeButton.addEventListener("click",function(){
      dashboardConfigs=dashboardConfigs.filter(function(item){return item.id!==config.id;});
      refreshDashboard();
    });
    actions.append(dragHandle,upButton,downButton,removeButton);
    heading.append(titleWrap,actions);
    var caption=document.createElement("p");
    caption.className="analysis-column-chart-caption";
    var canvas=document.createElement("canvas");
    canvas.setAttribute("role","img");
    canvas.setAttribute("aria-label","رسم بياني "+(config.customized&&data?data.title:config.title));
    card.append(heading,caption);
    var customize=document.createElement("details");
    customize.className="analysis-column-chart-customize";
    var customizeSummary=document.createElement("summary");
    customizeSummary.textContent="تخصيص البيانات والرسم";
    var controls=document.createElement("div");
    controls.className="analysis-column-chart-controls";
    function updateCustomChart(){
      config.customized=true;
      if(config.sourceIndex===null)config.title="رسم مخصص";
      refreshDashboard();
    }
    function renderDashboardControls(){
      controls.replaceChildren();
      var dimensionOptions=[{value:"",label:"بدون تجميع"}];
      currentHeaders.forEach(function(name,index){
        if(currentTypes[index]!=="category"&&currentTypes[index]!=="date")return;
        dimensionOptions.push({value:String(index),label:name+" · "+typeLabel(currentTypes[index])});
      });
      var metricOptions=[{value:"",label:"عدد السجلات"}];
      currentHeaders.forEach(function(name,index){
        if(currentTypes[index]!=="numeric")return;
        metricOptions.push({value:String(index),label:name});
      });
      addDashboardSelect(controls,"التصنيف أو التاريخ",dimensionOptions,config.dimensionIndex===null?"":String(config.dimensionIndex),function(event){
        config.dimensionIndex=event.currentTarget.value===""?null:Number(event.currentTarget.value);
        updateCustomChart();
      });
      addDashboardSelect(controls,"القيمة الرقمية",metricOptions,config.metricIndex===null?"":String(config.metricIndex),function(event){
        config.metricIndex=event.currentTarget.value===""?null:Number(event.currentTarget.value);
        if(config.metricIndex===null)config.aggregation="count";
        updateCustomChart();
      });
      addDashboardSelect(controls,"طريقة الحساب",[
        {value:"sum",label:"المجموع"},
        {value:"average",label:"المتوسط"},
        {value:"count",label:"عدد السجلات"}
      ],config.aggregation,function(event){
        config.aggregation=event.currentTarget.value;
        updateCustomChart();
      });
      addDashboardSelect(controls,"نوع الرسم",[
        {value:"auto",label:"تلقائي"},
        {value:"bar",label:"أعمدة"},
        {value:"line",label:"خطي"},
        {value:"doughnut",label:"دائري"}
      ],config.chartType,function(event){
        config.chartType=event.currentTarget.value;
        updateCustomChart();
      });
      addDashboardSelect(controls,"حجم البطاقة",[
        {value:"small",label:"صغير"},
        {value:"medium",label:"متوسط"},
        {value:"wide",label:"عريض"},
        {value:"large",label:"كبير"}
      ],config.size,function(event){
        config.size=event.currentTarget.value;
        card.classList.remove("analysis-chart-size-small","analysis-chart-size-medium","analysis-chart-size-wide","analysis-chart-size-large");
        card.classList.add("analysis-chart-size-"+config.size);
      });
      if(config.sourceIndex!==null&&config.customized){
        var resetButton=document.createElement("button");
        resetButton.type="button";
        resetButton.className="analysis-chart-reset";
        resetButton.textContent="استعادة الرسم التلقائي";
        resetButton.addEventListener("click",function(){
          var defaults=makeDashboardConfig(sourceColumn,columns);
          config.title=defaults.title;
          config.dimensionIndex=defaults.dimensionIndex;
          config.metricIndex=defaults.metricIndex;
          config.aggregation=defaults.aggregation;
          config.chartType="auto";
          config.customized=false;
          refreshDashboard();
        });
        controls.appendChild(resetButton);
      }
    }
    customize.addEventListener("toggle",function(){
      config.controlsOpen=customize.open;
      if(config.controlsOpen)renderDashboardControls();
    });
    if(config.controlsOpen){
      customize.open=true;
      renderDashboardControls();
    }
    customize.append(customizeSummary,controls);
    card.appendChild(customize);
    card.addEventListener("dragover",function(event){
      if(draggedChartId!==null&&draggedChartId!==config.id)event.preventDefault();
    });
    card.addEventListener("drop",function(event){
      event.preventDefault();
      var sourceId=Number(event.dataTransfer.getData("text/plain"))||draggedChartId;
      if(sourceId!==null)moveDashboardChart(sourceId,config.id);
      draggedChartId=null;
    });
    if(!data||!window.Chart){
      caption.textContent=!window.Chart?"تعذّر تحميل مكتبة الرسوم البيانية.":"لا توجد بيانات صالحة للرسم.";
      card.classList.add("analysis-column-chart-empty");
      return {element:card,destroy:function(){}};
    }
    caption.textContent=data.caption;
    var wrap=document.createElement("div");
    wrap.className="analysis-column-chart-wrap";
    wrap.appendChild(canvas);
    card.appendChild(wrap);
    var dark=(document.documentElement.getAttribute("data-theme")||"")?document.documentElement.getAttribute("data-theme")==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;
    var instance=new Chart(canvas.getContext("2d"),{
      type:data.type,
      data:{labels:data.labels,datasets:[{
        label:data.title,
        data:data.values,
        backgroundColor:data.type==="line"?"rgba(95,140,153,.18)":data.type==="doughnut"?["#d69c48","#6e8f73","#5f8c99","#a96f68","#9174a8","#c47e56","#71918d","#b18b67","#a6a354","#667e9f","#d38e82","#81a690"]:"#6e8f73",
        borderColor:data.type==="line"?"#5f8c99":"#6e8f73",
        borderWidth:2,
        borderRadius:data.type==="bar"?5:0,
        fill:data.type==="line",
        tension:.25,
        pointRadius:data.type==="line"?2:0
      }]},
      options:{
        responsive:true,
        maintainAspectRatio:false,
        indexAxis:data.indexAxis||(sourceColumn&&sourceColumn.kind==="category"?"y":"x"),
        onClick:function(event,elements){
          if(!elements.length)return;
          var selection=data.filters&&data.filters[elements[0].index];
          if(selection)setDashboardSelection(selection);
        },
        plugins:{
          legend:{display:data.type==="doughnut",position:"bottom",labels:{color:dark?"#e8e4d8":"#5f625b",font:{family:"Readex Pro"}}},
          tooltip:{callbacks:{label:function(context){return " "+formatNumber(context.raw);}}}
        },
        scales:data.type==="bar"||data.type==="line"?{
          x:{beginAtZero:true,ticks:{color:dark?"#c5c2b9":"#777",maxRotation:35,minRotation:0,autoSkip:true,maxTicksLimit:8,font:{family:"Readex Pro"}},grid:{color:dark?"#3b4039":"#e7e2d8"}},
          y:{beginAtZero:true,ticks:{color:dark?"#c5c2b9":"#777",autoSkip:true,maxTicksLimit:8,font:{family:"Readex Pro"}},grid:{display:data.indexAxis==="y"||(sourceColumn&&sourceColumn.kind==="category"),color:dark?"#3b4039":"#e7e2d8"}}
        }:{}
      }
    });
    return {element:card,destroy:function(){instance.destroy();}};
  }
  function renderColumnDashboard(columns,append,visiblePages){
    var host=$("columnCharts"),start=append?columnChartPage*COLUMN_CHART_PAGE_SIZE:0;
    if(!append){
      columnCharts.forEach(function(item){item.destroy();});
      columnCharts=[];
      host.replaceChildren();
      start=0;
    }
    $("addDashboardChart").disabled=!columns.length;
    $("saveDashboard").disabled=!latestSummary;
    $("exportDashboardImage").disabled=!dashboardConfigs.length||!window.Chart;
    $("printDashboard").disabled=!latestSummary;
    if(!window.Chart){
      $("columnChartsEmpty").textContent="تعذّر تحميل مكتبة الرسوم البيانية؛ تحقق من اتصال الإنترنت.";
      $("columnChartsEmpty").hidden=false;
      $("columnChartCount").textContent="";
      $("showMoreCharts").hidden=true;
      return;
    }
    var pages=append?columnChartPage+1:Math.min(dashboardPages(),visiblePages||1);
    var end=Math.min(dashboardConfigs.length,append?start+COLUMN_CHART_PAGE_SIZE:pages*COLUMN_CHART_PAGE_SIZE);
    for(var index=start;index<end;index++){
      var item=createColumnChart(dashboardConfigs[index],columns,index);
      columnCharts.push(item);
      host.appendChild(item.element);
    }
    columnChartPage=Math.ceil(end/COLUMN_CHART_PAGE_SIZE);
    $("columnChartCount").textContent="عرض "+formatNumber(end)+" من "+formatNumber(dashboardConfigs.length)+" رسم";
    $("showMoreCharts").hidden=end>=dashboardConfigs.length;
    $("showMoreCharts").textContent="عرض الرسوم التالية ("+formatNumber(Math.min(COLUMN_CHART_PAGE_SIZE,dashboardConfigs.length-end))+")";
    $("columnChartsEmpty").hidden=Boolean(dashboardConfigs.length);
    if(!dashboardConfigs.length){
      $("columnChartsEmpty").textContent="لا توجد رسوم في اللوحة. استخدم «إضافة رسم جديد» لإنشاء رسم.";
    }
  }
  function setDashboardStatus(message,isError){
    var status=$("dashboardStatus");
    status.textContent=message;
    status.classList.toggle("is-error",Boolean(isError));
  }
  function exportDashboardImage(){
    var cards=Array.prototype.slice.call($("columnCharts").querySelectorAll(".analysis-column-chart-card"));
    if(!cards.length){
      setDashboardStatus("أضف رسمًا واحدًا على الأقل قبل تنزيل الصورة.",true);
      return;
    }
    if(cards.length>48){
      setDashboardStatus("تنزيل الصورة يدعم حتى ٤٨ رسمًا محمّلًا في المرة الواحدة. استخدم طباعة / PDF لتصدير مجموعة أكبر.",true);
      return;
    }
    try{
      var width=1800,margin=50,gap=36,cardWidth=(width-margin*2-gap)/2;
      var kpis=Array.prototype.slice.call($("analysisKpis").querySelectorAll(".analysis-kpi"));
      var kpiGap=12,kpiWidth=(width-margin*2-kpiGap*(kpis.length-1))/Math.max(kpis.length,1);
      var layout=[],x=margin,y=270,rowHeight=0,column=0;
      cards.forEach(function(card){
        var size=card.classList.contains("analysis-chart-size-large")?"large"
          :card.classList.contains("analysis-chart-size-wide")?"wide"
            :card.classList.contains("analysis-chart-size-small")?"small":"medium";
        var height=size==="large"?560:size==="wide"?470:size==="small"?330:400;
        if(size==="wide"||size==="large"){
          if(column){y+=rowHeight+gap;x=margin;column=0;rowHeight=0;}
          layout.push({card:card,x:margin,y:y,width:width-margin*2,height:height});
          y+=height+gap;
        }else{
          if(column>=2){y+=rowHeight+gap;x=margin;column=0;rowHeight=0;}
          layout.push({card:card,x:x,y:y,width:cardWidth,height:height});
          x+=cardWidth+gap;
          column++;
          rowHeight=Math.max(rowHeight,height);
          if(column===2){y+=rowHeight+gap;x=margin;column=0;rowHeight=0;}
        }
      });
      if(column)y+=rowHeight;
      else if(layout.length)y-=gap;
      var height=Math.max(360,y+margin);
      var output=document.createElement("canvas");
      output.width=width;
      output.height=height;
      var context=output.getContext("2d");
      if(!context)throw new Error("تعذّر إنشاء مساحة الصورة.");
      var pageStyle=getComputedStyle(document.documentElement);
      context.fillStyle=pageStyle.getPropertyValue("--bg").trim()||"#fff";
      context.fillRect(0,0,width,height);
      context.direction="rtl";
      context.textAlign="right";
      context.fillStyle=pageStyle.getPropertyValue("--ink").trim()||"#222";
      context.font="bold 34px Readex Pro, Arial, sans-serif";
      context.fillText("لوحة تحليل البيانات",width-margin,66);
      context.font="18px Readex Pro, Arial, sans-serif";
      context.fillStyle=pageStyle.getPropertyValue("--muted").trim()||"#666";
      var filterSummary=dashboardSelections.map(function(selection){
        var value=selection.kind==="category-exclude"
          ?"بقية القيم"
          :selection.value||selection.period||(selection.kind==="numeric"?formatNumber(selection.min)+"–"+formatNumber(selection.max):"");
        return currentHeaders[selection.index]+": "+value;
      }).join(" · ");
      var subtitle="الصفوف بعد الفلترة: "+($("analysisKpis").querySelector(".analysis-kpi strong")||{}).textContent;
      if(filterSummary)subtitle+=" · الفلاتر: "+filterSummary;
      context.fillText(subtitle,width-margin,100,width-margin*2);
      var kpiY=125,kpiHeight=104;
      kpis.forEach(function(kpi,index){
        var kpiX=margin+index*(kpiWidth+kpiGap);
        context.fillStyle=getComputedStyle(kpi).backgroundColor||"#fff";
        context.fillRect(kpiX,kpiY,kpiWidth,kpiHeight);
        context.strokeStyle=pageStyle.getPropertyValue("--line").trim()||"#ddd";
        context.strokeRect(kpiX,kpiY,kpiWidth,kpiHeight);
        context.fillStyle=pageStyle.getPropertyValue("--muted").trim()||"#666";
        context.font="15px Readex Pro, Arial, sans-serif";
        context.fillText(kpi.querySelector("span").textContent,kpiX+kpiWidth-14,kpiY+35,kpiWidth-28);
        context.fillStyle=pageStyle.getPropertyValue("--ink").trim()||"#222";
        context.font="bold 24px Readex Pro, Arial, sans-serif";
        context.fillText(kpi.querySelector("strong").textContent,kpiX+kpiWidth-14,kpiY+77,kpiWidth-28);
      });
      layout.forEach(function(item){
        var style=getComputedStyle(item.card);
        context.fillStyle=style.backgroundColor||"#fff";
        context.fillRect(item.x,item.y,item.width,item.height);
        context.strokeStyle=pageStyle.getPropertyValue("--line").trim()||"#ddd";
        context.strokeRect(item.x,item.y,item.width,item.height);
        context.fillStyle=pageStyle.getPropertyValue("--ink").trim()||"#222";
        context.font="bold 20px Readex Pro, Arial, sans-serif";
        context.fillText(item.card.querySelector("h4").textContent,item.x+item.width-18,item.y+34,item.width-36);
        context.fillStyle=pageStyle.getPropertyValue("--muted").trim()||"#666";
        context.font="13px Readex Pro, Arial, sans-serif";
        context.fillText(item.card.querySelector(".analysis-column-chart-caption").textContent,item.x+item.width-18,item.y+58,item.width-36);
        var chartCanvas=item.card.querySelector("canvas");
        if(chartCanvas){
          var chartTop=item.y+72,chartHeight=item.height-88,chartWidth=item.width-36;
          context.drawImage(chartCanvas,item.x+18,chartTop,chartWidth,chartHeight);
        }
      });
      output.toBlob(function(blob){
        if(!blob){
          setDashboardStatus("تعذّر إنشاء ملف الصورة.",true);
          return;
        }
        var url=URL.createObjectURL(blob),link=document.createElement("a");
        link.href=url;
        var today=new Date(),dateLabel=today.getFullYear()+"-"+String(today.getMonth()+1).padStart(2,"0")+"-"+String(today.getDate()).padStart(2,"0");
        link.download="tazawwadu-dashboard-"+dateLabel+".png";
        link.click();
        window.setTimeout(function(){URL.revokeObjectURL(url);},1000);
        setDashboardStatus("تم تنزيل صورة للرسوم المحمّلة حاليًا وعددها "+formatNumber(cards.length)+".");
      }, "image/png");
    }catch(error){
      setDashboardStatus("تعذّر تصدير الصورة: "+error.message,true);
    }
  }
  function renderChart(columns){
    if(chart){chart.destroy();chart=null;}
    var canvas=$("analysisChart"),empty=$("chartEmpty");
    if(!window.Chart){canvas.hidden=true;empty.hidden=false;empty.textContent="تعذّر تحميل مكتبة الرسوم البيانية؛ راجع اتصال الإنترنت.";return;}
    var model=chartModel(columns);
    if(!model){canvas.hidden=true;empty.hidden=false;empty.textContent="اختر مقياسًا أو عمودًا للتجميع لعرض الرسم.";return;}
    var labels=model.labels,data=model.data;
    var chosenType=$("chartType").value;
    var type=chosenType==="auto"?(model.dimensionIndex!==null&&currentTypes[model.dimensionIndex]==="date"?"line":model.dimensionIndex!==null&&model.metricIndex===null?"doughnut":"bar"):chosenType;
    if(type==="doughnut"&&labels.length>12){labels=labels.slice(0,12);data=data.slice(0,12);}
    var colors=["#d69c48","#6e8f73","#5f8c99","#a96f68","#9174a8","#c47e56","#71918d","#b18b67","#a6a354","#667e9f","#d38e82","#81a690"];
    canvas.hidden=false;
    empty.hidden=true;
    var theme=document.documentElement.getAttribute("data-theme");
    var dark=theme?theme==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;
    chart=new Chart(canvas.getContext("2d"),{
      type:type,
      data:{labels:labels,datasets:[{label:model.title,data:data,backgroundColor:type==="line"?"rgba(95,140,153,.18)":colors,borderColor:type==="line"?"#5f8c99":dark?"#20251f":"#fff",borderWidth:type==="line"?2:2,borderRadius:type==="bar"?7:0,fill:type==="line",tension:.25,pointRadius:type==="line"?3:0}]},
      options:{
        responsive:true,
        maintainAspectRatio:false,
        indexAxis:type==="bar"?"y":"x",
        plugins:{
          legend:{display:type==="doughnut",position:"bottom",labels:{color:dark?"#e8e4d8":"#5f625b",font:{family:"Readex Pro"}}},
          tooltip:{callbacks:{label:function(context){return " "+formatNumber(context.raw);}}}
        },
        scales:type==="bar"||type==="line"?{
          x:{beginAtZero:true,ticks:{color:dark?"#c5c2b9":"#777",font:{family:"Readex Pro"}},grid:{color:dark?"#3b4039":"#e7e2d8"}},
          y:{beginAtZero:true,ticks:{color:dark?"#c5c2b9":"#777",font:{family:"Readex Pro"}},grid:{color:dark?"#3b4039":"#e7e2d8"}}
        }:{}
      }
    });
    $("chartTitle").textContent=model.title;
  }
  function normalizedResult(summary){
    return JSON.stringify({
      rowCount:summary.rowCount,
      columns:summary.columns.map(function(column){
        return [column.index,column.name,column.kind,column.nonEmptyCount,column.missingCount,column.uniqueCount,
          column.sum,column.average,column.median,column.min,column.max,column.minDate,column.maxDate,column.outlierCount,column.topValues||[]];
      })
    });
  }
  function appendComparison(label,value){
    var card=document.createElement("div");
    card.className="analysis-comparison-item";
    var title=document.createElement("span");
    title.textContent=label;
    var result=document.createElement("strong");
    result.textContent=value;
    card.append(title,result);
    comparisonResults.appendChild(card);
  }
  async function analyzeOnServer(indices){
    var form=new FormData();
    form.append("file",currentFile,currentFile.name);
    form.append("sheet_name",/\.csv$/i.test(currentFile.name)?"":sheetSelect.value);
    form.append("columns",JSON.stringify(indices));
    form.append("filters",JSON.stringify(activeFilters.map(function(filter){
      return {index:filter.index,kind:filter.kind,values:filter.values,from:filter.from,to:filter.to};
    })));
    var started=performance.now();
    var response=await fetch(apiBase+"/analyze-workbook",{method:"POST",body:form});
    var result;
    try{result=await response.json();}catch(error){throw new Error("لم يُرجع الخادم استجابة مفهومة.");}
    if(!response.ok)throw new Error(result.detail||"تعذّر تحليل الملف على الخادم.");
    result.requestMs=performance.now()-started;
    return result;
  }
  async function runAnalysis(){
    var indices=selectedColumns(),mode=processingMode.value;
    var filteredRows=getFilteredRows();
    if(!currentFile||!currentRows.length||!indices.length)return;
    if(!filteredRows.length){
      setStatus(analysisStatus,"الفلاتر لا تُبقي أي صفوف. عدّل الفلاتر قبل التحليل.",true);
      return;
    }
    if((mode==="server"||mode==="compare")&&!apiBase){
      setStatus(analysisStatus,"الخادم غير مهيأ. استخدم التحليل المحلي أو أضف عنوان الخادم أولًا.",true);
      return;
    }
    setBusy(true);
    resetResults();
    setStatus(analysisStatus,mode==="local"?"جارٍ تحليل الملف على جهازك…":"جارٍ إرسال الملف للخادم لتحليله…");
    try{
      var localResult=null,serverResult=null;
      if(mode==="local"||mode==="compare")localResult=analyzeLocal(indices,filteredRows);
      if(mode==="server"||mode==="compare")serverResult=await analyzeOnServer(indices);
      var result=mode==="server"?serverResult:localResult;
      baseResultRows=filteredRows;
      resultRows=filteredRows;
      dashboardSelections=[];
      renderResults(result);
      if(mode==="compare"){
        comparisonResults.replaceChildren();
        comparisonResults.hidden=false;
        var localTotal=parseDuration+localResult.computeMs;
        appendComparison("محلي · قراءة الملف + التحليل",formatNumber(localTotal)+" مللي ثانية");
        appendComparison("الخادم · رفع الملف + التحليل",formatNumber(serverResult.requestMs)+" مللي ثانية");
        appendComparison("زمن التحليل داخل الخادم",formatNumber(serverResult.durationMs)+" مللي ثانية");
        appendComparison("تطابق النتائج",normalizedResult(localResult)===normalizedResult(serverResult)?"نعم":"هناك اختلاف؛ راجع القيم المعروضة");
        setStatus(analysisStatus,"اكتملت المقارنة. زمن الخادم الكلي يشمل اتصال الشبكة ورفع الملف.");
      }else if(mode==="server"){
        setStatus(analysisStatus,"اكتمل التحليل على الخادم. زمن الطلب يشمل رفع الملف والاتصال.");
      }else{
        setStatus(analysisStatus,"اكتمل التحليل محليًا؛ لم يُرسل الملف إلى أي خادم.");
      }
      analysisResults.scrollIntoView({behavior:"smooth",block:"start"});
    }catch(error){
      setStatus(analysisStatus,error.message||"حدث خطأ أثناء تحليل الملف.",true);
    }finally{
      setBusy(false);
    }
  }
  function resetPage(){
    loadRequest++;
    fileInput.value="";
    currentFile=null;
    currentWorkbook=null;
    currentRows=[];
    currentHeaders=[];
    parseDuration=0;
    workbookReadDuration=0;
    fileName.textContent="لن يُحلّل الملف قبل اختيارك لطريقة التحليل والضغط على الزر.";
    setStatus(fileStatus,"");
    setStatus(analysisStatus,"");
    workbookOptions.hidden=true;
    columnPanel.hidden=true;
    $("filtersPanel").hidden=true;
    runPanel.hidden=true;
    $("filterList").replaceChildren();
    $("filterPreview").textContent="";
    activeFilters=[];
    currentTypes=[];
    resultRows=[];
    resetResults();
  }
  function initThemeAndNavigation(){
    var button=$("theme"),navLinks=$("primaryNavLinks"),menuToggle=$("navMenuToggle");
    try{
      var saved=localStorage.getItem("theme");
      if(saved==="dark"||saved==="light")document.documentElement.setAttribute("data-theme",saved);
    }catch(error){}
    function darkMode(){
      var theme=document.documentElement.getAttribute("data-theme");
      return theme?theme==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    function paintTheme(){
      if(!button)return;
      button.innerHTML=darkMode()
        ?'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg>'
        :'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 15.5A8.5 8.5 0 0 1 8.5 3.5 8.5 8.5 0 1 0 20.5 15.5Z"/></svg>';
      button.setAttribute("aria-label",darkMode()?"تفعيل الوضع الفاتح":"تفعيل الوضع الداكن");
    }
    paintTheme();
    if(button)button.addEventListener("click",function(){
      var value=darkMode()?"light":"dark";
      document.documentElement.setAttribute("data-theme",value);
      try{localStorage.setItem("theme",value);}catch(error){}
      paintTheme();
      if(latestSummary){
        var visiblePages=columnChartPage||1;
        renderChart(latestSummary.columns);
        renderColumnDashboard(latestSummary.columns,false,visiblePages);
      }
    });
    if(navLinks&&menuToggle){
      menuToggle.addEventListener("click",function(){
        var expanded=menuToggle.getAttribute("aria-expanded")!=="true";
        navLinks.classList.toggle("is-expanded",expanded);
        menuToggle.setAttribute("aria-expanded",String(expanded));
        menuToggle.setAttribute("aria-label",expanded?"إغلاق قائمة التنقل":"فتح قائمة التنقل");
      });
      navLinks.querySelectorAll("a").forEach(function(link){
        link.addEventListener("click",function(){
          if(window.innerWidth<=760){
            navLinks.classList.remove("is-expanded");
            menuToggle.setAttribute("aria-expanded","false");
          }
        });
      });
    }
  }

  if(apiBase){
    $("serverOption").disabled=false;
    $("serverOption").textContent="على الخادم — يُرسل الملف للمعالجة";
    $("compareOption").disabled=false;
    $("serverNotice").textContent="التحليل المحلي لا يرسل الملف. خيار الخادم يرسل نسخة منه إلى خادم الموقع لمعالجتها مؤقتًا دون حفظها.";
  }
  fileInput.addEventListener("change",function(){loadWorkbook(fileInput.files&&fileInput.files[0]);});
  sheetSelect.addEventListener("change",parseSelectedSheet);
  $("selectAllColumns").addEventListener("click",function(){
    columnList.querySelectorAll("input[type=checkbox]").forEach(function(input){input.checked=true;});
    updateSelection();
  });
  $("clearColumns").addEventListener("click",function(){
    columnList.querySelectorAll("input[type=checkbox]").forEach(function(input){input.checked=false;});
    updateSelection();
  });
  $("addFilter").addEventListener("click",addFilter);
  $("clearFilters").addEventListener("click",function(){
    activeFilters=[];
    $("filterList").replaceChildren();
    updateFilterFieldOptions();
    refreshFilterPreview();
  });
  processingMode.addEventListener("change",function(){
    $("serverNotice").classList.toggle("is-warning",processingMode.value!=="local");
  });
  runButton.addEventListener("click",runAnalysis);
  ["chartMetric","chartDimension","chartAggregation","chartType"].forEach(function(id){
    $(id).addEventListener("change",function(){
      if(!latestSummary)return;
      $("chartAggregation").disabled=$("chartMetric").value===""||$("chartDimension").value==="";
      renderChart(latestSummary.columns);
    });
  });
  $("resetAnalysis").addEventListener("click",resetPage);
  $("showMoreCharts").addEventListener("click",function(){
    if(latestSummary)renderColumnDashboard(latestSummary.columns,true);
  });
  $("addDashboardChart").addEventListener("click",function(){
    if(!latestSummary)return;
    var insertAt=Math.min(dashboardConfigs.length,(columnChartPage||1)*COLUMN_CHART_PAGE_SIZE);
    dashboardConfigs.splice(insertAt,0,makeCustomDashboardConfig(latestSummary.columns));
    renderColumnDashboard(latestSummary.columns,false,Math.max(columnChartPage||1,Math.ceil((insertAt+1)/COLUMN_CHART_PAGE_SIZE)));
  });
  $("saveDashboard").addEventListener("click",saveDashboardLayout);
  $("exportDashboardImage").addEventListener("click",exportDashboardImage);
  $("printDashboard").addEventListener("click",function(){
    if(latestSummary)window.print();
  });
  $("clearDashboardFilters").addEventListener("click",function(){
    if(!dashboardSelections.length)return;
    dashboardSelections=[];
    resultRows=baseResultRows;
    latestSummary=analyzeLocal(latestSummary.columns.map(function(column){return column.index;}),resultRows);
    renderKpis(latestSummary);
    renderSummaryTable(latestSummary.columns);
    renderDashboardFilters();
    renderColumnDashboard(latestSummary.columns,false,Math.max(1,columnChartPage||1));
    renderChart(latestSummary.columns);
    setDashboardStatus("تم إلغاء فلاتر الرسوم.",false);
  });
  initThemeAndNavigation();
})();
