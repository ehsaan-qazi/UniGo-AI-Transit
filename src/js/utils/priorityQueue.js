// src/js/utils/priorityQueue.js

class PriorityQueue {
    constructor() {
        this.collection = [];
    }

    enqueue(element, priority) {
        const node = { element, priority };
        if (this.isEmpty()) {
            this.collection.push(node);
        } else {
            let added = false;
            for (let i = 0; i < this.collection.length; i++) {
                // Lower numbers = higher priority
                if (node.priority < this.collection[i].priority) {
                    this.collection.splice(i, 0, node);
                    added = true;
                    break;
                }
            }
            if (!added) {
                this.collection.push(node);
            }
        }
    }

    dequeue() {
        const value = this.collection.shift();
        return value ? value.element : null;
    }

    isEmpty() {
        return this.collection.length === 0;
    }
}

// 👇 THIS LINE IS CRITICAL - DO NOT MISS IT
export default PriorityQueue;