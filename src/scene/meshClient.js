/**
 * Main-thread client for the mesh worker.
 *
 * Wraps the worker in a request/response API and serializes requests per
 * surface to avoid wasted work when the user drags a slider rapidly.
 */

import MeshWorker from '../workers/meshWorker.js?worker';

export class MeshClient {
  constructor() {
    this.worker = new MeshWorker();
    this.pending = new Map();
    this.nextId = 1;
    this.latestForSurface = new Map();

    this.worker.onmessage = (ev) => {
      const { id } = ev.data;
      const cb = this.pending.get(id);
      if (cb) {
        this.pending.delete(id);
        cb(ev.data);
      }
    };
  }

  /**
   * Request a fresh mesh for the given surface state.
   * Returns a Promise that resolves with the worker payload, OR resolves to
   * `{ stale: true }` if a newer request for the same surface superseded it.
   */
  request(req) {
    const id = this.nextId++;
    this.latestForSurface.set(req.surfaceId, id);

    return new Promise((resolve) => {
      this.pending.set(id, (data) => {
        if (this.latestForSurface.get(req.surfaceId) !== id) {
          resolve({ stale: true, id });
          return;
        }
        resolve(data);
      });
      this.worker.postMessage({ id, ...req });
    });
  }

  dispose() {
    this.worker.terminate();
    this.pending.clear();
  }
}
