import { once } from 'node:events';
import { deepEqual, equal } from 'node:assert/strict';
import { test } from 'node:test';
import { duckDBViewerPort } from '../../perspective-port.mjs';

test('DuckDB port acknowledges viewer unsubscribe with the original message ID', async () => {
  const {port1: engine, port2: server} = new MessageChannel();
  const viewer = duckDBViewerPort(server);
  let forwarded = 0;
  engine.onmessage = () => { forwarded++; };
  try {
    for (const [request, reply] of [
      [[8, 150, 1, 170, 2, 3, 8, 201, 1], [8, 150, 1, 170, 2, 0]],
      [[8, 255, 255, 255, 255, 15, 170, 2, 6, 8, 255, 255, 255, 255, 15],
       [8, 255, 255, 255, 255, 15, 170, 2, 0]],
      [[170, 2, 0], [170, 2, 0]],
    ]) {
      const buffer = Uint8Array.from(request).buffer;
      const result = once(viewer.client, 'message', {signal: AbortSignal.timeout(2000)});
      viewer.client.postMessage(buffer, [buffer]);
      deepEqual([...new Uint8Array((await result)[0])], reply);
    }
    equal(forwarded, 0);
  } finally {
    viewer.close();
    engine.close();
  }
});

test('DuckDB port passes init, query and unrecognized messages through', async () => {
  const {port1: engine, port2: server} = new MessageChannel();
  const viewer = duckDBViewerPort(server);
  engine.onmessage = ({data}) => engine.postMessage(data);
  try {
    const init = {cmd: 'init', args: []};
    const started = once(viewer.client, 'message', {signal: AbortSignal.timeout(2000)});
    viewer.client.postMessage(init);
    deepEqual((await started)[0], init);

    for (const bytes of [[8, 1, 26, 0], [8, 2, 170, 2, 3, 8, 128, 0]]) {
      const response = once(viewer.client, 'message', {signal: AbortSignal.timeout(2000)});
      viewer.client.postMessage(Uint8Array.from(bytes).buffer);
      deepEqual([...new Uint8Array((await response)[0])], bytes);
    }
  } finally {
    viewer.close();
    engine.close();
  }
});
