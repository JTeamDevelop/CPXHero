//special / unique terrain features
const FEATURECHANCE = [5,170/3,40/3,40/3,80/3,20,100/3];
const TERRAINFEATURES = {
  0: [],
  1: [],
  2: [],
  3: ["aquifer","butte","cave, fracture","cave, limestone","crater lake","dry lake","escarpment","esker","gulch",
    "heavy shrubs", "heavy underbrush","hillock/knoll","lake","lava dome","limestone pavement","mesa","mud pits",
    "plateau","ridge","riparian zone","rock outcropping","rock shelter","sinkhole","strath","tar pit","thicket",
    "tor","vernal pool","well"],
  4: [],
  5: [],
  6: []
};

//generic object creator - takes options (object) and extras (array)
// extras = [[name,default]]
CPX.obj = function (opts,extras,generate) {
  //loads the basics that all objects will have
  var obj = {
    _dtype : "html",
    class : [],
    seed : typeof opts.seed === "undefined" ? [CPXC.string({length: 32, pool: base62})] : opts.seed,
    scale : typeof opts.scale === "undefined" ? 3 : opts.scale,
    parent : typeof opts.parent === "undefined" ? {} : opts.parent,
    units : []
  }
  //pulls id from seed
  obj._id = obj.seed.join("");

  //for every extra pulls that data to the object - each extra is an [name,default]
  extras = typeof extras === "undefined" ? [] : extras;
  extras.forEach(function (E) {
    obj[E[0]] = typeof opts[E[0]] === "undefined" ? E[1] : opts[E[0]];
  })

  //create a chance RNG and generate the items in the generate array
  generate = typeof generate === "undefined" ? [] : generate;
  if(generate.length>0){
    obj.RNG = new Chance(obj.seed.join(""));
  }
  generate.forEach(function (G) {
    if(G=="people") { obj[G] = CPX[G](obj.RNG,opts.terrain); }
    else if(G=="creature") { obj[G] = CPX[G](obj.RNG,opts.terrain,opts.level); }
    else { obj[G] = CPX[G](obj.RNG); }
  })

  return obj;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.obj.applyTemplate = function (obj,opts) {
  if(objExists(opts.template))  { 
    for (var x in opts.template){
      obj[x] = opts.template[x];
    }
  }
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.obj.closure = function (obj,opts) {
  CPX.obj.applyTemplate(obj,opts);

  obj.RNG = null;
  delete obj.RNG;

  CPXDB[obj._id] = obj;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.pop = function (opts) {
  var generate = ["name","level","size"];
  if(!objExists(opts.template)) {
    generate.push("people");
  }

  var obj = CPX.obj(opts,[["atlas",{}]],generate);
  obj.class.push("city");
  obj.actions = ["help","rest"];

  if(objExists(opts.subtype)){
    obj.class = [opts.subtype];
    if(opts.subtype == "order"){
      obj.profession = obj.RNG.pickone(["Knight","Wizard","Priest","Monk"]);
      obj.recruit = [obj.profession];
    }
    if(opts.subtype == "hideout"){
      obj.profession = obj.RNG.pickone(["Knight","Wizard","Priest","Monk"]);
      obj.actions = ["explore"];
    }
  }
  else {
    obj.store = [{basic:true}];
    obj.recruit = [{basic:true}];
  }

  CPX.obj.closure(obj,opts);
  return obj._id;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.subSites = function (site){
  var minscale = 2, maxscale = 4;
  if(site.class.includes("site")){
    minscale = 3; maxscale = 5;
  }
  var subs = {}, remainder=0;
  var P = [0.03,0.01,0.01], n =-1, an=-1;

  //the following will calculate how many sub-scale 4,3, and 2 dungeons are in the ruin
  //based upon scale of ruin, its size, and the probability (P) table above
  //P is percent chance to find a dungeon of that idx scale+1  (ie 1% chance for a scale 4 dungeon)
  //ex: a scale 5 ruin of size 2 has a 20% chance of producing a scale 4 dungeon 
  //It will have ~20 scale 3 dungeons and ~540 scale 2 dungeons - that is a lot of exploring   

  //calculates hexmap dungeons based on raw multiplicaiton using above probabilities
  function scalc(s,n) {
    an=-1;
    //starting at the max scale and moving down
    for (var i = s; i >= minscale; i--) {
      //calculate the number of sites size times scale probability
      an = n*P[i-2];
      //post the number ot the object array
      subs[i]=an;
      //set the size of the next iteration, multiply by 10 because scale will be reduced
      n = (n-an)*10;
    }
    //the remainder - scale 1 sites in the ruin
    remainder = Math.round(n);
  }

  //determine how many special hexmap dungeon style sites to explore
  //start at scale 4 - a huge superstructure, if the ruin is that scale there is a percent chance
  if (site.scale >= maxscale) {
    //check for maxscale dungeon
    n = Math.pow(10,(site.scale - maxscale))*site.size;
    scalc(maxscale,n);
  }
  //if the ruin isn't that big, set the scale and the size based on the ruin
  else {
  //check for smaller dungeons
    scalc(site.scale,site.size);
  }
  return subs;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.ruin = function (opts) {
  var generate = ["name","level","size"];
  if(!objExists(opts.template)) {
    generate.push("people");
  }

  var sitenames = ["Crater","Crypt","Fort","Keep","Shrine","Spire","Temple","Tomb","Palace","Tower","Wall","Library"];

  var obj = CPX.obj(opts,[["atlas",{}]],generate);
  obj.class = ["ruin"];
  obj.actions = ["explore"];
  obj.special = [];

  var special = CPX.subSites(obj);

  //round and check for dungeons if results are less than 1
  for(var x in special) {
    if (special[x]<1) {
      if(obj.RNG.bool({likelihood:special[x]*100})) { 
        obj.special.push({scale:x,name:obj.RNG.pickone(sitenames)}); 
      }
    }
    else if (special[x]<10) {
      for(var i=0;i<special[x];i++) { obj.special.push({scale:x,name:obj.RNG.pickone(sitenames)}); }
    } 
  }

  CPX.obj.closure(obj,opts);
  return obj._id;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.site = function (opts) {
  var obj = CPX.obj(opts,[["atlas",{}]],["level","size"]);
  obj.class = ["site"];
  obj.actions = ["explore"];
  obj.special = [];

  var sitenames = ["Crater","Crypt","Fort","Keep","Shrine","Spire","Temple","Tomb","Palace","Tower","Wall","Library"];
  //base everything on scale 3 = 6 acres, good size for open area
  var maxn = Math.pow(10,obj.scale-3)*obj.size;
  if(maxn < 10) { 
    obj.special.push({scale:3,minScale:3,size:maxn,name:obj.RNG.pickone(sitenames)}); 
  }
  else if(maxn < 100) {
    obj.special.push({scale:3,minScale:3,size:obj.RNG.natural({min:7,max:20}),name:obj.RNG.pickone(sitenames)});
  }
  else {
    var rs = obj.RNG.natural({min:2,max:7});
    for(var i=0;i<rs;i++) {
      obj.special.push({scale:3,minScale:3,size:obj.RNG.natural({min:7,max:20}),name:obj.RNG.pickone(sitenames)});
    }
  }

  CPX.obj.closure(obj,opts);
  return obj._id;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.lair = function (opts) {
  var options = Object.assign({},opts), creature = {};
  delete options.visible;

  options.RNG = new Chance(opts.seed.concat(["c"]).join(""));
  if(!objExists(opts.template)) {
    creature = CPX.creature(options.RNG,opts.terrain,opts.level);
  }
  else {
    creature = Object.assign({},template.creature);
  }

  if(creature.nappearing == "horde") {
    creature.n = Math.round((CPX.size(options.RNG)+CPX.size(options.RNG))*10); 
    options.size = Math.round(creature.n/3); 
  }
  else if(options.creature.nappearing == "group") { 
    creature.n = Math.round((CPX.size(options.RNG)+CPX.size(options.RNG))*4);  
    options.size = Math.round(creature.n/3);
  }

  if(!objExists(opts.special)){
    creature.id = 0;
    options.special = [creature];
  }
  else {
    creature.id = options.special.length;
    options.special.push(creature);
  }

  var objid = CPX.hexMap(options),
  obj = CPXDB[objid];
  obj._subtype = "lair";

  options = null;
  CPX.obj.closure(obj,opts);
  return obj._id;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
//Overland adventure, based upon the atlas subhex - 6 mi to a side : 93.53 sq mi each
CPX.overland = function (opts) {
  var map = CPX.obj(opts,[["realm",""],["atlas",{}]],["size"]);
  map._type = "overland";
  map.nex = 0;

  map.RNG = null;
  delete map.RNG;

  CPXDB[map._id] = map;
  return map._id;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.overland.display = function (opts) {
  //display overland
  CPX.display.overland(opts.map);
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.overland.enterSite = function (site) {
  //move the unit here
  CPX.unit.move(CPXAU,CPX.unit.previousLocation(CPXAU),{map:site,site:site});
  //display site
  CPX.display.site(site);
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.display.site = function (site) {
  var scaletitle = ["Settlement","Hamlet","Village","Town","City","Large City"], header="", html="",
  maxsize = Math.round(Math.pow(10,site.scale)*site.size),
  actname = {
    help: "Help",
    rest: "Rest & Recover",
    store: "Resupply",
    recruit: "Recruit",
    explore: "Explore"
  };

  if(site.class.includes("city")){
    header+= "<h1 class='site' data-sid='"+site._id+"'>"+site.name+" ("+scaletitle[site.scale-1]+")</h1>",
    html+='<div class=center>People: '+site.people.people.join(", ")+' (pop: '+maxsize+')</div>';  
  }
  else {
    header+= "<h1 class='site' data-sid='"+site._id+"'>"+site.name+"</h1>";
  }
  
  html+="<h3 class='center'>Actions</h3><div class=actions>";

  site.actions.forEach(function (S) {
    html+= CPX.option({text:actname[S],classes:["siteAction",actname[S]],data:[["actid",S],["sid",site._id]]});
  });
  
  if(objExists(site.store)){
    html+= CPX.option({text:"Resupply",classes:["siteAction"],data:[["actid","store"]]});
    html+='<div class=siteStore><fieldset class="content ui-grid-c">';
    html+='<div class="ui-block-a">'+CPX.option({text:"Gear",classes:["ui-mini","btn-store-recruit"],data:[["id","gear"],["type","store"]]})+'</div>';
    html+='<div class="ui-block-b">'+CPX.option({text:"Weapons",classes:["ui-mini","btn-store-recruit"],data:[["id","weapon"],["type","store"]]})+'</div>';
    html+='<div class="ui-block-c">'+CPX.option({text:"Armor",classes:["ui-mini","btn-store-recruit"],data:[["id","armor"],["type","store"]]})+'</div>';
    html+='<div class="ui-block-d">'+CPX.option({text:"Special",classes:["ui-mini","btn-store"],data:[["id","special"],["type","store"]]})+'</div>';
    html+='</fieldset><div class=storeData></div><div class="storeCost center"></div></div>';
  }
  if(objExists(site.recruit)){
    html+= CPX.option({text:"Recruit",classes:["siteAction"],data:[["actid","recruit"],["sid",site._id]]});
    html+='<div class=siteRecruit><fieldset class="content ui-grid-a">';
    html+='<div class="ui-block-a">'+CPX.option({text:"General",classes:["ui-mini","btn-store-recruit"],data:[["id","general"],["type","recruit"]]})+'</div>';
    html+='<div class="ui-block-b">'+CPX.option({text:"Specialized",classes:["ui-mini","btn-store-recruit"],data:[["id","special"],["type","recruit"]]})+'</div>';
    html+='</fieldset><div class=recruitData></div><div class="recruitCost center"></div></div>';
  }
  html+="</div>";

  var type ="";
  if(site.class.includes("ruin") || site.class.includes("site")){
    type = site.class[0][0];
    html+="<h3 class='center'>Interesting Sites</h3><div class=site>";

    var options = {};
    site.special.forEach(function(el,i){
      //load the options with the parent 
      options = Object.assign({},el);
      options.seed=site.seed.concat([type,i]);
      options.parent=[site];
      //if the object doesn't exist load it
      if(!objExists(CPXDB[options.seed.join("")])) {
        //call the constructor
        sid = CPX.hexMap(options);
        //build the site object for use
        obj = CPXDB[sid];
      }
      else {
        sid = options.seed.join("");
        obj = CPXDB[sid];
      }
      html+=CPX.option({text:el.name,classes:["site"],data:[["id",options.seed.join("")]]});
    });
    html+="</div>";
  }
  
  var footer=CPX.option({text:"Exit",classes:["atlasHexExit"]});

  CPX.display.html(true,header,html,footer);
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////
$(document).on('click',"button.btn-store-recruit",function(e) {
  var type = $(this).attr("data-type"), sid = $("h1.site").attr("data-sid"),
  site = CPXDB[sid], maxpop = Math.round(Math.pow(10,site.scale)*site.size);
  
  CPXTEMP[type]={};
  $("."+type+"Cost").html("");

  var id = $(this).attr("data-id"), OBJ = {}, result = [], R={}, RI={}, html="", max=99, maxcheck=true;
  if(type == "recruit") { 
    OBJ = MINIONS; 
    if(id=="general")  { max=Math.round(maxpop*0.005); }
    else if(id=="special")  { max=Math.round(maxpop*0.001); }
  
    if(max<1){ maxcheck = false; }
  }
  else if (type == "store") { OBJ = GEAR; }
  
  if(maxcheck) {
    site[type].forEach(function(el) {
      //if basic pull data from GEAR or MINIONS
      if(objExists(el.basic)){
        for(var x in OBJ) {
          R = objCopy(OBJ[x]);

          if(R.tags.includes("basic") && R.tags.includes(id)) { 
            R.max = max;
            R.rank = 1;
            result.push(R); 
            
            if(type == "recruit" && max>10) {
              RI= objCopy(OBJ[x]);
              RI.max=Math.round(max/10);
              RI.rank = 2;  
              result.push(RI);
            }
          }
        }
      }
      //If template, pull speicfic item from GEAR or MINIONS, not in basic
      else if(objExists(el.template)) { 
        if(OBJ[el.template].tags.includes(id)) { 
          R = objCopy(OBJ[el.template]);
          R.max = el.max;
          result.push(R); 
        } 
      }
      //otherwise pull the item from the map itself
      else if (el.tags.includes(id)) { 
        R = OBJ[el];
        R.max = el.max;
        result.push(R); 
      }
    });
    
    html+='<div class=content>'
    result.forEach(function(el,i){
      html+='<div class="'+type+'" data-id="'+el.id+'" data-type="'+type+'" data-rank="'+el.rank+'">'+el.id;
      if(type=="recruit") { html+=' (Rank: '+el.rank+')'; }
      html+='<input class=qty type=number min=0 max='+el.max+'></input></div>';
    });
    html+='</div>'
    $("."+type+"Data").html(html); 
  }
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////
$(document).on('change',".qty",function(e) {
    var id=$(this).parent().attr("data-id"),
    type=$(this).parent().attr("data-type"),
    sid = $("h1.site").attr("data-sid"),
    rank = $(this).parent().attr("data-rank"),
    site = CPXDB[sid],
    parent = "", pOBJ = {}, btnText="",
    cost=0, item={};
    //set the value of the temp store/recruit
    if(type=="store"){ parent = "store"; pOBJ = GEAR; btnText="Buy"; }
    else { parent = "recruit"; pOBJ = MINIONS; btnText="Recruit"; }  
    CPXTEMP[parent][id+rank] = {id:id,rank:rank,qty:$(this).val()};  
    
    //sum the cost
    for(var x in CPXTEMP[parent]){
      item = CPXTEMP[parent][x];
      if(objExists(pOBJ[item.id])) { cost+=pOBJ[item.id].cost*item.qty*Math.pow(10,item.rank-1); }
      else {
        //find the object in the site store/recruit
        var sobj = site[parent].filter(function(el){ 
          if (el.id == item.id) { return el; } 
        })[0];
        //sum the cost
        cost+=item.qty * sobj.cost; 
      }
    }
    $("."+parent+"Cost").html("Cost: <span class=coin>"+cost+"</span>");
    if(cost>0) { $("."+parent+"Cost").append(CPX.option({text:btnText,classes:["siteBuy","ui-mini","ui-btn-inline","center"],data:[["type",parent]]})); }
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////
$(document).on('click',"button.siteBuy",function(e) {
    var coin = Number($(".coin").html()),
    type=$(this).attr("data-type");
    if(coin>CPXAU.coin) {
      var n = noty({
        layout:'center',
        type:'error',
        timeout: 1000,
        text: "You don't have that much coin."
      });
    }
    else {
      $("."+type+"Data").html("");
      $("."+type+"Cost").html("");
      CPX.unit.buy(CPXAU,coin,type);
      CPXTEMP[type]={};
    }
});  
///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.display.html = function (slim,header,content,footer) {
  $("#notify").empty();
  if(slim) {
    $("#notify").removeClass("wide");
    $("#notify").addClass("slim");
  }
  else {
    $("#notify").removeClass("slim");
    $("#notify").addClass("wide");
  }

  $("#notify").append('<div data-role="header">'+header+'</div>');
  $("#notify").append('<div class="content">'+content+footer+'</div>');
  $("#notify").enhanceWithin();
  $(".siteStore").hide();
  $(".siteRecruit").hide();

  $("#notify").slideDown();
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////
$(document).on('click',"button.site ",function(e) {
  var id = $(this).attr("data-id");
  $("#notify").slideUp();

  //display a hexmap
  if(CPXDB[id]._type=="hexMap") {
    CPXAU.location=CPXDB[id].seed.concat([CPXDB[id]._zoneEnter]);
    CPX.display({map:CPXDB[id]});
  }
  //display a html site
  else {
    CPX.display.site(CPXDB[id]);
  }

});
///////////////////////////////////////////////////////////////////////////////////////////////////////////
$(document).on('click',"button.siteAction ",function(e) {
  var actid = $(this).attr("data-actid"),
  sid = $("h1.site").attr("data-sid");
  
  if(actid == "store"){
    $(".siteRecruit").hide();
    $(".siteStore").slideToggle();
  }   

  if(actid == "recruit"){
    $(".siteStore").hide();
    $(".siteRecruit").slideToggle();
  }  

  if(actid == "help"){
    $("#notify").slideUp('fast',function(){
      CPX.trouble(CPXDB[sid]);
    });
  }
  if(actid == "rest"){
    $("#notify").slideUp();
    CPX.unit.change(CPXAU,["AP"],[-1]);
    CPX.unit.fullHP(CPXAU);
  }

  

});