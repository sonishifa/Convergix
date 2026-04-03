function base64ToUint8(b64) {
  return Buffer.from(b64, 'base64');
}

function uint8ToBase64(bytes) {
  return Buffer.from(bytes).toString('base64');
}

module.exports = { base64ToUint8, uint8ToBase64 };