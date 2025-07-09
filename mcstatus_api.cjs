const net = require('net');

// VarInt 编码函数
function writeVarInt(value) {
  const buffer = [];
  let temp = value;
  do {
    let byte = temp & 0x7F;
    temp >>>= 7;
    if (temp !== 0) byte |= 0x80;
    buffer.push(byte);
  } while (temp !== 0);
  return Buffer.from(buffer);
}

// 从缓冲区读取VarInt
function readVarIntFromBuffer(buffer) {
  let result = 0;
  let shift = 0;
  let bytesRead = 0;
  
  for (let i = 0; i < buffer.length; i++) {
    const byte = buffer[i];
    result |= (byte & 0x7F) << shift;
    shift += 7;
    bytesRead++;
    
    if ((byte & 0x80) === 0) {
      return { value: result, bytes: bytesRead };
    }
    
    if (bytesRead >= 5) {
      throw new Error('VarInt too big');
    }
  }
  
  return null; // 数据不足
}

// 获取服务器状态
function getServerStatus(host = 'localhost', port = 25565, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port }, async () => {
      try {
        // 构建握手包
        const handshake = Buffer.concat([
          writeVarInt(0), // 握手包ID
          writeVarInt(-1), // 协议版本
          writeVarInt(host.length),
          Buffer.from(host, 'utf8'),
          Buffer.from([port >> 8, port & 0xFF]), // 端口
          writeVarInt(1) // 下一状态
        ]);

        // 构建请求包
        const request = writeVarInt(0); // 请求包ID

        // 发送握手包 + 请求包
        socket.write(Buffer.concat([
          writeVarInt(handshake.length),
          handshake,
          writeVarInt(request.length),
          request
        ]));
      } catch (err) {
        reject(err);
      }
    });

    let receiveBuffer = Buffer.alloc(0);
    let packetLength = -1;
    let jsonResponse = null;
    
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error('Connection timeout'));
    }, timeout);

    socket.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });

    socket.on('data', (data) => {
      try {
        receiveBuffer = Buffer.concat([receiveBuffer, data]);
        
        // 如果还不知道包长度，尝试读取
        if (packetLength === -1) {
          const lengthResult = readVarIntFromBuffer(receiveBuffer);
          if (!lengthResult) return; // 数据不足，继续等待
          
          packetLength = lengthResult.value;
          // 移除长度字节
          receiveBuffer = receiveBuffer.slice(lengthResult.bytes);
        }
        
        // 检查是否收到完整数据包
        if (receiveBuffer.length >= packetLength) {
          const packet = receiveBuffer.slice(0, packetLength);
          receiveBuffer = receiveBuffer.slice(packetLength);
          
          // 读取包ID (应为0)
          const idResult = readVarIntFromBuffer(packet);
          if (!idResult || idResult.value !== 0) {
            throw new Error('Invalid packet ID');
          }
          
          // 读取JSON字符串长度
          const jsonLengthResult = readVarIntFromBuffer(packet.slice(idResult.bytes));
          if (!jsonLengthResult) {
            throw new Error('Incomplete JSON length');
          }
          
          // 提取JSON字符串
          const jsonStart = idResult.bytes + jsonLengthResult.bytes;
          const jsonStr = packet.slice(jsonStart, jsonStart + jsonLengthResult.value).toString('utf8');
          jsonResponse = JSON.parse(jsonStr);
          
          // 完成处理
          clearTimeout(timer);
          socket.end();
          resolve(jsonResponse);
        }
      } catch (err) {
        clearTimeout(timer);
        socket.destroy();
        reject(err);
      }
    });
  });
}

module.exports = {
    getServerStatus
}