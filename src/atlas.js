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


//////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*atlas generates a standard atlas map:
20 cells to a side : 1141 cells | 106717.7 sq mi
A cell has 6 mi to a side : 93.53 sq mi each
*/
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.atlas = function (opts) {
  var map = {
    _id: opts.seed.join(""),
    realm: opts.realm,
    parent: opts.parent,
    seed : opts.seed,
    _hexradius : 35,
    _type: "atlas",
    _dtype : "cells",
    _pointy : opts.pointy,
    _radial : true,
    _terrain : opts.cell.terrain,
    _climate : opts.cell.climate,
    explored : [],
    cells: {},
    zones: [],
    units: []
  },
  cell = opts.cell;

  map.RNG = new Chance(map.seed.join(""));

  var scale = 20, R=[], ac={};
  var NT = {
    "0" : [3,4,1,2,5,6],
    "1" : [3,4,0,2,5,6],
    "2" : [5,3,0,1,4,6],
    "3" : [4,5,0,1,2,6],
    "4" : [3,5,0,1,2,6],
    "5" : [6,3,0,1,2,4],
    "6" : [5,4,0,1,2,3]
  }

  //make 1 zone to contain all zones
  map.zones.push(new Zone(map,0));

  //create all of the atlas cells
  for (var i = -scale ; i < scale; i++) {
    for (var j = -scale; j < scale; j++) {
      d = CPX.hex.axialD({q:0,r:0},{q:i,r:j});
      if(d >= scale ) { continue; }

      ac = new HCell(i,j,cell.terrain,map.zones[0]);
      ac.climate = cell.climate;
      ac.element = map.RNG.weighted(["standard","secret","resource","huntingground","feature","difficult"], [3/10,1/10,1/10,2/10,3/20,3/20]);

      map.cells[ac.id] = ac;
      R.push(ac.id)
    }
  }

  CPX.hexMap.bounds(map);

  function makeTerrain(n,nttype) {
    var array=[], newhex = {};
    for (var i = 0; i < n; i++) {
      newhex = CPX.atlas.existingHex(map,R,array);
      array.push(newhex.id);
      newhex.terrain = nttype;
    }
  }

  //generate secondary terrain
  var n = Math.round(R.length*8/24), rn=0, count = 0;
  while (n>0) {
    rn = map.RNG.natural({min: 1, max: n});
    if(count > 10) { rn = n; }
    makeTerrain(rn,NT[cell.terrain][0]);
    n-=rn;
    count++;
  }

  //generate tertiary terrain
  n = Math.round(R.length*2/24);
  count = 0;
  while (n>0) {
    rn = map.RNG.natural({min: 1, max: n});
    if(count > 7) { rn = n; }
    makeTerrain(rn,NT[cell.terrain][1]);
    n-=rn;
    count++;
  }

  //generate wildcard terrain
  nw = NT[cell.terrain].slice(2);
  n = Math.round(R.length*1/24);
  while (n>0) {
    rn = map.RNG.natural({min: 1, max: n});
    makeTerrain(rn,map.RNG.pickone(nw));
    n-=rn;
  }

  CPX.atlas.locations(map);
  CPX.atlas.majorSites(map,cell);
  CPX.atlas.explored(map);

  delete map.RNG;
  CPXDB[map._id] = map;

  return map._id;
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.atlas.existingHex = function (map,pickfrom,selected) {
  var nhex = {}, initial = {}, rid ="";

  do {
    if(selected.length == 0){
      initial = map.cells[map.RNG.pickone(pickfrom)];
    }
    else {
      initial = map.cells[map.RNG.pickone(selected)];
    }
    rid = map.RNG.pickone(CPX.hex.neighboorIDs(initial));
    nhex = map.cells[rid];
  }
  while (nhex == undefined || selected.includes(nhex.id));
  return nhex;
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.basicVisibility = function (map,scale) {
  var visibility = [0,5,10,30,50,50,100,100,100,100];
  if(map.RNG.bool({likelihood: visibility[scale]})){
    return true;
  }
  else { return false; }
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Populate atlas with coolness - adventuring locales
CPX.atlas.locations = function (map) {
  var cA=CPX.cellArray(map),
  //E is the probability of a "major" location, it is based on terrain type
  T = {
    "0" : [10,1],
    "1" : [20,2],
    "2" : [20,2],
    "3" : [60,6],
    "4" : [40,4],
    "5" : [40,4],
    "6" : [20,2]
  },
  C = [-10,-5,0,5,10],
  scales = {
    pop: [3,2],
    site: [[6,"rare"],[5,"unusual"]],
    ruin: [[5,"rare"],[4,"unusual"]],
    lair: ["rare","unusual"],
    order: [[2,"rare"],[1,"unusual"]],
    hideout: [[3,"rare"],[2,"unusual"]]
  };

  //n is roughly the area of the atlas / 375
  var n = 225, majP = 0, cell={}, nMin = 0, cid="", type="";
  //check for every cell
  for (var i = 0; i < n; i++) {
    //chance for major encounter is based upon terrain and climate
    majP = T[map._terrain][0]+C[map._climate];
    //if true, there is a major item
    if(map.RNG.bool({likelihood: majP})){
      //random cell
      cid = map.RNG.pickone(cA);
      cA.splice(cA.indexOf(cid),1);
      //pick the type of item
      type = map.RNG.pickone(["pop","ruin","lair","site","order","hideout"]);
      //generator function
      CPX.hex[type](map,map.cells[cid],scales[type][0]);
    }
    //check for minor item
    for (var j = 0; j < T[map._terrain][1]; j++) {
      //d6 roll, on a 1 a minor item
      if(map.RNG.d6() == 1){
        //random cell
        cid = map.RNG.pickone(cA);
        cA.splice(cA.indexOf(cid),1);
        //pick the type of item
        type = map.RNG.pickone(["pop","ruin","lair","site","order","hideout"]);
        //generator function
        CPX.hex[type](map,map.cells[cid],scales[type][1]);
      }
    }
  }
}
CPX.atlas.majorPop = function (map,cell,pop,cA) {
  //n is the number of sub-pop sites 10 times the average size
  var n = Math.round(CPX.size(map.RNG)/2*10), group=[], cid = "", idx=0, nx=0,
  subP = Object.assign({}, pop);
  subP.scale--;

  if(objExists(pop.subtype)) {
    if(S.subtype=="hideout")  { subP.visible = false; }
  }

  //for each of the sub sites
  for (var i = 0; i < n; i++) {
  //if the pop is less than scale 6
    if(subP.scale < 7) {
    //pick a random cell and remove it from the list so it isn't picked again
      cid = map.RNG.pickone(cA);
      cA.splice(cA.indexOf(cid),1);
      //load the seed & push the pop data to the cell
      idx = map.cells[cid].special.length;
      subP.seed = map.seed.concat([cid,"p"+idx]);
      map.cells[cid].special.push(subP);
    }
    //if it is scale 6 or bigger - see how many cells it takes up
    else {
      group = []; cid="";
      //determine the number of cells it will take up - easy conversion 1 hex per million
      nx = Math.floor(Math.pow(10, subP.scale-6));
      //make a pop cell for every nx
      for (var j = 0; j < nx; j++) {
        //pick a random cell neighboor and remove it from the list so it isn't picked again
        cid = CPX.atlas.existingHex(map,cA,group).id;
        cA.splice(cA.indexOf(cid),1);
        //add it to the array of picked cells
        group.push(cid);
        //load the seed & push the pop data to the cell
        idx = map.cells[cid].special.length;
        subP.options.seed = map.seed.concat([cid,"p"+idx])
        map.cells[cid].special.push(subP);
      }
    }
  }
}
CPX.atlas.majorSites = function (map,cell) {
  var cA = CPX.cellArray(map), cid ="", cn=[], ms={},
  n = 0, idx = 0, group=[];

  //loop through the special sites in parent cell
  cell.special.forEach(function (S) {
    //if the type is pop - place it on the map
    if(S.type == "pop"){
      CPX.atlas.majorPop(map,cell,S,cA);
    }
    else {
      ms = Object.assign({}, S);
      ms.visible = CPX.basicVisibility(map,S.scale);
      //scale is less than eight - one hex
      if (S.scale<8) {
        //pick a random cell and remove it from the list so it isn't picked again
        cid = map.RNG.pickone(cA);
        cA.splice(cA.indexOf(cid),1);
        //determine the index of the seed
        idx = map.cells[cid].special.length;
        ms.terrain = map.cells[cid].terrain;
        ms.seed = map.seed.concat([cid,S.type[0]+idx]);
        //push the data to the cell
        map.cells[cid].special.push(ms);
      }
      //if it is 8 or more it will take up multiple hexes
      else {
        group = [];
        //the number of hexes is based on the scale
        n = Math.pow(10,S.scale-7);
        //for each hex, find a neighboor hex
        for (var i = 0; i < n; i++) {
          //pick a random cell neighboor and remove it from the list so it isn't picked again
          cid = CPX.atlas.existingHex(map,cA,group).id;
          cA.splice(cA.indexOf(cid),1);
          //add it to the array of picked cells
          group.push(cid);
          //determine the index of the seed
          idx = map.cells[cid].special.length;
          ms.terrain = map.cells[cid].terrain;
          ms.seed = map.seed.concat([cid,S.type[0]+idx]);
          //push the data to the cell
          map.cells[cid].special.push(ms);
        }
      }
    }

  })
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.atlas.explored = function (map) {
  var modmapid = map.seed.slice(1).join("");
  if(!objExists(CPXDB[map.seed[0]].mods[modmapid])){
    return;
  }

  var elements = ["secret","resource","huntingground","feature"],
  types = ["pop","ruin","lair","site","order","hideout"],
  explored = CPXDB[map.seed[0]].mods[modmapid].explored, cell= {}, R={}, obj={},
  scales = { pop: 2, site: [4,"unusual"], ruin: [3,"unusual"], lair: "unusual", order: [2,"unusual"], hideout: [1,"unusual"] };

  explored.forEach(function (eid) {
    cell = map.cells[eid];
    if(!elements.includes(cell.element)){ return; }

    R = CPX.discovery[cell.element](map.seed.concat([cell.id,"ex"]));
    if(types.includes(R.type)){
      //generator function
      CPX.hex[R.type](map,cell,scales[R.type]);
      obj = cell.special[cell.special.length-1];
      obj.visible = R.visible;

      if(objExists(R.subtype)) { obj.subtype = R.subtype; }
      if(objExists(R.nature)) { obj.nature = R.nature; }
    }
  })
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.atlas.display = function (opts) {
  var seed = opts.map.seed.concat([opts.cell.id,"a"]),
  options = {
    cell: opts.cell,
    type: "atlas",
    seed:seed,
    realm:opts.map.realm,
    parent:[opts.map,opts.cell],
    pointy: !opts.map._pointy,
    scale:7
  };
  //check if the map exists - if it doesn't make it
  CPX.mapCheck(seed,options);
  //display it
  CPX.display.makeCanvas(CPXDB[seed.join("")],CPX.display.atlas);
  //adjust the center
  CPX.display.centerAdjust(CPXDB[seed.join("")]);
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Population centers know about surrounding sites - provide a map
CPX.atlas.popMaps = function (map,cell,pop) {
  var allCells = CPX.hex.withinX(cell,pop.scale).all, scell = {}, maps=[], update=false;
  allCells.forEach(function (cid) {
    if(objExists(map.cells[cid])){
      scell = map.cells[cid];
      var special = ["ruin","lair","encounters","site","pop"];

      for(var x in scell){
        if(special.includes(x)){
          if(!scell[x].visible){
            if(CPXC.bool()){
              if(CPX.user.updateVisible(map,cid+x[0])){
                update = true;
              }
            }
          }
        }
      }

    }
  })

  if(update){
    CPX.display.atlasLocations(map);
  }
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.atlas.locationVisible= function (site) {
  var realmid = site.seed[0],
  atlasid = site.seed.slice(1,3).join(""),
  visibleid = site.seed.slice(-2).join("");

  if(!objExists(USER[realmid][atlasid])) {
    USER[realmid][atlasid] = {
      visible: []
    };
  }

  if(site.visible || USER[site.seed[0]][atlasid].visible.includes(visibleid)){
    return true;
  }
  return false;
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.atlas.mapClick = function (event) {
  var target = event.target,
    data =target.data,
    cell = CPXDB[data.map].cells[data.cid],
    aucell = CPXAU.location[CPXAU.location.length-1],
    cellNeighboors = CPX.hex.neighboorIDs(cell);

  //DEBUG: show the data 
  console.log({e:cell.element,sp:JSON.stringify(cell.special)});
  //if a neighboor to the active unit - move the unit
  if(cellNeighboors.includes(aucell)) { 
    //set the location
    CPXAU.location = CPXDB[data.map].seed.concat([data.cid]);
    //display units
    CPX.display.units();
  }
  
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.display.atlasLocations = function (map) {
  var sitelist = ["encounter","lair","site","ruin","pop"];

  sitelist.forEach(function (sl) {
    map.dispay[sl] = new createjs.Container();
  });

  //display characteristics for the various places of interest
  var dchar = {
    "ruin":[4,"black","grey"],
    "lair":[4,"black","red"],
    "encounter":[4,"black","yellow"],
    "site":[4,"black","blue"],
    "pop":[4,"black","black"]
  }

  var c={}, ac={}, cdata={}, dhex={};
  for (var x in map.cells) {
    ac= map.cells[x];

    ac.special.forEach(function (S) {
      if(CPX.atlas.locationVisible(S)){
        cdata = {realm:map.realm, map:map._id, cid:ac.id, seed:map.seed};
        dhex = {hex:ac,map:map,data:cdata};

        CPX.display.makeGraphics(makeCircle,CPX.atlas.mapClick,map.dispay[S.type],dhex,dchar[S.type]);
      }
    })
  }

  sitelist.forEach(function (sl) {
    map.dispay.stage.addChild(map.dispay[sl]);
  });
  map.dispay.stage.update();

}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.display.atlas = function (map) {
  if(objExists(map.dispay)){
    delete map.dispay;
  }
  map.dispay = {data:{}};
  map.dispay.canvas = $( "#"+map._id + " canvas")[0];
  map.dispay.stage = new createjs.Stage(map.dispay.canvas);

  map.dispay.hexmap = new createjs.Container();

  var c={}, ac={}, cdata={}, dhex={};
  for (var x in map.cells) {
    ac= map.cells[x];
    cdata = {realm:map.realm, map:map._id, cid:ac.id, seed:map.seed};
    dhex = {hex:ac,map:map,data:cdata};

    CPX.display.makeGraphics(makeHex,CPX.atlas.mapClick,map.dispay.hexmap,dhex,[map._hexradius,"black",terrainColors[ac.terrain]]);
  }

  map.dispay.stage.addChild(map.dispay.hexmap);
  map.dispay.stage.update();

  CPX.display.atlasLocations(map);
  $("#exit").hide();
  $("#enter").hide();
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.atlas.enterHex = function (map,cell) {
  var header= "<h1 class='site'>"+CPXC.capitalize(TERRAINS[cell.terrain])+"</h1>",
  html = "<div class='site'>", special ="";

  html+= CPX.option({text:"Explore",classes:["atlasHexExplore"]});

  var specials = ["pop","ruin","site"], scaletitle = ["Settlement","Hamlet","Village","Town","City","Large City"], name="", sid="", obj={}, options={};
  cell.special.forEach(function (S) {
    if(CPX.atlas.locationVisible(S)) {
      //if the object doesn't exist load it
      if(!objExists(CPXDB[S.seed.join("")])) {
        //load the options with the parent overland map and the atlas map
        options = Object.assign({},S);
        options.parent = [map,cell];
        //call the constructor
        sid = CPX[S.type](options);
        //build the site object for use
        obj = CPXDB[sid];
      }
      else {
        sid = S.seed.join("");
        obj = CPXDB[sid];
      }
      if(S.type =="pop") {
        name = obj.name+" ("+scaletitle[S.scale-1]+")"
      }
      else {
        name = CPXC.capitalize(S.type);
      }

      special+= CPX.option({text:name,classes:["site"],data:[["id",sid]]});
    }

  })

  if(special.length>0) {
    html+="<h3 class='center site'>Sites</h3>"+special;
  }
  html += "</div>";

  var footer=CPX.option({text:"Exit",classes:["atlasHexExit"],data:[["exitsite",cell.id]]});

  CPX.display.html(true,header,html,footer);
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////
$(document).on('click',".atlasHexExplore",function(e) {
  //get the atlas map, realm, and cell
  var atlas = CPXDB[$(".map.active").attr("id")],
  cell = atlas.cells[CPXAU.location[3]];

  /*
  var explore = ["secret","resource","huntingground","feature"];
    if(explore.includes(cell.element)){
      var R = CPX.discovery[cell.element](CPXAU.location.concat(["ex"]));
   }
   */

  cell.special.forEach(function (S) {
    if(!S.visible) {
      CPX.user.updateVisible(atlas,S.seed.slice(-2).join(""));
    }
  })

  CPX.atlas.enterHex(atlas,cell);
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////
$(document).on('click',".atlasHexExit",function(e) {
  $("#notify").slideUp();
});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
