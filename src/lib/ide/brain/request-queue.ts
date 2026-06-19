const queue: (() => Promise<void>)[] = [];
let isProcessing = false;

async function processQueue() {
  if (isProcessing) return;
  isProcessing = true;
  while (queue.length > 0) {
    const task = queue.shift();
    if (task) {
      try {
        await task();
      } catch (err) {
        console.error("Queue task failed:", err);
      }
      // Throttle: 500ms between tasks
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  isProcessing = false;
}

export function enqueueRequest(task: () => Promise<void>) {
  queue.push(task);
  processQueue();
}