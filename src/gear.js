var GEAR = {
	//Basic gear
	"Adventuring Gear":{id:"Adventuring Gear",cost:1,use:5,wt:1,tags:["gear","basic"]},
	"Healing Potion":{id:"Healing Potion",cost:1,use:1,wt:0,tags:["gear","basic"]},
	"Sunwand":{id:"Sunwand",cost:1,use:1,wt:0,tags:["gear","basic"]},
	"Antitoxin":{id:"Antitoxin",cost:1,use:1,wt:0,tags:["gear","basic"]},
	"Rations":{id:"Rations",cost:1,use:5,wt:1,tags:["gear","basic"]},
	//Ranged weapons
	"Longbow":{id:"Longbow",cost:1,dmg:0,range:"1",ammo:"arrows",special:["range","ammo"],tags:["weapon","bow","ranged","basic"]},
	"Compound Bow":{id:"Compound Bow",cost:1,dmg:1,range:"0",ammo:"arrows",special:["range","ammo"],tags:["weapon","bow","ranged","basic"]},
	"Shortbow":{id:"Shortbow",cost:1,dmg:0,range:"0",ammo:"arrows",special:["range","ammo"],tags:["weapon","bow","ranged","basic"]},
	"Crossbow":{id:"Crossbow",cost:1,dmg:1,range:"0",ammo:"arrows",special:["range","ammo"],tags:["weapon","crossbow","ranged","basic"]},
	//Ranged ammo
	"Arrows":{id:"Arrows",cost:1,use:4,wt:1,special:[],tags:["ammo","basic"]},
	"Bolts":{id:"Bolts",cost:1,use:4,wt:1,special:[],tags:["ammo","basic"]},
	//Melee weapons
	"Club":{id:"Club",cost:1,dmg:0,special:[],tags:["weapon","basic"]},
	"Staff":{id:"Staff",cost:1,dmg:0,special:[],tags:["weapon","basic"]},
	"Dagger":{id:"Dagger",cost:1,dmg:0,range:"0",special:["throw"],tags:["weapon","basic"]},
	"Short sword":{id:"Short sword",cost:1,dmg:0,special:[],tags:["weapon","basic"]},
	"Axe":{id:"Axe",cost:1,dmg:0,special:[],tags:["weapon","basic"]},
	"Mace":{id:"Mace",cost:1,dmg:0,special:[],tags:["weapon","basic"]},
	"Warhammer":{id:"Warhammer",cost:1,dmg:0,special:[],tags:["weapon","basic"]},
	"Staff":{id:"Staff",cost:1,dmg:0,special:[],tags:["weapon","basic"]},
	"Spear":{id:"Spear",cost:1,dmg:0,range:"0",special:["throw"],tags:["weapon","basic"]},
	"Longsword":{id:"Longsword",cost:1,dmg:0,special:[],tags:["weapon","basic"]},
	"Battle Axe":{id:"Battle Axe",cost:1,dmg:0,special:[],tags:["weapon","basic"]},
	"Rapier":{id:"Rapier",cost:1,dmg:0,special:[],tags:["weapon","basic"]},
	//Armor
	"Leather":{id:"Leather",cost:1,armor:0,special:[],tags:["armor","basic"]},
	"Chainmail":{id:"Chainmail",cost:1,armor:1,special:[],tags:["armor","basic"]},
	"Scale mail":{id:"Scale mail",cost:1,armor:1,special:[],tags:["armor","basic"]},
	"Plate mail":{id:"Plate mail",cost:1,armor:2,special:[],tags:["armor","basic"]},
	"Shield":{id:"Shield",cost:1,armor:0,special:["deflect"],tags:["armor","basic"]}
}