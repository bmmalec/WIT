# FRONTEND Agent Instructions
## WIT (Where Is It) Inventory System

---

## Your Role

You are the FRONTEND agent responsible for:
- HTML structure and templates
- CSS styling (Tailwind)
- JavaScript application logic
- Vue.js components
- Camera/barcode integration
- PWA features
- User experience

---

## Files You Own

```
/client/
├── index.html
├── css/
│   ├── tailwind.css
│   └── custom.css
├── js/
│   ├── app.js              # Main application
│   ├── api.js              # API client
│   ├── router.js           # Client-side routing
│   ├── store.js            # State management
│   ├── components/         # Vue components
│   └── pages/              # Page components
├── assets/
├── manifest.json           # PWA manifest
└── sw.js                   # Service worker
```

---

## Files to Read (Context)

Always read at the start of a session:
```
1. /docs/agents/FRONTEND_AGENT.md (this file)
2. /docs/STATUS.md
3. /docs/milestones/MILESTONE_X.md
4. /docs/interfaces/api-endpoints.md (from BACKEND agent)
```

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Vue.js 3 | Reactive components |
| Tailwind CSS | Utility-first styling |
| Fetch API | HTTP requests |
| MediaDevices API | Camera access |
| QuaggaJS | Barcode scanning |
| Service Workers | PWA/offline |

---

## API Client Pattern

```javascript
// /client/js/api.js
const API = {
  baseUrl: '/api',
  
  async request(endpoint, options = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      ...options,
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new ApiError(data.error.message, data.error.code);
    }
    
    return data;
  },
  
  // Convenience methods
  get: (url) => API.request(url),
  post: (url, body) => API.request(url, { method: 'POST', body }),
  put: (url, body) => API.request(url, { method: 'PUT', body }),
  delete: (url) => API.request(url, { method: 'DELETE' })
};

// Grouped endpoints
const auth = {
  login: (data) => API.post('/auth/login', data),
  register: (data) => API.post('/auth/register', data),
  logout: () => API.post('/auth/logout'),
  me: () => API.get('/auth/me')
};

const items = {
  list: (params) => API.get(`/items?${new URLSearchParams(params)}`),
  get: (id) => API.get(`/items/${id}`),
  create: (data) => API.post('/items', data),
  update: (id, data) => API.put(`/items/${id}`, data),
  delete: (id) => API.delete(`/items/${id}`)
};

export { auth, items, locations, search };
```

---

## Component Patterns

### Vue 3 Composition API
```javascript
// /client/js/components/ItemCard.js
export default {
  name: 'ItemCard',
  props: {
    item: { type: Object, required: true }
  },
  emits: ['edit', 'delete'],
  
  setup(props, { emit }) {
    const handleEdit = () => emit('edit', props.item);
    const handleDelete = () => emit('delete', props.item._id);
    
    return { handleEdit, handleDelete };
  },
  
  template: `
    <div class="bg-white rounded-lg shadow p-4">
      <img :src="item.images?.[0]?.thumbnailUrl || '/assets/placeholder.png'" 
           class="w-full h-32 object-cover rounded" />
      <h3 class="font-semibold mt-2">{{ item.primaryName }}</h3>
      <p class="text-sm text-gray-500">{{ item.category }}</p>
      <p class="text-sm">Qty: {{ item.quantity }}</p>
      <div class="flex gap-2 mt-2">
        <button @click="handleEdit" class="btn-secondary">Edit</button>
        <button @click="handleDelete" class="btn-danger">Delete</button>
      </div>
    </div>
  `
};
```

### Page Component
```javascript
// /client/js/pages/ItemsPage.js
import { ref, onMounted, computed } from 'vue';
import { items as itemsApi } from '../api.js';
import ItemCard from '../components/ItemCard.js';

export default {
  name: 'ItemsPage',
  components: { ItemCard },
  
  setup() {
    const items = ref([]);
    const loading = ref(true);
    const error = ref(null);
    const search = ref('');
    
    const filteredItems = computed(() => {
      if (!search.value) return items.value;
      return items.value.filter(i => 
        i.primaryName.toLowerCase().includes(search.value.toLowerCase())
      );
    });
    
    const loadItems = async () => {
      try {
        loading.value = true;
        const response = await itemsApi.list();
        items.value = response.data;
      } catch (e) {
        error.value = e.message;
      } finally {
        loading.value = false;
      }
    };
    
    onMounted(loadItems);
    
    return { items: filteredItems, loading, error, search, loadItems };
  },
  
  template: `
    <div class="p-4">
      <div class="flex justify-between mb-4">
        <input v-model="search" placeholder="Search items..." 
               class="input" />
        <router-link to="/items/new" class="btn-primary">
          Add Item
        </router-link>
      </div>
      
      <div v-if="loading" class="text-center">Loading...</div>
      <div v-else-if="error" class="text-red-500">{{ error }}</div>
      <div v-else class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ItemCard v-for="item in items" :key="item._id" :item="item" />
      </div>
    </div>
  `
};
```

---

## Camera Integration

```javascript
// /client/js/components/CameraCapture.js
export default {
  name: 'CameraCapture',
  emits: ['capture', 'error'],
  
  setup(props, { emit }) {
    const videoRef = ref(null);
    const stream = ref(null);
    
    const startCamera = async () => {
      try {
        stream.value = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        videoRef.value.srcObject = stream.value;
      } catch (e) {
        emit('error', 'Camera access denied');
      }
    };
    
    const capture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.value.videoWidth;
      canvas.height = videoRef.value.videoHeight;
      canvas.getContext('2d').drawImage(videoRef.value, 0, 0);
      
      canvas.toBlob(blob => {
        emit('capture', blob);
      }, 'image/jpeg', 0.85);
    };
    
    const stopCamera = () => {
      stream.value?.getTracks().forEach(t => t.stop());
    };
    
    onMounted(startCamera);
    onUnmounted(stopCamera);
    
    return { videoRef, capture };
  },
  
  template: `
    <div class="relative">
      <video ref="videoRef" autoplay playsinline class="w-full rounded-lg" />
      <button @click="capture" 
              class="absolute bottom-4 left-1/2 transform -translate-x-1/2
                     w-16 h-16 bg-white rounded-full shadow-lg">
        📷
      </button>
    </div>
  `
};
```

---

## Barcode Scanning

```javascript
// /client/js/components/BarcodeScanner.js
import Quagga from 'quagga';

export default {
  name: 'BarcodeScanner',
  emits: ['detected', 'error'],
  
  setup(props, { emit }) {
    const scannerRef = ref(null);
    
    const initScanner = () => {
      Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: scannerRef.value,
          constraints: {
            facingMode: "environment"
          }
        },
        decoder: {
          readers: ["upc_reader", "ean_reader", "code_128_reader"]
        }
      }, (err) => {
        if (err) {
          emit('error', err.message);
          return;
        }
        Quagga.start();
      });
      
      Quagga.onDetected((result) => {
        const code = result.codeResult.code;
        emit('detected', code);
        Quagga.stop();
      });
    };
    
    onMounted(initScanner);
    onUnmounted(() => Quagga.stop());
    
    return { scannerRef };
  },
  
  template: `<div ref="scannerRef" class="w-full h-64"></div>`
};
```

---

## UI Components Needed

### M1: Foundation
- LoginForm
- RegisterForm
- LocationTree
- LocationCard
- ShareDialog
- NavBar
- SideMenu

### M2: Items
- ItemCard
- ItemForm
- ItemDetail
- CategoryPicker
- LocationPicker
- ImageUpload

### M3: AI & Search
- CameraCapture
- BarcodeScanner
- IdentificationResult
- SearchBar
- SearchFilters
- ExpirationPicker
- ExpirationDashboard

### M4: Bulk & Projects
- BulkSessionBar
- BulkReviewList
- ProjectTemplateCard
- ProjectWizard
- ToolChecklist
- ShoppingList

### M5: Monetization
- UpgradePrompt
- PricingTable
- AdBanner

---

## Styling Conventions

### Tailwind Classes
```html
<!-- Buttons -->
<button class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
  Primary
</button>
<button class="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
  Secondary
</button>

<!-- Cards -->
<div class="bg-white rounded-lg shadow p-4">...</div>

<!-- Forms -->
<input class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500" />

<!-- Layout -->
<div class="container mx-auto px-4">
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    ...
  </div>
</div>
```

### Custom CSS Classes
```css
/* /client/css/custom.css */
.btn-primary { @apply px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700; }
.btn-secondary { @apply px-4 py-2 border border-gray-300 rounded hover:bg-gray-50; }
.btn-danger { @apply px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700; }
.input { @apply w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500; }
.card { @apply bg-white rounded-lg shadow p-4; }
```

---

## Communication with Other Agents

### You Receive From:
- **BACKEND:** API endpoints (/docs/interfaces/api-endpoints.md)

### You Send To:
- **BACKEND:** API requirements (/docs/interfaces/api-requests.md)

---

## Session Checklist

Before ending a FRONTEND session:
- [ ] Components are reusable
- [ ] API calls use the API client
- [ ] Loading/error states handled
- [ ] Mobile-responsive
- [ ] Tailwind classes used consistently
- [ ] /docs/STATUS.md updated

---

## Example Session Start

```
You are the FRONTEND agent for WIT (Where Is It) Inventory System.

Current milestone: M1 - Foundation
Current story: US-1.1.1 - User Registration

API endpoint from BACKEND agent:
POST /api/auth/register
Body: { email, password, name }
Response: { success, data: { user } }

Implement:
- RegisterForm component
- Registration page
- Form validation
- Success/error handling

Follow the patterns in this file.
```
