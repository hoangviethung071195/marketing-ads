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
        <!-- Nút chuyển đổi Light / Dark Mode -->
        <button class="btn btn-secondary theme-toggle-btn" @click="toggleTheme" :title="isLightMode ? 'Chuyển sang giao diện Dark Mode' : 'Chuyển sang giao diện Light Mode'">
          <svg v-if="isLightMode" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
          {{ isLightMode ? 'Dark Mode' : 'Light Mode' }}
        </button>

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
          <button class="preset-btn" :class="{ active: selectedPreset === 'this_week' }" @click="applyPreset('this_week')">Tuần này</button>
          <button class="preset-btn" :class="{ active: selectedPreset === 'last_week' }" @click="applyPreset('last_week')">Tuần trước</button>
          <button class="preset-btn" :class="{ active: selectedPreset === 'this_month' }" @click="applyPreset('this_month')">Tháng này</button>
          <button class="preset-btn" :class="{ active: selectedPreset === 'last_month' }" @click="applyPreset('last_month')">Tháng trước</button>
          <button class="preset-btn" :class="{ active: selectedPreset === '7d' }" @click="applyPreset('7d')">7 ngày qua</button>
          <button class="preset-btn" :class="{ active: selectedPreset === '30d' }" @click="applyPreset('30d')">30 ngày qua</button>
          <button class="preset-btn" :class="{ active: selectedPreset === '90d' }" @click="applyPreset('90d')">90 ngày</button>
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
              <th @click="handleSort('campaigns', 'name')" class="sortable-th">
                Tên Chiến Dịch <span class="sort-icon">{{ getSortIcon('campaigns', 'name') }}</span>
              </th>
              <th>Trạng Thái</th>
              <th @click="handleSort('campaigns', 'brand')" class="sortable-th">
                Nhãn Hàng <span class="sort-icon">{{ getSortIcon('campaigns', 'brand') }}</span>
              </th>
              <th>Định Dạng</th>
              <th>Target</th>
              <th @click="handleSort('campaigns', 'adSetCount')" class="sortable-th">
                Số Nhóm <span class="sort-icon">{{ getSortIcon('campaigns', 'adSetCount') }}</span>
              </th>
              <th @click="handleSort('campaigns', 'spend')" class="sortable-th">
                Chi Phí (VND) <span class="sort-icon">{{ getSortIcon('campaigns', 'spend') }}</span>
              </th>
              <th @click="handleSort('campaigns', 'impressions')" class="sortable-th">
                Hiển Thị <span class="sort-icon">{{ getSortIcon('campaigns', 'impressions') }}</span>
              </th>
              <th @click="handleSort('campaigns', 'clicks')" class="sortable-th">
                Clicks (CTR) <span class="sort-icon">{{ getSortIcon('campaigns', 'clicks') }}</span>
              </th>
              <th @click="handleSort('campaigns', 'messagingConversions')" class="sortable-th">
                Tin Nhắn <span class="sort-icon">{{ getSortIcon('campaigns', 'messagingConversions') }}</span>
              </th>
              <th @click="handleSort('campaigns', 'matchedLeadsCount')" class="sortable-th">
                Khách Khớp SĐT <span class="sort-icon">{{ getSortIcon('campaigns', 'matchedLeadsCount') }}</span>
              </th>
              <th @click="handleSort('campaigns', 'orderCount')" class="sortable-th">
                Số Đơn CRM <span class="sort-icon">{{ getSortIcon('campaigns', 'orderCount') }}</span>
              </th>
              <th @click="handleSort('campaigns', 'totalRevenue')" class="sortable-th">
                Doanh Thu Đơn <span class="sort-icon">{{ getSortIcon('campaigns', 'totalRevenue') }}</span>
              </th>
              <th @click="handleSort('campaigns', 'roas')" class="sortable-th">
                ROAS <span class="sort-icon">{{ getSortIcon('campaigns', 'roas') }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in filteredCampaigns" :key="c.id">
              <td>
                <div class="font-bold text-highlight">{{ c.name }}</div>
                <div class="font-mono text-dim text-xs">ID: {{ c.id }}</div>
              </td>
              <td>
                <span :class="['badge', c.status === 'ACTIVE' ? 'badge-success' : 'badge-dim']">
                  {{ c.status === 'ACTIVE' ? 'BẬT' : 'TẮT' }}
                </span>
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
              <td colspan="14" class="empty-cell">Không tìm thấy chiến dịch nào phù hợp.</td>
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
              <th @click="handleSort('adsets', 'name')" class="sortable-th">
                Tên Nhóm (AdSet) <span class="sort-icon">{{ getSortIcon('adsets', 'name') }}</span>
              </th>
              <th>Thuộc Chiến Dịch</th>
              <th @click="handleSort('adsets', 'brand')" class="sortable-th">
                Nhãn Hàng <span class="sort-icon">{{ getSortIcon('adsets', 'brand') }}</span>
              </th>
              <th @click="handleSort('adsets', 'adCount')" class="sortable-th">
                Số Mẫu Ads <span class="sort-icon">{{ getSortIcon('adsets', 'adCount') }}</span>
              </th>
              <th @click="handleSort('adsets', 'spend')" class="sortable-th">
                Chi Phí (VND) <span class="sort-icon">{{ getSortIcon('adsets', 'spend') }}</span>
              </th>
              <th @click="handleSort('adsets', 'impressions')" class="sortable-th">
                Hiển Thị <span class="sort-icon">{{ getSortIcon('adsets', 'impressions') }}</span>
              </th>
              <th @click="handleSort('adsets', 'clicks')" class="sortable-th">
                Clicks (CTR) <span class="sort-icon">{{ getSortIcon('adsets', 'clicks') }}</span>
              </th>
              <th @click="handleSort('adsets', 'messagingConversions')" class="sortable-th">
                Tin Nhắn <span class="sort-icon">{{ getSortIcon('adsets', 'messagingConversions') }}</span>
              </th>
              <th @click="handleSort('adsets', 'orderCount')" class="sortable-th">
                Số Đơn CRM <span class="sort-icon">{{ getSortIcon('adsets', 'orderCount') }}</span>
              </th>
              <th @click="handleSort('adsets', 'totalRevenue')" class="sortable-th">
                Doanh Thu Đơn <span class="sort-icon">{{ getSortIcon('adsets', 'totalRevenue') }}</span>
              </th>
              <th @click="handleSort('adsets', 'roas')" class="sortable-th">
                ROAS <span class="sort-icon">{{ getSortIcon('adsets', 'roas') }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="as in filteredAdSets" :key="as.id">
              <td>
                <div class="font-bold text-highlight">{{ as.name }}</div>
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
        
        <!-- Toggle Nhóm theo Tên Mẫu Ads Content -->
        <div class="view-mode-toggle">
          <button class="preset-btn" :class="{ active: adViewMode === 'detail' }" @click="adViewMode = 'detail'">
            Từng mã Ad ID (Chi tiết)
          </button>
          <button class="preset-btn" :class="{ active: adViewMode === 'grouped' }" @click="adViewMode = 'grouped'">
            ✨ Gộp theo Tên Mẫu Content (Sum)
          </button>
          <span class="badge badge-blue">{{ filteredAds.length }} {{ adViewMode === 'grouped' ? 'Mẫu Content' : 'Mẫu Ads' }}</span>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th v-if="adViewMode === 'detail'">Mã Ad ID</th>
              <th @click="handleSort('ads', 'name')" class="sortable-th">
                {{ adViewMode === 'grouped' ? 'Tên Mẫu Quảng Cáo (Gộp chung)' : 'Tên Quảng Cáo' }} <span class="sort-icon">{{ getSortIcon('ads', 'name') }}</span>
              </th>
              <th v-if="adViewMode === 'grouped'">Số Bản Chạy</th>
              <th>Nhãn Hàng</th>
              <th>Định Dạng</th>
              <th>Target</th>
              <th @click="handleSort('ads', 'spend')" class="sortable-th">
                Chi Phí (VND) <span class="sort-icon">{{ getSortIcon('ads', 'spend') }}</span>
              </th>
              <th @click="handleSort('ads', 'impressions')" class="sortable-th">
                Hiển Thị <span class="sort-icon">{{ getSortIcon('ads', 'impressions') }}</span>
              </th>
              <th @click="handleSort('ads', 'clicks')" class="sortable-th">
                Clicks (CTR) <span class="sort-icon">{{ getSortIcon('ads', 'clicks') }}</span>
              </th>
              <th @click="handleSort('ads', 'matchedLeadsCount')" class="sortable-th">
                Khách Khớp SĐT <span class="sort-icon">{{ getSortIcon('ads', 'matchedLeadsCount') }}</span>
              </th>
              <th @click="handleSort('ads', 'orderCount')" class="sortable-th">
                Số Đơn CRM <span class="sort-icon">{{ getSortIcon('ads', 'orderCount') }}</span>
              </th>
              <th @click="handleSort('ads', 'totalRevenue')" class="sortable-th">
                Doanh Thu Đơn <span class="sort-icon">{{ getSortIcon('ads', 'totalRevenue') }}</span>
              </th>
              <th @click="handleSort('ads', 'roas')" class="sortable-th">
                ROAS <span class="sort-icon">{{ getSortIcon('ads', 'roas') }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ad in filteredAds" :key="ad.id">
              <td v-if="adViewMode === 'detail'" class="font-mono text-cyan">{{ ad.id }}</td>
              <td class="font-bold">{{ ad.name }}</td>
              <td v-if="adViewMode === 'grouped'" class="font-mono"><span class="badge badge-dim">{{ ad.adCount }} ads</span></td>
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
              <td :colspan="adViewMode === 'grouped' ? 12 : 12" class="empty-cell">Chưa có dữ liệu quảng cáo.</td>
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

        <!-- Bộ chọn Attribution Model (First click, Last click 7d, 30d) theo yêu cầu Tuấn -->
        <div class="attribution-model-selector">
          <label class="font-bold text-xs text-muted">Mô hình Attribution:</label>
          <div class="quick-presets">
            <button class="preset-btn" :class="{ active: attributionModel === 'last_click' }" @click="setAttributionModel('last_click')">Last Click (Chuẩn)</button>
            <button class="preset-btn" :class="{ active: attributionModel === 'last_click_7d' }" @click="setAttributionModel('last_click_7d')">Last Click 7 ngày</button>
            <button class="preset-btn" :class="{ active: attributionModel === 'last_click_30d' }" @click="setAttributionModel('last_click_30d')">Last Click 30 ngày</button>
            <button class="preset-btn" :class="{ active: attributionModel === 'first_click' }" @click="setAttributionModel('first_click')">First Click</button>
          </div>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th @click="handleSort('attribution', 'adId')" class="sortable-th">
                Mã Ad ID <span class="sort-icon">{{ getSortIcon('attribution', 'adId') }}</span>
              </th>
              <th @click="handleSort('attribution', 'adName')" class="sortable-th">
                Tên Quảng Cáo <span class="sort-icon">{{ getSortIcon('attribution', 'adName') }}</span>
              </th>
              <th>Thuộc Chiến Dịch</th>
              <th>Nhãn Hàng</th>
              <th @click="handleSort('attribution', 'spend')" class="sortable-th">
                Chi Phí Ads <span class="sort-icon">{{ getSortIcon('attribution', 'spend') }}</span>
              </th>
              <th @click="handleSort('attribution', 'orderCount')" class="sortable-th">
                Số Đơn Chốt <span class="sort-icon">{{ getSortIcon('attribution', 'orderCount') }}</span>
              </th>
              <th @click="handleSort('attribution', 'totalRevenue')" class="sortable-th">
                Doanh Thu Đơn Hàng <span class="sort-icon">{{ getSortIcon('attribution', 'totalRevenue') }}</span>
              </th>
              <th @click="handleSort('attribution', 'roas')" class="sortable-th">
                ROAS Thật <span class="sort-icon">{{ getSortIcon('attribution', 'roas') }}</span>
              </th>
              <th @click="handleSort('attribution', 'cpa')" class="sortable-th">
                CPA (Chi phí/Đơn) <span class="sort-icon">{{ getSortIcon('attribution', 'cpa') }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="att in filteredAttribution" :key="att.adId">
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
            <tr v-if="filteredAttribution.length === 0">
              <td colspan="9" class="empty-cell">Không tìm thấy dữ liệu đối soát nào.</td>
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

// 1. Light Mode / Dark Mode Theme
const isLightMode = ref(false)
const toggleTheme = () => {
  isLightMode.value = !isLightMode.value
  if (process.client) {
    if (isLightMode.value) {
      document.body.classList.add('light-theme')
      localStorage.setItem('tool_marketing_theme', 'light')
    } else {
      document.body.classList.remove('light-theme')
      localStorage.setItem('tool_marketing_theme', 'dark')
    }
  }
}

// 2. View Mode cho Tab Ads (Chi tiết Ad ID vs Gộp chung Content)
const adViewMode = ref('detail') // 'detail' | 'grouped'

// 3. Attribution Model Selector
const attributionModel = ref('last_click') // 'last_click' | 'last_click_7d' | 'last_click_30d' | 'first_click'
const setAttributionModel = (model) => {
  attributionModel.value = model
  fetchData()
}

// 4. Date Range Filter State & Presets
const selectedPreset = ref('90d')
const formatISODate = (d) => {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const today = new Date()
const defaultStart = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)

const startDate = ref(formatISODate(defaultStart))
const endDate = ref(formatISODate(today))

const applyPreset = (preset) => {
  selectedPreset.value = preset
  const now = new Date()

  if (preset === 'this_week') {
    // Thứ 2 tuần này đến hôm nay
    const day = now.getDay()
    const diffToMonday = day === 0 ? 6 : day - 1
    const monday = new Date(now)
    monday.setDate(now.getDate() - diffToMonday)
    startDate.value = formatISODate(monday)
    endDate.value = formatISODate(now)
  } else if (preset === 'last_week') {
    // Thứ 2 tuần trước đến Chủ nhật tuần trước
    const day = now.getDay()
    const diffToMonday = day === 0 ? 6 : day - 1
    const lastMonday = new Date(now)
    lastMonday.setDate(now.getDate() - diffToMonday - 7)
    const lastSunday = new Date(lastMonday)
    lastSunday.setDate(lastMonday.getDate() + 6)
    startDate.value = formatISODate(lastMonday)
    endDate.value = formatISODate(lastSunday)
  } else if (preset === 'this_month') {
    // Ngày 1 tháng này đến hôm nay
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    startDate.value = formatISODate(firstDay)
    endDate.value = formatISODate(now)
  } else if (preset === 'last_month') {
    // Ngày đầu đến ngày cuối tháng trước
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    startDate.value = formatISODate(firstDayLastMonth)
    endDate.value = formatISODate(lastDayLastMonth)
  } else if (preset === '7d') {
    startDate.value = formatISODate(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000))
    endDate.value = formatISODate(now)
  } else if (preset === '30d') {
    startDate.value = formatISODate(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000))
    endDate.value = formatISODate(now)
  } else if (preset === '90d') {
    startDate.value = formatISODate(new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000))
    endDate.value = formatISODate(now)
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

// 5. Multi-column Sorting Logic
const sortState = ref({
  campaigns: { col: 'spend', dir: 'desc' },
  adsets: { col: 'spend', dir: 'desc' },
  ads: { col: 'spend', dir: 'desc' },
  attribution: { col: 'totalRevenue', dir: 'desc' }
})

const handleSort = (tab, col) => {
  if (!sortState.value[tab]) {
    sortState.value[tab] = { col, dir: 'desc' }
    return
  }
  if (sortState.value[tab].col === col) {
    sortState.value[tab].dir = sortState.value[tab].dir === 'asc' ? 'desc' : 'asc'
  } else {
    sortState.value[tab].col = col
    sortState.value[tab].dir = 'desc'
  }
}

const getSortIcon = (tab, col) => {
  const current = sortState.value[tab]
  if (!current || current.col !== col) return '↕'
  return current.dir === 'asc' ? '↑' : '↓'
}

const genericSort = (list, col, dir) => {
  if (!col) return list
  return [...list].sort((a, b) => {
    let va = a[col]
    let vb = b[col]
    if (va === undefined || va === null) va = 0
    if (vb === undefined || vb === null) vb = 0
    if (typeof va === 'string') {
      const cmp = va.localeCompare(vb)
      return dir === 'asc' ? cmp : -cmp
    }
    return dir === 'asc' ? (va - vb) : (vb - va)
  })
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
  let list = campaignsList.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(c => c.name.toLowerCase().includes(q) || (c.brand && c.brand.toLowerCase().includes(q)))
  }
  const s = sortState.value.campaigns
  return genericSort(list, s?.col, s?.dir)
})

const filteredAdSets = computed(() => {
  let list = adSetsList.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(a => a.name.toLowerCase().includes(q) || (a.campaignName && a.campaignName.toLowerCase().includes(q)) || (a.brand && a.brand.toLowerCase().includes(q)))
  }
  const s = sortState.value.adsets
  return genericSort(list, s?.col, s?.dir)
})

// Tab Ads: hỗ trợ view 'detail' và 'grouped'
const filteredAds = computed(() => {
  let list = adsList.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(a => a.id.toLowerCase().includes(q) || a.name.toLowerCase().includes(q) || (a.brand && a.brand.toLowerCase().includes(q)))
  }

  if (adViewMode.value === 'grouped') {
    // Gom nhóm theo name hoặc tên content
    const map = new Map()
    for (const ad of list) {
      const key = (ad.name || 'Không có tên').trim()
      if (!map.has(key)) {
        map.set(key, {
          id: `group-${map.size + 1}`,
          name: key,
          adCount: 1,
          brand: ad.brand || 'Khác',
          format: ad.format || 'MESS',
          target: ad.target || 'ALL',
          spend: ad.spend || 0,
          impressions: ad.impressions || 0,
          clicks: ad.clicks || 0,
          matchedLeadsCount: ad.matchedLeadsCount || 0,
          orderCount: ad.orderCount || 0,
          totalRevenue: ad.totalRevenue || 0,
        })
      } else {
        const item = map.get(key)
        item.adCount += 1
        item.spend += (ad.spend || 0)
        item.impressions += (ad.impressions || 0)
        item.clicks += (ad.clicks || 0)
        item.matchedLeadsCount += (ad.matchedLeadsCount || 0)
        item.orderCount += (ad.orderCount || 0)
        item.totalRevenue += (ad.totalRevenue || 0)
      }
    }
    const grouped = Array.from(map.values()).map(g => {
      const ctr = g.impressions > 0 ? Number(((g.clicks / g.impressions) * 100).toFixed(2)) : 0
      const roas = g.spend > 0 ? Number((g.totalRevenue / g.spend).toFixed(2)) : 0
      return { ...g, ctr, roas }
    })
    const s = sortState.value.ads
    return genericSort(grouped, s?.col, s?.dir)
  }

  const s = sortState.value.ads
  return genericSort(list, s?.col, s?.dir)
})

const filteredAttribution = computed(() => {
  let list = attributionList.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(a => a.adId.toLowerCase().includes(q) || a.adName.toLowerCase().includes(q) || (a.brand && a.brand.toLowerCase().includes(q)) || (a.campaignName && a.campaignName.toLowerCase().includes(q)))
  }
  const s = sortState.value.attribution
  return genericSort(list, s?.col, s?.dir)
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
    if (attributionModel.value) queryParams.set('model', attributionModel.value)
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
  if (process.client) {
    const savedTheme = localStorage.getItem('tool_marketing_theme')
    if (savedTheme === 'light') {
      isLightMode.value = true
      document.body.classList.add('light-theme')
    }
  }
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

/* Sortable Headers */
.sortable-th {
  cursor: pointer;
  user-select: none;
  transition: color 0.15s ease, background-color 0.15s ease;
}

.sortable-th:hover {
  color: var(--cyan) !important;
  background-color: rgba(6, 182, 212, 0.08) !important;
}

.sort-icon {
  display: inline-block;
  margin-left: 4px;
  font-size: 12px;
  color: var(--cyan);
  opacity: 0.8;
}

/* View Mode Toggle & Model Selector */
.view-mode-toggle,
.attribution-model-selector {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.theme-toggle-btn {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  color: var(--text-main);
}

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

/* ========================================================
   LIGHT MODE THEME STYLES (Chống đau mắt theo yêu cầu)
   ======================================================== */
body.light-theme {
  --bg-dark: #f1f5f9;
  --card-bg: #ffffff;
  --card-border: #cbd5e1;
  --text-main: #0f172a;
  --text-muted: #64748b;
  background-color: #f8fafc;
  color: #0f172a;
}

body.light-theme .header {
  border-bottom-color: #e2e8f0;
}

body.light-theme .subtitle {
  color: #64748b;
}

body.light-theme .card {
  background: #ffffff;
  border-color: #e2e8f0;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
}

body.light-theme .btn-secondary {
  background: #ffffff;
  color: #1e293b;
  border-color: #cbd5e1;
}

body.light-theme .btn-secondary:hover {
  background: #f1f5f9;
}

body.light-theme .preset-btn {
  background: #f1f5f9;
  border-color: #e2e8f0;
  color: #475569;
}

body.light-theme .preset-btn:hover {
  background: #e2e8f0;
  color: #0f172a;
}

body.light-theme .preset-btn.active {
  background: rgba(6, 182, 212, 0.15);
  border-color: #0891b2;
  color: #0891b2;
}

body.light-theme .search-input,
body.light-theme .date-picker-input {
  background: #ffffff;
  border-color: #cbd5e1;
  color: #0f172a;
}

body.light-theme .data-table th {
  background: #f8fafc;
  color: #475569;
  border-bottom-color: #e2e8f0;
}

body.light-theme .data-table td {
  border-bottom-color: #f1f5f9;
  color: #1e293b;
}

body.light-theme .data-table tr:hover {
  background: #f8fafc;
}

body.light-theme .tab-btn {
  color: #64748b;
}

body.light-theme .tab-btn:hover {
  color: #0f172a;
  background: #e2e8f0;
}

body.light-theme .tab-btn.active {
  background: #ffffff;
  color: #0284c7;
  border-color: #cbd5e1;
  box-shadow: 0 2px 6px rgba(0,0,0,0.06);
}

body.light-theme .badge-dim {
  background: #f1f5f9;
  color: #64748b;
}

body.light-theme .badge-sm {
  background: #e2e8f0;
  color: #334155;
}
</style>
