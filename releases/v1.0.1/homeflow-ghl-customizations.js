/**
 * HomeFlow HighLevel Customizations
 * Release: v1.0.1 (Unified Robust Production Architecture)
 * 
 * Centralized async route controller for HighLevel CRM web application.
 * Handles subaccount exclusions, route redirections, layout adjustments,
 * and location-scoped sidebar/header styling without dependencies.
 */
(function () {
  'use strict';

  /* =========================================================
     1. CONFIGURATION & CONSTANTS
  ========================================================= */
  const EXCLUDED_LOCATION_IDS = [
    "3hxU86Tlg4Hj231eATmo",
    "wU0QPFEzdTl7CpndxylS"
  ];

  const HOMEFLOW_LOCATION_ID = "XzzLQ42sqJR43o30CP34";

  const STYLE_IDS = {
    SIDEBAR: "custom-sidebar-global-layout",
    REVIEWS: "custom-review-layout-test",
    WIDGET: "custom-widget-layout-test",
    SOCIAL_PLANNER: "custom-social-planner-layout-test",
    REPUTATION_INTEGRATIONS: "custom-reputation-integrations-layout-test",
    REVIEWS_AI: "custom-reviews-ai-layout-test",
    HOMEFLOW: "hide-header-templates-emails"
  };

  const ALL_STYLE_IDS = Object.values(STYLE_IDS);

  /* =========================================================
     2. SHARED ASYNC LOCATION RESOLVER
  ========================================================= */
  async function getLocationId() {
    // 1. Native HighLevel AppUtils API
    if (
      window.AppUtils &&
      window.AppUtils.Utilities &&
      typeof window.AppUtils.Utilities.getCurrentLocation === "function"
    ) {
      try {
        const loc = await window.AppUtils.Utilities.getCurrentLocation();
        if (typeof loc === "string" && loc.trim()) {
          return loc.trim();
        }
        if (loc && loc.id && typeof loc.id === "string") {
          return loc.id;
        }
        if (loc && loc.locationId && typeof loc.locationId === "string") {
          return loc.locationId;
        }
      } catch (e) {
        // Fall through
      }
    }

    // 2. Path Regex Fallback
    const pathMatch = window.location.pathname.match(
      /\/(?:v2\/)?location\/([A-Za-z0-9_-]+)/
    );
    if (pathMatch && pathMatch[1]) {
      return pathMatch[1];
    }

    // 3. Search Params Fallback
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const queryLoc =
        searchParams.get("location_id") ||
        searchParams.get("location") ||
        searchParams.get("loc");
      if (queryLoc && queryLoc.trim()) {
        return queryLoc.trim();
      }
    } catch (e) {
      // Fall through
    }

    // 4. DOM Class Fallback
    try {
      const sidebarEl = document.querySelector('[class*="sidebar-v2-location"]');
      if (sidebarEl) {
        const classes = Array.from(sidebarEl.classList);
        for (let i = 0; i < classes.length; i++) {
          const cls = classes[i];
          if (cls !== "sidebar-v2-location" && cls.length >= 10) {
            return cls;
          }
        }
      }
    } catch (e) {
      // Fall through
    }

    return null;
  }

  /* =========================================================
     3. ROUTE CHECKS & HELPERS
  ========================================================= */
  function getCurrentTab() {
    try {
      return new URLSearchParams(window.location.search).get("tab");
    } catch (e) {
      return null;
    }
  }

  function isOverviewPage(pathname) {
    return pathname.includes("/reputation/overview");
  }

  function isReviewsPage(pathname) {
    return pathname.includes("/reputation/reviews");
  }

  function isWidgetPage(pathname) {
    return pathname.includes("/reputation/widget");
  }

  function isSocialPlannerPage(pathname) {
    return pathname.includes("/marketing/social-planner");
  }

  function isReputationSettingsPage(pathname) {
    return pathname.includes("/reputation/settings");
  }

  function isReputationIntegrationsPage(pathname, tab) {
    return isReputationSettingsPage(pathname) && tab === "reputationIntegrations";
  }

  function isReviewsAIPage(pathname, tab) {
    return isReputationSettingsPage(pathname) && tab === "reviewsAI";
  }

  function isConversationTemplatesPage(pathname) {
    return pathname.includes("/conversations/templates");
  }

  function isMarketingEmailsPage(pathname) {
    return pathname.includes("/marketing/emails");
  }

  /* =========================================================
     4. EFFICIENT DECLARATIVE STYLE MANAGEMENT
  ========================================================= */
  function ensureStyle(styleId, css, shouldExist) {
    const existing = document.getElementById(styleId);

    if (!shouldExist) {
      if (existing) existing.remove();
      return;
    }

    if (existing) {
      if (existing.innerHTML !== css) {
        existing.innerHTML = css;
      }
      return;
    }

    const style = document.createElement("style");
    style.id = styleId;
    style.innerHTML = css;
    (document.head || document.documentElement).appendChild(style);
  }

  function removeStyle(styleId) {
    const element = document.getElementById(styleId);
    if (element) element.remove();
  }

  function removeAllLayouts() {
    ALL_STYLE_IDS.forEach(removeStyle);
  }

  /* =========================================================
     5. EXACT ORIGINAL CSS SELECTORS (100% PARITY)
  ========================================================= */
  function getSidebarGlobalCss(locId) {
    const locSelector = locId ? `.sidebar-v2-location.${locId}` : `.sidebar-v2-location`;
    return `
      /* ── MOVE CUSTOM LINKS UP ── */
      div#app div.sidebar-v2-location #sidebar-v2 div.hl_nav-header nav.w-full a[id='78ae8e45-8a17-4905-8a5e-ff819d60eed6'] {
        order: 4 !important;
      }
      div#app div.sidebar-v2-location #sidebar-v2 div.hl_nav-header nav.w-full a[id='77fece63-4fcd-40e0-be67-35132d26ebde'] {
        order: 4 !important;
      }

      /* ── HIDE SIDEBAR ITEMS ── */
      ${locSelector} #sb_import-data,
      ${locSelector} #sb_custom-values,
      ${locSelector} #sb_contacts,
      ${locSelector} #sb_manage-preferences,
      ${locSelector} #\\36 7d04f019b961eb53460bcdc {
        display: none !important;
      }
    `;
  }

  const REVIEWS_CSS = `
    /* Hide top header bar */
    header.hl_header,
    .hl_header,
    .hl-topbar {
      display: none !important;
    }

    /* Hide the reputation sub-menu tabs */
    .reputation-tabs,
    .hl_tab-nav,
    [class*="reputation"] > nav,
    .tab-navigation,
    .nav-tabs {
      display: none !important;
    }

    /* Hide Add Reviews button */
    #add-reviews-button {
      display: none !important;
    }

    /* Hide Send Review Request button */
    #send-review-request-button {
      display: none !important;
    }

    /* Full width layout */
    #app,
    .hl_wrapper,
    .hl_main,
    main {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      max-width: 100% !important;
    }
  `;

  const WIDGET_AND_SOCIAL_PLANNER_CSS = `
    /* Hide top header/menu bar */
    header.hl_header,
    .hl_header,
    .hl-topbar {
      display: none !important;
    }

    /* Specific selector for the top bar flex row */
    #app > div:nth-child(2) > div:nth-child(1) > div.flex.v2-open > div:nth-child(2) > header.hl_header > div.flex.flex-row {
      display: none !important;
    }

    /* Full width layout */
    #app,
    .hl_wrapper,
    .hl_main,
    main {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      max-width: 100% !important;
    }
  `;

  function getReputationSettingsCss(locId) {
    const locPrefix = locId ? `.sidebar-v2-location.${locId} ` : "";
    return `
      header.hl_header,
      .hl_header,
      .hl-topbar {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        min-height: 0 !important;
        max-height: 0 !important;
        overflow: hidden !important;
      }

      #app > div:nth-child(2) > div:nth-child(1) > div.flex.v2-open > div:nth-child(2) > header.hl_header > div.container-fluid.\\!justify-end,
      #app > div:nth-child(2) > div:nth-child(1) > div.flex.v2-open > div:nth-child(2) > header.hl_header > div.flex.flex-row,
      ${locPrefix}#app > div:nth-child(2) > div:nth-child(1) > div.flex.v2-open > div:nth-child(2) > header.hl_header > div.container-fluid.\\!justify-end,
      ${locPrefix}#app > div:nth-child(2) > div:nth-child(1) > div.flex.v2-open > div:nth-child(2) > header.hl_header > div.flex.flex-row {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        min-height: 0 !important;
        max-height: 0 !important;
        overflow: hidden !important;
      }

      #app > div:nth-child(2) > div:nth-child(1) > div.flex.v2-open > div:nth-child(2) {
        padding-top: 0 !important;
        margin-top: 0 !important;
      }

      #reputation-settings-container > div.hr-wrapper-container.reputationApp > div.hr-config-provider.font-sans > div.flex.min-h-0 > div.hr-tabs.hr-tabs--bar-type > div.hr-tabs-nav--bar-type.hr-tabs-nav--left > div.hr-tabs-nav-scroll-wrapper > div.hr-tabs-nav-y-scroll > div.hr-tabs-nav-scroll-content,
      ${locPrefix}#reputation-settings-container > div.hr-wrapper-container.reputationApp > div.hr-config-provider.font-sans > div.flex.min-h-0 > div.hr-tabs.hr-tabs--bar-type > div.hr-tabs-nav--bar-type.hr-tabs-nav--left > div.hr-tabs-nav-scroll-wrapper > div.hr-tabs-nav-y-scroll > div.hr-tabs-nav-scroll-content {
        display: none !important;
        visibility: hidden !important;
        width: 0 !important;
        min-width: 0 !important;
        max-width: 0 !important;
        overflow: hidden !important;
      }

      #reputation-settings-container .hr-tabs-nav--left,
      #reputation-settings-container .hr-tabs-nav-scroll-wrapper,
      #reputation-settings-container .hr-tabs-nav-y-scroll {
        display: none !important;
        visibility: hidden !important;
        width: 0 !important;
        min-width: 0 !important;
        max-width: 0 !important;
        overflow: hidden !important;
      }

      #reputation-settings-container > div.hr-wrapper-container.reputationApp > div.hr-config-provider.font-sans > div.flex.min-h-0 > div.hr-tabs.hr-tabs--bar-type,
      ${locPrefix}#reputation-settings-container > div.hr-wrapper-container.reputationApp > div.hr-config-provider.font-sans > div.flex.min-h-0 > div.hr-tabs.hr-tabs--bar-type {
        width: 100% !important;
      }

      #reputation-settings-container .hr-tabs-content-holder,
      ${locPrefix}#reputation-settings-container .hr-tabs-content-holder {
        margin-left: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
      }
    `;
  }

  const HOMEFLOW_CSS = `
    header.hl_header,
    .hl_header,
    .hl-topbar {
      display: none !important;
      visibility: hidden !important;
      height: 0 !important;
      min-height: 0 !important;
      max-height: 0 !important;
      overflow: hidden !important;
    }

    #app > div:nth-child(2) > div:nth-child(1) > div.flex.v2-open > div:nth-child(2) > header.hl_header > div.flex.flex-row {
      display: none !important;
    }

    #app > div:nth-child(2) > div:nth-child(1) > div.flex.v2-open > div:nth-child(2) {
      margin-top: 0 !important;
      padding-top: 0 !important;
    }
  `;

  /* =========================================================
     6. REPUTATION OVERVIEW REDIRECT
  ========================================================= */
  async function redirectToReviews(state) {
    if (state.isExcluded || !state.locationId || !state.isOverviewPage) {
      return;
    }

    const reviewsPath = `/v2/location/${state.locationId}/reputation/reviews`;

    if (window.location.pathname === reviewsPath) {
      return;
    }

    // Try HighLevel official RouteHelper first
    try {
      if (
        window.AppUtils &&
        window.AppUtils.RouteHelper &&
        typeof window.AppUtils.RouteHelper.navigate === "function"
      ) {
        await window.AppUtils.RouteHelper.navigate({
          path: reviewsPath,
          replace: true
        });
        return;
      }
    } catch (e) {
      // Fall back to history replacement
    }

    window.history.replaceState(null, "", reviewsPath);
    window.dispatchEvent(new PopStateEvent("popstate"));

    setTimeout(function () {
      if (window.location.pathname.includes("/reputation/overview")) {
        window.location.href = reviewsPath;
      }
    }, 300);
  }

  /* =========================================================
     7. STATE CALCULATOR & APPLIER
  ========================================================= */
  async function buildState() {
    const locationId = await getLocationId();
    const pathname = window.location.pathname;
    const tab = getCurrentTab();

    // CRITICAL FIX: isExcluded MUST ONLY be true if locationId IS KNOWN and in EXCLUDED_LOCATION_IDS!
    // If locationId is temporarily null (unresolved), isExcluded is FALSE so styles can be applied as soon as location resolves.
    const isExcluded = Boolean(locationId && EXCLUDED_LOCATION_IDS.includes(locationId));

    return {
      url: window.location.href,
      pathname,
      tab,
      locationId,
      isExcluded,
      isOverviewPage: isOverviewPage(pathname),
      isReviewsPage: isReviewsPage(pathname),
      isWidgetPage: isWidgetPage(pathname),
      isSocialPlannerPage: isSocialPlannerPage(pathname),
      isReputationIntegrationsPage: isReputationIntegrationsPage(pathname, tab),
      isReviewsAIPage: isReviewsAIPage(pathname, tab),
      isHomeFlowTemplatesPage: locationId === HOMEFLOW_LOCATION_ID && isConversationTemplatesPage(pathname),
      isHomeFlowEmailsPage: locationId === HOMEFLOW_LOCATION_ID && isMarketingEmailsPage(pathname)
    };
  }

  function getStateKey(state) {
    return [
      state.url,
      state.locationId || "unresolved",
      state.isExcluded,
      state.isOverviewPage,
      state.isReviewsPage,
      state.isWidgetPage,
      state.isSocialPlannerPage,
      state.isReputationIntegrationsPage,
      state.isReviewsAIPage,
      state.isHomeFlowTemplatesPage,
      state.isHomeFlowEmailsPage
    ].join("|");
  }

  async function applyState(state) {
    if (state.isExcluded) {
      removeAllLayouts();
      return;
    }

    if (state.isOverviewPage) {
      removeAllLayouts();
      await redirectToReviews(state);
      return;
    }

    // Apply sidebar global layout for all non-excluded subaccounts
    ensureStyle(STYLE_IDS.SIDEBAR, getSidebarGlobalCss(state.locationId), true);
    
    // Page-specific layouts
    ensureStyle(STYLE_IDS.REVIEWS, REVIEWS_CSS, state.isReviewsPage);
    ensureStyle(STYLE_IDS.WIDGET, WIDGET_AND_SOCIAL_PLANNER_CSS, state.isWidgetPage);
    ensureStyle(STYLE_IDS.SOCIAL_PLANNER, WIDGET_AND_SOCIAL_PLANNER_CSS, state.isSocialPlannerPage);
    ensureStyle(STYLE_IDS.REPUTATION_INTEGRATIONS, getReputationSettingsCss(state.locationId), state.isReputationIntegrationsPage);
    ensureStyle(STYLE_IDS.REVIEWS_AI, getReputationSettingsCss(state.locationId), state.isReviewsAIPage);
    ensureStyle(STYLE_IDS.HOMEFLOW, HOMEFLOW_CSS, state.isHomeFlowTemplatesPage || state.isHomeFlowEmailsPage);
  }

  /* =========================================================
     8. CENTRAL ASYNC CONTROLLER & SELF-HEALING RUNNER
  ========================================================= */
  let running = false;
  let rerunRequested = false;
  let runSequence = 0;
  let lastAppliedStateKey = null;

  async function run() {
    if (running) {
      rerunRequested = true;
      return;
    }

    running = true;
    const thisRun = ++runSequence;

    try {
      const state = await buildState();

      if (thisRun !== runSequence) {
        return;
      }

      const stateKey = getStateKey(state);

      // Only skip if location was resolved AND state key matches exactly
      if (state.locationId && stateKey === lastAppliedStateKey) {
        return;
      }

      await applyState(state);

      if (thisRun === runSequence && state.locationId) {
        lastAppliedStateKey = stateKey;
      }
    } catch (error) {
      console.error("[GHL White Label Customizations] Runtime error:", error);
    } finally {
      running = false;

      if (rerunRequested) {
        rerunRequested = false;
        scheduleRun();
      }
    }
  }

  let scheduled = false;
  function scheduleRun() {
    if (scheduled) return;
    scheduled = true;
    Promise.resolve().then(function () {
      scheduled = false;
      run();
    });
  }

  /* =========================================================
     9. MULTI-LAYER EXECUTION & DOM LISTENERS
  ========================================================= */

  // Synchronous immediate run
  scheduleRun();

  // HighLevel lifecycle events
  window.addEventListener("routeLoaded", scheduleRun);
  window.addEventListener("routeChangeEvent", scheduleRun);
  window.addEventListener("popstate", scheduleRun);

  // Single History API wrapper
  const origPush = history.pushState;
  const origReplace = history.replaceState;

  if (typeof origPush === "function") {
    history.pushState = function () {
      const res = origPush.apply(this, arguments);
      scheduleRun();
      return res;
    };
  }

  if (typeof origReplace === "function") {
    history.replaceState = function () {
      const res = origReplace.apply(this, arguments);
      scheduleRun();
      return res;
    };
  }

  // Single MutationObserver for DOM changes & URL changes
  let lastObservedUrl = window.location.href;
  let observerStarted = false;

  function startObserver() {
    if (observerStarted || !document.body) return;
    observerStarted = true;

    const observer = new MutationObserver(function () {
      const currentUrl = window.location.href;
      if (currentUrl !== lastObservedUrl || !lastAppliedStateKey) {
        lastObservedUrl = currentUrl;
        scheduleRun();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      startObserver();
      scheduleRun();
    }, { once: true });
  } else {
    startObserver();
    scheduleRun();
  }

  window.addEventListener("load", function () {
    startObserver();
    scheduleRun();
  }, { once: true });

  // Self-healing 250ms polling loop (checks URL or un-resolved state)
  setInterval(function () {
    const currentUrl = window.location.href;
    if (currentUrl !== lastObservedUrl || !lastAppliedStateKey) {
      lastObservedUrl = currentUrl;
      scheduleRun();
    }
  }, 250);

})();
