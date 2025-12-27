/**
 * ItemForm Component
 * Modal form for creating and editing items
 */

import ImageUpload from './ImageUpload.js';

const { ref, reactive, computed, onMounted, watch } = Vue;

// Item types
const ITEM_TYPES = [
  { value: 'tool', label: 'Tool', icon: '🔧' },
  { value: 'supply', label: 'Supply', icon: '📦' },
  { value: 'part', label: 'Part', icon: '⚙️' },
  { value: 'consumable', label: 'Consumable', icon: '🧴' },
  { value: 'equipment', label: 'Equipment', icon: '🖥️' },
  { value: 'other', label: 'Other', icon: '📋' },
];

// Quantity units
const QUANTITY_UNITS = [
  { value: 'each', label: 'Each' },
  { value: 'box', label: 'Box' },
  { value: 'pack', label: 'Pack' },
  { value: 'lb', label: 'Pounds (lb)' },
  { value: 'oz', label: 'Ounces (oz)' },
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'g', label: 'Grams (g)' },
  { value: 'l', label: 'Liters (L)' },
  { value: 'ml', label: 'Milliliters (mL)' },
  { value: 'ft', label: 'Feet (ft)' },
  { value: 'in', label: 'Inches (in)' },
  { value: 'm', label: 'Meters (m)' },
  { value: 'cm', label: 'Centimeters (cm)' },
];

export default {
  name: 'ItemForm',

  components: {
    ImageUpload,
  },

  props: {
    locationId: {
      type: String,
      required: true,
    },
    item: {
      type: Object,
      default: null,
    },
    show: {
      type: Boolean,
      default: false,
    },
  },

  emits: ['close', 'saved'],

  setup(props, { emit }) {
    const loading = ref(false);
    const error = ref('');
    const categories = ref([]);
    const loadingCategories = ref(false);

    // Form data
    const form = reactive({
      name: '',
      description: '',
      categoryId: '',
      itemType: 'other',
      brand: '',
      model: '',
      sku: '',
      size: '',
      position: '',
      tags: [],
      alternateNames: [],
      quantity: {
        value: 1,
        unit: 'each',
        minAlert: null,
      },
      value: {
        purchasePrice: null,
        currentValue: null,
        currency: 'USD',
        purchaseDate: '',
        vendor: '',
      },
      perishable: {
        isPerishable: false,
        expirationDate: '',
        extendedExpirationDate: '',
      },
      notes: '',
    });

    // Computed: Days until expiration
    const daysUntilExpiration = computed(() => {
      if (!form.perishable.isPerishable || !form.perishable.expirationDate) {
        return null;
      }
      const expDate = new Date(form.perishable.expirationDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expDate.setHours(0, 0, 0, 0);
      const diffTime = expDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    });

    // Expiration status class
    const expirationStatusClass = computed(() => {
      const days = daysUntilExpiration.value;
      if (days === null) return '';
      if (days < 0) return 'text-red-600 bg-red-50';
      if (days <= 7) return 'text-orange-600 bg-orange-50';
      if (days <= 30) return 'text-yellow-600 bg-yellow-50';
      return 'text-green-600 bg-green-50';
    });

    // Tag input
    const tagInput = ref('');
    const alternateNameInput = ref('');

    // Images state
    const images = ref([]);
    const imageUploadRef = ref(null);

    // Is editing mode
    const isEditing = computed(() => !!props.item);

    // Load categories on mount
    onMounted(async () => {
      await loadCategories();
    });

    // Watch for item changes (edit mode)
    watch(() => props.item, (newItem) => {
      if (newItem) {
        populateForm(newItem);
      } else {
        resetForm();
      }
    }, { immediate: true });

    // Load categories
    const loadCategories = async () => {
      loadingCategories.value = true;
      try {
        const response = await window.api.categories.getAll();
        categories.value = response.data.categories || [];
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        loadingCategories.value = false;
      }
    };

    // Populate form from item
    const populateForm = (item) => {
      form.name = item.name || '';
      form.description = item.description || '';
      form.categoryId = item.categoryId?._id || item.categoryId || '';
      form.itemType = item.itemType || 'other';
      form.brand = item.brand || '';
      form.model = item.model || '';
      form.sku = item.sku || '';
      form.size = item.size || '';
      form.position = item.position || '';
      form.tags = [...(item.tags || [])];
      form.alternateNames = [...(item.alternateNames || [])];
      form.quantity = {
        value: item.quantity?.value ?? 1,
        unit: item.quantity?.unit || 'each',
        minAlert: item.quantity?.minAlert ?? null,
      };
      form.value = {
        purchasePrice: item.value?.purchasePrice ?? null,
        currentValue: item.value?.currentValue ?? null,
        currency: item.value?.currency || 'USD',
        purchaseDate: item.value?.purchaseDate ? item.value.purchaseDate.split('T')[0] : '',
        vendor: item.value?.vendor || '',
      };
      form.perishable = {
        isPerishable: item.perishable?.isPerishable || false,
        expirationDate: item.perishable?.expirationDate ? item.perishable.expirationDate.split('T')[0] : '',
        extendedExpirationDate: item.perishable?.extendedExpirationDate ? item.perishable.extendedExpirationDate.split('T')[0] : '',
      };
      form.notes = item.notes || '';
      images.value = [...(item.images || [])];
    };

    // Reset form
    const resetForm = () => {
      form.name = '';
      form.description = '';
      form.categoryId = '';
      form.itemType = 'other';
      form.brand = '';
      form.model = '';
      form.sku = '';
      form.size = '';
      form.position = '';
      form.tags = [];
      form.alternateNames = [];
      form.quantity = { value: 1, unit: 'each', minAlert: null };
      form.value = { purchasePrice: null, currentValue: null, currency: 'USD', purchaseDate: '', vendor: '' };
      form.perishable = { isPerishable: false, expirationDate: '', extendedExpirationDate: '' };
      form.notes = '';
      tagInput.value = '';
      alternateNameInput.value = '';
      error.value = '';
      images.value = [];
      if (imageUploadRef.value) {
        imageUploadRef.value.clearPending();
      }
    };

    // Add tag
    const addTag = () => {
      const tag = tagInput.value.trim();
      if (tag && !form.tags.includes(tag)) {
        form.tags.push(tag);
      }
      tagInput.value = '';
    };

    // Remove tag
    const removeTag = (index) => {
      form.tags.splice(index, 1);
    };

    // Add alternate name
    const addAlternateName = () => {
      const name = alternateNameInput.value.trim();
      if (name && !form.alternateNames.includes(name)) {
        form.alternateNames.push(name);
      }
      alternateNameInput.value = '';
    };

    // Remove alternate name
    const removeAlternateName = (index) => {
      form.alternateNames.splice(index, 1);
    };

    // Handle image upload success
    const handleImageUpload = (newImages) => {
      images.value.push(...newImages);
    };

    // Handle image delete
    const handleImageDelete = async (imageIndex) => {
      if (!props.item?._id) return;

      try {
        await window.api.items.deleteImage(props.item._id, imageIndex);
        images.value.splice(imageIndex, 1);
        window.store?.success('Image deleted');
      } catch (err) {
        console.error('Failed to delete image:', err);
        error.value = err.message || 'Failed to delete image';
      }
    };

    // Handle set primary image
    const handleSetPrimary = async (imageIndex) => {
      if (!props.item?._id) return;

      try {
        const result = await window.api.items.setPrimaryImage(props.item._id, imageIndex);
        images.value = result.data.images;
        window.store?.success('Primary image updated');
      } catch (err) {
        console.error('Failed to set primary image:', err);
        error.value = err.message || 'Failed to set primary image';
      }
    };

    // Submit form
    const handleSubmit = async () => {
      if (!form.name.trim()) {
        error.value = 'Name is required';
        return;
      }

      loading.value = true;
      error.value = '';

      try {
        const data = {
          locationId: props.locationId,
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          categoryId: form.categoryId || undefined,
          itemType: form.itemType,
          brand: form.brand.trim() || undefined,
          model: form.model.trim() || undefined,
          sku: form.sku.trim() || undefined,
          size: form.size.trim() || undefined,
          position: form.position.trim() || undefined,
          tags: form.tags.length > 0 ? form.tags : undefined,
          alternateNames: form.alternateNames.length > 0 ? form.alternateNames : undefined,
          quantity: {
            value: parseFloat(form.quantity.value) || 1,
            unit: form.quantity.unit,
            minAlert: form.quantity.minAlert ? parseFloat(form.quantity.minAlert) : undefined,
          },
          notes: form.notes.trim() || undefined,
        };

        // Add value info if any provided
        if (form.value.purchasePrice || form.value.currentValue || form.value.vendor || form.value.purchaseDate) {
          data.value = {
            purchasePrice: form.value.purchasePrice ? parseFloat(form.value.purchasePrice) : undefined,
            currentValue: form.value.currentValue ? parseFloat(form.value.currentValue) : undefined,
            currency: form.value.currency,
            purchaseDate: form.value.purchaseDate || undefined,
            vendor: form.value.vendor.trim() || undefined,
          };
        }

        // Add perishable info if item is perishable
        if (form.perishable.isPerishable) {
          data.perishable = {
            isPerishable: true,
            expirationDate: form.perishable.expirationDate || undefined,
            extendedExpirationDate: form.perishable.extendedExpirationDate || undefined,
          };
        } else {
          data.perishable = {
            isPerishable: false,
            expirationDate: undefined,
            extendedExpirationDate: undefined,
          };
        }

        let response;
        if (isEditing.value) {
          response = await window.api.items.update(props.item._id, data);
          window.store?.success('Item updated');
        } else {
          response = await window.api.items.create(data);
          window.store?.success('Item created');
        }

        emit('saved', response.data.item);
        emit('close');
        resetForm();
      } catch (err) {
        console.error('Failed to save item:', err);
        error.value = err.message || 'Failed to save item';
      } finally {
        loading.value = false;
      }
    };

    // Handle close
    const handleClose = () => {
      resetForm();
      emit('close');
    };

    return {
      form,
      loading,
      error,
      categories,
      loadingCategories,
      tagInput,
      alternateNameInput,
      isEditing,
      ITEM_TYPES,
      QUANTITY_UNITS,
      images,
      imageUploadRef,
      daysUntilExpiration,
      expirationStatusClass,
      addTag,
      removeTag,
      addAlternateName,
      removeAlternateName,
      handleImageUpload,
      handleImageDelete,
      handleSetPrimary,
      handleSubmit,
      handleClose,
    };
  },

  template: `
    <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">
            {{ isEditing ? 'Edit Item' : 'Add New Item' }}
          </h2>
          <button @click="handleClose" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="px-6 py-4 overflow-y-auto flex-1">
          <form @submit.prevent="handleSubmit" class="space-y-4">
            <!-- Error -->
            <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {{ error }}
            </div>

            <!-- Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                v-model="form.name"
                type="text"
                class="input"
                placeholder="Item name"
                required
              />
            </div>

            <!-- Category and Type -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select v-model="form.categoryId" class="input" :disabled="loadingCategories">
                  <option value="">Select category...</option>
                  <template v-for="cat in categories" :key="cat._id">
                    <option :value="cat._id">{{ cat.icon }} {{ cat.name }}</option>
                    <option
                      v-for="sub in cat.subcategories"
                      :key="sub._id"
                      :value="sub._id"
                    >
                      &nbsp;&nbsp;{{ sub.icon }} {{ sub.name }}
                    </option>
                  </template>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Item Type</label>
                <select v-model="form.itemType" class="input">
                  <option v-for="type in ITEM_TYPES" :key="type.value" :value="type.value">
                    {{ type.icon }} {{ type.label }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Brand and Model -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                <input v-model="form.brand" type="text" class="input" placeholder="Brand name" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Model</label>
                <input v-model="form.model" type="text" class="input" placeholder="Model number" />
              </div>
            </div>

            <!-- Quantity -->
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  v-model.number="form.quantity.value"
                  type="number"
                  min="0"
                  step="0.01"
                  class="input"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <select v-model="form.quantity.unit" class="input">
                  <option v-for="unit in QUANTITY_UNITS" :key="unit.value" :value="unit.value">
                    {{ unit.label }}
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Low Stock Alert</label>
                <input
                  v-model.number="form.quantity.minAlert"
                  type="number"
                  min="0"
                  step="0.01"
                  class="input"
                  placeholder="Optional"
                />
              </div>
            </div>

            <!-- Value -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Purchase Price</label>
                <input
                  v-model.number="form.value.purchasePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  class="input"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Current Value</label>
                <input
                  v-model.number="form.value.currentValue"
                  type="number"
                  min="0"
                  step="0.01"
                  class="input"
                  placeholder="0.00"
                />
              </div>
            </div>

            <!-- Purchase Info -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
                <input v-model="form.value.purchaseDate" type="date" class="input" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Vendor/Store</label>
                <input v-model="form.value.vendor" type="text" class="input" placeholder="Where purchased" />
              </div>
            </div>

            <!-- Position and Size -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <input v-model="form.position" type="text" class="input" placeholder="e.g., Drawer 1, Shelf A" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Size</label>
                <input v-model="form.size" type="text" class="input" placeholder="e.g., Large, 10mm" />
              </div>
            </div>

            <!-- Expiration -->
            <div class="border border-gray-200 rounded-lg p-4">
              <div class="flex items-center gap-3 mb-3">
                <input
                  type="checkbox"
                  id="isPerishable"
                  v-model="form.perishable.isPerishable"
                  class="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <label for="isPerishable" class="text-sm font-medium text-gray-700">
                  This item has an expiration date
                </label>
              </div>

              <div v-if="form.perishable.isPerishable" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Printed Expiration Date</label>
                    <input
                      v-model="form.perishable.expirationDate"
                      type="date"
                      class="input"
                    />
                    <p class="text-xs text-gray-500 mt-1">Date printed on package</p>
                  </div>
                  <div v-if="daysUntilExpiration !== null" class="flex items-end pb-5">
                    <div :class="['px-3 py-2 rounded-lg text-sm font-medium', expirationStatusClass]">
                      <span v-if="daysUntilExpiration < 0">
                        Expired {{ Math.abs(daysUntilExpiration) }} day{{ Math.abs(daysUntilExpiration) !== 1 ? 's' : '' }} ago
                      </span>
                      <span v-else-if="daysUntilExpiration === 0">
                        Expires today
                      </span>
                      <span v-else>
                        {{ daysUntilExpiration }} day{{ daysUntilExpiration !== 1 ? 's' : '' }} until expiration
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Personal "Use By" Date</label>
                  <input
                    v-model="form.perishable.extendedExpirationDate"
                    type="date"
                    class="input max-w-xs"
                  />
                  <p class="text-xs text-gray-500 mt-1">When you're comfortable using this item (optional)</p>
                </div>
              </div>
            </div>

            <!-- Tags -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <div class="flex gap-2">
                <input
                  v-model="tagInput"
                  type="text"
                  class="input flex-1"
                  placeholder="Add a tag"
                  @keydown.enter.prevent="addTag"
                />
                <button type="button" @click="addTag" class="btn-secondary">Add</button>
              </div>
              <div v-if="form.tags.length > 0" class="mt-2 flex flex-wrap gap-2">
                <span
                  v-for="(tag, index) in form.tags"
                  :key="tag"
                  class="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                >
                  {{ tag }}
                  <button type="button" @click="removeTag(index)" class="hover:text-blue-900">&times;</button>
                </span>
              </div>
            </div>

            <!-- Alternate Names -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Also Known As</label>
              <p class="text-xs text-gray-500 mb-2">Add other names to help find this item in search</p>
              <div class="flex gap-2">
                <input
                  v-model="alternateNameInput"
                  type="text"
                  class="input flex-1"
                  placeholder="e.g., Phillips screwdriver, crosshead"
                  @keydown.enter.prevent="addAlternateName"
                />
                <button type="button" @click="addAlternateName" class="btn-secondary">Add</button>
              </div>
              <div v-if="form.alternateNames.length > 0" class="mt-2 flex flex-wrap gap-2">
                <span
                  v-for="(name, index) in form.alternateNames"
                  :key="name"
                  class="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                >
                  {{ name }}
                  <button type="button" @click="removeAlternateName(index)" class="hover:text-green-900">&times;</button>
                </span>
              </div>
            </div>

            <!-- Description -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                v-model="form.description"
                rows="3"
                class="input"
                placeholder="Item description..."
              ></textarea>
            </div>

            <!-- Images -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Images</label>
              <div v-if="isEditing">
                <ImageUpload
                  ref="imageUploadRef"
                  :item-id="item?._id"
                  :images="images"
                  :disabled="loading"
                  @upload="handleImageUpload"
                  @delete="handleImageDelete"
                  @set-primary="handleSetPrimary"
                />
              </div>
              <p v-else class="text-sm text-gray-500 py-4 text-center border-2 border-dashed border-gray-200 rounded-lg">
                Save the item first to upload images
              </p>
            </div>

            <!-- Notes -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                v-model="form.notes"
                rows="2"
                class="input"
                placeholder="Additional notes..."
              ></textarea>
            </div>
          </form>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button @click="handleClose" class="btn-secondary" :disabled="loading">
            Cancel
          </button>
          <button @click="handleSubmit" class="btn-primary" :disabled="loading">
            <span v-if="loading" class="flex items-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
            <span v-else>{{ isEditing ? 'Save Changes' : 'Create Item' }}</span>
          </button>
        </div>
      </div>
    </div>
  `,
};
