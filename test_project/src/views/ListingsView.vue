<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

type ListingValue = string | number | null | undefined

interface Listing {
  title?: ListingValue
  rooms?: ListingValue
  adress?: ListingValue
  district?: ListingValue
  images?: (string | null | undefined)[] | null
  price?: ListingValue
  priceArea?: ListingValue
  mortgage?: ListingValue
  favourite: boolean
}

const listings = ref<Listing[]>([])
const isLoading = ref(true)
const loadError = ref('')
const roomOptions = computed(() => [...new Set(
  listings.value.map(listing => String(listing.rooms ?? '').trim()).filter(Boolean),
)].sort((left, right) => left.localeCompare(right, 'ru')))
const districtOptions = computed(() => [...new Set(
  listings.value.map(listing => String(listing.district ?? '').trim()).filter(Boolean),
)].sort((left, right) => left.localeCompare(right, 'ru')))

const searchText = ref('')
const selectedRooms = ref('')
const selectedDistrict = ref('')
const minPrice = ref('')
const maxPrice = ref('')
const favouritesOnly = ref(false)

watch(
  [searchText, selectedRooms, selectedDistrict, minPrice, maxPrice, favouritesOnly],
  ([search, rooms, district, priceFrom, priceTo, favourites]) => {
    console.log('Search parameters changed:', {
      search,
      rooms,
      district,
      priceFrom,
      priceTo,
      favouritesOnly: favourites,
    })
  },
)

const filteredListings = computed(() => {
  const query = searchText.value.trim().toLocaleLowerCase('ru')
  const minimum = parseInputPrice(minPrice.value)
  const maximum = parseInputPrice(maxPrice.value)

  return listings.value.filter(listing => {
    const searchableText = [
      listing.title,
      listing.rooms,
      listing.adress,
      listing.district,
    ].map(value => String(value ?? '')).join(' ').toLocaleLowerCase('ru')

    const price = parsePrice(listing.price)

    return (!query || searchableText.includes(query))
      && (!selectedRooms.value || String(listing.rooms ?? '') === selectedRooms.value)
      && (!selectedDistrict.value || String(listing.district ?? '') === selectedDistrict.value)
      && (minimum === null || (price !== null && price >= minimum))
      && (maximum === null || (price !== null && price <= maximum))
      && (!favouritesOnly.value || listing.favourite)
  })
})

function parsePrice(value: ListingValue): number | null {
  const digits = String(value ?? '').replace(/\D/g, '')
  return digits ? Number(digits) : null
}

function parseInputPrice(value: string): number | null {
  if (typeof value !== 'number') return null
  const price = Number(value)
  return Number.isFinite(price) ? price : null
}

function displayText(value: ListingValue) {
  const text = String(value ?? '').trim()
  return text || 'Не указано'
}

function formatAmount(value: ListingValue) {
  const text = String(value ?? '').trim()
  if (!text) return 'Не указано'

  const amount = Number(text.replace(/\s/g, '').replace(',', '.'))
  if (!Number.isFinite(amount)) return text

  return `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(amount)} ₽`
}

function listingImages(listing: Listing) {
  return Array.isArray(listing.images)
    ? listing.images.filter((image): image is string => typeof image === 'string' && image.trim().length > 0)
    : []
}

function hideBrokenImage(event: Event) {
  if (event.currentTarget instanceof HTMLImageElement) {
    event.currentTarget.hidden = true
  }
}


onMounted(async () => {
  try {
    const response = await fetch('http://localhost:3000/listings')
    if (!response.ok) throw new Error(`Request failed: ${response.status}`)

    const data: unknown = await response.json()
    listings.value = Array.isArray(data)
      ? (data as Listing[]).map(listing => ({ ...listing, favourite: listing.favourite === true }))
      : []
  } catch (error) {
    console.error('Failed to fetch listings:', error)
    loadError.value = 'Не удалось загрузить объявления. Попробуйте обновить страницу.'
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <main class="listings-page">
    <header class="page-header">
      <p class="eyebrow">Недвижимость · Новосибирск</p>
      <h1>Квартиры на продажу</h1>
      <div class="listing-filters">
        <input
            v-model="searchText"
            class="search-input"
            type="search"
            aria-label="Поиск объявлений"
            placeholder="Поиск объявлений"
        >
        <select v-model="selectedRooms" class="filter-select" aria-label="Количество комнат">
          <option value="" selected>Комнаты</option>
          <option v-for="rooms in roomOptions" :key="rooms" :value="rooms">{{ rooms }}</option>
        </select>
        <select v-model="selectedDistrict" class="filter-select" aria-label="Район">
          <option value="" selected>Район</option>
          <option v-for="district in districtOptions" :key="district" :value="district">
            {{ district }}
          </option>
        </select>
        <input
            v-model="minPrice"
            class="price-input"
            type="number"
            min="0"
            step="any"
            aria-label="Минимальная цена"
            placeholder="Цена от"
        >
        <input
            v-model="maxPrice"
            class="price-input"
            type="number"
            min="0"
            step="any"
            aria-label="Максимальная цена"
            placeholder="Цена до"
        >
        <label class="favourites-filter">
          <input v-model="favouritesOnly" type="checkbox">
          <span>Избранное</span>
        </label>
      </div>
      <p class="result-count" v-if="!isLoading && !loadError">
        Найдено объявлений: {{ listings.length }}
      </p>
      <p class="result-count" v-if="!isLoading && !loadError">
        Найдено объявлений подходящих поиску: {{ filteredListings.length }}
      </p>
    </header>

    <p v-if="isLoading" class="status-message" role="status">Загружаем объявления…</p>
    <p v-else-if="loadError" class="status-message error-message" role="alert">{{ loadError }}</p>
    <p v-else-if="listings.length === 0" class="status-message">Объявлений пока нет.</p>

    <section v-else class="listings-list" aria-label="Список объявлений">
      <article v-for="(listing, index) in filteredListings" :key="index" class="listing">
        <div v-if="listingImages(listing).length" class="listing-gallery">
          <img
            v-for="(image, imageIndex) in listingImages(listing)"
            :key="`${image}-${imageIndex}`"
            :src="image"
            :alt="`${displayText(listing.title)}, фото ${imageIndex + 1}`"
            :class="{ 'gallery-main': imageIndex === 0 }"
            loading="lazy"
            @error="hideBrokenImage"
          >
        </div>
        <div v-else class="image-placeholder" aria-label="Фотографии отсутствуют">
          <span>Фото отсутствуют</span>
        </div>

        <div class="listing-content">
          <div class="listing-heading">
            <div>
              <p class="listing-type">{{ displayText(listing.rooms) }}</p>
              <h2>{{ displayText(listing.title) }}</h2>
            </div>
            <div class="listing-actions">
              <p class="price">{{ formatAmount(listing.price) }}</p>
              <button
                class="favourite-button"
                type="button"
                :aria-label="listing.favourite ? 'Убрать из избранного' : 'Добавить в избранное'"
                :aria-pressed="listing.favourite"
                :title="listing.favourite ? 'Убрать из избранного' : 'Добавить в избранное'"
                @click="listing.favourite = !listing.favourite"
              >
                <span aria-hidden="true">{{ listing.favourite ? '★' : '☆' }}</span>
              </button>
            </div>
          </div>

          <dl class="listing-details">
            <div>
              <dt>Адрес</dt>
              <dd>{{ displayText(listing.adress) }}</dd>
            </div>
            <div>
              <dt>Район</dt>
              <dd>{{ displayText(listing.district) }}</dd>
            </div>
            <div>
              <dt>Цена за м²</dt>
              <dd>{{ formatAmount(listing.priceArea) }}</dd>
            </div>
            <div>
              <dt>Ипотека в месяц</dt>
              <dd>{{ formatAmount(listing.mortgage) }}</dd>
            </div>
          </dl>
        </div>
      </article>
    </section>
  </main>
</template>



<style scoped>
.listings-page {
  --ink: #202b2b;
  --muted: #647170;
  --line: #dce5e1;
  --accent: #bd4f36;
  max-width: 1120px;
  margin: 0 auto;
  padding: 48px 28px 72px;
  color: var(--ink);
}

.page-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: start;
  gap: 12px;
  margin-bottom: 28px;
  padding-bottom: 22px;
  border-bottom: 1px solid var(--line);
}

.eyebrow {
  grid-column: 1 / -1;
  margin: 0;
  color: var(--accent);
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
}

h1,
h2,
p {
  margin-top: 0;
}

h1 {
  margin-bottom: 0;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 500;
}

.listing-filters {
  display: grid;
  grid-template-columns: minmax(0, 2fr) repeat(4, minmax(120px, 1fr)) auto;
  gap: 10px;
  width: 100%;
}

.search-input,
.filter-select,
.price-input {
  width: 100%;
  min-width: 0;
  min-height: 46px;
  padding: 0 14px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: #fff;
  color: var(--ink);
  font: inherit;
}

.search-input:focus-visible,
.filter-select:focus-visible,
.price-input:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.favourites-filter {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 46px;
  padding: 0 12px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: #fff;
  color: var(--ink);
  cursor: pointer;
  white-space: nowrap;
}

.favourites-filter input {
  width: 16px;
  height: 16px;
  margin: 0;
  accent-color: var(--accent);
}

.result-count {
  margin: 0;
  color: var(--muted);
}

.listings-list {
  display: grid;
  gap: 20px;
}

.listing {
  display: grid;
  grid-template-columns: minmax(220px, 32%) minmax(0, 1fr);
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: #fff;
}

.listing-gallery {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-auto-rows: 92px;
  gap: 4px;
  align-content: start;
  overflow: hidden;
  background: #edf1ed;
}

.listing-gallery img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #edf1ed;
}

.listing-gallery .gallery-main {
  grid-column: span 3;
  grid-row: span 2;
}

.image-placeholder {
  display: grid;
  min-height: 220px;
  place-items: center;
  padding: 16px;
  background: #edf1ed;
  color: var(--muted);
  text-align: center;
}

.listing-content {
  min-width: 0;
  padding: 22px 24px;
}

.listing-heading {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--line);
}

.listing-type {
  margin-bottom: 6px;
  color: var(--muted);
  font-size: 0.9rem;
}

h2 {
  margin-bottom: 0;
  font-size: 1.15rem;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.price {
  flex: 0 0 auto;
  margin: 2px 0 0;
  color: var(--accent);
  font-size: 1.2rem;
  font-weight: 700;
}

.listing-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: flex-start;
  gap: 12px;
}

.favourite-button {
  display: grid;
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: #fff;
  color: var(--muted);
  cursor: pointer;
  font-size: 1.4rem;
  line-height: 1;
}

.favourite-button[aria-pressed='true'] {
  border-color: var(--accent);
  color: var(--accent);
}

.favourite-button:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.listing-details {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 24px;
  margin: 18px 0 0;
}

.listing-details dt {
  margin-bottom: 4px;
  color: var(--muted);
  font-size: 0.82rem;
}

.listing-details dd {
  margin: 0;
  overflow-wrap: anywhere;
}

.status-message {
  padding: 28px 0;
  color: var(--muted);
}

.error-message {
  color: #a43126;
}

@media (max-width: 700px) {
  .listings-page {
    padding: 30px 16px 48px;
  }

  .listing-filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .search-input {
    grid-column: 1 / -1;
  }

  .listing {
    grid-template-columns: 1fr;
  }

  .listing-gallery {
    grid-auto-rows: 72px;
  }

  .listing-gallery .gallery-main {
    grid-row: span 2;
  }

  .image-placeholder {
    min-height: 170px;
  }

  .listing-content {
    padding: 18px;
  }
}

@media (max-width: 440px) {
  .listing-filters {
    grid-template-columns: 1fr;
  }

  .search-input {
    grid-column: auto;
  }

  .listing-heading {
    flex-direction: column;
    gap: 12px;
  }

  .listing-details {
    grid-template-columns: 1fr;
    gap: 13px;
  }
}
</style>

