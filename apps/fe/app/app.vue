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
          <h1>Marketing Multi-Level Attribution Tool</h1>
          <p class="subtitle">Báo cáo đa chiều: Campaign ↔ Adset ↔ Ads ↔ Khớp Đơn Hàng CRM Đông Á (SHA-256)</p>
        </div>
      </div>

      <div class="actions">
        <button class="btn btn-secondary" @click="syncCrmData" :disabled="isSyncingCrm">
          <span v-if="isSyncingCrm" class="spinner"></span>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          {{ isSyncingCrm ? 'Đang kéo CRM...' : 'Đồng bộ Đơn Đông Á' }}
        </button>

        <button class="btn btn-secondary" @click="syncAllData" :disabled="isSyncingAll">
          <span v-if="isSyncingAll" class="spinner"></span>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
          {{ isSyncingAll ? 'Đang đồng bộ...' : 'Đồng bộ Tất cả (Ads + Inbox)' }}
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
        <div class="kpi-icon icon-emerald">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m16 10-4 4-2-2"/></svg>
        </div>
        <div class="kpi-content">
          <span class="kpi-label">Doanh Thu Khớp Thực Tế</span>
          <h2 class="kpi-value text-emerald">{{ formatCurrency(totalAttributedRevenue) }}</h2>
          <span class="kpi-sub font-mono">Đã chốt: {{ totalAttributedOrders }} đơn chốt từ Ads</span>
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
        <div class="kpi-icon icon-amber">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </div>
        <div class="kpi-content">
          <span class="kpi-label">Khách Hàng Khớp SĐT (Lead Funnel L1)</span>
          <h2 class="kpi-value text-amber">{{ summary.totalMatchedLeads }} Khách</h2>
          <span class="kpi-sub font-mono">CPL Trung bình: {{ formatCurrency(summary.avgCpl) }}/Khách</span>
        </div>
      </div>
    </section>

    <!-- Date Range Filter Bar (Default 90 days) -->
    <section class="card filter-card">
      <div class="filter-left">
        <div class="filter-label-group">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span class="font-bold">Khoảng Thời Gian:</span>
        </div>

        <div class="quick-presets">
          <button class="preset-btn" :class="{ active: selectedPreset === '90d' }" @click="applyPreset('90d')">90 ngày gần nhất (Mặc định)</button>
          <button class="preset-btn" :class="{ active: selectedPreset === '30d' }" @click="applyPreset('30d')">30 ngày qua</button>
          <button class="preset-btn" :class="{ active: selectedPreset === '7d' }" @click="applyPreset('7d')">7 ngày qua</button>
          <button class="preset-btn" :class="{ active: selectedPreset === 'all' }" @click="applyPreset('all')">Toàn thời gian</button>
        </div>
      </div>

      <div class="date-inputs">
        <div class="input-item">
          <label>Từ ngày:</label>
          <input type="date" v-model="startDate" @change="onCustomDateChange" class="date-picker-input" />
        </div>
        <div class="input-item">
          <label>Đến ngày:</label>
          <input type="date" v-model="endDate" @change="onCustomDateChange" class="date-picker-input" />
        </div>
        <button class="btn btn-secondary btn-sm" @click="fetchData">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          Lọc
        </button>
      </div>
    </section>

    <!-- Controls Bar: Dimension Selector & Search -->
    <div class="controls-bar">
      <!-- Main Navigation Tabs -->
      <div class="tabs">
        <button class="tab-btn" :class="{ active: activeTab === 'campaigns' }" @click="activeTab = 'campaigns'">
          🎯 Báo Cáo Theo Chiến Dịch (Campaigns)
        </button>
        <button class="tab-btn" :class="{ active: activeTab === 'adsets' }" @click="activeTab = 'adsets'">
          📁 Báo Cáo Theo Nhóm (AdSets)
        </button>
        <button class="tab-btn" :class="{ active: activeTab === 'ads' }" @click="activeTab = 'ads'">
          📊 Báo Cáo Theo Mẫu Ads & Content
        </button>
        <button class="tab-btn" :class="{ active: activeTab === 'attribution' }" @click="activeTab = 'attribution'">
          💰 Doanh Thu & ROAS Thực Tế ({{ matchedAttributionList.length }} Ads có đơn)
        </button>
        <button class="tab-btn" :class="{ active: activeTab === 'leads' }" @click="activeTab = 'leads'">
          👥 Khách Khớp SĐT & CRM ({{ leadsList.length }})
        </button>
        <button class="tab-btn" :class="{ active: activeTab === 'logs' }" @click="activeTab = 'logs'">
          📋 Nhật Ký Đồng Bộ
        </button>
      </div>

      <div class="filter-box">
        <input v-model="searchQuery" type="text" placeholder="Tìm theo tên, ID, hoặc Nhãn..." class="search-input" />
      </div>
    </div>

    <!-- TAB 1: CAMPAIGNS REPORT -->
    <section v-if="activeTab === 'campaigns'" class="card table-card">
      <div class="table-header">
        <div>
          <h3>Báo Cáo Hiệu Suất Theo Chiến Dịch (Campaign Level)</h3>
          <p class="table-sub">Tổng hợp đa chiều toàn bộ Chi phí, Lượt xem, Clicks, Đơn hàng và Doanh thu theo từng Campaign</p>
        </div>
        <span class="badge badge-blue">{{ filteredCampaigns.length }} Chiến Dịch</span>
      </div>

      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Tên Chiến Dịch</th>
              <th>Nhãn Hàng</th>
              <th>Định Dạng</th>
              <th>Target</th>
              <th>Số Nhóm</th>
              <th>Chi Phí (VND)</th>
              <th>Hiển Thị</th>
              <th>Clicks (CTR)</th>
              <th>Tin Nhắn</th>
              <th>Khách Khớp SĐT</th>
              <th>Số Đơn CRM</th>
              <th>Doanh Thu Đơn</th>
              <th>ROAS</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in filteredCampaigns" :key="c.id">
              <td>
                <div class="font-bold text-white">{{ c.name }}</div>
                <div class="font-mono text-dim text-xs">ID: {{ c.id }}</div>
              </td>
              <td><span class="badge badge-blue">{{ c.brand }}</span></td>
              <td><span class="badge badge-amber">{{ c.format }}</span></td>
              <td><span class="text-xs">{{ c.target }}</span></td>
              <td class="font-mono">{{ c.adSetCount }} nhóm</td>
              <td class="font-mono text-amber font-bold">{{ formatCurrency(c.spend) }}</td>
              <td class="font-mono">{{ formatNumber(c.impressions) }}</td>
              <td class="font-mono">{{ formatNumber(c.clicks) }} <span class="badge-sm">{{ c.ctr }}%</span></td>
              <td class="font-mono">{{ c.messagingConversions }}</td>
              <td><span class="badge badge-success">{{ c.matchedLeadsCount }}</span></td>
              <td class="font-mono font-bold">{{ c.orderCount }} đơn</td>
              <td class="font-mono font-bold text-emerald">{{ formatCurrency(c.totalRevenue) }}</td>
              <td>
                <span :class="['badge font-bold', c.roas >= 2 ? 'badge-success' : (c.roas > 0 ? 'badge-amber' : 'badge-dim')]">
                  {{ c.roas }}x
                </span>
              </td>
            </tr>
            <tr v-if="filteredCampaigns.length === 0">
              <td colspan="13" class="empty-cell">Không tìm thấy chiến dịch nào phù hợp.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- TAB 2: ADSETS REPORT -->
    <section v-if="activeTab === 'adsets'" class="card table-card">
      <div class="table-header">
        <div>
          <h3>Báo Cáo Hiệu Suất Theo Nhóm Quảng Cáo (AdSet Level)</h3>
          <p class="table-sub">Tổng hợp chi phí và doanh thu chốt đơn theo từng Nhóm đối tượng mục tiêu</p>
        </div>
        <span class="badge badge-blue">{{ filteredAdSets.length }} Nhóm Quảng Cáo</span>
      </div>

      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Tên Nhóm (AdSet)</th>
              <th>Thuộc Chiến Dịch</th>
              <th>Nhãn Hàng</th>
              <th>Số Mẫu Ads</th>
              <th>Chi Phí (VND)</th>
              <th>Hiển Thị</th>
              <th>Clicks (CTR)</th>
              <th>Tin Nhắn</th>
              <th>Số Đơn CRM</th>
              <th>Doanh Thu Đơn</th>
              <th>ROAS</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="as in filteredAdSets" :key="as.id">
              <td>
                <div class="font-bold text-white">{{ as.name }}</div>
                <div class="font-mono text-dim text-xs">ID: {{ as.id }}</div>
              </td>
              <td class="text-dim text-xs max-w-xs">{{ as.campaignName }}</td>
              <td><span class="badge badge-blue">{{ as.brand }}</span></td>
              <td class="font-mono">{{ as.adCount }} ads</td>
              <td class="font-mono text-amber font-bold">{{ formatCurrency(as.spend) }}</td>
              <td class="font-mono">{{ formatNumber(as.impressions) }}</td>
              <td class="font-mono">{{ formatNumber(as.clicks) }} <span class="badge-sm">{{ as.ctr }}%</span></td>
              <td class="font-mono">{{ as.messagingConversions }}</td>
              <td class="font-mono font-bold">{{ as.orderCount }} đơn</td>
              <td class="font-mono font-bold text-emerald">{{ formatCurrency(as.totalRevenue) }}</td>
              <td>
                <span :class="['badge font-bold', as.roas >= 2 ? 'badge-success' : (as.roas > 0 ? 'badge-amber' : 'badge-dim')]">
                  {{ as.roas }}x
                </span>
              </td>
            </tr>
            <tr v-if="filteredAdSets.length === 0">
              <td colspan="11" class="empty-cell">Không tìm thấy nhóm quảng cáo nào.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- TAB 3: ADS REPORT -->
    <section v-if="activeTab === 'ads'" class="card table-card">
      <div class="table-header">
        <div>
          <h3>Hiệu Suất Từng Mẫu Quảng Cáo & Naming Tags</h3>
          <p class="table-sub">Bóc tách sâu: Brand, Target, Format, Date, Chi phí, Khách khớp SĐT và Doanh thu thực</p>
        </div>
        <span class="badge badge-blue">{{ filteredAds.length }} Mẫu Ads</span>
      </div>

      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Mã Ad ID</th>
              <th>Tên Quảng Cáo</th>
              <th>Nhãn Hàng</th>
              <th>Định Dạng</th>
              <th>Target</th>
              <th>Chi Phí (VND)</th>
              <th>Hiển Thị</th>
              <th>Clicks (CTR)</th>
              <th>Khách Khớp SĐT</th>
              <th>Số Đơn CRM</th>
              <th>Doanh Thu Đơn</th>
              <th>ROAS</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ad in filteredAds" :key="ad.id">
              <td class="font-mono text-cyan">{{ ad.id }}</td>
              <td class="font-bold">{{ ad.name }}</td>
              <td><span class="badge badge-blue">{{ ad.brand || 'Khác' }}</span></td>
              <td><span class="badge badge-amber">{{ ad.format || 'MESS' }}</span></td>
              <td><span class="text-xs">{{ ad.target || 'ALL' }}</span></td>
              <td class="font-mono text-amber">{{ formatCurrency(ad.spend) }}</td>
              <td class="font-mono">{{ formatNumber(ad.impressions) }}</td>
              <td class="font-mono">{{ formatNumber(ad.clicks) }} <span class="badge-sm">{{ ad.ctr }}%</span></td>
              <td>
                <span class="badge badge-success">{{ ad.matchedLeadsCount }} Khách</span>
              </td>
              <td class="font-mono font-bold">{{ ad.orderCount }} đơn</td>
              <td class="font-mono font-bold text-emerald">{{ formatCurrency(ad.totalRevenue) }}</td>
              <td>
                <span :class="['badge font-bold', ad.roas >= 2 ? 'badge-success' : (ad.roas > 0 ? 'badge-amber' : 'badge-dim')]">
                  {{ ad.roas }}x
                </span>
              </td>
            </tr>
            <tr v-if="filteredAds.length === 0">
              <td colspan="12" class="empty-cell">Chưa có dữ liệu quảng cáo.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- TAB 4: ATTRIBUTION & REAL ROAS -->
    <section v-if="activeTab === 'attribution'" class="card table-card">
      <div class="table-header">
        <div>
          <h3>Bảng Đối Soát Doanh Thu & ROAS Thật Từ CRM Đông Á</h3>
          <p class="table-sub">Nối tự động: Ad ID ↔ Messenger PSID ↔ SĐT Khách Hàng ↔ Đơn Hàng Thực Tế Hệ Thống Đông Á</p>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Mã Ad ID</th>
              <th>Tên Quảng Cáo</th>
              <th>Thuộc Chiến Dịch</th>
              <th>Nhãn Hàng</th>
              <th>Chi Phí Ads</th>
              <th>Số Đơn Chốt</th>
              <th>Doanh Thu Đơn Hàng</th>
              <th>ROAS Thật</th>
              <th>CPA (Chi phí/Đơn)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="att in attributionList" :key="att.adId">
              <td class="font-mono text-cyan">{{ att.adId }}</td>
              <td class="font-bold">{{ att.adName }}</td>
              <td class="text-dim text-xs">{{ att.campaignName }}</td>
              <td><span class="badge badge-blue">{{ att.brand }}</span></td>
              <td class="font-mono text-amber">{{ formatCurrency(att.spend) }}</td>
              <td class="font-mono font-bold">{{ att.orderCount }} đơn</td>
              <td class="font-mono font-bold text-emerald">{{ formatCurrency(att.totalRevenue) }}</td>
              <td>
                <span :class="['badge font-bold', att.roas >= 2 ? 'badge-success' : (att.roas > 0 ? 'badge-amber' : 'badge-dim')]">
                  {{ att.roas }}x
                </span>
              </td>
              <td class="font-mono">{{ formatCurrency(att.cpa) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- TAB 5: LEADS TABLE -->
    <section v-if="activeTab === 'leads'" class="card table-card">
      <div class="table-header">
        <div>
          <h3>Danh Sách Khách Hàng Khớp Số Điện Thoại & Mã Ad ID</h3>
          <p class="table-sub">Khách hàng để lại SĐT qua Messenger Chat hoặc Form Lead, làm khóa nối với CRM Đông Á</p>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Mã Ad ID Khớp</th>
              <th>Mẫu Quảng Cáo Tương Tác</th>
              <th>Tên Khách Hàng</th>
              <th>Số Điện Thoại (Khóa Nối)</th>
              <th>Kênh</th>
              <th>Thời Gian Chat</th>
              <th>Đơn Hàng Khớp Trong CRM</th>
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
              <td>
                <span :class="['badge', lead.channel === 'MESSENGER' ? 'badge-blue' : 'badge-amber']">
                  {{ lead.channel }}
                </span>
              </td>
              <td class="font-mono text-dim">{{ formatDate(lead.createdTime) }}</td>
              <td>
                <span v-if="lead.orders && lead.orders.length > 0" class="badge badge-success">
                  {{ lead.orders.length }} đơn ({{ formatCurrency(lead.orders.reduce((s, o) => s + o.revenue, 0)) }})
                </span>
                <span v-else class="text-dim text-xs">Chưa có đơn</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- TAB 6: SYNC LOGS -->
    <section v-if="activeTab === 'logs'" class="card table-card">
      <div class="table-header">
        <h3>Nhật Ký Đồng Bộ API Hệ Thống</h3>
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
              <td class="font-mono"><span class="badge badge-blue">{{ log.type }}</span></td>
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

const activeTab = ref('campaigns')
const searchQuery = ref('')
const isSyncingAll = ref(false)
const isSyncingCrm = ref(false)

// Date Range Filter State (Default 90 days)
const selectedPreset = ref('90d')
const formatISODate = (d) => d.toISOString().slice(0, 10)

const today = new Date()
const defaultStart = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)

const startDate = ref(formatISODate(defaultStart))
const endDate = ref(formatISODate(today))

const applyPreset = (preset) => {
  selectedPreset.value = preset
  const now = new Date()
  endDate.value = formatISODate(now)

  if (preset === '90d') {
    startDate.value = formatISODate(new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000))
  } else if (preset === '30d') {
    startDate.value = formatISODate(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000))
  } else if (preset === '7d') {
    startDate.value = formatISODate(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000))
  } else if (preset === 'all') {
    startDate.value = ''
    endDate.value = ''
  }
  fetchData()
}

const onCustomDateChange = () => {
  selectedPreset.value = 'custom'
  fetchData()
}

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

const campaignsList = ref([])
const adSetsList = ref([])
const adsList = ref([])
const leadsList = ref([])
const syncLogs = ref([])
const attributionList = ref([])

const totalAttributedRevenue = computed(() => {
  return attributionList.value.reduce((acc, cur) => acc + (cur.totalRevenue || 0), 0)
})

const totalAttributedOrders = computed(() => {
  return attributionList.value.reduce((acc, cur) => acc + (cur.orderCount || 0), 0)
})

const matchedAttributionList = computed(() => {
  return attributionList.value.filter(a => a.totalRevenue > 0)
})

const filteredCampaigns = computed(() => {
  if (!searchQuery.value) return campaignsList.value
  const q = searchQuery.value.toLowerCase()
  return campaignsList.value.filter(c => c.name.toLowerCase().includes(q) || (c.brand && c.brand.toLowerCase().includes(q)))
})

const filteredAdSets = computed(() => {
  if (!searchQuery.value) return adSetsList.value
  const q = searchQuery.value.toLowerCase()
  return adSetsList.value.filter(a => a.name.toLowerCase().includes(q) || (a.campaignName && a.campaignName.toLowerCase().includes(q)))
})

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
    const queryParams = new URLSearchParams()
    if (startDate.value) queryParams.set('tu_ngay', startDate.value)
    if (endDate.value) queryParams.set('den_ngay', endDate.value)
    const qs = queryParams.toString() ? `?${queryParams.toString()}` : ''

    const [resSummary, resCamps, resAdSets, resAds, resLeads, resLogs, resAtt] = await Promise.all([
      fetch(`${apiBase}/api/reports/summary${qs}`).then(r => r.json()),
      fetch(`${apiBase}/api/reports/campaigns${qs}`).then(r => r.json()),
      fetch(`${apiBase}/api/reports/adsets${qs}`).then(r => r.json()),
      fetch(`${apiBase}/api/reports/ads${qs}`).then(r => r.json()),
      fetch(`${apiBase}/api/reports/leads${qs}`).then(r => r.json()),
      fetch(`${apiBase}/api/reports/sync-logs`).then(r => r.json()),
      fetch(`${apiBase}/api/reports/attribution${qs}`).then(r => r.json()),
    ])

    summary.value = resSummary
    campaignsList.value = resCamps
    adSetsList.value = resAdSets
    adsList.value = resAds
    leadsList.value = resLeads
    syncLogs.value = resLogs
    attributionList.value = resAtt
  } catch (err) {
    console.error('Lỗi lấy dữ liệu từ Backend API:', err)
  }
}

const syncAllData = async () => {
  isSyncingAll.value = true
  try {
    await fetch(`${apiBase}/api/sync/all`, { method: 'POST' })
    await fetchData()
  } catch (err) {
    alert('Lỗi đồng bộ dữ liệu: ' + err.message)
  } finally {
    isSyncingAll.value = false
  }
}

const syncCrmData = async () => {
  isSyncingCrm.value = true
  try {
    const res = await fetch(`${apiBase}/api/sync/crm`, { method: 'POST' }).then(r => r.json())
    alert(`Đồng bộ đơn hàng thành công! Đã nạp ${res.result?.totalOrders || 0} đơn, khớp ${res.result?.matchedOrders || 0} đơn vào Ads.`)
    await fetchData()
  } catch (err) {
    alert('Lỗi đồng bộ CRM: ' + err.message)
  } finally {
    isSyncingCrm.value = false
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
  max-width: 1440px;
  margin: 0 auto;
}

/* Header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
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
  padding: 10px 18px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 13px;
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
  margin-bottom: 24px;
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

/* Date Filter Card */
.filter-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
  padding: 14px 20px;
  flex-wrap: wrap;
}

.filter-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.filter-label-group {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--cyan);
  font-size: 14px;
}

.quick-presets {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.preset-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--card-border);
  color: var(--text-muted);
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.preset-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-main);
}

.preset-btn.active {
  background: rgba(6, 182, 212, 0.15);
  border-color: var(--cyan);
  color: var(--cyan);
  font-weight: 700;
}

.date-inputs {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.input-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-muted);
}

.date-picker-input {
  background: #0b0f19;
  border: 1px solid var(--card-border);
  color: white;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 13px;
  outline: none;
}

.date-picker-input:focus {
  border-color: var(--cyan);
}

.btn-sm {
  padding: 7px 14px;
  font-size: 12px;
}

/* Controls Bar */
.controls-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--card-border);
  padding-bottom: 8px;
  flex-wrap: wrap;
}

/* Tabs */
.tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tab-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: var(--text-main);
  background: rgba(255, 255, 255, 0.05);
}

.tab-btn.active {
  background: var(--card-bg);
  color: #38bdf8;
  border: 1px solid var(--card-border);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.filter-box {
  display: flex;
  gap: 10px;
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

.table-wrapper {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 13px;
}

.data-table th {
  background: #0f172a;
  color: var(--text-muted);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 14px 14px;
  border-bottom: 1px solid var(--card-border);
  white-space: nowrap;
}

.data-table td {
  padding: 14px;
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
.text-xs { font-size: 11px; }

.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
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
.badge-dim { background: rgba(255, 255, 255, 0.05); color: #64748b; }

.empty-cell {
  text-align: center;
  padding: 40px;
  color: var(--text-muted);
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
