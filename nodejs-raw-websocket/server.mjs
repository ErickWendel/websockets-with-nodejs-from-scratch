import {
  createServer
} from 'http'
const PORT = 1337
import crypto from 'crypto'
const WEBSOCKET_MAGIC_STRING_KEY = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'
const SEVEN_BITS_INTEGER_MARKER = 125
const SIXTEEN_BITS_INTEGER_MARKER = 126
const SIXTYFOUR_BITS_INTEGER_MARKER = 127

const MAXIMUM_SIXTEEN_BITS_INTEGER = 2 ** 16 // 0 to 65536
const MASK_KEY_BYTES_LENGTH = 4
const OPCODE_TEXT = 0x01 // 1 bit in binary 1

// parseInt('10000000', 2)
const FIRST_BIT = 128

const server = createServer((request, response) => {
    response.writeHead(200)
    response.end('hey there')
  })
  .listen(1337, () => console.log('server listening to', PORT))

server.on('upgrade', onSocketUpgrade)


function onSocketUpgrade(req, socket, head) {

  const {
    'sec-websocket-key': webClientSocketKey
  } = req.headers
  console.log(`${webClientSocketKey} connected!`)
  const headers = prepareHandShakeHeaders(webClientSocketKey)

  socket.write(headers)
  socket.on('readable', () => onSocketReadable(socket))
 
}

function sendMessage(msg, socket) {
  const data = prepareMessage(msg)
  socket.write(data)
}

function prepareMessage(message) {
  const msg = Buffer.from(message)
  const messageSize = msg.length

  let dataFrameBuffer;
   

  // 0x80 === 128 in binary 
  // '0x' +  Math.abs(128).toString(16) == 0x80
  const firstByte = 0x80 | OPCODE_TEXT // single frame + text
  if(messageSize <= SEVEN_BITS_INTEGER_MARKER) {
    const bytes = [firstByte]
    dataFrameBuffer = Buffer.from(bytes.concat(messageSize))
  }
  else if (messageSize <= MAXIMUM_SIXTEEN_BITS_INTEGER ) {
    const offsetFourBytes = 4
    const target = Buffer.allocUnsafe(offsetFourBytes)
    target[0] = firstByte
    target[1] = SIXTEEN_BITS_INTEGER_MARKER | 0x0 // just to know the mask

    target.writeUint16BE(messageSize, 2) // content lenght is 2 bytes
    dataFrameBuffer = target

    // alloc 4 bytes
    // [0] - 128 + 1 - 10000001  fin + opcode
    // [1] - 126 + 0 - payload length marker + mask indicator 
    // [2] 0 - content length
    // [3] 113 - content length
    // [ 4 - ..] - the message itself
  }
  else {
    throw new Error('message too long buddy :( ')
  }
  const totalLength = dataFrameBuffer.byteLength + messageSize
  const dataFrameResponse = concat([ dataFrameBuffer, msg], totalLength)
  return dataFrameResponse

}

function concat(bufferList, totalLength) {
  const target = Buffer.allocUnsafe(totalLength)
  let offset = 0;
  for(const buffer of bufferList) {
    target.set(buffer, offset)
    offset += buffer.length
  }

  return target
}

function onSocketReadable(socket) {
  // consume optcode (first byte)
  // 1 - 1 byte - 8bits
  socket.read(1)

  const [markerAndPayloadLengh] = socket.read(1)
  // Because the first bit is always 1 for client-to-server messages
  // you can subtract one bit (128 or '10000000') 
  // from this byte to get rid of the MASK bit
  const lengthIndicatorInBits = markerAndPayloadLengh - FIRST_BIT

  let messageLength = 0
  if (lengthIndicatorInBits <= SEVEN_BITS_INTEGER_MARKER) {
    messageLength = lengthIndicatorInBits
  } 
  else if(lengthIndicatorInBits === SIXTEEN_BITS_INTEGER_MARKER) {
    // unsigned, big-endian 16-bit integer [0 - 65K] - 2 ** 16
    messageLength = socket.read(2).readUint16BE(0)
  }
  else {
    throw new Error(`your message is too long! we don't handle 64-bit messages`)
  }


  const maskKey = socket.read(MASK_KEY_BYTES_LENGTH)
  const encoded = socket.read(messageLength)
  const decoded = unmask(encoded, maskKey)
  const received = decoded.toString('utf8')

  const data = JSON.parse(received)
  console.log('message received!', data)

  const msg = JSON.stringify({
    message: data,
    at: new Date().toISOString()
  })
  sendMessage(msg, socket) 
}

function unmask(encodedBuffer, maskKey) {

  const finalBuffer = Buffer.from(encodedBuffer);
  // because the maskKey has only 4 bytes
  // index % 4 === 0, 1, 2, 3 = index bits needed to decode the message

  // XOR  ^
  // returns 1 if both are different
  // returns 0 if both are equal

  // (71).toString(2).padStart(8, "0") = 0 1 0 0 0 1 1 1
  // (53).toString(2).padStart(8, "0") = 0 0 1 1 0 1 0 1
  //                                     0 1 1 1 0 0 1 0

  // (71 ^ 53).toString(2).padStart(8, "0") = '01110010'
  // String.fromCharCode(parseInt('01110010', 2))
  const fillWithEightZeros = (t) => t.padStart(8, "0")
  const toBinary = (t) => fillWithEightZeros(t.toString(2))
  const fromBinaryToDecimal = (t) => parseInt(toBinary(t), 2)
  const getCharFromBinary = (t) => String.fromCharCode(fromBinaryToDecimal(t))

  for (let index =0; index< encodedBuffer.length; index++) {
    finalBuffer[index] = encodedBuffer[index] ^ maskKey[index % MASK_KEY_BYTES_LENGTH];

    const logger = {
      unmaskingCalc: `${toBinary(encodedBuffer[index])} ^ ${toBinary(maskKey[index % MASK_KEY_BYTES_LENGTH])} = ${toBinary(finalBuffer[index])}`,
      decoded: getCharFromBinary(finalBuffer[index])
    }
    console.log(logger)
  }

  return finalBuffer
}

function prepareHandShakeHeaders(id) {
  const acceptKey = createSocketAccept(id)
  const headers = [
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${acceptKey}`,
    ''
  ].map(line => line.concat('\r\n')).join('')

  return headers
}

function createSocketAccept(id) {
  const shaum = crypto.createHash('sha1')
  shaum.update(id + WEBSOCKET_MAGIC_STRING_KEY)
  return shaum.digest('base64')
}

// error handling to keep the server on
;
[
  "uncaughtException",
  "unhandledRejection"
].forEach(event =>
  process.on(event, (err) => {
    console.error(`something bad happened! event: ${event}, msg: ${err.stack || err}`)
  })

)