var CREATURES = {
  creature : [["beast","monster"],[1,1]],
  beast : [["land","air","water"],[7/12,3/12,2/12]],
  land: ["termite","tick","snail","slug","worm","ant","centipede","scorpion","snake","lizard",
         "rat","weasel","boar","dog","fox","wolf","cat","lion","panther","deer","horse","ox",
         "rhino","bear","gorilla","ape","mammoth","dinosaur"],
  air : ["mosquito","firefly","locust","dragonfly","moth","bee","wasp","chicken","duck","goose",
         "jay","parrot","gull","pelican","crane","raven","falcon","eagle","owl","condor","pteranodon"],
  water : ["jellyfish","clam","eel","frog","fish","crab","lobster","turtle","alligator","shark",
           "squid","octopus","whale"],
  unnatural : [["undead", "planar", "divine"] , [8/12,3/12,1/12]],
  undead : [["haunt","wisp","ghost","banshee","wraith","wight","spirit lord","skeleton"],[1,1,1,1,1,1,1,1]],
  planar : [["imp", "lesser elemental", "lesser demon/horror", "greater elemental", "greater demon/horror", "devil/elemental lord"],[3/12,3/12,3/12,1/12,1/12,1/12]],
  divine : [["agent", "champion", "army", "avatar"], [5/12,4/12,2/12,1/12]],
  monster : [["uncommon", "rare", "legendary"] , [7/12,3/12,2/12]],
  uncommon : [["plant","fungus",["*beast","*undead"],["*beast","*beast"],["*beast","+ability"],["*beast","+feature"]],[1,1,1,1,1,1]],
  rare : [["slime",["*beast","+construct"],["*beast","+element"],["*beast","*unnatural"]],[1,1,1,1]],
  legendary : [[["*dragon"], "colossus", ["#uncommon","+huge"], ["#rare","+huge"], ["*beast","*dragon"], ["#uncommon","*dragon"], ["#rare","*dragon"]], [1/8,1/8,1/4,1/4,1/12,1/12,1/12]],
}
var CREATURESKILLLEVELS = {
  beast : [0,1,2,3,4],
  unusual : [1,2,3,4,5],
  rare : [2,3,4,5,6],
  legendary : [4,5,6,7,8]
}
var SPECIALNATURE = {
  nature : ["brute","blaster","skirmisher","soldier","stalker","controller"],
  ability : ["bless","curse","entangle","poison","disease","paralyze","petrify","mimic",
  "camouflage","hypnotize","dissolve","disintegrate","ignores armor", "ranged","flying",
  "armored","slicing","great strength","master combatant","deft","drain life","drain magic",
  "immunity","control minds","piercing","*magic","rolltwice"],
  aspect : ["power/strength","trickery/dexterity","time/constitution","knowledge/intelligence",
  "nature/wisdom","culture/charisma","war/lies/discord","peace/truth/balance","hate/envy",
  "love/admiration","*element","rolltwice"],
  element : ["air","earth","fire","water","life","death"],
  feature : ["vicious","multiple heads/headless","many eyes/one eye","many limbs/tails",
  "tentacles/tendrils","*aspect","*element","*magic","*oddity", "rolltwice"],
  magic : ["divination","enchantment","evocation","illusion","necromancy","summoning"],
  nappearing : ["solitary", "group", "horde"],
  tag : ["amorphous","construct","devious","intelligent","magical","organized",
  "planar","stealthy","terrifying","rolltwice"],
  oddity : ["particle swarm","geometric","chaotic","crystalline","fungal",
  "gaseous","smoke","illusionary"]
}
var COLORDESCRIPTORS = [
  "Inferno","Flame","Blaze","Pyre","Desert","War","Strife","Ravage","Crimson","Scarlet","Ruby",
  "Dire","Thorny","Proto","Storm","Lightning","Wind","Gale","Emerald","Moss","Malachite","Veridian",
  "Azure","Cobalt","Sapphire","Devious","Night","Shadow","Fear","Ice","Snow","Blizzard",
  "Stone","Cunning","Crystal","Rock","Crag","Doom","Death","Ruin","Null","Amber","Gold","Citrine",
  "Aurulent","Iron","Law","Protection","Void","Righteousness","Strong","Pale","Ashen",
  "Ghost","Silver","Alabaster","Ivory","Ghastly","Hoary","Pallid"
];
var MINIONS = {
  "brute":{skills:["Physique","Fight","Athletics"],tags:["foe"]},
  "blaster":{skills:["Shoot","Athletics","Fight"],tags:["foe"]},
  "skirmisher":{skills:["Athletics","Fight","Physique"],tags:["foe"]},
  "soldier":{skills:["Fight","Physique","Athletics"],tags:["foe"]},
  "stalker":{skills:["Stealth","Fight","Athletics"],tags:["foe"]},
  "controller":{skills:["Lore","Will","Athletics"],tags:["foe"]},
  //minoins for hire
  "Laborer":{id:"Laborer",cost:1,skills:["Physique","Crafts","Athletics"],tags:["basic","general"],inventory:["tools"]},
  "Soldier":{id:"Soldier",cost:1,skills:["Fight","Physique","Athletics"],tags:["basic","general"],inventory:["Longsword","Leather Armor"]},
  "Diplomat":{id:"Diplomat",cost:1,skills:["Rapport","Empathy","Investigate"],tags:["basic","special"],inventory:[]},
}

CPX.encounter = function (RNG,terrain,level) {
/*
1-4 Beast Activity, Disposition, No. Appearing, Size
5-6 Human Activity, Alignment, Disposition, No. Appearing, NPC tables
7 -8 Humanoid Activity, Alignment, Disposition, No. Appearing, NPC tables
9-12 Monster Activity, Alignment, Disposition, No. Appearing, Size
 Optional: Ability, Adjective, Age, Aspect, Condition, Feature, Tags
*/

}
CPX.creature = function (RNG,terrain,rank) {
  var creature = {};
  if(objExists(rank)) {
    if(rank == "beast"){ creature = CPX.creature.beast(RNG,terrain,rank); }
    else if(rank == "unusual"){ creature = CPX.creature.monster(RNG,terrain,"unusual"); }
    else if(rank == "rare"){ creature = CPX.creature.monster(RNG,terrain,"rare"); }
    else if(rank == "legendary"){ creature = CPX.creature.monster(RNG,terrain,"legendary"); }
  }
  else {
    var ma = RNG.weighted(CREATURES.creature[0],CREATURES.creature[1]);
    creature = CPX.creature[ma](RNG,terrain,rank);
  }
/*
defense : [[0,1,2,3,4,5],[]]
1 Tiny
2-3 Small
4-9 medium-sized
10-11 Large
12 Huge
*/
  
  creature.type = "pop";
  creature.subtype = "creature";
  creature.scale = 0;
  creature.maxskill = RNG.weighted(CREATURESKILLLEVELS[creature.rank],[0.1,0.2,0.4,0.2,0.1]);
  creature.nappearing = RNG.weighted(SPECIALNATURE.nappearing,[0.3,0.5,0.2]);
  creature.nature = RNG.pickone(SPECIALNATURE.nature);
  creature.text = RNG.pickone(COLORDESCRIPTORS);

  return creature;
}
CPX.creature.constructor = function (nature,RNG,strtest,terrain,rank) {
  var R = {special:[]}, OBJ={}, etext ="", temp = "";
  R[nature] = [];
  
  if(nature == "creature") { OBJ = CREATURES; }
  else if (nature == "people") { OBJ = PEOPLES; }
  
  //direct array in the people
  if(objExists(OBJ[strtest])){
    //single array
    R[nature].push(RNG.pickone(OBJ[strtest]));
  }
  else if (strtest[0] == "#") {
    etext = strtest.slice(1);
    //double array is a weighted function 
    temp = RNG.weighted(OBJ[etext][0],OBJ[etext][1]);
    //it gets tricky if the result is another array - we have to run the constructor function
    if(Array.isArray(temp)) {
      var dtemp = {};
      //run the constructor function and load the result
      temp.forEach(function(el) {
        dtemp = CPX.creature.constructor(nature,RNG,el,terrain,rank);
        R[nature] = R[nature].concat(dtemp[nature]);
        R.special = R.special.concat(dtemp.special);
      });
    }
    //otherwise just push the result
    else { 
      R = CPX.creature.constructor(nature,RNG,temp,terrain,rank);
    }
  }
  //this is a people generator function
  else if (strtest[0] == "*") {
    etext = strtest.slice(1);
    //gerate the people
    R = CPX[nature][etext](RNG,terrain,rank);
  }
  //this is a special generator function
  else if (strtest[0] == "+") {
    etext = strtest.slice(1);
    //if it is in special nature use the function
    if(objExists(SPECIALNATURE[etext])) { 
      R.special = CPX.creature.special(RNG,etext); 
    }
    //otherwise just push the special
    else { R.special.push(etext)  }
  }
  //nothing special, just push it to the array
  else { R[nature].push(strtest); }
  return R;
}
CPX.creature.special = function (RNG,type) {
  var r = [];

  function roll (array) {
    return RNG.pickone(array)
  } 

  r.push(roll(SPECIALNATURE[type]));

  if(r.includes("rolltwice")) {
    var newarray = SPECIALNATURE[type].slice().pop(); 
    r.length = 0;
    r.push(roll(newarray));
    r.push(roll(newarray));
  }

  r.forEach(function(el){
    if(el[0] == "*"){
      var newtype = el.slice(1); 
      el = roll(SPECIALNATURE[newtype]);
    }
  });

  return r;
}
//beast
CPX.creature.beast = function (RNG,terrain,rank) {
  var P = CREATURES.beast[1];
  if(terrain == 0) { P = [3/12,1/12,7/12]; }

  var ba = RNG.weighted(CREATURES.beast[0],P),
  bb = RNG.pickone(CREATURES[ba]);

  return {
    rank : "beast",
    creature : [bb],
    special : []
  }
}
//monster
CPX.creature.monster = function (RNG,terrain,rank) {
  if(!objExists(rank)) {
    rank = RNG.weighted(CREATURES.monster[0],CREATURES.monster[1]);
  }
  mb = RNG.weighted(CREATURES[rank][0],CREATURES[rank][1]);

  var creature = {creature:[],special:[]}, temp={};

  if(Array.isArray(mb)){
    mb.forEach(function(el) {
      temp = CPX.creature.constructor("creature",RNG,el,terrain,rank);
      creature.creature = creature.creature.concat(temp.creature);
      creature.special = creature.special.concat(temp.special);
    });
  }
  else { creature = CPX.creature.constructor("creature",RNG,mb,terrain,rank); }

  creature.rank = rank;
  return creature;
}
CPX.creature.dragon = function (RNG,terrain,rank) {
  var special = CPX.creature.special(RNG,"ability");
  special = special.concat(
    CPX.creature.special(RNG,"element"),
    CPX.creature.special(RNG,"feature"),
    CPX.creature.special(RNG,"tag")
    );

  return {
    creature : ["dragon"],
    special : special
  } 
}
//unnatural
CPX.creature.unnatural = function (RNG,terrain,rank) {
  var ua = RNG.weighted(CREATURES.unnatural[0],CREATURES.unnatural[1]);
  return CPX.creature[ua](RNG);
}
//Undead
CPX.creature.undead = function (RNG,terrain,rank) {
  var ua = RNG.weighted(CREATURES.undead[0],CREATURES.undead[1]);
  //Ability, Activity, Alignment, Disposition
  return {
    creature : [ua],
    special : CPX.creature.special(RNG,"ability")
  }
}
//Planar
CPX.creature.planar = function (RNG,terrain,rank) {
  var ua = RNG.weighted(CREATURES.planar[0],CREATURES.planar[1]);
  //Ability, Element, Feature, Tag, Activity, Alignment, Disposition, 
  var special = CPX.creature.special(RNG,"ability");
  special = special.concat(
    CPX.creature.special(RNG,"element"),
    CPX.creature.special(RNG,"feature"),
    CPX.creature.special(RNG,"tag")
    ); 

  return {
    creature : [ua],
    special : special
  }
}
//divine
CPX.creature.divine = function (RNG,terrain,rank) {
  var ua = RNG.weighted(CREATURES.divine[0],CREATURES.divine[1]);
  //Aspect, Ability, Element, Feature, Tag, Activity, Alignment, Disposition, 
  var special = CPX.creature.special(RNG,"aspect");
  special = special.concat(
    CPX.creature.special(RNG,"ability"),
    CPX.creature.special(RNG,"element"),
    CPX.creature.special(RNG,"feature"),
    CPX.creature.special(RNG,"tag")
    ); 

  return {
    creature : [ua],
    special : special
  }
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////
var PEOPLES = {
  human : ["Human"],
  demi : ["Elf","Dwarf"],
  smallfolk : ["Gnome","Halfling","Kobold"],
  monstrous : ["Nightelf","Orc","Goblin","Hobgoblin","Ogre","Troll","Gnoll", "Minotaur","Lizard-people",
    "Snake-people","Dog-people","Cat-people","Mantis-people","Naga"],
  hybrid : ["Ape","Badger","Bat","Bear","Beetle","Boar","Cat","Cetnipede","Deer","Dog","Eagle","Elephant",
    "Frog","Goat","Horse","Lion","Mantis","Owl","Panther","Rat","Raven","Rhinoceros","Scorpion","Snake",
    "Spider","Tiger","Vulture","Wasp","Weasel","Wolf","Crab","Crocodile","Octopus","Shark","Eel"],
  uncommonraces : ["Thornling","Mycomid"],
  rareraces : ["*elemental","*giant","Treant"],
  common : [["human","demi","smallfolk","monstrous"],[0.5,0.25,0.1,0.15]],
  uncommon : [["uncommonraces","hybrid",["#common","+element"]], [1,2,2]],
  rare : [["rareraces",["#common","+construct"],["uncommonraces","hybrid"],["hybrid","hybrid"],
    ["hybrid","+element"],["#common","+ability","+element","+aspect"]], [1,1,1,1,1,1]],
  legendary : [["*dragon","*dragon"],[1,2]],
}

function professions (cRNG,profarray) {
  profarray = typeof profarray === "undefined" ? [] : profarray;
  var type = ["Mystic Knights","Knights","Wizards","Priests","Monks"];
  return cRNG.pickone(type.concat(profarray));
}
CPX.people = function (RNG,terrain,rank) {
  if(!objExists(rank)) {
    rank = RNG.weighted(["common", "uncommon", "rare", "legendary"], [10,5,2,0.5]);
  }

  var pa = RNG.weighted(PEOPLES[rank][0],PEOPLES[rank][1]),
  people = {people:[],special:[]}, temp={};

  if(Array.isArray(pa)){
    pa.forEach(function(el) {
      temp = CPX.creature.constructor("people",RNG,el,terrain,rank);
      people.people = people.people.concat(temp.people);
      people.special = people.special.concat(temp.special);
    });
  }
  else { people = CPX.creature.constructor("people",RNG,pa,terrain,rank); }

  people.rank = rank;
  return people;
}
CPX.people.elemental = function(RNG) {
  var special = CPX.creature.special(RNG,"element");
  special = special.concat(
    CPX.creature.special(RNG,"ability"),
    CPX.creature.special(RNG,"tag")
    ); 

  return {
    people : ["elemental"],
    special : special
  }
}
CPX.people.giant = function(RNG) {
  var special = CPX.creature.special(RNG,"element");

  return {
    people : ["giant"],
    special : special.push("huge")
  }
}
CPX.people.dragon = function (RNG,terrain,rank) {
  var special = CPX.creature.special(RNG,"ability");
  special = special.concat(
    CPX.creature.special(RNG,"element"),
    CPX.creature.special(RNG,"feature"),
    CPX.creature.special(RNG,"tag")
    );

  return {
    people : ["dragon"],
    special : special
  } 
}
