<template>
  <div class="dashboard-container">
    <!-- Header -->
    <header class="header">
      <div class="brand">
        <div class="logo">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-bar-chart-2">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
        </div>
        <div>
          <h1>Marketing Report Tool</h1>
          <p class="subtitle">Tự động kéo Facebook Ads Manager & Khớp dữ liệu Khách hàng theo Ad ID</p>
        </div>
      </div>

      <div class="actions">
        <button class="btn btn-secondary" @click="syncData" :disabled="isSyncing">
          <span v-if="isSyncing" class="spinner"></span>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
          {{ isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ Facebook Ads' }}
        </button>

        <a :href="apiBase + '/api/export/excel'" download class="btn btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Xuất File Excel (.xlsx)
        </a>
      </div>
    </header>

    <!-- KPI Cards Grid -->
    <section class="kpi-grid">
      <div class="card kpi-card">
        <div class="kpi-icon icon-purple">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        </div>
        <div class="kpi-content">
          <span class="kpi-label">Tổng Chi Phí Ads</span>
          <h2 class="kpi-value text-gradient">{{ formatCurrency(summary.totalSpend) }}</h2>
          <span class="kpi-sub font-mono">CPC TB: {{ formatCurrency(summary.avgCpc) }}</span>
        </div>
      </div>

      <div class="card kpi-card">
        <div class="kpi-icon icon-blue">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </div>
        <div class="kpi-content">
          <span class="kpi-label">Lượt Hiển Thị / Clicks</span>
          <h2 class="kpi-value">{{ formatNumber(summary.totalImpressions) }}</h2>
          <span class="kpi-sub font-mono">{{ formatNumber(summary.totalClicks) }} Clicks (CTR {{ summary.avgCtr }}%)</span>
        </div>
      </div>

      <div class="card kpi-card">
        <div class="kpi-icon icon-emerald">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
        </div>
        <div class="kpi-content">
          <span class="kpi-label">Tin Nhắn Messenger & Form</span>
          <h2 class="kpi-value">{{ summary.totalMessages + summary.totalFormLeads }}</h2>
          <span class="kpi-sub font-mono">{{ summary.totalMessages }} Messenger | {{ summary.totalFormLeads }} Form</span>
        </div>
      </div>

      <div class="card kpi-card">
        <div class="kpi-icon icon-amber">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </div>
        <div class="kpi-content">
          <span class="kpi-label">Khách Hàng Khớp Mã Ad ID</span>
          <h2 class="kpi-value text-emerald">{{ summary.totalMatchedLeads }} Khách</h2>
          <span class="kpi-sub font-mono">CPL Trung bình: {{ formatCurrency(summary.avgCpl) }}/Khách</span>
        </div>
      </div>
    </section>

    <!-- Main Navigation Tabs -->
    <div class="tabs">
      <button class="tab-btn" :class="{ active: activeTab === 'ads' }" @click="activeTab = 'ads'">
        📊 Báo Cáo Chi Tiết Quảng Cáo & Naming Tags
      </button>
      <button class="tab-btn" :class="{ active: activeTab === 'attribution' }" @click="activeTab = 'attribution'">
        💰 Doanh Thu & ROAS theo Ad ID (Attribution)
      </button>
      <button class="tab-btn" :class="{ active: activeTab === 'leads' }" @click="activeTab = 'leads'">
        👥 Khách Hàng Khớp SĐT & Ad ID ({{ leadsList.length }})
      </button>
      <button class="tab-btn" :class="{ active: activeTab === 'logs' }" @click="activeTab = 'logs'">
        📋 Lịch Sử Đồng Bộ
      </button>
    </div>

    <!-- Tab 1: Ads Report Table -->
    <section v-if="activeTab === 'ads'" class="card table-card">
      <div class="table-header">
        <div>
          <h3>Hiệu Suất Quảng Cáo & Bóc Tách Naming Convention</h3>
          <p class="table-sub">Bóc tách đa chiều: Nhãn Hàng (Brand), Mục Tiêu (Target), Định Dạng (Format), Chi phí, CPL</p>
        </div>
        <input v-model="searchQuery" type="text" placeholder="Tìm theo tên hoặc Ad ID..." class="search-input" />
      </div>

      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Mã Ad ID</th>
              <th>Tên Quảng Cáo</th>
              <th>Nhãn Hàng</th>
              <th>Mục Tiêu</th>
              <th>Định Dạng</th>
              <th>Chi Phí (VND)</th>
              <th>Hiển Thị</th>
              <th>Clicks (CTR)</th>
              <th>Tin Nhắn / Form</th>
              <th>Khách Khớp SĐT</th>
              <th>CPL</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ad in filteredAds" :key="ad.id">
              <td class="font-mono text-cyan">{{ ad.id }}</td>
              <td class="font-bold">{{ ad.name }}</td>
              <td><span class="badge badge-blue">{{ ad.brand || 'Khác' }}</span></td>
              <td>{{ ad.target || 'ALL' }}</td>
              <td><span class="badge badge-amber">{{ ad.format || 'MESS' }}</span></td>
              <td class="font-mono text-amber">{{ formatCurrency(ad.spend) }}</td>
              <td class="font-mono">{{ formatNumber(ad.impressions) }}</td>
              <td class="font-mono">{{ formatNumber(ad.clicks) }} <span class="badge-sm">{{ ad.ctr }}%</span></td>
              <td class="font-mono">{{ ad.messagingConversions }} msgs</td>
              <td>
                <span class="badge badge-success">{{ ad.matchedLeadsCount }} Khách</span>
              </td>
              <td class="font-mono font-bold text-emerald">{{ formatCurrency(ad.cpl) }}</td>
            </tr>
            <tr v-if="filteredAds.length === 0">
              <td colspan="11" class="empty-cell">Chưa có dữ liệu quảng cáo.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Tab: Attribution & ROAS -->
    <section v-if="activeTab === 'attribution'" class="card table-card">
      <div class="table-header">
        <div>
          <h3>Attribution Engine: Doanh Thu & Hệ Số ROAS theo Ad ID</h3>
          <p class="table-sub">Nối tự động: Ad ID ↔ Messenger PSID ↔ SĐT Khách Hàng ↔ Đơn Hàng CRM</p>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Mã Ad ID</th>
              <th>Tên Quảng Cáo</th>
              <th>Nhãn Hàng</th>
              <th>Chi Phí Ads</th>
              <th>Số Đơn Chốt</th>
              <th>Doanh Thu Đơn Hàng</th>
              <th>ROAS</th>
              <th>CPA (Chi phí/Đơn)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="att in attributionList" :key="att.adId">
              <td class="font-mono text-cyan">{{ att.adId }}</td>
              <td class="font-bold">{{ att.adName }}</td>
              <td><span class="badge badge-blue">{{ att.brand }}</span></td>
              <td class="font-mono text-amber">{{ formatCurrency(att.spend) }}</td>
              <td class="font-mono font-bold">{{ att.orderCount }} đơn</td>
              <td class="font-mono font-bold text-emerald">{{ formatCurrency(att.totalRevenue) }}</td>
              <td>
                <span :class="['badge', att.roas >= 2 ? 'badge-success' : 'badge-amber']">
                  {{ att.roas }}x
                </span>
              </td>
              <td class="font-mono">{{ formatCurrency(att.cpa) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Tab 2: Customer Leads Table -->
    <section v-if="activeTab === 'leads'" class="card table-card">
      <div class="table-header">
        <div>
          <h3>Danh Sách Khách Hàng Được Gán Mã Ad ID</h3>
          <p class="table-sub">Tự động nhận diện từ Messenger Conversation Referral và Facebook Form Lead</p>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Mã Ad ID Khớp</th>
              <th>Mẫu Quảng Cáo Thấy</th>
              <th>Tên Khách Hàng</th>
              <th>Số Điện Thoại</th>
              <th>Email</th>
              <th>Kênh</th>
              <th>Thời Gian</th>
              <th>Nhu Cầu / Ghi Chú</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="lead in sortedLeads" :key="lead.id">
              <td class="font-mono text-cyan">{{ lead.adId }}</td>
              <td class="font-bold">{{ lead.ad?.name || 'N/A' }}</td>
              <td class="text-white">{{ lead.customerName }}</td>
              <td>
                <span v-if="lead.phoneNumber" class="badge badge-success font-mono font-bold">{{ lead.phoneNumber }}</span>
                <span v-else class="text-dim font-mono">-</span>
              </td>
              <td class="font-mono">{{ lead.email || '-' }}</td>
              <td>
                <span :class="['badge', lead.channel === 'MESSENGER' ? 'badge-blue' : 'badge-amber']">
                  {{ lead.channel }}
                </span>
              </td>
              <td class="font-mono text-dim">{{ formatDate(lead.createdTime) }}</td>
              <td>{{ lead.notes || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Tab 3: Sync Logs -->
    <section v-if="activeTab === 'logs'" class="card table-card">
      <div class="table-header">
        <h3>Nhật Ký Đồng Bộ API</h3>
      </div>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Thời Gian</th>
              <th>Loại Đồng Bộ</th>
              <th>Trạng Thái</th>
              <th>Thông Điệp Chi Tiết</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in syncLogs" :key="log.id">
              <td class="font-mono">{{ formatDate(log.syncedAt) }}</td>
              <td class="font-mono">{{ log.type }}</td>
              <td>
                <span :class="['badge', log.status === 'SUCCESS' ? 'badge-success' : 'badge-danger']">
                  {{ log.status }}
                </span>
              </td>
              <td>{{ log.message }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const config = useRuntimeConfig()
const apiBase = config.public.apiBase || 'http://localhost:3001'

const activeTab = ref('ads')
const searchQuery = ref('')
const isSyncing = ref(false)

const summary = ref({
  totalSpend: 0,
  totalImpressions: 0,
  totalClicks: 0,
  totalMessages: 0,
  totalFormLeads: 0,
  totalMatchedLeads: 0,
  avgCpl: 0,
  avgCtr: 0,
  avgCpc: 0,
})

const adsList = ref([])
const leadsList = ref([])
const syncLogs = ref([])
const attributionList = ref([])

const filteredAds = computed(() => {
  if (!searchQuery.value) return adsList.value
  const q = searchQuery.value.toLowerCase()
  return adsList.value.filter(a => a.id.toLowerCase().includes(q) || a.name.toLowerCase().includes(q) || (a.brand && a.brand.toLowerCase().includes(q)))
})

const sortedLeads = computed(() => {
  return [...leadsList.value].sort((a, b) => {
    if (a.phoneNumber && !b.phoneNumber) return -1
    if (!a.phoneNumber && b.phoneNumber) return 1
    return new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime()
  })
})

const fetchData = async () => {
  try {
    const [resSummary, resAds, resLeads, resLogs, resAtt] = await Promise.all([
      fetch(`${apiBase}/api/reports/summary`).then(r => r.json()),
      fetch(`${apiBase}/api/reports/ads`).then(r => r.json()),
      fetch(`${apiBase}/api/reports/leads`).then(r => r.json()),
      fetch(`${apiBase}/api/reports/sync-logs`).then(r => r.json()),
      fetch(`${apiBase}/api/reports/attribution`).then(r => r.json()),
    ])

    summary.value = resSummary
    adsList.value = resAds
    leadsList.value = resLeads
    syncLogs.value = resLogs
    attributionList.value = resAtt
  } catch (err) {
    console.error('Lỗi lấy dữ liệu từ Backend API:', err)
  }
}

const syncData = async () => {
  isSyncing.value = true
  try {
    await fetch(`${apiBase}/api/sync/all`, { method: 'POST' })
    await fetchData()
  } catch (err) {
    alert('Lỗi đồng bộ dữ liệu: ' + err.message)
  } finally {
    isSyncing.value = false
  }
}

const formatCurrency = (val) => {
  if (!val) return '0 ₫'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
}

const formatNumber = (val) => {
  if (!val) return '0'
  return new Intl.NumberFormat('vi-VN').format(val)
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('vi-VN')
}

onMounted(() => {
  fetchData()
})
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  --bg-dark: #0b0f19;
  --card-bg: #141c2e;
  --card-border: #1e293b;
  --text-main: #f8fafc;
  --text-muted: #94a3b8;
  --primary: #6366f1;
  --primary-hover: #4f46e5;
  --emerald: #10b981;
  --cyan: #06b6d4;
  --amber: #f59e0b;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Plus Jakarta Sans', sans-serif;
  background-color: var(--bg-dark);
  color: var(--text-main);
  min-height: 100vh;
  padding: 24px;
}

.dashboard-container {
  max-width: 1400px;
  margin: 0 auto;
}

/* Header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--card-border);
}

.brand {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--primary), #8b5cf6);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.4);
}

.logo svg {
  width: 24px;
  height: 24px;
}

h1 {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.5px;
}

.subtitle {
  font-size: 14px;
  color: var(--text-muted);
}

.actions {
  display: flex;
  gap: 12px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  border: none;
}

.btn-primary {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}

.btn-secondary {
  background: var(--card-bg);
  color: var(--text-main);
  border: 1px solid var(--card-border);
}

.btn-secondary:hover {
  background: #1e293b;
  transform: translateY(-2px);
}

/* KPI Grid */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
  margin-bottom: 28px;
}

.card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.kpi-card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.kpi-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-purple { background: rgba(99, 102, 241, 0.15); color: #818cf8; }
.icon-blue { background: rgba(6, 182, 212, 0.15); color: #38bdf8; }
.icon-emerald { background: rgba(16, 185, 129, 0.15); color: #34d399; }
.icon-amber { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }

.kpi-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
}

.kpi-value {
  font-size: 22px;
  font-weight: 800;
  margin: 4px 0;
}

.kpi-sub {
  font-size: 12px;
  color: var(--text-muted);
}

.text-gradient {
  background: linear-gradient(135deg, #a78bfa, #818cf8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Tabs */
.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--card-border);
  padding-bottom: 8px;
}

.tab-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn.active {
  background: var(--card-bg);
  color: var(--text-main);
  border: 1px solid var(--card-border);
}

/* Tables */
.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.table-sub {
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 4px;
}

.search-input {
  background: #0b0f19;
  border: 1px solid var(--card-border);
  padding: 10px 16px;
  border-radius: 8px;
  color: white;
  font-size: 13px;
  width: 280px;
}

.table-wrapper {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 14px;
}

.data-table th {
  background: #0f172a;
  color: var(--text-muted);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--card-border);
}

.data-table td {
  padding: 16px;
  border-bottom: 1px solid var(--card-border);
}

.data-table tr:hover {
  background: rgba(255, 255, 255, 0.02);
}

.font-mono { font-family: 'JetBrains Mono', monospace; }
.font-bold { font-weight: 700; }
.text-cyan { color: var(--cyan); }
.text-amber { color: var(--amber); }
.text-emerald { color: var(--emerald); }
.text-dim { color: #64748b; }

.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.badge-sm {
  padding: 2px 6px;
  font-size: 11px;
  background: rgba(255,255,255,0.1);
  border-radius: 4px;
}

.badge-success { background: rgba(16, 185, 129, 0.15); color: #34d399; }
.badge-blue { background: rgba(99, 102, 241, 0.15); color: #818cf8; }
.badge-amber { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
.badge-danger { background: rgba(239, 68, 68, 0.15); color: #f87171; }

.empty-cell {
  text-align: center;
  padding: 40px;
  color: var(--text-muted);
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
