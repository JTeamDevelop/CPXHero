//sets an interval to refresh the RNG every 10 minutes
setInterval(function(){
  refreshRNG();
}, 600000);

function refreshRNG(callback){
  //set callback if undefined
  callback = typeof callback === "undefined" ? function () {} : callback;

  //on success use the returned random number
  function initAjaxSuccess(randNum) {
    var mySeed = randNum;
    // Instantiate Chance with this truly random number as the seed
    CPXC = new Chance(mySeed);
  }
  //on failure use the local rng as a seed
  function initAjaxError() {
    var mySeed = Math.random();
    // Instantiate Chance with this truly random number as the seed
    CPXC = new Chance(mySeed);
  }
  // ajax call to get a random number for use as global RNG
  $.ajax({
    url: "https://www.random.org/integers/",
    data: {num: "1", col: "1", min: "1", max: "1000000000", base: "10", format: "plain", rnd: "new"},
    success: initAjaxSuccess,
    error: initAjaxError,
    complete : callback,
    timeout: 3000
  });
}

//global start function
function start() {
  refreshRNG(initialize);
}

function initialize() {
  function firstUnit() {
    for (var a in CPXUNITS) return CPXUNITS[a];
  }

  var hasdata = false, hasunit=false;
  var lso = {};
  //loop through localStorage looking for realms and units
  for (var x in localStorage) {
    //parse the data into an object
    lso = JSON.parse(localStorage[x]);
    //if the object has a realm data it is a realm to tbe loaded
    if(objExists(lso.realm)){
      var options = lso.options;
      options.seed = lso.seed;
      options.mods = lso.mods;

      var hid = CPX[lso.type](options);
      hasdata = true;
    }
    //othrwise if the object has a unit type it should be loaded
    if(x == "units"){
      CPXUNITS = lso;
      var hero = firstUnit();
      hasunit = true;
    }
    //finally check if it is the user data
    if(x == "user"){
      USER = lso;
    }
  }
  //if no data is loaded generate a plane
  if(!hasdata){
    var hid = CPX.hexPlane();
  }
  //if no units, create a hero
  if(!hasunit){
    var hero = CPX.hero();
    hero.location = CPXDB[hid].seed.concat(["0_0","a","0_0"]);
    CPX.display.heroEditor(hero,"new");
  }

  CPX.user.addRealm(hid);
  CPXAU = hero;
  CPX.display({map:CPXDB[hid]});
  CPX.display.audata();

  console.log(CPXDB);
  console.log(USER);
}

//launch!
start();
