SKILLS = ["Athletics", "Burglary", "Contacts", "Crafts", "Deceive", "Drive", "Empathy", "Fight", "Investigate",
  "Lore", "Notice", "Physique", "Provoke", "Rapport", "Resources", "Shoot", "Stealth", "Will"];
COLORS = {
  red:{rgba:"rgba(255,0,0,1)", element:["stength","mighty","fire","sun","war","force","spirit"]},
  orange:{rgba:"rgba(255,165,0,1)",element:["constitution","subtle","earth","healing","night","fertility","animal"]},
  yellow:{rgba:"rgba(255,255,0,1)",element:["dexterity","quick","weather","lightning","time","travel","wealth"]},
  green:{rgba:"rgba(0,128,0,1)",element:["intelligence","clever","air","knowledge","artifice","magic","winter"]},
  blue:{rgba:"rgba(0,0,255,1)",element:["wisdom","wise","water","mind","righteousness","law","protection"]},
  indigo:{rgba:"rgba(75,0,130,1)",element:["charisma","bold","charm","community","glory","luck","nobility"]}
};
LEVELS = [
  {aspects:2,stunts:2,skills:[2]},
  {aspects:3,stunts:3,skills:[3]},
  {aspects:3,stunts:3,skills:[2,2]},
  {aspects:4,stunts:4,skills:[4,2]},
  {aspects:4,stunts:5,skills:[4,2,1]},
  {aspects:5,stunts:5,skills:[4,3,2]},
  {aspects:5,stunts:6,skills:[4,3,2,1]},
  {aspects:6,stunts:7,skills:[4,4,3,1]},
  {aspects:6,stunts:7,skills:[3,4,3,2,1]},
  {aspects:7,stunts:8,skills:[3,4,4,2,2]},
  {aspects:7,stunts:9,skills:[1,4,4,3,2,1]},
  {aspects:8,stunts:9,skills:[0,2,4,4,3,2]},
  {aspects:8,stunts:10,skills:[1,1,5,4,3,2,1]},
  {aspects:9,stunts:10,skills:[1,1,1,5,4,3,2]},
  {aspects:9,stunts:11,skills:[0,1,2,5,4,3,2,1]}
]
STUNTS={
  anmlCTL : {tags:"animal,control",name:"Animal Control",shortText:"",effect:"boost",boost:"Rapport"},
  crtrSUM : {tags:"summon",name:"Creature Summoning",shortText:"",effect:"summon",limit:"Creature Type"},
  disgise : {tags:"disguise",name:"Disguise",shortText:"",effect:"boost",boost:"Deceive"},
  nrgyABS : {tags:"absorbption",name:"Energy Absorbption",shortText:"",effect:"absorb",limit:"Energy Type"},
  nrgyBST : {tags:"blast",name:"Energy Blast",shortText:"",effect:"blast",limit:"Energy Type"},
  suprSTR : {tags:"strength,super-ability",name:"Super Strength",shortText:"",effect:"boost",boost:"Pysique"}
}

ASPECTSALL = [];
for (var x in COLORS){
  ASPECTSALL = ASPECTSALL.concat(COLORS[x].element);
}
SKILLSCURRENT = SKILLS.concat([]);

CPX.display.heroEditor = function (unit,status) {
  var level = LEVELS[unit.level-1], html="<div class='heroEditor'>", shtml="", cskills=SKILLS.concat([]), slist="";
  header="<h1 data-id="+unit._id+">Hero Editor</h1>";

  if(unit.name == "") {
    html+='<h2>Name</h2><input type="text" name="uname" id="uname" value="" placeholder="Name">';
  }
  else {
    header = "<h1 data-id="+unit._id+">Hero Editor <div class=unitdata data-id=name>"+unit.name+"</div></h1>";
  }

  //list the aspects to choose from
  html+='<h3>Aspects</h3>';
  //container for aspects
  html+="<div class=aspectContainer>";

  //load the unit's aspects.
  var comma = ", "
  for (var i = 0; i < unit.aspects.length; i++) {
    if(i==unit.aspects.length-1) { comma = ""; }
    aspect = unit.aspects[i];
    html+="<span class=aspect data-type=aspect data-data="+aspect+">"+CPXC.capitalize(aspect)+"</span>"+comma;
  }

  function aspectSelect() {
    var list ="", R="";
    ASPECTSALL.forEach(function (A) {
      list += "<option value="+A+">"+CPXC.capitalize(A)+"</option>"
    })
    R+='<div class="ui-field-contain selectaspect"><select class="select-aspect">'
    R+=list+'</select></div>'
    return R;
  }

  //option for more aspects if they have less than the max
  for (i = i; i < level.aspects; i++) {
    html+=aspectSelect();
  }
  html+="</div>"

  function skillSelect() {
    var list ="", R="";
    SKILLS.forEach(function (S) {
      list += "<option value="+S+">"+CPXC.capitalize(S)+"</option>"
    })
    R+='<div class="ui-field-contain selectskill"><select class="select-skill" >'
    R+=list+'</select></div>'
    return R;
  }

  //build the skill selector list
  html+="<h3>Skills</h3>"
  html+="<div class='skillContainer'>";

  comma = ", "
  for (var i = level.skills.length; i > 0; i--) {
    html+='<div class=skillLevel data-i='+i+'><span class="label selectskill">Level '+i+': </span>';
    for (var j = 0; j < unit.skills[i-1].length; j++) {
      if(j==unit.skills[i-1].length-1) { comma = ""; }
      html+="<span class=skill data-type=skill data-data="+unit.skills[i-1][j]+">"+unit.skills[i-1][j]+"</span>"+comma;
    }
    for (j = j; j < level.skills[i-1]; j++) {
      html+=skillSelect();
    }
    html+="</div>";
  }
  html+="</div>"

  var footer="<div class=center>"+CPX.option({text:"Save",id:"saveHero",classes:["cpx-option","ui-btn-inline"],data:[["status",status]],ftorun:"saveHero"});
  if(status!="new"){
    footer+=CPX.option({text:"Close",classes:["ui-btn-inline","closeNotify"]});
  }
  if(CPX.unit.array().length>1){
    footer+=CPX.option({text:"Next",classes:["ui-btn-inline","viewNextUnit"]});
  }
  footer+='</div>';

  CPX.display.html(false,header,html,footer);
}

CPX.saveHero = function (event) {
  var id = $("#notify h1").attr("data-id"),
    status = $("#saveHero").attr("data-status"),
    unit = CPXUNITS[id],
    selaspect = $("select.select-aspect"),
    selskill = $("select.select-skill"),
    setaspect = $(".aspect"),
    setskill = $(".skill"),
    aspects = [], skills = [];

  selaspect.each(function (i,A) {
    aspects.push(A.value);
  })
  setaspect.each(function (i,A) {
    aspects.push($(A).attr("data-data"));
  })
  selskill.each(function (i,S) {
    var i = $(S).parents(".skillLevel").attr("data-i");
    if(!objExists(skills[i-1])) {
      skills[i-1] = [];
    }
    skills[i-1].push(S.value);
  })
  setskill.each(function (i,S) {
    var i = $(S).parents(".skillLevel").attr("data-i");
    if(!objExists(skills[i-1])) {
      skills[i-1] = [];
    }
    skills[i-1].push($(S).attr("data-data"));
  })

  if($("#uname").length){
    unit.name = $("#uname").val();
  }

  unit.skills = skills;
  unit.aspects = aspects;

  if(status=="new") {
    unit.HP=CPX.unit.maxHP(unit);
  }

  CPX.unit.save(unit);
}
