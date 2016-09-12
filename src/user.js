///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.user.addRealm = function (realmid) {
  if(!objExists(USER[realmid])) {
    USER[realmid] = {};

    localStorage.setItem("user",JSON.stringify(USER));
  }
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.user.updateVisible = function (map,location) {
  var mapid = map.seed.slice(1).join("");
  if(!objExists(USER[map.realm][mapid])) {
    USER[map.realm][mapid] = {
      visible: []
    };
  }
  if(!USER[map.realm][mapid].visible.includes(location)) {
    USER[map.realm][mapid].visible.push(location);

    localStorage.setItem("user",JSON.stringify(USER));
    return true;
  }
  return false;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.unit = function (opts) {
  var uobj = {
    class : ["unit"]
  }
}
CPX.unit.array = function () {
  var A = [];
  for(var x in CPXUNITS){
    A.push(CPXUNITS[x]);
  }
  return A;
}
CPX.unit.actions = function (type,unit) {
  var actions = [];
  if(type=="fight"){
    actions.push("Fight");
  }
  return actions;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.unit.save = function () {
  return new Promise(function(resolve, reject) {
    localStorage.setItem("units",JSON.stringify(CPXUNITS));
    CPX.display.audata();
    resolve();
  });
}
CPX.unit.move = function (unit,to) {
  //update the unit location
  unit.location = to;
  CPX.unit.save(unit);
}
CPX.unit.buy = function (unit,cost,type) {
  unit.coin-=cost;
  if(type=="store"){
    for(var x in CPXTEMP.store){
      unit.inventory.push({template:x,qty:CPXTEMP.store[x]});
    }
  }
  else if(type="recruit"){
    for(var x in CPXTEMP.recruit){
      unit.party.push({template:x,qty:CPXTEMP.recruit[x]});
    }
  }
  CPX.unit.save(unit);
};
CPX.unit.fullHP = function (unit){
  unit.HP=CPX.unit.maxHP(unit);
  CPX.unit.save(unit);
}
CPX.unit.change = function (unit,variable,vals){
  variable.forEach(function(el,i){
    unit[el]+=vals[i];  
  })
  CPX.unit.save(unit);
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.unit.maxHP = function (unit){
  var physique = CPX.unit.skillVal(unit,"Physique"), hp=2,
  mod = Math.floor((physique+1)/2);
  for(var i =0;i<mod;i++) { hp+=i+1; }
  return hp;
}
CPX.unit.skillVal = function (unit,skill){
  var val =0;
  if(unit.class.includes("minion")){
    var mskill = MINIONS[unit.nature].skills;
    if(mskill[0]==skill) { val = unit.maxskill; }
    else if (mskill.slice(1).includes(skill)) { val = unit.maxskill-1; }
  }
  else {
    unit.skills.forEach(function(sr,i){
      if(sr.includes(skill)) { val = i; }
    });  
  }
  
  return val;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.hero = function (opts) {
  var hero = {
    _id: CPXC.guid(),
    class: ["unit","hero"],
    name: "",
    level : 1,
    HP : 1,
    XP:0,
    AP:30,
    coin: 50,
    party: [],
    inventory: [],
    location : [],
    aspects : [],
    skills : [[],[],[],[],[],[],[],[]],
    stunts : []
  }

  CPXUNITS[hero._id] = hero;
  CPX.unit.save(hero);
  return CPXUNITS[hero._id];
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////
window.onkeypress=function(event){
  var x = event.which || event.keyCode,
    key = String.fromCharCode(x);
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.optionList = function (list) {
  var R = "";
  list.forEach(function (L) {
    R+=CPX.option(L);
  });
  return R;
}
CPX.option = function (opts) {
  opts.text = typeof opts.text === "undefined" ? "" : opts.text;
  opts.id = typeof opts.id === "undefined" ? "" : opts.id;
  opts.ftorun = typeof opts.ftorun === "undefined" ? "" : opts.ftorun;
  opts.style = typeof opts.style === "undefined" ? "standard" : opts.style;
  opts.classes = typeof opts.classes === "undefined" ? [] : opts.classes;
  opts.data = typeof opts.data === "undefined" ? [] : opts.data;

  var style = "btn-standard ", data = "", id="";

  if(opts.id.length>0){
    id='id='+opts.id;
  }

  if(opts.style == "circle"){
    style += "btn-large ui-corner-all ";
  }
  else if (opts.style == "short"){
    style += "btn-short ";
  }
  else if (opts.style == "inline"){
    style += "ui-btn-inline ";
  }

  //add classes in a list
  style+= opts.classes.join(" ");

  opts.data.forEach(function (D) {
    data+=" data-"+D[0]+"="+D[1];
  })
  if(opts.ftorun.length>0){
    data+=" data-ftorun="+opts.ftorun;
  }

  var R= '<button '+id+' class="'+style+' ui-btn"'+data
  R+= '>'+opts.text+'</button>'
  return R;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.clearAllData = function (event) {
  var content = '<div data-role="header"><h1>Destroy All Data</h1></div>';
  content += "<div class=content>This will delete all the data! You will have to start over. Are you sure?</div>";

  var buttons = [
    {text:"Yes",id:"destroyAll",classes:["red"],style:"inline"},
    {text:"No",classes:["green","closeDialog"],data:[["id","confirm"]],style:"inline"}
  ]
  content += '<div class=center>'+CPX.optionList(buttons)+'</div>';

  $("#confirm").html(content);
  $("#confirm").enhanceWithin();
  $( "#confirm" ).popup();
  $( "#confirm" ).popup("open",{positionTo: "window"} );

  $('#destroyAll').on('click',function() {
    localStorage.clear();
    $( "#confirm" ).popup( "destroy" );
  });

}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.viewUnits = function (event) {
  CPX.display.heroEditor(CPX.unit.array()[0]);
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
$('#mainmenu').on('click',function(e) {
  var buttons = [
    {text:"Clear All Data",classes:["cpx-option"],ftorun:"clearAllData"},
    {text:"View Units",classes:["cpx-option"],ftorun:"viewUnits"},
    {text:"Close",classes:["closeNotify"]}
  ],
  header = '<div data-role="header"><h1>Main Menu</h1></div>';

  var options=CPX.optionList(buttons);

  CPX.display.html(true,header,options,"");
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////
$(document).on('click','.closeDialog',function(e) {
  //get id of dialog
  var id = $(this).attr("data-id");
  //destroy the dialog
  if(id == "notify"){ $( "#"+id ).slideUp(); }
  else { $( "#"+id ).popup( "destroy" ); }

});
$(document).on('click','.closeNotify',function(e) {
  $("#notify").slideUp();
});
$(document).on('click','.cpx-option',function(e) {
  //get function to run
  var id = $(this).attr("data-ftorun");
  //close the menu
  $( "#notify" ).slideUp("fast",function function_name(argument) {
    //run the function - pass the event
    CPX[id](e);
  });
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////
$('.zoom').on('click',function(e) {
  var id = $(this).attr("id");
  if(id == "zoomin"){
    if(ZOOMLEVEL+1>=ZOOM.length) { return false; }
    ZOOMLEVEL++;
  }
  else {
    if(ZOOMLEVEL-1<0) { return false; }
    ZOOMLEVEL--;
  }

  var mapid="", cell={};
  if(ZOOM[ZOOMLEVEL]=="atlas"){
    CPX.display({map:CPXDB[CPXAU.location[0]],cell:CPXDB[CPXAU.location[0]].cells[CPXAU.location[1]]});
    $('#enter').show();
  }
  else if (ZOOM[ZOOMLEVEL]=="hexPlane") {
    $('#enter').hide();
    CPX.display({map:CPXDB[CPXAU.location[0]]});
  }
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////
$('#enter').on('click',function(e) {
  var map = CPXDB[$(".map.active").attr("id")],
    site = map[map._dtype][CPXAU.location[ZOOMLEVEL*2+1]];

  CPX.atlas.enterHex(map,site);
});
$('#exit').on('click',function(e) {
  var map = CPXDB[$(this).attr("data-id")];
  
  CPX.display.makeCanvas(map,function(){});
});

