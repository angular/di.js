
var globalCounter = 0;
function getUniqueId() {
  return ++globalCounter;
}

export {
  getUniqueId
};
