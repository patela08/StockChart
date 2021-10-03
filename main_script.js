
(function iife(){
	//load chart
	google.charts.load('current', {packages: ['corechart', 'bar']});
  const globalVar = {
  	subBtn : getElementByID('submitBtn'),
    inputField : getElementByID('stock'),
    listOfStockContainer : getElementByID('listOfStocks'),
    warningMsgContainer : getElementByID('warningMsgContainer'),
    token : 'Tpk_bd9a4f1d9581473da736c3a0effe6091',
    frm : getElementByID('stockForm'),
    options : {
        title: 'Stock Prices',
        hAxis: {
          title: 'Price'
        },
        vAxis: {
          title: 'Stock Symbol'
        }
      }
  }
  let qrySymbolsArr = [];
  let intervalID;
  let dataToDisplay;
  
  globalVar.subBtn.onclick = formSubmitted;
  globalVar.frm.onsubmit = formSubmitted;
  globalVar.listOfStockContainer.onclick = removeStkFromListAndChart;
  
  function formSubmitted(e){
  	let inputVal = globalVar.inputField.value.toUpperCase();
  	if(this.id.toLowerCase()=='stockform'){
    	//When user uses enter button to add stock then  prevent form submission
    	e.preventDefault();
    }
    //To Prevent user from adding same stocks to the list or when they enter without any value
    if(qrySymbolsArr.indexOf(inputVal)>-1 || inputVal.trim().length==0){
    	globalVar.inputField.value = '';
     	displayWarningMsg(inputVal.trim().length==0 ? 'Please Enter Symbol to Display it on the graph!!':'The stock you entered is already in the list!!');
    	return;
    }
   	qrySymbolsArr.push(inputVal);
    fetchData(inputVal);
    if(qrySymbolsArr.length==1){
    	updatePriceAtInterval();
    }
    
  }
  
  function fetchData(inputVal){
    const xhttp = new XMLHttpRequest();
    let addToList = false;
    xhttp.onload = function() {
    	if(this.status == 200){
      	if(JSON.parse(this.response).length){
        	dataToDisplay = [['Stock', 'Price' ,{ role: 'annotation' }]];
          JSON.parse(this.response).forEach((stk)=>{
            dataToDisplay.push([stk.symbol,stk.lastSalePrice,stk.lastSalePrice]);
            //To Avoid invalid stock in the list
            if(inputVal && inputVal==stk.symbol.toUpperCase()){
              addToList = true;
            }
          });
          if(dataToDisplay.length > 1){
            drawMultSeries(dataToDisplay);
          }

          if(inputVal && inputVal.trim().length>0){
            if(addToList){
              globalVar.listOfStockContainer.appendChild(createNewElement(inputVal));
              globalVar.inputField.value = '';
              globalVar.inputField.focus();
            }else{
              qrySymbolsArr = qrySymbolsArr.filter(sbl=>sbl!=inputVal);
              console.log(qrySymbolsArr)
            }
          }
        }else{
        	//If no data returned then clear input field
        	if(inputVal){
            qrySymbolsArr = qrySymbolsArr.filter(sbl=>sbl!=inputVal);
            globalVar.inputField.value = '';
          }
        }
      }else{
      	displayWarningMsg('There was an Error while fetching requested data!!');
      }
      
    };
    if(qrySymbolsArr.length){
   		xhttp.open("GET", `https://sandbox.iexapis.com/stable/tops?token=${globalVar.token}&symbols=${encodeURIComponent(qrySymbolsArr.join()).replaceAll('%2C',',')}`, true);
   		xhttp.send();
    }else{
      clearInterval(intervalID);
    }
   
  }
  
  function removeStkFromListAndChart(e){
   	e.stopImmediatePropagation();
    let cls = e.target.getAttribute('class');
    let indxToRemove = cls.split('_').pop();
  	if(cls.indexOf('removeStk') > -1){
    	let liToRemove = getElementByID(`stk${indxToRemove}`);
      globalVar.listOfStockContainer.removeChild(liToRemove);
      qrySymbolsArr.splice(indxToRemove-1,1);
      dataToDisplay.splice(indxToRemove,1);
      if(qrySymbolsArr.length==0){
        clearInterval(intervalID);
        document.getElementById('chart_div').innerHTML='';
      }else{
      	drawMultSeries(dataToDisplay);
      }
    }
   
  }
  
  function updatePriceAtInterval(){
  	intervalID = setInterval(function updateStockPrice(){
    	fetchData();
    },5000)
  }
  
  function createNewElement(content){
  	let li = document.createElement('li');
    li.id = `stk${qrySymbolsArr.length}`;
    li.innerHTML = `<span class="stkSymbol">${content}</span><button class='removeStk_${qrySymbolsArr.length}'>Remove</button>`;
    return li;
  }
  function getElementByID(id){
  	return document.getElementById(`${id}`);
  }
  
  function displayWarningMsg(msg){
  	globalVar.warningMsgContainer.innerHTML = msg;
  	setTimeout(function clearMsg(){
    	globalVar.warningMsgContainer.innerHTML = '';
    },2000);
  }
  
  function drawMultSeries(dataToDisplay) {
    const chart = new google.visualization.BarChart(document.getElementById('chart_div'));
    chart.draw(google.visualization.arrayToDataTable(dataToDisplay),globalVar.options);
  }
})();