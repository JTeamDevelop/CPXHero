CPX = {
  display:{},
  gen:{},
  user:{}
};

USER = {};
CPXDB = {};
CPXUNITS = {};
CPXAU = {};
CPXTEMP = {store:{},recruit:{}};
CPXFIGHT = {};
ZOOMLEVEL = 0;

var CPXC;
const base62 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
//terrain colors
const TERRAINS = ["water","swamp","desert","plain","forest","hill","mountain"];
const terrainColors = ["aqua","CadetBlue","Beige","LightGreen","ForestGreen","Brown","DarkGrey"];
const CLIMATES = ["arctic","sub-arctic","temperate","sub-tropical","tropical"];
//hexagon neighboors in axial coords
const axialDirections = [
  [1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]
]
//levels of zoom
const ZOOM = ["hexPlane","atlas"];

//////////////////////////////////////////////////////////////////////////////////////////////////////////////
function hexToRgbA(hex,alpha) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  var string = "rgba("
  string+=parseInt(result[1], 16) +",";
  string+=parseInt(result[2], 16) +",";
  string+=parseInt(result[3], 16) +",";
  string+=alpha+")";
  return string;
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Simple test to see if an object is defined = exists
objExists = function (obj) {
  if (typeof obj === "undefined") {
    return false;
  }
  else {
    return true;
  }
}
objCopy = function (obj){
  return JSON.parse(JSON.stringify(obj));
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Removes duplicates from array
Array.prototype.unique = function() {
    var a = this.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i] === a[j])
                a.splice(j--, 1);
        }
    }

    return a;
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var Zone = function (map,i) {
  this.id=i;
  this.cells=[];
  this.color=map.RNG.color({format: 'hex'});
  this.visible = false;
  this.special = [];
}
var HCell = function (q,r,terrain,zone) {
  this.id = q+"_"+r;
  this.q = q;
  this.r = r;
  this.terrain = terrain;
  this.climate = -1;
  this.zone = -1;
  this.special=[];
  this.doom = 0;

  if(objExists(zone)) {
    this.zone = zone.id;
  }
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
//Find a map given a seed - if it doesn't exist return false
CPX.findMap = function (seed) {
  var map = {};
  for (var x in CPXDB) {
    map = CPXDB[x];
    if(map.seed.toString() == seed.toString()){
      return map._id;
    }
  }
  return false;
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.realm = {};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.mapModCheck = function (map,mod) {
  var realmid = map.seed[0], modid = map.seed.slice(1).join(""),
  moddb = CPXDB[realmid].mods;


}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.mapMod = function (map,mod) {
  var realmid = map.seed[0], modid = map.seed.slice(1).join(""),
  moddb = CPXDB[realmid].mods, modtype=mod[1], modvar=mod[0];
  
  moddb.update({_id:modid},
    {modtype : { modvar : mod[2] }},
    {upsert:true},function(){});

}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.hex = {};
CPX.hex.center = function (radius,hex,pointy) {
  pointy = typeof pointy === "undefined" ? true : pointy;
  x = radius * Math.sqrt(3) * (hex.q + hex.r/2);
  y = radius * 3/2 * hex.r;
  if(!pointy) {
    x = radius * 3/2 * hex.q;
    y = radius * Math.sqrt(3) * (hex.r + hex.q/2);
  }
  return {x:x,y:y};
}
CPX.hex.mapBounds = function (map) {
  var mmin = CPX.hex.center(map._hexradius,{q:map.r,r:map.q},map._pointy);
  var mmax = CPX.hex.center(map._hexradius,{q:map.r+map.width,r:map.q+map.height},map._pointy);
  var span = {x:mmax.x-mmin.x+2*map._hexradius,y:mmax.y-mmin.y+2*map._hexradius};

  return span;
}
CPX.hex.axialD = function (a,b){
  return (Math.abs(a.q - b.q)
        + Math.abs(a.q + a.r - b.q - b.r)
        + Math.abs(a.r - b.r)) / 2;
}
CPX.hex.neighboorIDs = function (hex) {
  var R = [], id="", q=0, r=0;
  for (var i = 0; i < axialDirections.length; i++) {
    q = hex.q + axialDirections[i][0];
    r = hex.r + axialDirections[i][1];
    R.push(q+"_"+r);
  }
  return R;
}
CPX.hex.withinX = function (hex,X) {
  var all = [], R= [], id="", q=0, r=0, nhex = {}, ihex={};

  all.push(hex.id);
  R[0] = [hex];

  for (var i = 1; i <= X; i++) {
    R[i] = []

    for (var j = 0; j < R[i-1].length; j++) {
      ihex = R[i-1][j];

      for (var k = 0; k < axialDirections.length; k++) {
        q = ihex.q + axialDirections[k][0];
        r = ihex.r + axialDirections[k][1];
        id = q+"_"+r;

        if(!all.includes(id)) {
          all.push(id);
          R[i].push({id:id,q:q,r:r});
        }
      }
    }
  }

  R.all = all;
  return R;
}
//get the cell q r from id
CPX.hex.cellQR = function (cid) {
  var i = cid.indexOf("_"),
    q=Number(cid.substr(0,i)),
    r=Number(cid.substr(i+1));
  return {q:q,r:r};
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.hex.pop = function (map,cell,level) {
  var visible = false, i = cell.special.length, scale = level, 
  pop={
    type:"pop",
    seed : map.seed.concat([cell.id,"p"+i]),
    terrain : cell.terrain,
    visible: false
  };
  
  if(map._type=="atlas"){
    scale = map.RNG.weighted([level-1,level,level+1], [0.25,0.6,0.15]);
  }
  pop.scale = scale;
  
  if(CPX.basicVisibility(map,scale)){
    pop.visible = true;
  }

  if (map._type=="hexPlane") {
    pop.template = {
      people: CPX.people(map.RNG,cell.terrain)
    };
  }
  
  cell.special.push(pop);
  
}
CPX.hex.hideout = function (map,cell,level) {
  var i = cell.special.length;

  var hideout  = {
    type:"pop",
    subtype:"hideout",
    seed : map.seed.concat([cell.id,"h"+i]),
    terrain : cell.terrain,
    scale : level[0],
    level : level[1],
    visible: false
  };

  cell.special.push(hideout);
}
CPX.hex.order = function (map,cell,level) {
  var i = cell.special.length, scale = level[0];
  if(map._type=="atlas"){
    scale = map.RNG.weighted([level[0]-1,level[0],level[0]+1], [0.25,0.6,0.15]);  
  }

  var order = {
    type:"pop",
    subtype:"order",
    seed : map.seed.concat([cell.id,"d"+i]),
    terrain : cell.terrain,
    scale:scale,
    level: level[1],
    visible: false
  };

  if(CPX.basicVisibility(map,scale)){
    order.visible = true;
  }

  cell.special.push(order);
}
CPX.hex.lair = function (map,cell,level) {
  var i = cell.special.length;

  var lair = {
    type:"lair",
    seed : map.seed.concat([cell.id,"l"+i]),
    terrain : cell.terrain,
    scale:4,
    level:level,
    visible: false
  };

  //scale is determined by the level and the random creature
  cell.special.push(lair);
}
CPX.hex.ruin = function (map,cell,level) {
  var i = cell.special.length, scale = level;
  scale = map.RNG.weighted([level[0]-2,level[0]-1,level[0],level[0]+1,level[0]+2], [0.05,0.2,.5,0.2,0.05]);  

  var ruin = {
    type:"ruin",
    seed : map.seed.concat([cell.id,"r"+i]),
    terrain : cell.terrain,
    scale:scale,
    level:level[1],
    visible: false
  };

  if(CPX.basicVisibility(map,scale)){
    ruin.visible = true;
  }

  cell.special.push(ruin);
}
CPX.hex.site = function (map,cell,level) {
  var i = cell.special.length, scale=level[0];
  if(map._type=="hexPlane"){
    scale = map.RNG.weighted([level[0]-1,level[0],level[0]+1], [0.2,.6,0.2]);  
  }
  else if(map._type=="atlas"){
    scale = map.RNG.weighted([level[0]-2,level[0]-1,level[0],level[0]+1], [0.1,0.45,.4,0.05]);  
  }

  var site = {
    type:"site",
    seed : map.seed.concat([cell.id,"s"+i]),
    terrain : cell.terrain,
    level: level[1],
    scale : scale,
    visible: false
  };

  if(CPX.basicVisibility(map,scale)){
    site.visible = true;
  }

  cell.special.push(site);
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.name = function (RNG) {
  return RNG.capitalize(RNG.word());
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
//determine a random threat level of a location or site
CPX.level = function (RNG) {
  var levels = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];
  var P = [1,.5,.1,.04,.01667,.005,.000333,.0001,.000025,.00001,.0000025,.000001,.0000003,.0000002,.0000001];
  return RNG.weighted(levels, P);
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.size = function (RNG) {
  var s = RNG.weighted([1,2,3,4,5], [.1,.45,.34,.1,.01]);
  var n = RNG.normal({mean: 0, dev: 0.3});
  if(s==1) {
    s+= Math.abs(n);
  }
  else {
    s+=n;
  }
  return s;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.enter = function (map) {
  if(!objExists(USER[map._id])){
    USER[map._id] = {
      visible:[]
    }
  }

  CPX[map._type].enter(map);
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.cellArray = function (map) {
  var cA=[];
  //put all the cells in an array for random selection
  for(var x in map.cells) {
    cA.push(x);
  }
  return cA;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
//check if the map exists - and then enter it
CPX.mapCheck = function (seed,opts) {
  //find if the map exists
  var _id = CPX.findMap(seed);
  if(_id == false) {
    //if it doesn't exist make it, given the map type from the options
    _id = CPX[opts.type](opts);
    //testing
    console.log(CPXDB);
  }
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function mapLocation(dhex) {
  var hex = dhex.hex, size = dhex.map._hexradius, pointy = dhex.map._pointy;

  var deg = -90;
  if(!dhex.map._pointy){
    deg = 0;
  }

  var center = CPX.hex.center(size,hex,pointy),
  bounds = dhex.map.bounds;
  center.x+= bounds.x/2;
  center.y+= bounds.y/2;

  if(objExists(dhex.viewcenter)){
    center.x-=dhex.viewcenter.x;
    center.y-=dhex.viewcenter.y;
  }
  return center;
}
function makeHex(dhex,gsize,stroke,fill) {
  var center = mapLocation(dhex), deg = -90;
  if(!dhex.map._pointy){
    deg = 0;
  }
  graphics = new createjs.Graphics();
  graphics.setStrokeStyle(1).beginStroke(stroke);
  if(dhex.map._type=="hexMap") {
    graphics.beginRadialGradientFill(["white",fill], [0.3, 0.9], center.x, center.y, 0, center.x, center.y, dhex.map._hexradius);
    if(objExists(dhex.unit)){ 
      graphics.beginFill(fill);
    }
  }
  else {
    graphics.beginFill(fill);
  }
  graphics.drawPolyStar(center.x, center.y, dhex.map._hexradius, 6, 0, deg);  
  return graphics;
}
function makeCircle(dhex,size,stroke,fill) {
  var center = mapLocation(dhex);
  graphics = new createjs.Graphics();
  graphics.setStrokeStyle(1).beginStroke(stroke).beginFill(fill).drawCircle(center.x, center.y, size);
  return graphics;
}
function makeTriangle(dhex,gsize,stroke,fill) {
  var center = mapLocation(dhex);
  graphics = new createjs.Graphics();
  graphics.setStrokeStyle(1).beginStroke(stroke).beginFill(fill).drawPolyStar(center.x, center.y, gsize, 3, 0, 0);
  return graphics;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.display = function(opts){
  if(ZOOM[ZOOMLEVEL]=="atlas" && objExists(opts.cell)) {
    CPX.atlas.display(opts);
  }
  else {
    CPX[opts.map._type].display(opts);
  }

  CPX.display.units();
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.display.audata = function () {
  var realm = CPXDB[CPXAU.location[0]],
  html = '<h2 class="center header">'+realm.name+"</h2>";

  html+='<h4 class="center header">'+CPXAU.name+" HP: "+CPXAU.HP+" AP: "+CPXAU.AP+"</h4>";

  $("#title").html(html);
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.display.makeGraphics = function(gf,cf,container,dhex,dvar){
  var c = new createjs.Shape();
  c.data = dhex.data;
  c.graphics = gf(dhex,dvar[0],dvar[1],dvar[2]);
  container.addChild(c);
  c.addEventListener("click", cf);
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.display.centerAdjust = function (map) {
  map.dispay.stage.children.forEach(function(el) {
   el.x-=map.center.x;
   el.y-=map.center.y; 
  });
  map.dispay.stage.update();
  
  var center = {x:map.bounds.x/4, y:map.bounds.y/4}
  $("#maps").scrollTop(center.y);
  $("#maps").scrollLeft(center.x);
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.display.units = function(){
  var mapid = $(".map.active").attr("id"), map = CPXDB[mapid];
  var unit={}, unitloc="", site = {}, cdata={}, dhex = {}, newd=false;
  //create a new container for the units if one does not exist
  if(objExists(map.dispay.unit)){
    //remove it and start fresh
    map.dispay.stage.removeChild(map.dispay.unit);
  }
  map.dispay.unit = new createjs.Container();
  //for unit see if it is on the map - display it
  for (var x in CPXUNITS) {
    //load the unit
    unit = CPXUNITS[x];
    unitloc = unit.location.join("");
    //check if the map._id is in the location
    if(unitloc.includes(map._id)){
      //pull the site based on display type and site id - from unit
      site = map[map._dtype][unit.location[map.seed.length]];
      //load cell data
      cdata = {realm:map.realm, map:map._id, uid:unit._id, cid:site.id};
      //if display type is cell (hex)
      if(map._dtype == "cells") {
        dhex = {hex:site,map:map,data:cdata};
      }
      //if display type is zone
      else if (map._dtype == "zones") {
        //uses the center of the zone for placement
        dhex = {hex:map.cells[site.cells[0]],map:map,data:cdata};
      }
      //update the graphics - adding a triangle for every hero
      CPX.display.makeGraphics(makeTriangle,CPX.unit.Click,map.dispay.unit,dhex,[10,"black","green"]);
    }
  }

  map.dispay.unit.x-= map.center.x;
  map.dispay.unit.y-= map.center.y;
  //add container to the stage
  map.dispay.stage.addChild(map.dispay.unit);
  //updates display
  map.dispay.stage.update();
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.display.makeCanvas = function (map,callback) {
  //pull the proper navigation buttons
  $("#footernav").enhanceWithin();

  $(".map").removeClass("active");
  $(".map").slideUp();
  if ( $( "#"+map._id ).length ) {
    if(map._type == "hexMap"){
      $("#exit").show();
      $("#exit").attr("data-id",map.slice(0,3).join(""));
    }
    else {
      $("#exit").hide();
      if(map._type == "atlas") {
        $("#enter").show();
      }
    }
    $( "#"+map._id ).addClass("active");
    $( "#"+map._id ).slideDown();
    return false;
  }
  else {
    var B= CPX.hex.mapBounds(map);
    $("#maps").append('<div id='+map._id+' class="map active"><canvas width="'+B.x+'" height="'+B.y+'"></canvas>');
    callback(map);
  }
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////

