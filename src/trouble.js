var TROUBLE = {
  categories: ["disorder","uprising","poverty","education","despair","corruption"],
  "disorder": ["raiders","wildlife","monsters","thugs","gangs","lurkingoutsiders","cult"],
  "uprising": ["darkwizard","outsiders","exiledlord","murderousheirs"],
  "poverty": ["barren","contaminated","extremepoverty","harshconditions","inaccessible","hunger","damaged","undeveloped"],
  "education" : ["hazardousresource","sickness","toxicprocess","wastedproduction"],
  "despair": ["classhatred","crushedspirits","demagogue","disunity"],
  "corruption": ["corruptleaders","mercenarypop","mob","secretsociety","sinistercult"],
  //disorder
  "raiders":{text:"Raiders routinely harrass the populace."},
  "monsters":{text:"Monsters lurk in the wilds."},
  "wildlife":{text:"The beasts of the regions have no fear."},
  "gangs":{text:"Gangs"},
  "thugs":{text:"Thugs"},
  "lurkingoutsiders":{text:"Outsiders"},
  "cult":{text:"Cult"},
  //uprising
  "darkwizard":{text:"Dark wizard"},
  "exiledlord":{text:"Exiled lord"},
  "murderousheirs":{text:"Murderous heirs"},
  "outsiders":{text:"Outsiders"},
  //poverty
  "barren":{text:"Barren land"},
  "contaminated":{text:"Contmainated land"},
  "extremepoverty":{text:"Extreme poverty"},
  "harshconditions":{text:"Harsh conditions"},
  "inaccessible":{text:"Inaccessible"},
  "hunger":{text:"Hunger"},
  "damaged":{text:"Damage"},
  "undeveloped":{text:"Undeveloped"},
  //education
  "hazardousresource":{text:"Hazardous resources"},
  "sickness":{text:"Sickness"},
  "toxicprocess":{text:"Toxic process"},
  "wastedproduction":{text:"Wasted production"},
  //despair
  "classhatred":{text:"Class hatred"},
  "crushedspirits":{text:"Crushed spirit"},
  "demagogue":{text:"Demagogue"},
  "disunity":{text:"Disunuty"},
  //corruption
  "corruptleaders":{text:"Corrupt leadership"},
  "mercenarypop":{text:"Mercenary population"},
  "mob":{text:"Mobs"},
  "secretsociety":{text:"Secret society"},
  "sinistercult":{text:"Sinister cult"}
};
var TROUBLESKILLS = {
  "disorder":[["Fight","Shoot"],["Investigate","Athletics","Physique","Provoke"],["Resources","Stealth","Will"]],
  "uprising":[["Fight","Shoot","Athletics","Physique"],["Will","Provoke","Investigate","Stealth"],["Resources"]],
  "poverty":[["Resources","Contacts"],["Rapport","Crafts"],["Physique"]],
  "education":[["Rapport","Contacts"],["Crafts","Lore","Resources"],["Empathy","Investigate"]],
  "despair":[["Rapport","Empathy"],["Contacts","Will"],["Resources"]],
  "corruption":[["Investigate","Notice","Contacts"],["Burglary","Deceive","Provoke","Resources","Stealth"],["Fight","Physique","Shoot","Will"]],
}
var TROUBLETIME = 0.005;

CPX.quest = function (map) {
  var type = CPXC.pickone(["defeat","find","save"]);
  //goto, defeat/find, obj

}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.trouble = function (map) {
  var ta = CPXC.pickone(TROUBLE.categories), 
  tb = CPXC.pickone(TROUBLE[ta]),
  text = TROUBLE[tb].text;

  //time it takes to solve the trouble
  //TODO: include unit scale
  var time = 1;
  if(map.scale>2){
    time = Math.round(CPX.size(CPXC)*Math.pow(10,map.scale-3));
  }

  var header= "<h1 class='trouble'>Help "+map.name+"</h1>",
  html= "<div class=center>"+text+"<div>("+time+" days)</div></div>";
  html+= CPX.option({text:"Help",classes:["troubleHelp"],data:[["tc",ta],["tid",tb],["sid",map._id],["time",time]]}); 

  var footer=CPX.option({text:"Leave "+map.name,classes:["atlasHexExit"]});

  CPX.display.html(true,header,html,footer);
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
CPX.trouble.test = function (T,map) {
  var TDIFF = {
    basic:[0,0,1,2],
    low:[0,1,2,3],
    medium:[1,2,3,4],
    high:[2,3,4,5]
  }, dp=[35,40,20,5], pass = 0, fail =0;

  function difficulty() {
    if(map.scale<3) { return CPXC.weighted(TDIFF.basic,dp); }
    else if (map.scale<5) { return CPXC.weighted(TDIFF.low,dp); }
    else if (map.scale<7) { return CPXC.weighted(TDIFF.medium,dp); }
    else { return CPXC.weighted(TDIFF.high,dp); }  
  }

  //basic test roll, given a bonus - determined from the skill
  function test(bonus) {
    var TR = chance.rpg('4d3', {sum: true})-8+bonus, D= difficulty();
    //Fate roll, if better than difficulty
    if(TR >= D) { pass++; }
    else { fail++; }
  }

  var si = -1, skill="";
  for(var i=0;i<5;i++) {
    si = CPXC.natural({min: 0, max: 1});
    skill = CPXC.pickone(TROUBLESKILLS[T.class][si]);
    test(CPX.unit.skillVal(CPXAU,skill));
  }

  if(pass > fail) {
    var n = noty({
      layout:'center',
      type:'success',
      timeout: 1000,
      text: 'Success!'
    });
    CPX.realm.pushMod(map,[["special",0,"help","inc",1]]);
  }
  else {
    //reduce HP for the effort, but add xp
    CPX.unit.change(CPXAU,["XP","HP"],[1,-1]);
    var n = noty({
      layout:'center',
      type:'error',
      timeout: 1000,
      text: 'Failure!'
    });
  }
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
$(document).on('click',".troubleHelp",function(e) {
  var tc = $(this).attr("data-tc"),
  tid = $(this).attr("data-tid"),
  time = $(this).attr("data-time"),
  sid = $(this).attr("data-sid");

  $("#notify").slideUp();

  $("#notify").slideUp("fast",function(){
    //time passes
    CPX.unit.change(CPXAU,["AP"],[-time]);
    //tackle the rouble
    CPX.trouble.test({class: tc,id:tid},CPXDB[sid]);  
  });
});
