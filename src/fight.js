CPX.fight = function () {

}
CPX.fight.build = function (parent,pop) {
  var N = [], E=[], np = pop.n, n=0, P=JSON.parse(JSON.stringify(pop));
  
  function elite () {
    var foe ={
      maxskill : P.maxskill,
      class:["minion","elite"],
      nature : CPXC.pickone(SPECIALNATURE.nature)  
    };
    
    if(CPXC.bool({likelihood:10})) { foe.class.push("boss"); }
    
    foe.maxHP = CPX.unit.maxHP(foe);
    foe.HP = foe.maxHP; 
    
    N.push(foe);
  }
  function minion (n){
    var foe = {
      maxskill : P.maxskill,
      class:["minion"],
      nature : CPXC.pickone(["brute","blaster","skirmisher","soldier"]),
      maxHP : 1,
      HP: 1
    };
    
    for(var i =0;i<n;i++) {
      N.push(foe);  
    }
  }
  function mob () {
    var foe = {
      maxskill : P.maxskill,
      class:["minion","mob"],
      nature : CPXC.pickone(["brute","blaster","skirmisher","soldier"]),
      special : ["mob"],
      scale : P.scale+1
    };
    foe.maxHP = CPX.unit.maxHP(foe);
    foe.HP = foe.maxHP;
    
    N.push(foe);
  }
  
  //determine the nature of the encounter depending on the nappearing
  if(P.nappearing == "horde") {
    P.maxskill--;
    E = CPXC.weighted([["mob"],["mob","rabble"],["mob","elite"],["mob","elite","elite","rabble"],["mob","elite","mob"]],[.2,.3,.2,.15,.15]); 
  }
  else if(P.nappearing == "group") { 
    E = CPXC.weighted([["rabble"],["rabble","elite"],["rabble","elite","elite"],["rabble","elite","elite","rabble"]],[.1,.4,.25,.25]); 
  }
  else {
    P.maxskill++;
    E = ["elite"]; 
  }

  //setup the encounter by pushing foes to an array, either mobs or singles
  //update np - number available - each time
  E.forEach(function(e){
    if(e=="mob") { 
      if(np<10) { minion(np); np=0; }
      else { mob(); np-=10; }
    }
    else if (e=="rabble") {
      if(np<7) { minion(np); np=0; }
      else { 
        n = CPXC.d6()+1;
        minion(n); 
        np-=n;
      }
    }
    else { elite(); np--; }
  })
  
  //load the fight object and call the display function
  CPXFIGHT = {
    map : parent,
    foes : { pop: P, number: N},
    heroes : [CPXAU]
  }
  CPX.fight.display();
}
CPX.fight.display = function () {
  var header= "<h1 class='fight'>Fight</h1>", html="",
  footer=CPX.option({text:"Flee",classes:["fightFlee"]}), 
  foe = CPXFIGHT.foes.pop;

  var being = foe[foe.subtype].map(function(f){
    return CPXC.capitalize(f);
  })
  being = foe.text+" "+being.join(" "), name = "";

  html+='<h3 class="center">Foes</h3>';
  CPXFIGHT.foes.number.forEach(function(f,i){
    name = being;
    if(f.class.includes("mob")){
      name += " mob";
    }
    html+= CPX.option({text:name,classes:["fight","foe"],data:[["id",i]]});      
  });

  var actions = [];
  html+='<h3 class="center">Heroes</h3>';
  html+='<div data-role="collapsibleset" data-theme="a" data-content-theme="a">'
  CPXFIGHT.heroes.forEach(function(h,i){
    html+='<div data-role="collapsible"><h3>'+h.name+'</h3>'
    actions = CPX.unit.actions("fight",h);
    actions.forEach(function(a){
      html+=CPX.option({text:a,classes:["ui-mini","fight","action"],data:[["id",a]]});  
    });
    html+="</div>";    
  });  
  html+='</div>';

  CPX.display.html(true,header,html,footer);    
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
$(document).on('click',"button.fightFlee ",function(e) {
  $("#notify").slideUp();
});