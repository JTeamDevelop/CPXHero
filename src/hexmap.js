/*
    A hex plane random generator

    This is free because the grace of God is free through His son Jesus.

	The code is Copyright (C) 2016 JTeam

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>

*/

///////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.mapDimensions = function () {
  var width =document.getElementById("maps").offsetWidth*.95,
    height = document.getElementById("maps").offsetHeight*.95;

  return {width:width,height:height};
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.hexMap = function (opts) {
  var map = {
    _type : "hexMap",
    _dtype : "zones",
    _radial : false,
    _hexradius : 35,
    seed : typeof opts.seed === "undefined" ? [CPXC.string({length: 32, pool: base62})] : opts.seed,
    cells : {},
    zones : [],
    units : [],
    mods : {}
  }

  map._id = map.seed.join("");
  map.parent = typeof opts.parent === "undefined" ? "" : opts.parent;

  map.special = typeof opts.special === "undefined" ? [] : opts.special;

  map._pointy = typeof opts.pointy === "undefined" ? true : opts.pointy;

  map._scale = typeof opts.scale === "undefined" ? 1 : opts.scale;
  map._minScale = typeof opts.minScale === "undefined" ? 1 : opts.minScale;
  map._dscale = map._minScale;

  map._nZones = typeof opts.nZones === "undefined" ? -1 : opts.nZones;
  map._nCells = typeof opts.nCells === "undefined" ? 0 : opts.nCells;
  //uniform distribution of planes = no zones used
  var uniform = typeof opts.uniform === "undefined" ? false : opts.uniform;

  map._visible = typeof opts.visible === "undefined" ? [] : opts.visible;
  map._zoneEnter = typeof opts.zoneEnter === "undefined" ? -1 : opts.zoneEnter;

  map._parentNeighboors = typeof opts.parentNeighboors === "undefined" ? [] : opts.parentNeighboors;


  //since we are passing an array use the ES6 spread(...) command
  map.RNG = new Chance(map.seed.join(""));
  map.realm = typeof opts.realm === "undefined" ? map.seed[0] : opts.realm;
  map._size = typeof opts.size === "undefined" ? CPX.size(map.RNG)/2 : opts.size;

  if(map._nZones == -1  && !uniform){
    map._nZones = Math.round(Math.pow(10,map._scale-map._dscale)*map._size);

    for (var i = 0; i < map._nZones; i++) {
      CPX.hexMap.addZone(map);
    }
  }

  if(uniform) {
    //if uniform a number of cells has to be provided
    if(map._nCells == 0){
      //based on size
      for (var i = 0; i < map._size; i++) {
        map._nCells += Math.round(map.RNG.normal({mean: 40, dev: 7}));
      }
    }
    //make 1 zone to contain all zones
    map.zones.push(new Zone(map,0));
    //for every cell add one
    for (var i = 0; i < map._nCells; i++) {
      CPX.hexMap.addCell(map);
    }
  }

  CPX.hexMap.makeVisible(map);
  CPX.hexMap.zoneGates(map);
  CPX.hexMap.zoneNeighboors(map);
  CPX.hexMap.populations(map);

  delete map.RNG;
  
  CPX.hexMap.bounds(map);

  if(objExists(opts.dataOnly)){
    return map;
  }

  CPXDB[map._id] = map;
  return map._id;

}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.hexMap.save = function (map,options) {
  var data = {
    seed: map.seed,
    type: "hexMap",
    mods: map.mods,
    options: options,
    realm: map.realm
  }
  localStorage.setItem(map._id,JSON.stringify(data));
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.hexMap.addZone = function (map) {
  var size = CPX.size(map.RNG),
    nz = map.zones.length, Z = new Zone(map,nz);

  Z.size = size/2;

  map.zones.push(Z);

  var rZ=map.RNG.pickone(map.zones), nA=[], nid="";

  for (var i = 0; i < size*3/2; i++) {
    nid="";
    //new map - first cell is at 0,0
    if(nz==0 && i==0) {
      nid="0_0";
    }
    else {
      //first cell in new zone has to start at a random zone
      if(i==0) {
        while (nA.length==0) {
          nA = CPX.hexMap.zoneEmptyNeighboors(map,rZ.id);
          rZ = map.RNG.pickone(map.zones);
        }
      }
      //otherwise we get edges from the zone
      else {
        nA = CPX.hexMap.zoneEmptyNeighboors(map,Z.id);
        //if no new id - it is encased, move one to new zone
        if (nA.length==0){
          break;
        }
      }
      nid = map.RNG.pickone(nA);
    }

    var cXY = CPX.hex.cellQR(nid);
    map.cells[nid] = new HCell(cXY.q,cXY.r,-1,Z);
    Z.cells.push(nid);
    map._nCells++;
  }

  CPX.hexMap.zoneBounds(map,Z.id);
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.hexMap.addCell = function (map) {
  var Z=map.zones[0], nid="", nA=[];

  //new map - first cell is at 0,0
  if(!objExists(map.cells["0_0"])){
    nid = "0_0"
  }
  else {
    //get the empty neighboors
    nA = CPX.hexMap.zoneEmptyNeighboors(map,Z.id);
    nid = map.RNG.pickone(nA);
  }

  var cQR = CPX.hex.cellQR(nid);
  map.cells[nid] = new HCell(cQR.q,cQR.r,-1,Z);
  Z.cells.push(nid);
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////
//cell immediate neighboors
CPX.hexMap.cellNeighboors = function (map,cell) {
  var R={n:[],o:[]};
  //n will be neighboors, o will be open cells
  var neighboors = CPX.hex.withinX(cell,1)[1];
  for (var i = 0; i < neighboors.length; i++) {
    if(objExists(map.cells[neighboors[i].id])){
      R.n.push(neighboors[i].id);
    }
    else {
      R.o.push(neighboors[i].id);
    }
  }
  return R;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.hexMap.bounds = function (map) {
  var cell={}, rmax=0, qmax=0, rmin=0, qmin=0;

  for (var x in map.cells) {
    cell = map.cells[x];
    if(cell.q<qmin) { qmin = cell.q; }
    if(cell.q>qmax) { qmax = cell.q; }
    if(cell.r<rmin) { rmin = cell.r; }
    if(cell.r>rmax) { rmax = cell.r; }
  }

  map.q = qmin;
  map.r = rmin;
  map.width = Math.abs(qmax-qmin);
  map.height = Math.abs(rmax-rmin);
  map.center = {
    q:qmin+map.width/2,
    r:rmin+map.height/2
  };

  map.bounds = CPX.hex.mapBounds(map);
  var center = CPX.hex.center(map._hexradius,map.center,map._pointy);
  map.center.x = center.x;
  map.center.y = center.y;
   
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.hexMap.zoneBounds = function (map,zid) {
  var Z = map.zones[zid], cell={}, rmax=0, qmax=0, rmin=0, qmin=0;

  for (var i = 0; i < Z.cells.length; i++) {
    cell = map.cells[Z.cells[i]];
    if(cell.q<qmin) { qmin = cell.q; }
    if(cell.q>qmax) { qmax = cell.q; }
    if(cell.r<rmin) { rmin = cell.r; }
    if(cell.r>rmax) { rmax = cell.r; }
  }

  Z.q = qmin;
  Z.r = rmin;
  Z.width = Math.abs(qmax-qmin);
  Z.height = Math.abs(rmax-rmin);
  Z.center = {q:qmin+Z.width/2,r:rmin+Z.height/2};
  Z.radius = Math.sqrt((qmin+Z.width)*(qmin+Z.width)+(rmin+Z.height)*(rmin+Z.height));

  return Z;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.hexMap.makeVisible = function (map) {
  var count = 0;
  for (var i = 0; i < map.zones.length; i++) {
    if(map._visible.includes(i) || map._visible.includes("all")) {
      map.zones[i].visible = true;
      count++;
    }
  }

  if(map._zoneEnter == -1) {
    var edge = CPX.hexMap.zoneOnEdge(map);
    map._zoneEnter = map.RNG.pickone(edge);
  }

  if(count == 0){
    map.zones[map._zoneEnter].visible = true;
  }
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
//get Zone empty cell neighboors
CPX.hexMap.zoneEmptyNeighboors = function (map,zid) {
  var Z = map.zones[zid], cA=[];
  for (var i = 0; i < Z.cells.length; i++) {
    cA = cA.concat(CPX.hexMap.cellNeighboors(map,map.cells[Z.cells[i]]).o);
  }

  return cA.unique();
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.hexMap.zoneOnEdge = function (map) {
  var edge = [];
  for (var x in map.cells) {
    if(CPX.hexMap.cellNeighboors(map,map.cells[x]).o.length>0){
      edge.push(map.cells[x].zone);
    }
  }

  return edge.unique();
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////
//provides the zones with a list of their zone neighboors
CPX.hexMap.zoneNeighboors = function (map) {
  var ZN = [], Zid = -1, nZid=-1, cN=[];
  for (var x in map.cells) {
    Zid = map.cells[x].zone;
    if(!objExists(ZN[Zid])) {
      ZN[Zid] = [];
    }

    cN = CPX.hexMap.cellNeighboors(map,map.cells[x]).n;
    for (var i = 0; i < cN.length; i++) {
      nZid = map.cells[cN[i]].zone;
      if(Zid != nZid) {
        if(!ZN[Zid].includes(nZid)) {
          ZN[Zid].push(nZid);
        }
      }
    }
  }

  map._ZN = ZN;
  return ZN;
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Gates to other parent neighboors
CPX.hexMap.zoneGates = function (map) {
  var zone = {}
  map._parentNeighboors.forEach(function (pN) {
    zone = map.RNG.pickone(map.zones);
    if(objExists(zone.gate)) {
      zone.gate.push(pN);
    }
    else {
      zone.gate = [pN];
    }
  })
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.hexMap.populations = function (map) {
  map.special.forEach(function(S){
    if(S.type=="pop") { 
      //see if any mods exist for the number of the pop
      mod = CPX.realm.modCheck(map,["special",S.id,"n"]);
      if(mod.status) { S.n+=mod.val; }
    }
  });
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.hexMap.encounter = function (map,zone) {
  var pop = [], prob=[], modobj = CPXDB[map.seed[0]].mods[map.seed.slice(1).join("")], mod={};

  map.special.forEach(function(S){
    if(S.type=="pop") { 
      pop.push(S);
      prob.push(S.n);       
    }
  });
  //if there is a pop to pull from randomly determine the encounter based upon total population
  if(pop.length != 0 || prob.reduce( ( acc, cur ) => acc + cur, 0 ) != 0 ) {
    CPX.fight.build([map,zone],CPXC.weighted(pop,prob));
  }
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.hexMap.display = function (opts) {
  var vmapid = opts.map.seed.slice(1).join("");
  if(!objExists(USER[opts.map.realm][vmapid])) {
    USER[opts.map.realm][vmapid] = {
      visible: []
    };
  }

  //make the canvas
  CPX.display.makeCanvas(opts.map,CPX.display.hexMap);
  //enter the first zone
  CPX.hexMap.enterZone(opts.map,opts.map.zones[opts.map._zoneEnter]);
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.hexMap.enterZone = function (map,zone) {
  CPXAU.location = map.seed.concat([zone.id]);

  //the zone is now explored

  //user can now see the neighboor zones
  map._ZN[zone.id].forEach(function(el){
    CPX.user.updateVisible(map,el);
  })
  
  //basic layout of zone - same every time
  var dP=30, temp = {
    seed : map.seed.concat([zone.id]).join("")
  }
  temp.RNG = new Chance(temp.seed);
  var R=CPX.explore(temp.RNG,map._subtype,dP);
  temp = null;

  //random encounter
  if(map._subtype=="lair") { dP = 50; }
  if(CPXC.bool({likelihood:dP})) { 
    CPX.hexMap.encounter(map,zone);
  }

  console.log(R);
  
  //update display for the move
  CPX.display.drawHex(map);
  CPX.display.centerAdjust(map);
  CPX.display.units();
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.hexMap.mapClick = function (e) {
  var target = e.target,
    data =target.data,
    map = CPXDB[data.map],
    cell = map.cells[data.cid],
    zone = map.zones[cell.zone], 
    auzid = CPXAU.location[CPXAU.location.length-1];

  //if it is the zone with the active unit offer some options
  if(CPXAU.location.join("").includes(map._id) && auzid == zone.id) {

  }
  else {
    //move the active unit if it is a neighboor zone
    if(map._ZN[auzid].includes(zone.id)) { 
      CPX.hexMap.enterZone(map,zone);
    }
  }
  
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.display.drawHex = function (map) {
  if(objExists(map.dispay.hexmap)){
    //remove it and start fresh
    map.dispay.stage.removeChild(map.dispay.hexmap);
  }
  map.dispay.hexmap = new createjs.Container();

  var c={}, ac={}, cdata={}, dhex={}, color ="", alpha = 0.5;
  for (var x in map.cells) {
    ac= map.cells[x];

    if(map.zones[ac.zone].visible || USER[map.realm][map.seed.slice(1).join("")].visible.includes(ac.zone)) {
      cdata = {realm:map.realm, map:map._id, cid:ac.id, seed:map.seed};
      dhex = {hex:ac,map:map,data:cdata};
      //keep the alpha at 0.5 unless the current unit is in the zone
      alpha = 1;
      if(CPXAU.location.join("").includes(map.seed.join("")) && CPXAU.location[CPXAU.location.length-1] == ac.zone) {
        alpha =1;
        dhex.unit = true;
      }
      //set the color based upon the zone color
      color = hexToRgbA(map.zones[ac.zone].color,alpha);
      if(map._type == "hexPlane"){
        color = terrainColors[ac.terrain];
      }

      CPX.display.makeGraphics(makeHex,CPX[map._type].mapClick,map.dispay.hexmap,dhex,[map._hexradius,"black",color]);
    }
  }

  map.dispay.stage.addChild(map.dispay.hexmap);

}

///////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.display.hexMap = function (map) {
  if(objExists(map.dispay)){
    delete map.dispay;
  }
  map.dispay = {data:{}};
  map.dispay.canvas = $( "#"+map._id + " canvas")[0];
  map.dispay.stage = new createjs.Stage(map.dispay.canvas);

  function highlightZone(zone) {
    zone.cells.forEach(function (cell) {
      var cd = map.display[cell];
      cd.graphics = makeHex("black",hexToRgbA(cd.data.color,1),cd.data.x,cd.data.y);
    })
  }

  function dimZone(zone) {
    zone.cells.forEach(function (cell) {
      var cd = map.display[cell];
      cd.graphics = makeHex(hexToRgbA(cd.data.color,0.4),hexToRgbA(cd.data.color,0.4),cd.data.x,cd.data.y);
    })
  }

  function mouseover(event) {
    var target = event.target;
    highlightZone(map.zones[target.data.zone]);
  }

  function mouseout(event) {
    var target = event.target;
    dimZone(map.zones[target.data.zone]);
  }

  function cellClick(event) {
    var target = event.target;
    dimZone(map.zones[target.data.zone]);
  }

  CPX.display.drawHex(map);

  $("#enter").hide();
  if(map.parent.length>0){
    $("#exit").show();
    $("#exit").attr("data-id",map.seed.slice(0, 3).join(""));
  }

}
