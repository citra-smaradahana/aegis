// Offline Storage Utility for PWA
class OfflineStorage {
  constructor() {
    this.dbName = 'AegisKMBDB';
    this.dbVersion = 1;
    this.db = null;
    this.init();
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = event => {
        const db = event.target.result;

        // Create object stores for different form types
        if (!db.objectStoreNames.contains('fitToWork')) {
          const fitToWorkStore = db.createObjectStore('fitToWork', {
            keyPath: 'id',
            autoIncrement: true,
          });
          fitToWorkStore.createIndex('timestamp', 'timestamp', {
            unique: false,
          });
        }

        if (!db.objectStoreNames.contains('take5')) {
          const take5Store = db.createObjectStore('take5', {
            keyPath: 'id',
            autoIncrement: true,
          });
          take5Store.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('hazard')) {
          const hazardStore = db.createObjectStore('hazard', {
            keyPath: 'id',
            autoIncrement: true,
          });
          hazardStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async saveFormData(formType, data) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([formType], 'readwrite');
      const store = transaction.objectStore(formType);

      const formData = {
        ...data,
        timestamp: new Date().toISOString(),
        synced: false,
      };

      const request = store.add(formData);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingForms(formType) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([formType], 'readonly');
      const store = transaction.objectStore(formType);
      const index = store.index('timestamp');

      const request = index.getAll();
      request.onsuccess = () => {
        const forms = request.result.filter(form => !form.synced);
        resolve(forms);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async markAsSynced(formType, id) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([formType], 'readwrite');
      const store = transaction.objectStore(formType);

      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const form = getRequest.result;
        form.synced = true;

        const putRequest = store.put(form);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async deleteForm(formType, id) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([formType], 'readwrite');
      const store = transaction.objectStore(formType);

      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearAllData() {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(
        ['fitToWork', 'take5', 'hazard'],
        'readwrite'
      );

      const fitToWorkStore = transaction.objectStore('fitToWork');
      const take5Store = transaction.objectStore('take5');
      const hazardStore = transaction.objectStore('hazard');

      fitToWorkStore.clear();
      take5Store.clear();
      hazardStore.clear();

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // Check if device is online
  isOnline() {
    return navigator.onLine;
  }

  // Listen for online/offline events
  onOnline(callback) {
    window.addEventListener('online', callback);
  }

  onOffline(callback) {
    window.addEventListener('offline', callback);
  }
}

// Create singleton instance
const offlineStorage = new OfflineStorage();

export default offlineStorage;
