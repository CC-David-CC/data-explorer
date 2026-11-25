// Perspective 5.6.1's virtual server answers GetHostedTables once. A viewer
// still removes its local subscription when deleted. Acknowledge that request
// at this dedicated DuckDB port so delete can release its views normally.
// Request and Response use field 1 for the message ID and field 37 for this
// unsubscribe pair. The request's nested field 1 is the subscription ID.
const uint32Field = 0x08;
const removeHostedTablesField = [0xaa, 0x02];

function uint32End(bytes, start) {
  for (let offset = start; offset < Math.min(start + 5, bytes.length); offset++) {
    const byte = bytes[offset];
    if (offset === start + 4 && byte > 15) return -1;
    if (byte < 128) return byte === 0 && offset > start ? -1 : offset + 1;
  }
  return -1;
}

function unsubscribeReply(request) {
  if (!(request instanceof ArrayBuffer) || request.byteLength > 15) return null;
  const bytes = new Uint8Array(request);
  const idEnd = bytes[0] === uint32Field ? uint32End(bytes, 1) : 0;
  const [tagStart, tagEnd] = removeHostedTablesField;
  if (idEnd < 0 || bytes[idEnd] !== tagStart || bytes[idEnd + 1] !== tagEnd) return null;

  const payload = idEnd + 3;
  if (bytes[idEnd + 2] !== bytes.length - payload) return null;
  if (payload < bytes.length &&
      (bytes[payload] !== uint32Field || uint32End(bytes, payload + 1) !== bytes.length)) return null;

  const reply = new Uint8Array(idEnd + 3);
  reply.set(bytes.subarray(0, idEnd));
  reply.set([tagStart, tagEnd, 0], idEnd);
  return reply.buffer;
}

function forward(port, data) {
  port.postMessage(data, data instanceof ArrayBuffer ? [data] : []);
}

export function duckDBViewerPort(serverPort) {
  const {port1: bridge, port2: client} = new MessageChannel();
  bridge.onmessage = ({data}) => {
    const reply = unsubscribeReply(data);
    if (reply) forward(bridge, reply);
    else forward(serverPort, data);
  };
  serverPort.onmessage = ({data}) => forward(bridge, data);

  return {
    client,
    close() {
      serverPort.onmessage = null;
      bridge.onmessage = null;
      client.close();
      bridge.close();
      serverPort.close();
    }
  };
}
