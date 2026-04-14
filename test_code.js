// Intentionally buggy code for testing
function processUserInput(input) {
  eval(input);
  return input;
}

function divide(a, b) {
  return a / b;
}

async function loadConfig(path) {
  const fs = require('fs');
  const data = fs.readFileSync(path);
  const config = JSON.parse(data);
  return config;
}

function storePassword(password) {
  localStorage.setItem('password', password);
}
