/*
    Created by Stephan Kaminsky
*/
var newlinechar = "\n";
function getVal(i) {
    var id = "reg-" + i + "-val";
    var el = document.getElementById(id);
    driver.saveRegister(el, i);
    return el.value;
}
function extendZeros(s) {
  var z = 8-s.length;
  for (var k = 0; k < z; k++) {
    s = "0" + s;
  }
  return s;
}
function getBaseLog(x, y) {
  return Math.log(y) / Math.log(x);
}
function numToBase(n, length) {
    var amount = Math.pow(2, length);
    length = getBaseLog(curNumBase, amount);
    var num = parseInt(n).toString(curNumBase);
    if (length - num.length > 0) {
      num = "0".repeat(length - num.length) + num;
    }
    snum = "";
    if (curNumBase == 2) {
      for (var i = 0; i < length; i++) {
          if (i % 4 == 0 && i != 0) {
              snum += " ";
          }
          snum += num[i];
      }
    } else {
      snum = num;
    }
  return snum;
}
var regs = [1, 2, 5, 6, 7, 8, 9, 10];
var lin = 0;
var extra = 0;
function getOneTrace(additional) {
    var res = "";
    var vals = [];
    if (additional != true) {
      driver.undo();
    }
    for (var j in regs) {
        i = regs[j];
        var s = getVal(i);
       if (s.length == 0) {
            s = "00000000";
        } else {
            s = s.substring(2);
            if (i == 2 && false) {
              s = (parseInt(s, 16)-parseInt("7ffffff0", 16)).toString(16);
              s = extendZeros(s);
            }
        }
        res += numToBase("0x" + s, 32) + "\t";
    }
    var bpc = Math.floor(driver.sim.state_0.pc / 4);
    if (additional == true) {
      bpc += extra;
      extra++;
    }
    if (additional != true) {
      driver.step();
    }
    var line = numToBase(lin, 16);
    var pc = numToBase(bpc, 32);
    var inst = "0x00000000";
    if (additional != true) {
      var prevpc = driver.sim.preInstruction_0.array_9xgyxj$_0;
      var prevcommand = document.getElementById("instruction-" + Math.floor(prevpc[prevpc.length - 1]["pc"] / 4));
      if (prevcommand != null) {
        var basecode = prevcommand.getElementsByTagName("td")[0].innerHTML;
        if (basecode != null) {
            //inst
            inst = basecode;
        }
      }
    }
    res += line + "\t" + pc + "\t" + numToBase(inst, 32);
    lin++;
    return res + newlinechar;
}
async function generateTrace() {
    lin = 0;
    extra = 0;
    driver.reset();
    if (document.getElementById("spzero").value == "true") {
      var ell = document.getElementById("reg-2-val");
      ell.value = "0x00000000";
    }
    var res = [];
    var runNextTrace = 1;
    try {
        var ecallExit = 0;
        var getecall = 0;
      while(canProceed(lin) && lin < 200) {
        driver.step();
        var selected = document.getElementsByClassName("is-selected")[0];
        if (selected != null && selected.id != null && selected.id.indexOf("instruction-") != -1) {
            var basecode = selected.getElementsByTagName("td")[1].innerHTML;
            if (basecode != null) {
                if(basecode == "ecall") {
                    var r10 = parseInt(getVal(10));
                    if (r10 == 10) {
                        ecallExit = -2;
                    } else {
                        getecall = -2;
                    }
                }
            }
        }
        getecall++;
        if (!getecall) {
            var consOut = document.getElementById("console-output");
            if (consOut != null) {
                console.log(consOut.value);
                res.push(consOut.value);
                consOut.value = "";
            }
        } else {
            getecall = (getecall == -1) ? -1 : 0;
        }
        ecallExit++;
        if (!ecallExit) {
            res = res.join("");
            res += "exiting the simulator";
            break;
        } else {
            ecallExit = (ecallExit == -1) ? -1 : 0;
        }
        res.push(getOneTrace(false));
        console.log(res);
     }
    } catch (e) { console.log(e); }
    try {
      for (var i = -1;((i < numBlankCommands || (((i - 1) < totalCommands) && totalCommands > 0)) && canProceed(lin))  && lin < 200; i++) {
       res.push(getOneTrace(true));
       console.log(res);
     }
    }
    catch(e) {
      console.log(e);
    }
    document.getElementById("alerts").innerHTML = "Trace done! Finishing up...";
    res.push(newlinechar);
    //document.write(res.join(""));
    //document.close();
    document.getElementById("trace-output").value = res.join("");
    //driver.dump();
    //document.getElementById("trace-dump").value = document.getElementById("console-output").value;
    openTrace();
    document.getElementById("alerts").innerHTML = "";
    return res;
};
function canProceed(n) {
  return (totalCommands <= 0) || (!(totalCommands <= 0) && (n - 1) < totalCommands);
}
var numBlankCommands = 0;
var totalCommands = -1;
function genTraceMain() {
    var tracebut = document.getElementById("trace-trace");
    tracebut.classList.add("is-loading");
    document.getElementById("alerts").innerHTML = "Generating trace...<br>(WARNING! Large traces may take a while!)";
    setTimeout(function(){
      curNumBase = document.getElementById("numbase").value;
      if (curNumBase < 2 || curNumBase == "") {
        curNumBase = 2;
      }
      if (curNumBase > 32) {
        curNumBase = 32;
      }
      closeTrace();
      numBlankCommands = document.getElementById("numextra").value;
      if (numBlankCommands == "") {
        numBlankCommands = 0;
      }
      totalCommands = document.getElementById("numtot").value;
      if (totalCommands < 0) {

      }
      codeMirror.save(); 
      driver.openSimulator();
      openTrace();
      setTimeout(function(){generateTrace(); tracebut.classList.remove("is-loading");}, 50);
    }, 50);

};
function CopyToClipboard(containerid) {
  var copyText = document.getElementById(containerid);

  /* Select the text field */
  copyText.select();

  /* Copy the text inside the text field */
  document.execCommand("Copy");
  return
if (document.selection) { 
    var range = document.body.createTextRange();
    range.moveToElementText(document.getElementById(containerid));
    range.select().createTextRange();
    document.execCommand("copy"); 

} else if (window.getSelection) {
    var range = document.createRange();
     range.selectNode(document.getElementById(containerid));
     window.getSelection().addRange(range);
     document.execCommand("copy");
     alert("text copied") 
}}
function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}
function clearTrace() {
  document.getElementById("trace-output").value = "";
  document.getElementById("trace-dump-output").value = "";
}
function openTrace() {
  var editortab = document.getElementById("editor-tab");
  var simulatortab = document.getElementById("simulator-tab");
  var tracetab = document.getElementById("trace-tab");
  var trace = document.getElementById("trace-tab-view");
  var simulator = document.getElementById("simulator-tab-view");
  
  //codeMirror.save(); 
  driver.openSimulator();
  simulatortab.setAttribute("class", "");
  tracetab.setAttribute("class", "is-active");
  simulator.style.display = "none";
  trace.style.display = "block";
}
function closeTrace() {
  var tracetab = document.getElementById("trace-tab");
  var trace = document.getElementById("trace-tab-view");
  
  trace.style.display = "none";
  tracetab.setAttribute("class", "");
}
function ddump() {
  document.getElementById("alerts").innerHTML = "Dumping...<br>(WARNING! Large dumps may take a while!)";
  var dumpbut = document.getElementById("trace-dump");
  dumpbut.classList.add("is-loading");
  setTimeout(function(){
    closeTrace();
    codeMirror.save(); 
    driver.openSimulator();
    driver.dump();
    var trace = document.getElementById("console-output").value;
    document.getElementById("trace-dump-output").value = trace;
    openTrace();
    dumpbut.classList.remove("is-loading");
    document.getElementById("alerts").innerHTML = "";
  }, 50);
}
function toggleThis(e) {
  if (e.value == "true") {
    e.classList.remove("is-primary");
    e.value = "false";
  } else {
    e.classList.add("is-primary");
    e.value = "true";
  }
}
function validateBase(e) {
  if (e.value == "") {
    return;
  }
  if (e.value < 1) {
    e.value = 2;
  }
  if (e.value > 32) {
    e.value = 32;
  }
}
function tracer() {
  var lielem = document.createElement('li');
  var aelem = document.createElement('a');
  //aelem.setAttribute("onclick", "genTraceMain()");
  aelem.setAttribute("onclick", "openTrace()");
  lielem.setAttribute("id", "trace-tab");
  var secelem = document.createElement('section');
  secelem.setAttribute("class", "section");
  secelem.setAttribute("id", "trace-tab-view");
  secelem.style.display = "none";
  secelem.innerHTML = `<div class="tile is-ancestor">
  <div class="tile is-vertical">
    <div class="tile">
      <div class="tile is-parent">
          <article class="tile is-child is-primary" align="center">
            <font size="6px">Trace Generator v1.0.2</font><br>
            <font size="4px">Created by Stephan Kaminsky using parts from an Anonymous post on Piazza.</font>
          </article>
        </center>
      </div>
    </div>
    <div class="tile">
      <div class="tile is-parent">
        <article class="tile is-child is-primary" id="simulator-controls-container">
          <div class="field is-grouped is-grouped-centered">
            <div class="control">
              <button id="trace-trace" class="button is-primary" onclick="genTraceMain()">Trace</button>
            </div>
            <div class="control">
              <button id="trace-dump" class="button" onclick="ddump()">Dump</button>
            </div>
            <div class="control">
              <button id="trace-clear" class="button" onclick="clearTrace()">Clear</button>
            </div>
           </div>
         </article>
       </div>
     </div>
     <div class="tile">
       <div class="tile is-parent">
         <article class="tile is-child is-primary" align="center">
            Options!
            <center>
            <table id="options" class="table" style="width:50%">
              <thead>
                <tr>
                  <th><center>Number of extra lines<br>after code is done:</center></th>
                  <th><center>Total number of commands:<br>(Negative means ignored)</center></th>
                  <th><center>Output Number's Base</center></th>
                </tr>
              </thead>
                <tr>
                  <th><center><input id="numextra" type="number" class="input is-small" style="width:180px;" onblur="" value=0 spellcheck="false"></center></th>
                  <th><center><input id="numtot" type="number" class="input is-small" style="width:180px;" onblur="" value=-1 spellcheck="false"></center></th>
                  <th><center><input id="numbase" type="number" class="input is-small" style="width:180px;" onblur="validateBase(this);" onkeyup="validateBase(this);" value=2 spellcheck="false"></center></th>
                </tr>
            </table>
            </center>
            Set SP to 0 by default? (Green = True; White = false)<br>
            <button id="spzero" class="button is-primary" onclick="toggleThis(this)" value="true">0 SP</button>
         </article>
       </div>
     </div>
     <div class="tile is-parent">
      <article class="tile is-child">
        Trace:&nbsp;&nbsp;&nbsp;&nbsp;<a onclick="CopyToClipboard('trace-output')">Copy!</a>
        <br>
        <textarea id="trace-output" class="textarea" placeholder="trace output" readonly=""></textarea>
      </article>
    </div>
    <div class="tile is-parent">
      <article class="tile is-child">
        Trace Dump:&nbsp;&nbsp;&nbsp;&nbsp;<a onclick="CopyToClipboard('trace-dump-output')">Copy!</a>
        <br>
        <textarea id="trace-dump-output" class="textarea" placeholder="trace dump output" readonly=""></textarea>
      </article>
    </div>
   </div>
  </div>`;
  aelem.innerHTML = "Trace Generator";
  lielem.appendChild(aelem);
  document.getElementsByClassName('tabs')[0].children[0].appendChild(lielem);
  insertAfter(secelem, document.getElementById("simulator-tab-view"));

  var editortab = document.getElementById("editor-tab");
  var simulatortab = document.getElementById("simulator-tab");
  editortab.setAttribute("onclick", editortab.getAttribute("onclick") + "; closeTrace();")
  simulatortab.setAttribute("onclick", simulatortab.getAttribute("onclick") + "; closeTrace();")
  window.alert = function(){console.log("alert")};

  var noticelm = document.createElement("div");
  noticelm.setAttribute("id", "alertsDiv");
  noticelm.innerHTML = `
    <center>
      <div id="alerts">
      </div>
    </center>
  `;
  document.body.insertBefore(noticelm, document.body.children[0]);
}
var curNumBase = 2;
function removeTracer() {
  document.getElementById("trace-tab").remove();
  document.getElementById("alertsDiv").remove();
  document.getElementById("trace-tab-view").remove();
}

function mainTrace() {

  if (typeof traceIsLoaded == "undefined") {
    console.log("Loading trace...");
     tracer();
  } else {
    console.log("Reloading trace...");
    var tracetab = document.getElementById("trace-tab");
    var wasactive = false;
    if (tracetab.getAttribute("class") == "is-active") {
      wasactive = true;
    }
    removeTracer();
    tracer();
    if (wasactive) {
      openTrace();
    }
  }
  
}
mainTrace();
var traceIsLoaded = true;