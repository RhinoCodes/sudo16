const {VirtualMachine} = wasm_bindgen;
let code;
let vm;
let oldmem = [];
var running = false;
let oldmempointer = 0;
var hertz = document.getElementById('hertz');
var run = document.getElementById('run');
var hz;
var completed = false;
var asap_enabled = true; 

document.getElementById("code").children[1].value = localStorage.getItem("code") ? localStorage.getItem("code") : "0x11 0x0412 0x13 0x13 0xFF 0x48 0x65 0x6c 0x6c 0x6f 0x2c 0x20 0x57 0x6f 0x72 0x6c 0x64 0x21 0x00 0x0A 0x05 0x12 0x06 0x08 0x01 0x0A 0x01 0x09 0x12 0x06 0x08 0x03 0x18 0xFFFF";

const urlParams = new URLSearchParams(window.location.search);
code = urlParams.get("code");
if (code) { 
  document.getElementById("code").children[1].value = code.replaceAll(",", " ");
}

function updatemobile() {
  if (window.innerWidth <= 700) {
    document.body.appendChild(document.getElementById("guides"))
  } else {
    document.getElementById("all").appendChild(document.getElementById("guides"))
  }
}
updatemobile()
window.addEventListener('resize', updatemobile)

document.getElementById("results").addEventListener("focus", function (event) {
  event.target.value += "█";
})

document.getElementById("results").addEventListener("blur", function (event) {
  event.target.value = event.target.value.replace("█", "");
})

function setuphertzinput() {
  hertz = document.getElementById('hertz');

  hertz.addEventListener('mouseover', function () {
    run.classList.add('no-hover');
  });
  
  hertz.addEventListener('mouseout', function () {
    run.classList.remove('no-hover');
    
    
  });
  hertz.addEventListener('click', function (event) {
    event.stopPropagation();
  });
}

setuphertzinput();

document.getElementById('share').addEventListener('click', function() {
  var textToCopy = window.location.origin + "/?code=" + document.getElementById('code').children[1].value.replaceAll(" ", ",");

  navigator.clipboard.writeText(textToCopy)
    .then(function() {
      alert("Copied to clipboard.")
    })
    .catch(function(err) {
      alert('Copy failed.' + err);
    });
});


document.getElementById("results").addEventListener("keyup", function (event) {
  if (["Backspace", "Enter"].includes(event.code)) {
    let codes = {
      "Backspace": 8,
      "Enter": 13
    }
    vm.set_byte(0xFF, codes[event.code]);
  } else if (event.key != "Shift") {
    vm.set_byte(0xFF, event.key.charCodeAt(0));
  }
  console.log(event)
})

function update_mem(vm_mem) {
  for (mem in vm_mem) {
    if (mem == vm.mempointer) {
      document.getElementsByClassName("details")[1].children[mem].outerHTML = "<p style='color:red'>" + vm_mem[mem].toString(16) + "</p>";
    } else if ((vm_mem[mem] != oldmem[mem]) || (mem == oldmempointer && oldmempointer != vm.mempointer)) {
      document.getElementsByClassName("details")[1].children[mem].outerHTML = "<p>" + vm_mem[mem].toString(16) + "</p>";
    }
  }
}

async function run_wasm() {
  // Load the wasm file by awaiting the Promise returned by `wasm_bindgen`
  // `wasm_bindgen` was imported in `index.html`
  await wasm_bindgen();

  console.log('index.js loaded');

  code = document.getElementById("code").children[1].value.split(" ");
  console.log(code)
  if (localStorage.getItem("code") != document.getElementById("code").children[1].value && document.getElementById("code").children[1].value != urlParams.get("code")) {
    localStorage.setItem("code", document.getElementById("code").children[1].value)
  }
  vm = VirtualMachine.new(code);
  vm.setup()
  vm_mem = vm.get_memory()
  document.getElementsByClassName("details")[1].innerHTML = ''
  for (mem in vm_mem) {
    if (mem == vm.mempointer) {
      document.getElementsByClassName("details")[1].innerHTML += "<p style='color:red'>" + vm_mem[mem].toString(16) + "</p>";
    } else {
      document.getElementsByClassName("details")[1].innerHTML += "<p>" + vm_mem[mem].toString(16) + "</p>";
    }
  }
}

function reset() {
  code = document.getElementById("code").children[1].value.split(" ");
  vm = VirtualMachine.new(code);
  vm.setup()
  vm_mem = vm.get_memory()
  document.getElementsByClassName("details")[1].innerHTML = ''
  for (mem in vm_mem) {
    if (mem == vm.mempointer) {
      document.getElementsByClassName("details")[1].innerHTML += "<p style='color:red'>" + vm_mem[mem].toString(16) + "</p>";
    } else {
      document.getElementsByClassName("details")[1].innerHTML += "<p>" + vm_mem[mem].toString(16) + "</p>";
    }
  }
  document.getElementById("registerslist").innerHTML = `<p>Register A: 0x00</p>
  <br>
  <p>Register B: 0x00</p><br>`;
  document.getElementById("lastInstruction").innerHTML = '';
  document.getElementById("results").value = '';
}

function runhz() {
  if (completed) {
    reset();
    completed = false;
    running = false;
    run.innerHTML = `Run <input id="hertz" type="number" placeholder="250"></input> hz`;
    setuphertzinput();
    return;
  }
  if (running) {
    clearInterval(hz);
    running=false;
    run.innerHTML = `Run <input id="hertz" type="number" placeholder="250"></input> hz`;
    setuphertzinput();
    
    return;
  } else {{
    running = true;
  }}
  let hzx = document.getElementById("hertz").value;
  run.innerHTML = "Stop";
  if ((hzx > 250 || hzx == 0) && asap_enabled) {
    console.log("Max set speed is 250hz, switching to ASAP execution")
    while (running == true) {
      if (step() == "done") {
        break;
      }
    }
    vm_mem = vm.get_memory()
    document.getElementsByClassName("details")[1].innerHTML = ''
    for (mem in vm_mem) {
      if (mem == vm.mempointer) {
        document.getElementsByClassName("details")[1].innerHTML += "<p style='color:red'>" + vm_mem[mem].toString(16) + "</p>";
      } else {
        document.getElementsByClassName("details")[1].innerHTML += "<p>" + vm_mem[mem].toString(16) + "</p>";
      }
    }
    completed = true;
    run.innerHTML = "Reset";
    return;
  }
  hz = setInterval(() => {
    if (step() == "done") {
      clearInterval(hz);
      completed = true;
      run.innerHTML = "Reset";
    }
  }, (1/hzx)*1000)
}

function step() {
  intpointer = vm.instruction_pointer;
  result = vm.step();
  register_a = "0x"+vm.register_a.toString(16);
  register_b = "0x"+vm.register_b.toString(16);
  document.getElementById("lastInstruction").innerHTML = vm.get_last_instruction();
  if (result != '�') {
    setTimeout(() => {
      document.getElementsByClassName("details")[0].innerHTML = `<p>Register A: ${register_a}</p><br><p>Register B: ${register_b}</p><br>`;
      
      update_mem(vm.get_memory());
      oldmem = vm.get_memory();
      oldmempointer = vm.mempointer;
    },0)
    if (result == "→") {
      return;
    } else {
      if (document.getElementById("results").value.slice(-1) == "█") {
        if (result.charCodeAt(0) == 8) {
          document.getElementById("results").value = document.getElementById("results").value.slice(0, -2)
        } else {
          document.getElementById("results").value = document.getElementById("results").value.slice(0, -1) + result;
        }
        document.getElementById("results").value += "█";
      } else {
        if (result.charCodeAt(0) == 8) {
          document.getElementById("results").value = document.getElementById("results").value.slice(0, -1)
        } else {
          document.getElementById("results").value += result;
        }
      }
    } 
  } else {
    return 'done'
  }
}

run_wasm();