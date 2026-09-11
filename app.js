const STORAGE_KEY = "finance-tracker-mvp-bookings";
const CATEGORY_STORAGE_KEY = "finance-tracker-mvp-categories";
const APP_VERSION = "2026.06.18-auth-stability";
const AUTH_SESSION_TIMEOUT_MS = 10000;
const AUTH_ACTION_TIMEOUT_MS = 15000;
const AUTH_STATES = {
  INITIALIZING: "initializing",
  LOGGED_OUT: "loggedOut",
  LOGGED_IN: "loggedIn",
  ERROR: "authError",
};
const SUPABASE_URL = "https://zrvdnnwdbihzdurpryce.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpydmRubndkYmloemR1cnByeWNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NDA3MTQsImV4cCI6MjA5NzExNjcxNH0.QGQB1F-0vZHjvftHwIBQKn9MnmE-aNoZjF5ws6wCaDY";
const defaultCategories = [
  "Auto",
  "Essen",
  "Kleidung",
  "Gehalt",
  "Wohnung",
  "Freizeit",
  "Business",
  "Investieren",
  "Bildung",
  "Sonstiges",
];
const bookingTypes = {
  income: { label: "Einnahme", pluralLabel: "Einnahmen", amountDirection: "positive" },
  expense: { label: "Ausgabe", pluralLabel: "Ausgaben", amountDirection: "negative" },
  saving: { label: "Sparen", pluralLabel: "Sparen", amountDirection: "negative" },
  investment: { label: "Investition", pluralLabel: "Investitionen", amountDirection: "negative" },
  adjustment: { label: "Ausgleich", pluralLabel: "Ausgleiche", amountDirection: "positive" },
};
const validBookingTypes = Object.keys(bookingTypes);
const analysisTypes = ["expense", "income", "saving", "investment"];
const automaticCategoriesByType = {
  saving: "Sparen",
  investment: "Investition",
};

const currencyFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

const elements = {
  authShell: document.querySelector("#auth-shell"),
  appShell: document.querySelector("#app-shell"),
  headerTitle: document.querySelector("#header-title"),
  headerUserName: document.querySelector("#header-user-name"),
  openProfileDialog: document.querySelector("#open-profile-dialog"),
  profileDialog: document.querySelector("#profile-dialog"),
  profileForm: document.querySelector("#profile-form"),
  profileName: document.querySelector("#profile-name"),
  profileEmail: document.querySelector("#profile-email"),
  profileNewPassword: document.querySelector("#profile-new-password"),
  profileNewPasswordConfirm: document.querySelector("#profile-new-password-confirm"),
  profileMessage: document.querySelector("#profile-message"),
  cancelProfile: document.querySelector("#cancel-profile"),
  logoutButton: document.querySelector("#logout-button"),
  tabs: document.querySelectorAll(".tab-button"),
  panels: {
    entry: document.querySelector("#entry-panel"),
    dashboard: document.querySelector("#dashboard-panel"),
  },
  form: document.querySelector("#booking-form"),
  amount: document.querySelector("#amount"),
  categoryFormRow: document.querySelector("#category-form-row"),
  category: document.querySelector("#category"),
  openCategoryDialog: document.querySelector("#open-category-dialog"),
  categoryDialog: document.querySelector("#category-dialog"),
  categoryForm: document.querySelector("#category-form"),
  newCategory: document.querySelector("#new-category"),
  categoryMessage: document.querySelector("#category-message"),
  cancelCategory: document.querySelector("#cancel-category"),
  description: document.querySelector("#description"),
  date: document.querySelector("#date"),
  dateInputs: document.querySelectorAll("[data-datepicker]"),
  dataActions: document.querySelector(".data-actions"),
  dataActionToggle: document.querySelector("#data-action-toggle"),
  dataActionMenu: document.querySelector("#data-action-menu"),
  exportBackup: document.querySelector("#export-backup"),
  importBackup: document.querySelector("#import-backup"),
  backupFileInput: document.querySelector("#backup-file-input"),
  exportCsv: document.querySelector("#export-csv"),
  importCsv: document.querySelector("#import-csv"),
  csvFileInput: document.querySelector("#csv-file-input"),
  csvImportDialog: document.querySelector("#csv-import-dialog"),
  csvImportForm: document.querySelector("#csv-import-form"),
  cancelCsvImport: document.querySelector("#cancel-csv-import"),
  confirmCsvImport: document.querySelector("#confirm-csv-import"),
  csvPreviewTotal: document.querySelector("#csv-preview-total"),
  csvPreviewNew: document.querySelector("#csv-preview-new"),
  csvPreviewDuplicates: document.querySelector("#csv-preview-duplicates"),
  csvPreviewErrors: document.querySelector("#csv-preview-errors"),
  csvErrorList: document.querySelector("#csv-error-list"),
  csvImportMessage: document.querySelector("#csv-import-message"),
  downloadReport: document.querySelector("#download-report"),
  dataActionMessage: document.querySelector("#data-action-message"),
  message: document.querySelector("#form-message"),
  todayPreview: document.querySelector("#today-preview"),
  entryCount: document.querySelector("#entry-count"),
  filters: {
    from: document.querySelector("#filter-from"),
    to: document.querySelector("#filter-to"),
  },
  totalIncome: document.querySelector("#total-income"),
  totalExpenses: document.querySelector("#total-expenses"),
  totalSavings: document.querySelector("#total-savings"),
  totalInvestments: document.querySelector("#total-investments"),
  totalBalance: document.querySelector("#total-balance"),
  analysisTitle: document.querySelector("#analysis-title"),
  analysisModeButtons: document.querySelectorAll(".analysis-mode-button"),
  expenseDonut: document.querySelector("#expense-donut"),
  expenseLegend: document.querySelector("#expense-legend"),
  expenseEmptyState: document.querySelector("#expense-empty-state"),
  analysisCarousel: document.querySelector("#analysis-carousel"),
  analysisPrev: document.querySelector("#analysis-prev"),
  analysisNext: document.querySelector("#analysis-next"),
  analysisActiveLabel: document.querySelector("#analysis-active-label"),
  detailTitle: document.querySelector("#analysis-detail-title"),
  detailSubtitle: document.querySelector("#expense-detail-subtitle"),
  detailCard: document.querySelector(".expense-detail-card"),
  mobileDetailBackdrop: document.querySelector(".mobile-detail-backdrop"),
  mobileDetailClose: document.querySelector(".mobile-detail-close"),
  detailPlaceholder: document.querySelector("#expense-detail-placeholder"),
  detailContent: document.querySelector("#expense-detail-content"),
  detailTotal: document.querySelector("#detail-total"),
  detailGrossExpenses: document.querySelector("#detail-gross-expenses"),
  detailAdjustments: document.querySelector("#detail-adjustments"),
  detailExpenseOnly: document.querySelectorAll(".detail-expense-only"),
  detailCount: document.querySelector("#detail-count"),
  detailTableBody: document.querySelector("#detail-bookings-table"),
  detailTotalLabel: document.querySelector("#detail-total-label"),
};

let bookings = loadBookings();
let categories = loadLocalCategories();
let supabaseClient = null;
let currentUser = null;
let authStatus = AUTH_STATES.INITIALIZING;
let authView = "loggedOut";
let authSessionCheckId = 0;
let authSessionTimeoutId = null;
let authSessionCancel = null;
let userDataLoadPromise = null;
let loadedUserId = null;
let activeAnalysisType = "expense";
let activeDatePicker = null;
let activeDetail = null;
let pendingCsvImport = null;
let analysisSwipeStartX = null;
const chartColors = ["#7f8f8b", "#b9a77d", "#9ba8bf", "#d0a19a", "#8faf9b", "#c3b5cf", "#a9a094", "#94abb1"];
const lineSeriesMeta = {
  income: { label: "Einnahmen", color: "#6fcf97" },
  expenses: { label: "Netto-Ausgaben", color: "#e07a78" },
  savings: { label: "Gespart", color: "#7db7e8" },
  investments: { label: "Investiert", color: "#d8b45d" },
};

function toLocalIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function todayIsoDate() {
  return toLocalIsoDate(new Date());
}

function firstDayOfCurrentMonthIsoDate() {
  const today = new Date();
  return toLocalIsoDate(new Date(today.getFullYear(), today.getMonth(), 1));
}

function parseIsoDate(dateValue) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsedDate = new Date(year, month - 1, day);

  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return null;
  }

  return parsedDate;
}

function parseDisplayDate(dateValue) {
  const match = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(dateValue.trim());
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const parsedDate = new Date(year, month - 1, day);

  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return null;
  }

  return parsedDate;
}

function isValidIsoDate(dateValue) {
  return Boolean(parseIsoDate(dateValue));
}

function formatDateForDisplay(dateString) {
  const parsedDate = parseIsoDate(dateString);
  if (!parsedDate) return "";

  const day = String(parsedDate.getDate()).padStart(2, "0");
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const year = parsedDate.getFullYear();
  return `${day}.${month}.${year}`;
}

function formatDateForStorage(displayString) {
  const trimmedValue = displayString.trim();
  const isoDate = parseIsoDate(trimmedValue);
  const displayDate = parseDisplayDate(trimmedValue);

  if (isoDate) return toLocalIsoDate(isoDate);
  if (displayDate) return toLocalIsoDate(displayDate);
  return "";
}

function setDateInputValue(input, isoDate) {
  input.value = formatDateForDisplay(isoDate);
}

function normalizeDateInput(input) {
  const isoDate = formatDateForStorage(input.value);

  if (isoDate) {
    setDateInputValue(input, isoDate);
  }

  return isoDate;
}

function addMonths(date, monthOffset) {
  return new Date(date.getFullYear(), date.getMonth() + monthOffset, 1);
}

function getDateFilterValue(input) {
  return formatDateForStorage(input.value);
}

function loadBookings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function normalizeCategoryName(categoryName) {
  return categoryName.trim().replace(/\s+/g, " ");
}

function mergeCategories(categoryList) {
  const merged = [...defaultCategories, ...categoryList, ...bookings.map((booking) => booking.category)];
  const uniqueCategories = [];

  merged.forEach((category) => {
    const normalizedCategory = normalizeCategoryName(String(category || ""));
    const alreadyExists = uniqueCategories.some((item) => item.toLowerCase() === normalizedCategory.toLowerCase());

    if (normalizedCategory && !alreadyExists) {
      uniqueCategories.push(normalizedCategory);
    }
  });

  return uniqueCategories;
}

function loadLocalCategories() {
  try {
    const stored = localStorage.getItem(CATEGORY_STORAGE_KEY);
    const storedCategories = stored ? JSON.parse(stored) : [];
    return mergeCategories(Array.isArray(storedCategories) ? storedCategories : []);
  } catch {
    return mergeCategories([]);
  }
}

function saveBookings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
}

function saveCategories() {
  localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(categories));
}

function isCloudMode() {
  return Boolean(supabaseClient && currentUser);
}

function mapTransactionRow(row) {
  return {
    id: row.id,
    amount: Number(row.amount),
    type: row.type,
    category: row.category,
    description: row.description || "",
    date: row.date,
    createdAt: row.created_at,
    userId: row.user_id,
  };
}

async function loadUserData() {
  if (!isCloudMode()) return;

  console.log("data: loadUserData start");

  try {
    const userId = currentUser.id;
    await withTimeout(ensureDefaultCategories(), AUTH_ACTION_TIMEOUT_MS, "Cloud-Daten laden");
    const [loadedCategories, loadedTransactions] = await withTimeout(
      Promise.all([loadCategories(), loadTransactions()]),
      AUTH_ACTION_TIMEOUT_MS,
      "Cloud-Daten laden"
    );

    if (!currentUser || currentUser.id !== userId) return;

    categories = mergeCategories(loadedCategories);
    bookings = loadedTransactions;
    activeDetail = null;
    loadedUserId = userId;
    render();
    showLocalDataNotice();
    console.log("data: loadUserData success");
  } catch (error) {
    console.error("data: loadUserData error", error);
    render();
    setDataActionMessage(error.message || "Cloud-Daten konnten nicht geladen werden.", true);
  }
}

async function refreshAppData() {
  if (isCloudMode()) {
    await loadUserData();
    return;
  }

  bookings = loadBookings();
  categories = loadLocalCategories();
  render();
}

async function loadTransactions() {
  const { data, error } = await supabaseClient
    .from("transactions")
    .select("id, created_at, user_id, date, type, amount, category, description")
    .eq("user_id", currentUser.id)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Buchungen konnten nicht geladen werden.");
  }

  return (data || []).map(mapTransactionRow);
}

async function saveTransaction(transaction) {
  if (!isCloudMode()) {
    bookings.unshift(transaction);
    saveBookings();
    return transaction;
  }

  const { data, error } = await supabaseClient
    .from("transactions")
    .insert({
      user_id: currentUser.id,
      date: transaction.date,
      type: transaction.type,
      amount: transaction.amount,
      category: transaction.category,
      description: transaction.description,
    })
    .select("id, created_at, user_id, date, type, amount, category, description")
    .single();

  if (error) {
    throw new Error(error.message || "Buchung konnte nicht gespeichert werden.");
  }

  const savedTransaction = mapTransactionRow(data);
  bookings.unshift(savedTransaction);
  return savedTransaction;
}

async function deleteTransaction(id) {
  if (!isCloudMode()) {
    bookings = bookings.filter((booking) => booking.id !== id);
    saveBookings();
    return;
  }

  const { error } = await supabaseClient.from("transactions").delete().eq("id", id).eq("user_id", currentUser.id);

  if (error) {
    throw new Error(error.message || "Buchung konnte nicht gelöscht werden.");
  }

  bookings = bookings.filter((booking) => booking.id !== id);
}

async function loadCategories() {
  if (!isCloudMode()) {
    return loadLocalCategories();
  }

  const { data, error } = await supabaseClient
    .from("categories")
    .select("id, created_at, user_id, name")
    .eq("user_id", currentUser.id)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message || "Kategorien konnten nicht geladen werden.");
  }

  return (data || []).map((category) => category.name).filter(Boolean);
}

async function saveCategory(name) {
  if (!isCloudMode()) {
    categories.push(name);
    categories.sort((first, second) => first.localeCompare(second, "de"));
    saveCategories();
    return;
  }

  const { error } = await supabaseClient.from("categories").insert({
    user_id: currentUser.id,
    name,
  });

  if (error) {
    throw new Error(error.message || "Kategorie konnte nicht gespeichert werden.");
  }

  categories.push(name);
  categories.sort((first, second) => first.localeCompare(second, "de"));
}

async function ensureDefaultCategories() {
  if (!isCloudMode()) return;

  const { data, error } = await supabaseClient.from("categories").select("name").eq("user_id", currentUser.id);

  if (error) {
    throw new Error(error.message || "Kategorien konnten nicht geprüft werden.");
  }

  if ((data || []).length) return;

  const { error: insertError } = await supabaseClient.from("categories").insert(
    defaultCategories.map((name) => ({
      user_id: currentUser.id,
      name,
    }))
  );

  if (insertError) {
    throw new Error(insertError.message || "Standardkategorien konnten nicht erstellt werden.");
  }
}

function showLocalDataNotice() {
  const hasLocalBookings = loadBookings().length > 0;
  let hasLocalCategories = false;

  try {
    const storedCategories = JSON.parse(localStorage.getItem(CATEGORY_STORAGE_KEY) || "[]");
    hasLocalCategories = Array.isArray(storedCategories) && storedCategories.length > 0;
  } catch {
    hasLocalCategories = false;
  }

  if (hasLocalBookings || hasLocalCategories) {
    setDataActionMessage("Lokale Daten gefunden. Migration in deinen Account wird später ergänzt.");
  }
}

function clearAuthSessionTimeout() {
  if (authSessionTimeoutId !== null) {
    window.clearTimeout(authSessionTimeoutId);
    authSessionTimeoutId = null;
  }

  if (authSessionCancel) {
    const cancel = authSessionCancel;
    authSessionCancel = null;
    cancel();
  }

  console.log("auth: session timeout cleared");
}

function withTimeout(promise, timeoutMs, actionLabel) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(new Error(`${actionLabel} dauert zu lange. Bitte prüfe deine Verbindung und versuche es erneut.`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    window.clearTimeout(timeoutId);
  });
}

function setAuthState(status, user = null) {
  authStatus = status;
  currentUser = user;
  renderAuthScreen();
}

function resetAppStateForLoggedOut() {
  authStatus = AUTH_STATES.LOGGED_OUT;
  currentUser = null;
  authView = "loggedOut";
  activeDetail = null;
  loadedUserId = null;
  userDataLoadPromise = null;
  bookings = [];
  categories = loadLocalCategories();
  render();
}

function renderLoggedOut() {
  resetAppStateForLoggedOut();
  renderAuthScreen();
}

async function loadAuthenticatedUserData(user, source) {
  if (!user || authStatus !== AUTH_STATES.LOGGED_IN || currentUser?.id !== user.id) return;
  if (loadedUserId === user.id) return;
  if (userDataLoadPromise) return userDataLoadPromise;

  console.log(`data: authenticated load scheduled via ${source}`);
  userDataLoadPromise = loadUserData().finally(() => {
    userDataLoadPromise = null;
  });
  return userDataLoadPromise;
}

function applyAuthenticatedSession(user, source, options = {}) {
  if (!user) return;

  clearAuthSessionTimeout();
  const userChanged = currentUser?.id !== user.id;
  authStatus = AUTH_STATES.LOGGED_IN;
  authView = "loggedIn";
  currentUser = user;

  if (userChanged) {
    bookings = [];
    categories = mergeCategories([]);
    activeDetail = null;
    loadedUserId = null;
    userDataLoadPromise = null;
    render();
  }

  console.log(`auth: signed in via ${source}`);
  renderAuthScreen();

  if (options.loadData !== false) {
    window.setTimeout(() => {
      void loadAuthenticatedUserData(user, source);
    }, 0);
  }
}

function loadSupabaseLibrary() {
  if (window.supabase?.createClient) return Promise.resolve(true);

  return new Promise((resolve) => {
    const script = document.createElement("script");
    const timeout = window.setTimeout(() => {
      script.remove();
      resolve(false);
    }, 8000);

    script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
    script.async = true;
    script.addEventListener("load", () => {
      window.clearTimeout(timeout);
      resolve(Boolean(window.supabase?.createClient));
    });
    script.addEventListener("error", () => {
      window.clearTimeout(timeout);
      resolve(false);
    });
    document.head.append(script);
  });
}

async function initSupabase() {
  if (supabaseClient) return true;

  console.log("auth: supabase init start");
  const supabaseLoaded = await loadSupabaseLibrary();

  if (!supabaseLoaded) {
    console.error("auth: supabase library failed to load");
    authStatus = AUTH_STATES.ERROR;
    authView = "loggedOut";
    renderAuthScreen();
    return false;
  }

  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  console.log("auth: supabase client initialized");

  supabaseClient.auth.onAuthStateChange((event, session) => {
    console.log(`auth: state change ${event}`);

    if (event === "SIGNED_OUT") {
      clearAuthSessionTimeout();
      window.setTimeout(() => {
        if (authStatus !== AUTH_STATES.LOGGED_OUT || currentUser) {
          renderLoggedOut();
        }
      }, 0);
      return;
    }

    if (session?.user && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
      applyAuthenticatedSession(session.user, event);
      return;
    }

    if (session?.user && (event === "TOKEN_REFRESHED" || event === "USER_UPDATED")) {
      currentUser = session.user;
      authStatus = AUTH_STATES.LOGGED_IN;
      renderAuthScreen();
      return;
    }

    if (!session?.user && event === "INITIAL_SESSION" && authStatus !== AUTH_STATES.INITIALIZING) {
      window.setTimeout(renderLoggedOut, 0);
    }
  });

  return true;
}

async function checkAuthSession() {
  if (!supabaseClient) {
    renderAuthScreen();
    return;
  }

  const checkId = authSessionCheckId + 1;
  authSessionCheckId = checkId;
  clearAuthSessionTimeout();
  console.log(`auth: getSession start #${checkId}`);

  const timeoutPromise = new Promise((resolve) => {
    authSessionCancel = () => {
      resolve({ data: { session: null }, error: null, cancelled: true, checkId });
    };
    authSessionTimeoutId = window.setTimeout(() => {
      authSessionTimeoutId = null;
      authSessionCancel = null;
      console.log(`auth: getSession timeout #${checkId}`);
      resolve({ data: { session: null }, error: null, timedOut: true, checkId });
    }, AUTH_SESSION_TIMEOUT_MS);
    console.log(`auth: session timeout started #${checkId}`);
  });

  const sessionResult = await Promise.race([
    supabaseClient.auth
      .getSession()
      .then((result) => ({ ...result, checkId }))
      .catch((error) => ({ data: { session: null }, error, checkId })),
    timeoutPromise,
  ]);
  const { data, error, timedOut, cancelled } = sessionResult;

  if (cancelled) {
    console.log(`auth: getSession cancelled #${checkId}`);
    return;
  }

  if (checkId !== authSessionCheckId) {
    console.log(`auth: stale getSession result ignored #${checkId}`);
    return;
  }

  clearAuthSessionTimeout();

  if (timedOut) {
    if (currentUser) {
      console.log(`auth: timeout ignored because user is already signed in #${checkId}`);
      return;
    }

    authStatus = AUTH_STATES.ERROR;
    currentUser = null;
    authView = "loggedOut";
    renderAuthScreen();
    return;
  }

  if (error) {
    console.error("auth: getSession error", error);
    authStatus = AUTH_STATES.ERROR;
    currentUser = null;
    authView = "loggedOut";
    renderAuthScreen();
    return;
  }

  console.log(`auth: getSession success #${checkId}`, { hasSession: Boolean(data.session?.user) });

  if (data.session?.user) {
    applyAuthenticatedSession(data.session.user, "getSession");
    return;
  }

  console.log(`auth: getSession no session #${checkId}`);
  renderLoggedOut();
}

function getUserDisplayName(user = currentUser) {
  return normalizeCategoryName(user?.user_metadata?.full_name || user?.user_metadata?.name || "");
}

function setAuthView(view) {
  authStatus = AUTH_STATES.LOGGED_OUT;
  authView = view;
  renderAuthScreen();
}

async function retryAuthInitialization() {
  console.log("auth: retry start");
  setAuthState(AUTH_STATES.INITIALIZING);

  try {
    if ((await initSupabase()) && supabaseClient) {
      await checkAuthSession();
    }
  } catch (error) {
    console.error("auth: retry error", error);
    setAuthState(AUTH_STATES.ERROR);
  }
}

function setAuthMessage(text, isError = false) {
  const message = elements.authShell.querySelector("[data-auth-message]");
  if (!message) return;

  message.textContent = text;
  message.classList.toggle("error", isError);
}

function updateHeaderForUser() {
  const name = getUserDisplayName();
  const title = name ? `${name}'s Finance Tracker` : "Mein Finance Tracker";

  elements.headerTitle.textContent = title;
  elements.headerUserName.textContent = name || currentUser?.email || "Mein Account";
}

function setProfileMessage(text, isError = false) {
  elements.profileMessage.textContent = text;
  elements.profileMessage.classList.toggle("error", isError);
}

function openProfileModal() {
  elements.profileName.value = getUserDisplayName();
  elements.profileEmail.value = currentUser?.email || "";
  elements.profileNewPassword.value = "";
  elements.profileNewPasswordConfirm.value = "";
  setProfileMessage("");
  elements.profileDialog.showModal();
  elements.profileName.focus();
  elements.profileName.select();
}

function closeProfileModal() {
  elements.profileDialog.close();
  setProfileMessage("");
}

function setProfileLoading(isLoading) {
  const submitButton = elements.profileForm.querySelector('button[type="submit"]');
  if (!submitButton) return;

  submitButton.disabled = isLoading;
  submitButton.textContent = isLoading ? "Speichert..." : "Änderungen speichern";
}

function validateProfileChanges() {
  const name = normalizeCategoryName(elements.profileName.value);
  const email = String(elements.profileEmail.value || "").trim();
  const newPassword = String(elements.profileNewPassword.value || "");
  const newPasswordConfirm = String(elements.profileNewPasswordConfirm.value || "");

  if (!name) return "Bitte gib einen Namen ein.";
  if (!email) return "Bitte gib deine E-Mail-Adresse ein.";
  if (!isLikelyEmail(email)) return "Bitte gib eine gültige E-Mail-Adresse ein.";

  if (newPassword || newPasswordConfirm) {
    if (!newPassword) return "Bitte gib ein neues Passwort ein.";
    if (newPassword.length < 6) return "Das neue Passwort muss mindestens 6 Zeichen lang sein.";
    if (newPassword !== newPasswordConfirm) {
      return "Das neue Passwort und die Bestätigung stimmen nicht überein.";
    }
  }

  return "";
}

async function updateUserProfile(event) {
  event.preventDefault();
  console.log("profile: save clicked");
  const validationError = validateProfileChanges();

  if (validationError) {
    setProfileMessage(validationError, true);
    return;
  }

  const emailChanged = String(elements.profileEmail.value || "").trim() !== (currentUser?.email || "");
  const passwordChangeRequested = isPasswordChangeRequested();
  setProfileLoading(true);
  console.log("profile: save start");

  try {
    if (!(await updateUserName())) return;
    if (!(await updateUserEmail())) return;
    if (!(await updateUserPassword())) return;

    updateHeaderForUser();
    closeProfileModal();
    const successMessage = passwordChangeRequested
      ? "Passwort wurde aktualisiert."
      : emailChanged
        ? "Bitte bestätige die neue E-Mail-Adresse über den Link in deinem Postfach."
        : "Profil aktualisiert.";
    setDataActionMessage(successMessage);
    console.log("profile: save success");
  } catch (error) {
    console.error("profile: save error", error);
    setProfileMessage(error.message || "Profil konnte nicht aktualisiert werden.", true);
  } finally {
    setProfileLoading(false);
    console.log("profile: save finally");
  }
}

async function updateUserName() {
  const name = normalizeCategoryName(elements.profileName.value);
  const currentName = getUserDisplayName();

  if (!name) {
    setProfileMessage("Bitte gib einen Namen ein.", true);
    return false;
  }

  if (name === currentName) return true;

  console.log("profile: name update start");
  const { data, error } = await withTimeout(
    supabaseClient.auth.updateUser({
      data: {
        name,
        full_name: name,
      },
    }),
    AUTH_ACTION_TIMEOUT_MS,
    "Name speichern"
  );

  if (error) {
    console.error("profile: name update error", error);
    setProfileMessage(error.message || "Name konnte nicht aktualisiert werden.", true);
    return false;
  }

  currentUser = data.user;
  console.log("profile: name update success");
  return true;
}

function isLikelyEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getAuthRedirectUrl() {
  return window.location.protocol === "http:" || window.location.protocol === "https:" ? window.location.href : undefined;
}

async function updateUserEmail() {
  const email = String(elements.profileEmail.value || "").trim();
  const currentEmail = currentUser?.email || "";

  if (!email) {
    setProfileMessage("Bitte gib eine E-Mail-Adresse ein.", true);
    return false;
  }

  if (!isLikelyEmail(email)) {
    setProfileMessage("Bitte gib eine gültige E-Mail-Adresse ein.", true);
    return false;
  }

  if (email === currentEmail) return true;

  console.log("profile: email update start");
  const { data, error } = await withTimeout(
    supabaseClient.auth.updateUser({ email }),
    AUTH_ACTION_TIMEOUT_MS,
    "E-Mail speichern"
  );

  if (error) {
    console.error("profile: email update error", error);
    setProfileMessage(error.message || "E-Mail konnte nicht aktualisiert werden.", true);
    return false;
  }

  currentUser = data.user || currentUser;
  console.log("profile: email update success");
  return true;
}

function isPasswordChangeRequested() {
  return Boolean(elements.profileNewPassword.value || elements.profileNewPasswordConfirm.value);
}

async function updateUserPassword() {
  const newPassword = String(elements.profileNewPassword.value || "");
  const newPasswordConfirm = String(elements.profileNewPasswordConfirm.value || "");

  if (!isPasswordChangeRequested()) return true;

  if (!newPassword) {
    setProfileMessage("Bitte gib ein neues Passwort ein.", true);
    return false;
  }

  if (newPassword.length < 6) {
    setProfileMessage("Das neue Passwort muss mindestens 6 Zeichen lang sein.", true);
    return false;
  }

  if (newPassword !== newPasswordConfirm) {
    setProfileMessage("Das neue Passwort und die Bestätigung stimmen nicht überein.", true);
    return false;
  }

  console.log("profile: password update start");
  const { data, error } = await withTimeout(
    supabaseClient.auth.updateUser({ password: newPassword }),
    AUTH_ACTION_TIMEOUT_MS,
    "Passwort speichern"
  );

  if (error) {
    console.error("profile: password update error", error);
    setProfileMessage(error.message || "Passwort konnte nicht aktualisiert werden.", true);
    return false;
  }

  currentUser = data.user || currentUser;
  elements.profileNewPassword.value = "";
  elements.profileNewPasswordConfirm.value = "";
  console.log("profile: password update success");
  return true;
}

function renderAuthScreen() {
  const isLoggedIn = authStatus === AUTH_STATES.LOGGED_IN && currentUser;

  elements.authShell.classList.toggle("hidden", isLoggedIn);
  elements.appShell.classList.toggle("hidden", !isLoggedIn);

  if (isLoggedIn) {
    console.log("ui: render app");
    updateHeaderForUser();
    elements.authShell.innerHTML = "";
    return;
  }

  if (authStatus === AUTH_STATES.INITIALIZING) {
    console.log("ui: render auth loading");
    renderAuthCard({
      title: "Finance Tracker",
      body: '<p class="auth-message">Session wird geprüft...</p>',
      actions: "",
    });
    return;
  }

  if (authStatus === AUTH_STATES.ERROR) {
    console.log("ui: render auth error");
    renderAuthCard({
      title: "Verbindung nicht möglich",
      body: '<p class="auth-message error">Die Session konnte nicht geprüft werden. Bitte versuche es erneut.</p>',
      actions: '<button class="auth-link" type="button" data-auth-retry>Erneut versuchen</button>',
    });
    return;
  }

  console.log("ui: render login");

  if (authView === "signup") {
    renderSignupForm();
    return;
  }

  if (authView === "resetPassword") {
    renderResetPasswordForm();
    return;
  }

  renderLoginForm();
}

function renderAuthCard({ title, body, actions }) {
  elements.authShell.innerHTML = `
    <div class="auth-card">
      <p class="eyebrow">Persönlicher Finance Tracker</p>
      <h1>${title}</h1>
      ${body}
      <p class="auth-message" data-auth-message role="status" aria-live="polite"></p>
      <div class="auth-links">${actions}</div>
    </div>
  `;
}

function renderLoginForm() {
  renderAuthCard({
    title: "Einloggen",
    body: `
      <form class="auth-form" id="login-form" novalidate>
        <div class="form-row">
          <label for="login-email">E-Mail</label>
          <input id="login-email" name="email" type="email" autocomplete="email" required>
        </div>
        <div class="form-row">
          <label for="login-password">Passwort</label>
          <input id="login-password" name="password" type="password" autocomplete="current-password" required>
        </div>
        <button class="primary-button auth-submit" type="submit">Einloggen</button>
      </form>
    `,
    actions: `
      <button class="auth-link" type="button" data-auth-view="resetPassword">Passwort vergessen?</button>
      <button class="auth-link" type="button" data-auth-view="signup">Noch kein Account? Registrieren</button>
    `,
  });

  elements.authShell.querySelector("#login-form").addEventListener("submit", signInUser);
}

function renderSignupForm() {
  renderAuthCard({
    title: "Registrieren",
    body: `
      <form class="auth-form" id="signup-form" novalidate>
        <div class="form-row">
          <label for="signup-name">Name</label>
          <input id="signup-name" name="name" type="text" autocomplete="name" required>
        </div>
        <div class="form-row">
          <label for="signup-email">E-Mail</label>
          <input id="signup-email" name="email" type="email" autocomplete="email" required>
        </div>
        <div class="form-row">
          <label for="signup-password">Passwort</label>
          <input id="signup-password" name="password" type="password" autocomplete="new-password" required>
        </div>
        <div class="form-row">
          <label for="signup-password-confirm">Passwort bestätigen</label>
          <input id="signup-password-confirm" name="passwordConfirm" type="password" autocomplete="new-password" required>
        </div>
        <button class="primary-button auth-submit" type="submit">Account erstellen</button>
      </form>
    `,
    actions: '<button class="auth-link" type="button" data-auth-view="login">Zurück zum Login</button>',
  });

  elements.authShell.querySelector("#signup-form").addEventListener("submit", signUpUser);
}

function renderResetPasswordForm() {
  renderAuthCard({
    title: "Passwort zurücksetzen",
    body: `
      <form class="auth-form" id="reset-password-form" novalidate>
        <div class="form-row">
          <label for="reset-email">E-Mail</label>
          <input id="reset-email" name="email" type="email" autocomplete="email" required>
        </div>
        <button class="primary-button auth-submit" type="submit">Reset-Link senden</button>
      </form>
    `,
    actions: '<button class="auth-link" type="button" data-auth-view="login">Zurück zum Login</button>',
  });

  elements.authShell.querySelector("#reset-password-form").addEventListener("submit", resetPassword);
}

function setAuthFormLoading(form, isLoading, loadingText) {
  const submitButton = form.querySelector('button[type="submit"]');
  if (!submitButton) return;

  if (!submitButton.dataset.defaultText) {
    submitButton.dataset.defaultText = submitButton.textContent;
  }

  submitButton.disabled = isLoading;
  submitButton.textContent = isLoading ? loadingText : submitButton.dataset.defaultText;
}

async function signInUser(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(event.currentTarget);
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    setAuthMessage("Bitte gib E-Mail und Passwort ein.", true);
    return;
  }

  setAuthFormLoading(form, true, "Einloggen...");

  try {
    const { data, error } = await withTimeout(
      supabaseClient.auth.signInWithPassword({ email, password }),
      AUTH_ACTION_TIMEOUT_MS,
      "Login"
    );

    if (error) {
      setAuthMessage(error.message || "Login fehlgeschlagen.", true);
      return;
    }

    if (data.user) {
      applyAuthenticatedSession(data.user, "signIn");
    }
  } catch (error) {
    console.error("auth: sign in error", error);
    setAuthMessage(error.message || "Login fehlgeschlagen.", true);
  } finally {
    setAuthFormLoading(form, false, "");
  }
}

async function signUpUser(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(event.currentTarget);
  const name = normalizeCategoryName(String(formData.get("name") || ""));
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const passwordConfirm = String(formData.get("passwordConfirm") || "");

  if (!name) {
    setAuthMessage("Bitte gib deinen Namen ein.", true);
    return;
  }

  if (!email) {
    setAuthMessage("Bitte gib deine E-Mail-Adresse ein.", true);
    return;
  }

  if (!password) {
    setAuthMessage("Bitte gib ein Passwort ein.", true);
    return;
  }

  if (password !== passwordConfirm) {
    setAuthMessage("Die Passwörter stimmen nicht überein.", true);
    return;
  }

  setAuthFormLoading(form, true, "Erstellt...");

  try {
    const { data, error } = await withTimeout(
      supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            full_name: name,
          },
          emailRedirectTo: getAuthRedirectUrl(),
        },
      }),
      AUTH_ACTION_TIMEOUT_MS,
      "Registrierung"
    );

    if (error) {
      setAuthMessage(error.message || "Registrierung fehlgeschlagen.", true);
      return;
    }

    if (data.session && data.user) {
      applyAuthenticatedSession(data.user, "signUp");
      return;
    }

    setAuthView("login");
    setAuthMessage("Registrierung erstellt. Bitte prüfe deine E-Mail zur Bestätigung.");
  } catch (error) {
    console.error("auth: sign up error", error);
    setAuthMessage(error.message || "Registrierung fehlgeschlagen.", true);
  } finally {
    setAuthFormLoading(form, false, "");
  }
}

async function resetPassword(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const email = String(new FormData(form).get("email") || "").trim();

  if (!email) {
    setAuthMessage("Bitte gib deine E-Mail-Adresse ein.", true);
    return;
  }

  setAuthFormLoading(form, true, "Wird gesendet...");

  try {
    const { error } = await withTimeout(
      supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: getAuthRedirectUrl(),
      }),
      AUTH_ACTION_TIMEOUT_MS,
      "Reset-Link senden"
    );

    if (error) {
      setAuthMessage(error.message || "Reset-Link konnte nicht gesendet werden.", true);
      return;
    }

    setAuthMessage("Reset-Link wurde gesendet. Bitte prüfe deine E-Mails.");
  } catch (error) {
    console.error("auth: reset password error", error);
    setAuthMessage(error.message || "Reset-Link konnte nicht gesendet werden.", true);
  } finally {
    setAuthFormLoading(form, false, "");
  }
}

function setLogoutLoading(isLoading) {
  elements.logoutButton.disabled = isLoading;
  elements.logoutButton.textContent = isLoading ? "Logout..." : "Logout";
}

async function signOutUser() {
  console.log("auth: logout clicked");
  console.log("auth: logout start");
  authSessionCheckId += 1;
  clearAuthSessionTimeout();
  setLogoutLoading(true);

  try {
    if (supabaseClient) {
      const { error } = await withTimeout(
        supabaseClient.auth.signOut({ scope: "local" }),
        AUTH_ACTION_TIMEOUT_MS,
        "Logout"
      );

      if (error) {
        throw error;
      }
    }

    renderLoggedOut();
    console.log("auth: logout success");
  } catch (error) {
    console.error("auth: logout error", error);
    setDataActionMessage(error.message || "Logout fehlgeschlagen.", true);
  } finally {
    setLogoutLoading(false);
    console.log("auth: logout finally");
  }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function setDataActionMessage(text, isError = false) {
  elements.dataActionMessage.textContent = text;
  elements.dataActionMessage.classList.toggle("error", isError);

  if (!isError && text) {
    window.clearTimeout(setDataActionMessage.timeout);
    setDataActionMessage.timeout = window.setTimeout(() => {
      elements.dataActionMessage.textContent = "";
    }, 3200);
  }
}

function setDataActionMenuOpen(isOpen) {
  elements.dataActionMenu.classList.toggle("hidden", !isOpen);
  elements.dataActionToggle.setAttribute("aria-expanded", String(isOpen));
}

function toggleDataActionMenu(event) {
  event.stopPropagation();
  setDataActionMenuOpen(elements.dataActionMenu.classList.contains("hidden"));
}

function closeDataActionMenu() {
  setDataActionMenuOpen(false);
}

function normalizeCsvHeader(header) {
  return String(header || "").trim().toLowerCase().replace(/-/g, "_");
}

function countCsvDelimiter(line, delimiter) {
  let count = 0;
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"' && inQuotes && nextCharacter === '"') {
      index += 1;
      continue;
    }

    if (character === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes && character === delimiter) {
      count += 1;
    }
  }

  return count;
}

function detectCsvDelimiter(csvText) {
  const firstLine = String(csvText || "").split(/\r?\n/)[0] || "";
  return countCsvDelimiter(firstLine, ";") >= countCsvDelimiter(firstLine, ",") ? ";" : ",";
}

function parseCsv(csvText, delimiter = ";") {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const character = csvText[index];
    const nextCharacter = csvText[index + 1];

    if (character === '"' && inQuotes && nextCharacter === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (character === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes && character === delimiter) {
      row.push(cell);
      cell = "";
      continue;
    }

    if (!inQuotes && (character === "\n" || character === "\r")) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += character;
  }

  if (inQuotes) {
    throw new Error("Ungültige CSV-Datei: Ein Textfeld wurde nicht geschlossen.");
  }

  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }

  return rows.filter((csvRow) => csvRow.some((value) => String(value || "").trim()));
}

function protectCsvCell(value, shouldProtectFormula = true) {
  const text = String(value ?? "");
  const normalized = text.replace(/\r\n/g, "\n");
  const safeText = shouldProtectFormula && /^[=+\-@\t\r]/.test(normalized) ? `'${normalized}` : normalized;
  return `"${safeText.replace(/"/g, '""')}"`;
}

function unprotectCsvCell(value) {
  const text = String(value ?? "").trim();
  return /^'[=+\-@\t\r]/.test(text) ? text.slice(1) : text;
}

function isValidCsvId(id) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

function createCsvSignature(booking) {
  const amount = Number(booking.amount);
  return [
    booking.date,
    booking.type,
    normalizeCategoryName(String(booking.category || "")).toLowerCase(),
    String(booking.description || "").trim(),
    Number.isFinite(amount) ? amount.toFixed(2) : "",
  ].join("|");
}

function normalizeCsvType(typeValue) {
  const type = String(typeValue || "").trim().toLowerCase();
  if (type === "income" || type === "einnahme" || type === "einnahmen") return "income";
  if (type === "expense" || type === "ausgabe" || type === "ausgaben") return "expense";
  if (type === "saving" || type === "sparen") return "saving";
  if (type === "investment" || type === "investition" || type === "investitionen") return "investment";
  if (type === "adjustment" || type === "ausgleich" || type === "ausgleiche") return "adjustment";
  return "";
}

function parseCsvAmount(amountValue) {
  const rawValue = String(amountValue || "").trim();
  if (!rawValue) return NaN;

  let normalizedValue = rawValue.replace(/\s/g, "").replace(/€/g, "");
  const lastComma = normalizedValue.lastIndexOf(",");
  const lastDot = normalizedValue.lastIndexOf(".");

  if (lastComma > -1 && lastDot > -1) {
    normalizedValue =
      lastComma > lastDot ? normalizedValue.replace(/\./g, "").replace(",", ".") : normalizedValue.replace(/,/g, "");
  } else if (lastComma > -1) {
    normalizedValue = normalizedValue.replace(/\./g, "").replace(",", ".");
  }

  return Number(normalizedValue);
}

function normalizeCsvBooking(row, rowNumber) {
  const type = normalizeCsvType(row.type);
  const date = formatDateForStorage(unprotectCsvCell(row.date));
  let category = normalizeCategoryName(unprotectCsvCell(row.category || ""));
  const description = unprotectCsvCell(row.description || "");
  const parsedAmount = parseCsvAmount(row.amount);
  const rawId = unprotectCsvCell(row.id || "");
  const id = isValidCsvId(rawId) ? rawId : crypto.randomUUID();
  const createdAt = unprotectCsvCell(row.created_at || row.createdAt || "") || new Date().toISOString();
  const errors = [];

  if (!date || !isValidIsoDate(date)) errors.push("ungültiges Datum");
  if (!type) errors.push("ungültiger Typ");
  if (!category && automaticCategoriesByType[type]) {
    category = automaticCategoriesByType[type];
  }
  if (!category) errors.push("fehlende Kategorie");
  if (!Number.isFinite(parsedAmount) || parsedAmount === 0) errors.push("ungültiger Betrag");

  if (errors.length) {
    return { rowNumber, errors };
  }

  return {
    rowNumber,
    booking: {
      id: id || crypto.randomUUID(),
      amount: getSignedAmountByType(parsedAmount, type),
      type,
      category,
      description: description.trim(),
      date,
      createdAt: Number.isNaN(Date.parse(createdAt)) ? new Date().toISOString() : createdAt,
    },
  };
}

function getExistingBookingKeys() {
  return {
    ids: new Set(bookings.map((booking) => booking.id).filter(Boolean)),
    signatures: new Set(bookings.map(createCsvSignature)),
  };
}

function buildCsvImportPreview(csvText) {
  const delimiter = detectCsvDelimiter(csvText);
  const rows = parseCsv(csvText.replace(/^\uFEFF/, ""), delimiter);

  if (rows.length < 2) {
    throw new Error("Die CSV-Datei enthält keine Buchungen.");
  }

  const headers = rows[0].map(normalizeCsvHeader);
  const requiredHeaders = ["date", "type", "category", "amount"];
  const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));

  if (missingHeaders.length) {
    throw new Error(`Fehlende Pflichtspalten: ${missingHeaders.join(", ")}.`);
  }

  const existing = getExistingBookingKeys();
  const seenIds = new Set();
  const seenSignatures = new Set();
  const validBookings = [];
  const duplicateRows = [];
  const errorRows = [];

  rows.slice(1).forEach((csvRow, index) => {
    const rowNumber = index + 2;
    const row = {};
    headers.forEach((header, headerIndex) => {
      row[header] = csvRow[headerIndex] || "";
    });

    const normalized = normalizeCsvBooking(row, rowNumber);

    if (normalized.errors) {
      errorRows.push({ rowNumber, message: normalized.errors.join(", ") });
      return;
    }

    const { booking } = normalized;
    const signature = createCsvSignature(booking);
    const hasDuplicateId = booking.id && (existing.ids.has(booking.id) || seenIds.has(booking.id));
    const hasDuplicateSignature = existing.signatures.has(signature) || seenSignatures.has(signature);

    if (hasDuplicateId || hasDuplicateSignature) {
      duplicateRows.push(rowNumber);
      return;
    }

    validBookings.push(booking);
    seenIds.add(booking.id);
    seenSignatures.add(signature);
  });

  return {
    totalRows: rows.length - 1,
    newBookings: validBookings,
    duplicateRows,
    errorRows,
  };
}

function getCsvExportFilename() {
  const from = getDateFilterValue(elements.filters.from);
  const to = getDateFilterValue(elements.filters.to);

  if (from && to) return `finance-tracker-export-${from}-bis-${to}.csv`;
  if (from) return `finance-tracker-export-ab-${from}.csv`;
  if (to) return `finance-tracker-export-bis-${to}.csv`;
  return `finance-tracker-export-${todayIsoDate()}.csv`;
}

function exportCsv() {
  const headers = ["id", "date", "type", "category", "description", "amount", "created_at", "user_id"];
  const csvRows = getFilteredBookings().map((booking) => [
    booking.id || "",
    booking.date || "",
    booking.type || "",
    booking.category || "",
    booking.description || "",
    Number.isFinite(Number(booking.amount)) ? String(Number(booking.amount)) : "",
    booking.createdAt || "",
    booking.userId || currentUser?.id || "",
  ]);
  const csv = [
    headers.map((cell) => protectCsvCell(cell, false)).join(";"),
    ...csvRows.map((row) =>
      row
        .map((cell, index) => protectCsvCell(cell, index !== 5))
        .join(";")
    ),
  ].join("\r\n");
  const filename = getCsvExportFilename();

  downloadBlob(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }), filename);
  setDataActionMessage(csvRows.length ? "CSV exportiert." : "CSV ohne Buchungen im gewählten Zeitraum exportiert.");
}

function setCsvImportMessage(text, isError = false) {
  elements.csvImportMessage.textContent = text;
  elements.csvImportMessage.classList.toggle("error", isError);
}

function openCsvImportPreview(preview) {
  if (elements.csvImportDialog.open) {
    elements.csvImportDialog.close();
  }

  pendingCsvImport = preview;
  elements.csvPreviewTotal.textContent = String(preview.totalRows);
  elements.csvPreviewNew.textContent = String(preview.newBookings.length);
  elements.csvPreviewDuplicates.textContent = String(preview.duplicateRows.length);
  elements.csvPreviewErrors.textContent = String(preview.errorRows.length);
  elements.confirmCsvImport.disabled = preview.newBookings.length === 0 || preview.errorRows.length > 0;

  if (preview.errorRows.length) {
    const visibleErrors = preview.errorRows.slice(0, 6);
    elements.csvErrorList.innerHTML = visibleErrors
      .map((error) => `<p>Zeile ${error.rowNumber}: ${error.message}</p>`)
      .join("");
    if (preview.errorRows.length > visibleErrors.length) {
      elements.csvErrorList.insertAdjacentHTML("beforeend", "<p>Weitere fehlerhafte Zeilen wurden ausgeblendet.</p>");
    }
  } else {
    elements.csvErrorList.innerHTML = "";
  }

  elements.csvErrorList.classList.toggle("hidden", preview.errorRows.length === 0);
  let message = "Prüfung abgeschlossen. Du kannst den Import bestätigen.";
  if (preview.errorRows.length) {
    message = "Bitte korrigiere die fehlerhaften Zeilen und wähle die CSV-Datei erneut aus.";
  } else if (!preview.newBookings.length) {
    message = "Keine neuen Buchungen gefunden. Bestehende Daten bleiben unverändert.";
  }
  setCsvImportMessage(message);
  elements.csvImportDialog.showModal();
}

function closeCsvImportDialog() {
  pendingCsvImport = null;
  elements.csvImportDialog.close();
  setCsvImportMessage("");
}

function importCsvFile(file) {
  const reader = new FileReader();

  reader.addEventListener("load", () => {
    try {
      const preview = buildCsvImportPreview(String(reader.result || ""));
      openCsvImportPreview(preview);
    } catch (error) {
      setDataActionMessage(error.message || "Die CSV-Datei konnte nicht geprüft werden.", true);
    } finally {
      elements.csvFileInput.value = "";
    }
  });

  reader.addEventListener("error", () => {
    setDataActionMessage("Die CSV-Datei konnte nicht gelesen werden.", true);
    elements.csvFileInput.value = "";
  });

  reader.readAsText(file, "utf-8");
}

async function importCsvBookings(event) {
  event.preventDefault();

  if (!pendingCsvImport) {
    setCsvImportMessage("Bitte wähle zuerst eine CSV-Datei aus.", true);
    return;
  }

  if (pendingCsvImport.errorRows.length) {
    setCsvImportMessage("Der Import ist erst nach Korrektur der fehlerhaften Zeilen möglich.", true);
    return;
  }

  const bookingsToImport = pendingCsvImport.newBookings;

  if (!bookingsToImport.length) {
    setCsvImportMessage("Es wurden keine neuen Buchungen gefunden.", true);
    return;
  }

  elements.confirmCsvImport.disabled = true;
  elements.confirmCsvImport.textContent = "Importiert...";
  let importedCount = 0;

  try {
    const missingCategories = bookingsToImport
      .map((booking) => booking.category)
      .filter((category, index, list) => list.findIndex((item) => item.toLowerCase() === category.toLowerCase()) === index)
      .filter((category) => !categories.some((existingCategory) => existingCategory.toLowerCase() === category.toLowerCase()));

    for (const category of missingCategories) {
      await withTimeout(saveCategory(category), AUTH_ACTION_TIMEOUT_MS, "CSV-Kategorie importieren");
    }

    for (const booking of bookingsToImport) {
      const safeBooking = {
        ...booking,
        id: isCloudMode() ? crypto.randomUUID() : booking.id,
      };
      await withTimeout(saveTransaction(safeBooking), AUTH_ACTION_TIMEOUT_MS, "CSV-Buchung importieren");
      importedCount += 1;
    }

    activeDetail = null;
    render();
    closeCsvImportDialog();
    setDataActionMessage(`${bookingsToImport.length} Buchung(en) aus CSV importiert.`);
  } catch (error) {
    console.error("csv: import failed", error);
    if (pendingCsvImport) {
      pendingCsvImport.newBookings = bookingsToImport.slice(importedCount);
      elements.csvPreviewNew.textContent = String(pendingCsvImport.newBookings.length);
    }
    setCsvImportMessage(error.message || "CSV-Import teilweise fehlgeschlagen.", true);
  } finally {
    elements.confirmCsvImport.disabled = false;
    elements.confirmCsvImport.textContent = "Import bestätigen";
  }
}

function createBackupData() {
  return {
    app: "finance-tracker-mvp",
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      bookings,
      categories,
      settings: {
        activeAnalysisType,
      },
    },
  };
}

function isValidBooking(booking) {
  return (
    booking &&
    typeof booking.id === "string" &&
    typeof booking.amount === "number" &&
    isValidBookingType(booking.type) &&
    typeof booking.category === "string" &&
    typeof booking.description === "string" &&
    isValidIsoDate(booking.date)
  );
}

function isValidBackupData(backupData) {
  const data = backupData?.data;
  return (
    backupData?.app === "finance-tracker-mvp" &&
    data &&
    Array.isArray(data.bookings) &&
    Array.isArray(data.categories) &&
    data.bookings.every(isValidBooking) &&
    data.categories.every((category) => typeof category === "string" && normalizeCategoryName(category))
  );
}

function exportBackup() {
  const backupData = createBackupData();
  const backupJson = JSON.stringify(backupData, null, 2);
  const filename = `finance-tracker-backup-${todayIsoDate()}.json`;
  downloadBlob(new Blob([backupJson], { type: "application/json" }), filename);
  setDataActionMessage("Backup exportiert.");
}

function importBackupFile(file) {
  const reader = new FileReader();

  reader.addEventListener("load", () => {
    try {
      const backupData = JSON.parse(String(reader.result || ""));

      if (!isValidBackupData(backupData)) {
        setDataActionMessage("Die ausgewählte Datei ist kein gültiges Finance-Tracker-Backup.", true);
        return;
      }

      if (isCloudMode()) {
        setDataActionMessage("Import in Cloud-Daten wird in einem separaten Schritt ergänzt.", true);
        return;
      }

      const shouldImport = window.confirm("Der Import ersetzt deine aktuellen lokalen Daten. Fortfahren?");
      if (!shouldImport) {
        setDataActionMessage("Import abgebrochen.");
        return;
      }

      bookings = backupData.data.bookings;
      categories = mergeCategories(backupData.data.categories.map(normalizeCategoryName));
      activeAnalysisType = analysisTypes.includes(backupData.data.settings?.activeAnalysisType)
        ? backupData.data.settings.activeAnalysisType
        : "expense";
      activeDetail = null;
      saveBookings();
      saveCategories();
      render();
      setDataActionMessage("Backup importiert.");
    } catch {
      setDataActionMessage("Die Backup-Datei konnte nicht gelesen werden.", true);
    } finally {
      elements.backupFileInput.value = "";
    }
  });

  reader.addEventListener("error", () => {
    setDataActionMessage("Die Backup-Datei konnte nicht gelesen werden.", true);
    elements.backupFileInput.value = "";
  });

  reader.readAsText(file);
}

function getReportRange() {
  const from = getDateFilterValue(elements.filters.from) || firstDayOfCurrentMonthIsoDate();
  const to = getDateFilterValue(elements.filters.to) || todayIsoDate();
  return { from, to };
}

function getPositiveAmount(booking) {
  return Math.abs(Number(booking.amount) || 0);
}

function aggregateByCategory(visibleBookings, type) {
  const totals = new Map();

  visibleBookings
    .filter((booking) => booking.type === type)
    .forEach((booking) => {
      const amount = getPositiveAmount(booking);
      totals.set(booking.category, (totals.get(booking.category) || 0) + amount);
    });

  return [...totals.entries()]
    .filter(([, total]) => total > 0)
    .map(([category, total]) => ({ category, total }))
    .sort((first, second) => second.total - first.total);
}

function aggregateNetExpensesByCategory(visibleBookings) {
  const totals = new Map();

  visibleBookings.forEach((booking) => {
    if (booking.type !== "expense" && booking.type !== "adjustment") return;

    const currentTotal = totals.get(booking.category) || 0;
    const amount = booking.type === "expense" ? getPositiveAmount(booking) : -getPositiveAmount(booking);
    totals.set(booking.category, currentTotal + amount);
  });

  return [...totals.entries()]
    .map(([category, total]) => ({ category, total: Math.max(0, total) }))
    .filter((item) => item.total > 0)
    .sort((first, second) => second.total - first.total);
}

function getReportData() {
  const range = getReportRange();
  const reportBookings = bookings
    .filter((booking) => booking.date >= range.from && booking.date <= range.to)
    .sort((first, second) => first.date.localeCompare(second.date));
  const totals = calculateTotals(reportBookings);

  return {
    range,
    bookings: reportBookings,
    totals,
    expensesByCategory: aggregateNetExpensesByCategory(reportBookings),
    incomeByCategory: aggregateByCategory(reportBookings, "income"),
    savingsByCategory: aggregateByCategory(reportBookings, "saving"),
    investmentsByCategory: aggregateByCategory(reportBookings, "investment"),
  };
}

function encodePdfText(text) {
  const replacements = {
    "€": "\x80",
    "‚": "\x82",
    "ƒ": "\x83",
    "„": "\x84",
    "…": "\x85",
    "†": "\x86",
    "‡": "\x87",
    "ˆ": "\x88",
    "‰": "\x89",
    "Š": "\x8A",
    "‹": "\x8B",
    "Œ": "\x8C",
    "Ž": "\x8E",
    "‘": "\x91",
    "’": "\x92",
    "“": "\x93",
    "”": "\x94",
    "•": "\x95",
    "–": "\x96",
    "—": "\x97",
    "˜": "\x98",
    "™": "\x99",
    "š": "\x9A",
    "›": "\x9B",
    "œ": "\x9C",
    "ž": "\x9E",
    "Ÿ": "\x9F",
  };

  return String(text)
    .replace(/[€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ]/g, (char) => replacements[char] || char)
    .replace(/[^\x09\x0A\x0D\x20-\xFF]/g, "?")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function createPdfDocument(lines) {
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 48;
  const lineHeight = 15;
  const objects = [];
  const pages = [];
  let currentPage = [];
  let y = pageHeight - margin;

  function addPage() {
    if (currentPage.length) pages.push(currentPage);
    currentPage = [];
    y = pageHeight - margin;
  }

  lines.forEach((line) => {
    const neededHeight = line.gapBefore ? line.gapBefore + lineHeight : lineHeight;
    if (y - neededHeight < margin) addPage();
    if (line.gapBefore) y -= line.gapBefore;
    currentPage.push({ ...line, x: line.x || margin, y, size: line.size || 10 });
    y -= line.height || lineHeight;
  });

  if (currentPage.length) pages.push(currentPage);

  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push("");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");

  const pageObjectNumbers = [];

  pages.forEach((pageLines) => {
    const content = pageLines
      .map((line) => {
        const font = line.bold ? "F2" : "F1";
        const color = line.color || "0.12 0.12 0.13";
        return `BT /${font} ${line.size} Tf ${color} rg ${line.x.toFixed(2)} ${line.y.toFixed(2)} Td (${encodePdfText(line.text)}) Tj ET`;
      })
      .join("\n");
    const streamObjectNumber = objects.length + 1;
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
    const pageObjectNumber = objects.length + 1;
    pageObjectNumbers.push(pageObjectNumber);
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${streamObjectNumber} 0 R >>`);
  });

  objects[1] = `<< /Type /Pages /Kids [${pageObjectNumbers.map((number) => `${number} 0 R`).join(" ")}] /Count ${pageObjectNumbers.length} >>`;

  let pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([Uint8Array.from(pdf, (char) => char.charCodeAt(0))], { type: "application/pdf" });
}

function addReportSection(lines, title, rows) {
  lines.push({ text: title, size: 13, bold: true, gapBefore: 12 });

  if (!rows.length) {
    lines.push({ text: "Keine Daten vorhanden.", color: "0.43 0.43 0.45" });
    return;
  }

  rows.forEach((row) => lines.push(row));
}

function downloadPdfReport() {
  const report = getReportData();
  const rangeLabel = `${formatDateForDisplay(report.range.from)} – ${formatDateForDisplay(report.range.to)}`;
  const lines = [
    { text: "Finance Report", size: 22, bold: true },
    { text: `Zeitraum: ${rangeLabel}`, size: 11, color: "0.43 0.43 0.45", gapBefore: 4 },
    { text: "Übersicht", size: 14, bold: true, gapBefore: 18 },
    { text: `Gesamte Einnahmen: ${formatCurrency(report.totals.income)}`, color: "0.14 0.48 0.31" },
    { text: `Brutto-Ausgaben: ${formatCurrency(-report.totals.grossExpenses)}`, color: "0.69 0.28 0.24" },
    { text: `Ausgleich: ${formatCurrency(report.totals.adjustments)}`, color: "0.14 0.48 0.31" },
    { text: `Netto-Ausgaben: ${formatCurrency(-report.totals.expenses)}`, color: "0.69 0.28 0.24" },
    { text: `Gespart: ${formatCurrency(report.totals.savings)}` },
    { text: `Investiert: ${formatCurrency(report.totals.investments)}` },
    { text: `Vermögensaufbau: ${formatCurrency(report.totals.wealthBuilding)}` },
    { text: `Monatsrest / Cashflow: ${formatCurrency(report.totals.balance)}` },
  ];

  addReportSection(
    lines,
    "Netto-Ausgaben nach Kategorie",
    report.expensesByCategory.map((item) => ({
      text: `${item.category}: ${formatCurrency(-item.total)}`,
      color: "0.69 0.28 0.24",
    }))
  );

  addReportSection(
    lines,
    "Einnahmen nach Kategorie",
    report.incomeByCategory.map((item) => ({
      text: `${item.category}: ${formatCurrency(item.total)}`,
      color: "0.14 0.48 0.31",
    }))
  );

  addReportSection(
    lines,
    "Sparen nach Kategorie",
    report.savingsByCategory.map((item) => ({
      text: `${item.category}: ${formatCurrency(item.total)}`,
    }))
  );

  addReportSection(
    lines,
    "Investitionen nach Kategorie",
    report.investmentsByCategory.map((item) => ({
      text: `${item.category}: ${formatCurrency(item.total)}`,
    }))
  );

  lines.push({ text: "Einzelbuchungen im Zeitraum", size: 14, bold: true, gapBefore: 16 });

  if (!report.bookings.length) {
    lines.push({ text: "Keine Buchungen im ausgewählten Zeitraum.", color: "0.43 0.43 0.45" });
  } else {
    lines.push({ text: "Datum | Typ | Kategorie | Beschreibung | Betrag", bold: true });
    report.bookings.forEach((booking) => {
      const description = booking.description || "-";
      const amountColor = booking.amount < 0 ? "0.69 0.28 0.24" : "0.14 0.48 0.31";
      lines.push({
        text: `${formatDateForDisplay(booking.date)} | ${displayType(booking.type)} | ${booking.category} | ${description} | ${formatCurrency(booking.amount)}`,
        color: amountColor,
      });
    });
  }

  const pdfBlob = createPdfDocument(lines);
  const filename = `finance-report-${report.range.from}-bis-${report.range.to}.pdf`;
  downloadBlob(pdfBlob, filename);
  setDataActionMessage("PDF-Report erstellt.");
}

function populateSelect(select, options, placeholder) {
  const currentValue = select.value;
  select.innerHTML = "";

  const placeholderOption = document.createElement("option");
  placeholderOption.value = placeholder.value;
  placeholderOption.textContent = placeholder.label;
  select.append(placeholderOption);

  options.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    select.append(option);
  });

  if ([...select.options].some((option) => option.value === currentValue)) {
    select.value = currentValue;
  }
}

function renderCategoryOptions(selectedCategory = "") {
  const sortedCategories = [...categories].sort((first, second) =>
    first.localeCompare(second, "de", { sensitivity: "base" })
  );

  populateSelect(elements.category, sortedCategories, { value: "", label: "Kategorie wählen" });

  if (selectedCategory) {
    elements.category.value = selectedCategory;
  }
}

function getSelectedType() {
  return new FormData(elements.form).get("type");
}

function getCategoryForType(type) {
  return automaticCategoriesByType[type] || elements.category.value;
}

function requiresManualCategory(type) {
  return !Object.prototype.hasOwnProperty.call(automaticCategoriesByType, type);
}

function updateCategoryControlForType(type = getSelectedType()) {
  const isManualCategory = requiresManualCategory(type);
  elements.category.disabled = !isManualCategory;
  elements.openCategoryDialog.disabled = !isManualCategory;
  elements.category.required = isManualCategory;
  elements.categoryFormRow.classList.toggle("category-disabled", !isManualCategory);

  if (!isManualCategory) {
    elements.category.value = "";
  }
}

function isValidBookingType(type) {
  return validBookingTypes.includes(type);
}

function getSignedAmountByType(amount, type) {
  const absoluteAmount = Math.abs(Number(amount));
  const amountDirection = bookingTypes[type]?.amountDirection || "positive";
  return amountDirection === "negative" ? -absoluteAmount : absoluteAmount;
}

function signedAmount(amount, type) {
  return getSignedAmountByType(amount, type);
}

function displayType(type) {
  return bookingTypes[type]?.label || "Unbekannt";
}

function displayAnalysisType(type) {
  return bookingTypes[type]?.pluralLabel || "Buchungen";
}

function getAnalysisEmptyText(type) {
  if (type === "income") return "Keine Einnahmen im gewählten Zeitraum.";
  if (type === "saving") return "Keine Sparbuchungen im gewählten Zeitraum.";
  if (type === "investment") return "Keine Investitionen im gewählten Zeitraum.";
  return "Keine Ausgaben im gewählten Zeitraum.";
}

function formatDate(dateValue) {
  return formatDateForDisplay(dateValue);
}

function formatShortDisplayDate(dateValue) {
  const displayDate = formatDateForDisplay(dateValue);
  if (!displayDate) return "";
  return `${displayDate.slice(0, 6)}${displayDate.slice(-2)}`;
}

function formatCurrency(value) {
  return currencyFormatter.format(value);
}

function formatSignedCurrency(value) {
  if (value > 0) return `+${formatCurrency(value)}`;
  return formatCurrency(value);
}

function getDetailAmountClass(type, amount) {
  if (type === "saving") return "amount-saving";
  if (type === "investment") return "amount-investment";
  return amount < 0 ? "amount-expense" : "amount-income";
}

function getTodaysBookings() {
  const today = todayIsoDate();
  return bookings.filter((booking) => booking.date === today);
}

function setMessage(text, isError = false) {
  elements.message.textContent = text;
  elements.message.classList.toggle("error", isError);

  if (!isError && text) {
    window.clearTimeout(setMessage.timeout);
    setMessage.timeout = window.setTimeout(() => {
      elements.message.textContent = "";
    }, 2600);
  }
}

function setCategoryMessage(text, isError = false) {
  elements.categoryMessage.textContent = text;
  elements.categoryMessage.classList.toggle("error", isError);
}

function createDatePicker() {
  const picker = document.createElement("div");
  picker.className = "date-picker";
  picker.setAttribute("role", "dialog");
  picker.setAttribute("aria-label", "Datum auswählen");
  document.body.append(picker);
  return picker;
}

function positionDatePicker() {
  if (!activeDatePicker) return;

  const { input, picker } = activeDatePicker;
  const inputRect = input.getBoundingClientRect();
  const pickerWidth = picker.offsetWidth || 352;
  const left = Math.min(
    window.scrollX + inputRect.left,
    window.scrollX + document.documentElement.clientWidth - pickerWidth - 18
  );

  picker.style.left = `${Math.max(window.scrollX + 18, left)}px`;
  picker.style.top = `${window.scrollY + inputRect.bottom + 10}px`;
}

function renderDatePicker() {
  if (!activeDatePicker) return;

  const { input, picker } = activeDatePicker;
  const selectedDate = parseIsoDate(formatDateForStorage(input.value));
  const today = new Date();
  const todayValue = todayIsoDate();
  const monthDate = activeDatePicker.visibleMonth;
  const monthLabel = monthDate.toLocaleDateString("de-DE", { month: "long", year: "numeric" });
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const firstWeekday = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
  const weekdayLabels = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

  picker.innerHTML = "";

  const header = document.createElement("div");
  header.className = "date-picker-header";

  const previousButton = document.createElement("button");
  previousButton.className = "date-picker-nav";
  previousButton.type = "button";
  previousButton.textContent = "‹";
  previousButton.setAttribute("aria-label", "Vorheriger Monat");
  previousButton.addEventListener("click", () => {
    activeDatePicker.visibleMonth = addMonths(activeDatePicker.visibleMonth, -1);
    renderDatePicker();
  });

  const title = document.createElement("div");
  title.className = "date-picker-title";
  title.textContent = monthLabel;

  const nextButton = document.createElement("button");
  nextButton.className = "date-picker-nav";
  nextButton.type = "button";
  nextButton.textContent = "›";
  nextButton.setAttribute("aria-label", "Nächster Monat");
  nextButton.addEventListener("click", () => {
    activeDatePicker.visibleMonth = addMonths(activeDatePicker.visibleMonth, 1);
    renderDatePicker();
  });

  header.append(previousButton, title, nextButton);
  picker.append(header);

  const weekdays = document.createElement("div");
  weekdays.className = "date-picker-weekdays";
  weekdayLabels.forEach((weekday) => {
    const weekdayElement = document.createElement("span");
    weekdayElement.textContent = weekday;
    weekdays.append(weekdayElement);
  });
  picker.append(weekdays);

  const grid = document.createElement("div");
  grid.className = "date-picker-grid";

  for (let index = 0; index < firstWeekday; index += 1) {
    const emptyCell = document.createElement("span");
    emptyCell.className = "date-picker-empty";
    grid.append(emptyCell);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dayDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
    const dayValue = toLocalIsoDate(dayDate);
    const dayButton = document.createElement("button");
    dayButton.className = "date-picker-day";
    dayButton.type = "button";
    dayButton.textContent = String(day);
    dayButton.dataset.date = dayValue;

    if (selectedDate && dayValue === toLocalIsoDate(selectedDate)) {
      dayButton.classList.add("selected");
    }

    if (dayValue === todayValue) {
      dayButton.classList.add("today");
    }

    dayButton.addEventListener("click", () => {
      setDateInputValue(input, dayValue);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      closeDatePicker();
    });

    grid.append(dayButton);
  }

  picker.append(grid);

  const footer = document.createElement("div");
  footer.className = "date-picker-footer";

  const todayButton = document.createElement("button");
  todayButton.className = "date-picker-action";
  todayButton.type = "button";
  todayButton.textContent = "Heute";
  todayButton.addEventListener("click", () => {
    setDateInputValue(input, todayValue);
    activeDatePicker.visibleMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    closeDatePicker();
  });

  const clearButton = document.createElement("button");
  clearButton.className = "date-picker-action muted";
  clearButton.type = "button";
  clearButton.textContent = "Löschen";
  clearButton.addEventListener("click", () => {
    input.value = "";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    closeDatePicker();
  });

  footer.append(clearButton, todayButton);
  picker.append(footer);
  positionDatePicker();
}

function openDatePicker(input) {
  closeDatePicker();

  const selectedDate = parseIsoDate(formatDateForStorage(input.value));
  const baseDate = selectedDate || new Date();
  const picker = createDatePicker();

  activeDatePicker = {
    input,
    picker,
    visibleMonth: new Date(baseDate.getFullYear(), baseDate.getMonth(), 1),
  };

  input.setAttribute("aria-expanded", "true");
  renderDatePicker();
}

function closeDatePicker() {
  if (!activeDatePicker) return;

  activeDatePicker.input.setAttribute("aria-expanded", "false");
  activeDatePicker.picker.remove();
  activeDatePicker = null;
}

function initDatePickers() {
  elements.dateInputs.forEach((input) => {
    input.setAttribute("aria-haspopup", "dialog");
    input.setAttribute("aria-expanded", "false");
    input.addEventListener("focus", () => openDatePicker(input));
    input.addEventListener("click", () => openDatePicker(input));
    input.addEventListener("blur", () => normalizeDateInput(input));
    input.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeDatePicker();
      }
    });
  });

  document.addEventListener("pointerdown", (event) => {
    if (!activeDatePicker) return;

    const clickedPicker = activeDatePicker.picker.contains(event.target);
    const clickedInput = activeDatePicker.input.contains(event.target);

    if (!clickedPicker && !clickedInput) {
      closeDatePicker();
    }
  });

  window.addEventListener("resize", positionDatePicker);
  window.addEventListener("scroll", positionDatePicker, true);

  document.querySelectorAll(".date-filter-card").forEach((card) => {
    card.addEventListener("click", (event) => {
      const input = card.querySelector("[data-datepicker]");
      if (!input || event.target === input) return;
      input.focus();
      openDatePicker(input);
    });
  });
}

function resetForm() {
  elements.form.reset();
  setDateInputValue(elements.date, todayIsoDate());
  document.querySelector('input[name="type"][value="income"]').checked = true;
  updateCategoryControlForType("income");
  elements.amount.focus();
}

function validateBooking(amount, category, date, visibleDate = "", type = "") {
  if (!amount || Number(amount) <= 0) {
    return "Bitte gib einen gültigen Betrag ein.";
  }

  if (!isValidBookingType(type)) {
    return "Bitte wähle einen gültigen Buchungstyp aus.";
  }

  if (requiresManualCategory(type) && (!category || !categories.includes(category))) {
    return "Bitte wähle eine Kategorie aus.";
  }

  if (!date && !visibleDate.trim()) {
    return "Bitte wähle ein Datum aus.";
  }

  if (!isValidIsoDate(date)) {
    return "Bitte nutze ein gültiges Datum im Format DD.MM.JJJJ.";
  }

  return "";
}

function openCategoryDialog() {
  elements.newCategory.value = "";
  setCategoryMessage("");
  elements.categoryDialog.showModal();
  elements.newCategory.focus();
}

function closeCategoryDialog() {
  elements.categoryDialog.close();
  setCategoryMessage("");
}

function setFormSubmitLoading(form, isLoading, loadingText) {
  const submitButton = form.querySelector('button[type="submit"]');
  if (!submitButton) return;

  if (!submitButton.dataset.defaultText) {
    submitButton.dataset.defaultText = submitButton.textContent;
  }

  submitButton.disabled = isLoading;
  submitButton.textContent = isLoading ? loadingText : submitButton.dataset.defaultText;
}

async function handleCategorySubmit(event) {
  event.preventDefault();

  const categoryName = normalizeCategoryName(elements.newCategory.value);
  const alreadyExists = categories.some((category) => category.toLowerCase() === categoryName.toLowerCase());

  if (!categoryName) {
    setCategoryMessage("Bitte gib einen Kategorienamen ein.", true);
    return;
  }

  if (alreadyExists) {
    setCategoryMessage("Diese Kategorie gibt es bereits.", true);
    return;
  }

  setFormSubmitLoading(elements.categoryForm, true, "Speichert...");

  try {
    await withTimeout(saveCategory(categoryName), AUTH_ACTION_TIMEOUT_MS, "Kategorie speichern");
  } catch (error) {
    setCategoryMessage(error.message || "Kategorie konnte nicht gespeichert werden.", true);
    return;
  } finally {
    setFormSubmitLoading(elements.categoryForm, false, "");
  }

  renderCategoryOptions(categoryName);
  closeCategoryDialog();
  setMessage("Kategorie hinzugefügt.");
  render();
}

async function handleSubmit(event) {
  event.preventDefault();

  const type = getSelectedType();
  const amount = elements.amount.value;
  const category = getCategoryForType(type);
  const description = elements.description.value.trim();
  const visibleDate = elements.date.value;
  const date = formatDateForStorage(elements.date.value);
  const validationError = validateBooking(amount, category, date, visibleDate, type);

  if (validationError) {
    setMessage(validationError, true);
    return;
  }

  const transaction = {
    id: crypto.randomUUID(),
    amount: signedAmount(amount, type),
    type,
    category,
    description,
    date,
    createdAt: new Date().toISOString(),
  };

  setFormSubmitLoading(elements.form, true, "Speichert...");

  try {
    await withTimeout(saveTransaction(transaction), AUTH_ACTION_TIMEOUT_MS, "Buchung speichern");
  } catch (error) {
    setMessage(error.message || "Buchung konnte nicht gespeichert werden.", true);
    return;
  } finally {
    setFormSubmitLoading(elements.form, false, "");
  }

  resetForm();
  setMessage("Buchung gespeichert.");
  render();
}

function getFilteredBookings() {
  const from = getDateFilterValue(elements.filters.from);
  const to = getDateFilterValue(elements.filters.to);

  return bookings.filter((booking) => {
    const matchesFrom = !from || booking.date >= from;
    const matchesTo = !to || booking.date <= to;
    return matchesFrom && matchesTo;
  });
}

function calculateTotals(filteredBookings) {
  const totals = filteredBookings.reduce(
    (totals, booking) => {
      if (booking.type === "income") {
        totals.income += Math.abs(booking.amount);
      } else if (booking.type === "expense") {
        totals.grossExpenses += Math.abs(booking.amount);
      } else if (booking.type === "adjustment") {
        totals.adjustments += Math.abs(booking.amount);
      } else if (booking.type === "saving") {
        totals.savings += Math.abs(booking.amount);
      } else if (booking.type === "investment") {
        totals.investments += Math.abs(booking.amount);
      }

      return totals;
    },
    {
      income: 0,
      grossExpenses: 0,
      adjustments: 0,
      expenses: 0,
      savings: 0,
      investments: 0,
      wealthBuilding: 0,
      balance: 0,
    }
  );

  totals.expenses = Math.max(0, totals.grossExpenses - totals.adjustments);
  totals.wealthBuilding = totals.savings + totals.investments;
  totals.balance = totals.income - totals.expenses - totals.savings - totals.investments;
  return totals;
}

function renderMetrics(filteredBookings) {
  const totals = calculateTotals(filteredBookings);
  elements.totalIncome.textContent = formatCurrency(totals.income);
  elements.totalExpenses.textContent = formatCurrency(totals.expenses);
  elements.totalSavings.textContent = formatCurrency(totals.savings);
  elements.totalInvestments.textContent = formatCurrency(totals.investments);
  elements.totalBalance.textContent = formatCurrency(totals.balance);
  elements.totalBalance.className = totals.balance < 0 ? "amount-expense" : "amount-income";
}

function createBookingTableRows(tableBody, visibleBookings, options = {}) {
  tableBody.innerHTML = "";

  visibleBookings.forEach((booking) => {
    const row = document.createElement("tr");
    const amountClass = getDetailAmountClass(booking.type, booking.amount);
    const dateCell = document.createElement("td");
    const descriptionCell = document.createElement("td");
    const amountCell = document.createElement("td");
    const actionCell = document.createElement("td");
    const deleteButton = document.createElement("button");

    dateCell.textContent = options.compact ? formatShortDisplayDate(booking.date) : formatDate(booking.date);
    descriptionCell.textContent =
      options.showTypeInDescription && booking.type
        ? `${displayType(booking.type)} · ${booking.description || "-"}`
        : booking.description || "-";
    amountCell.className = `align-right ${amountClass}`;
    amountCell.textContent = formatCurrency(booking.amount);
    deleteButton.className = "delete-button";
    deleteButton.type = "button";
    deleteButton.dataset.id = booking.id;
    deleteButton.dataset.source = options.source || "";
    deleteButton.setAttribute("aria-label", "Buchung löschen");
    deleteButton.title = "Buchung löschen";

    if (options.compact) {
      const trashIcon = document.createElement("span");
      deleteButton.classList.add("delete-button-icon");
      trashIcon.className = "trash-icon";
      trashIcon.setAttribute("aria-hidden", "true");
      deleteButton.append(trashIcon);
    } else {
      deleteButton.textContent = "Löschen";
    }

    actionCell.append(deleteButton);

    if (options.compact) {
      row.append(dateCell, descriptionCell, amountCell, actionCell);
    } else {
      const typeCell = document.createElement("td");
      const categoryCell = document.createElement("td");
      const typePill = document.createElement("span");

      typePill.className = `type-pill ${booking.type}`;
      typePill.textContent = displayType(booking.type);
      typeCell.append(typePill);
      categoryCell.textContent = booking.category;
      row.append(dateCell, typeCell, categoryCell, descriptionCell, amountCell, actionCell);
    }

    tableBody.append(row);
  });
}

function getCategoryBreakdown(filteredBookings, type) {
  const breakdown = type === "expense" ? aggregateNetExpensesByCategory(filteredBookings) : aggregateByCategory(filteredBookings, type);

  return breakdown.map((item, index) => ({
    ...item,
    color: chartColors[index % chartColors.length],
  }));
}

function getMonthKey(dateValue) {
  return String(dateValue || "").slice(0, 7);
}

function getMonthLabel(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat("de-DE", { month: "short" }).format(date).replace(".", "");
}

function getMonthRange() {
  const from = getDateFilterValue(elements.filters.from) || firstDayOfCurrentMonthIsoDate();
  const to = getDateFilterValue(elements.filters.to) || todayIsoDate();
  const fromDate = parseIsoDate(from);
  const toDate = parseIsoDate(to);

  if (!fromDate || !toDate || fromDate > toDate) return [];

  const months = [];
  let cursor = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
  const end = new Date(toDate.getFullYear(), toDate.getMonth(), 1);

  while (cursor <= end) {
    months.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`);
    cursor = addMonths(cursor, 1);
  }

  return months;
}

function getMonthlyDashboardData(filteredBookings) {
  const months = getMonthRange();

  return months.map((monthKey) => {
    const monthBookings = filteredBookings.filter((booking) => getMonthKey(booking.date) === monthKey);
    const totals = calculateTotals(monthBookings);
    const netExpenses = aggregateNetExpensesByCategory(monthBookings).reduce((sum, item) => sum + item.total, 0);

    return {
      key: monthKey,
      label: getMonthLabel(monthKey),
      isCurrentMonth: monthKey === getMonthKey(todayIsoDate()),
      income: totals.income,
      expenses: netExpenses,
      savings: totals.savings,
      investments: totals.investments,
    };
  });
}

function createSvgElement(name, attributes = {}) {
  const svgNamespace = "http://www.w3.org/2000/svg";
  const element = document.createElementNS(svgNamespace, name);

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, String(value));
  });

  return element;
}

function formatCompactCurrency(value) {
  if (value >= 1000) return `${Math.round(value / 1000)} Tsd. €`;
  return `${Math.round(value)} €`;
}

function renderLineChart({ container, emptyState, data }) {
  container.innerHTML = "";
  emptyState.textContent = "Keine Buchungen im gewählten Zeitraum.";

  const seriesKeys = Object.keys(lineSeriesMeta);
  const maxValue = Math.max(...data.flatMap((item) => seriesKeys.map((key) => item[key])), 0);
  const hasData = data.length > 0 && maxValue > 0;

  emptyState.classList.toggle("visible", !hasData);
  container.classList.toggle("hidden", !hasData);

  if (!hasData) return;

  const chartWidth = 760;
  const chartHeight = 246;
  const padding = { top: 18, right: 28, bottom: 42, left: 62 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;
  const yMax = Math.ceil(maxValue / 100) * 100 || 100;
  const xForIndex = (index) => padding.left + (data.length === 1 ? plotWidth / 2 : (index / (data.length - 1)) * plotWidth);
  const yForValue = (value) => padding.top + plotHeight - (value / yMax) * plotHeight;
  const svg = createSvgElement("svg", {
    viewBox: `0 0 ${chartWidth} ${chartHeight}`,
    class: "line-chart-svg",
    role: "img",
    "aria-label": "Monatsvergleich für Einnahmen, Netto-Ausgaben, Sparen und Investitionen",
  });

  [0, 0.5, 1].forEach((ratio) => {
    const y = padding.top + plotHeight - ratio * plotHeight;
    const value = yMax * ratio;
    svg.append(
      createSvgElement("line", {
        class: "line-chart-grid",
        x1: padding.left,
        y1: y,
        x2: chartWidth - padding.right,
        y2: y,
      })
    );

    const label = createSvgElement("text", {
      class: "line-chart-axis-label",
      x: padding.left - 10,
      y: y + 4,
      "text-anchor": "end",
    });
    label.textContent = formatCompactCurrency(value);
    svg.append(label);
  });

  data.forEach((item, index) => {
    const x = xForIndex(index);
    const label = createSvgElement("text", {
      class: item.isCurrentMonth ? "line-chart-axis-label current" : "line-chart-axis-label",
      x,
      y: chartHeight - 14,
      "text-anchor": "middle",
    });
    label.textContent = item.isCurrentMonth ? `${item.label} · läuft` : item.label;
    svg.append(label);
  });

  seriesKeys.forEach((key) => {
    const meta = lineSeriesMeta[key];
    const points = data.map((item, index) => `${xForIndex(index)},${yForValue(item[key])}`);
    const line = createSvgElement("polyline", {
      class: "line-chart-series",
      points: points.join(" "),
      stroke: meta.color,
    });

    svg.append(line);

    data.forEach((item, index) => {
      svg.append(
        createSvgElement("circle", {
          class: "line-chart-point",
          cx: xForIndex(index),
          cy: yForValue(item[key]),
          r: 4.2,
          fill: meta.color,
        })
      );
    });
  });

  const legend = document.createElement("div");
  legend.className = "line-chart-legend";
  seriesKeys.forEach((key) => {
    const meta = lineSeriesMeta[key];
    const legendItem = document.createElement("span");
    const swatch = document.createElement("span");
    const label = document.createElement("span");

    legendItem.className = "line-chart-legend-item";
    swatch.style.background = meta.color;
    label.textContent = meta.label;
    legendItem.append(swatch, label);
    legend.append(legendItem);
  });

  container.append(svg, legend);
}

function renderAnalysisModeButtons() {
  elements.analysisModeButtons.forEach((button) => {
    const isActive = button.dataset.analysisType === activeAnalysisType;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  if (elements.analysisActiveLabel) {
    elements.analysisActiveLabel.textContent = displayAnalysisType(activeAnalysisType);
  }
}

function setAnalysisType(type) {
  if (!analysisTypes.includes(type) || type === activeAnalysisType) return;

  activeAnalysisType = type;
  activeDetail = null;
  render();
}

function stepAnalysisType(direction) {
  const currentIndex = analysisTypes.indexOf(activeAnalysisType);
  const nextIndex = (currentIndex + direction + analysisTypes.length) % analysisTypes.length;
  setAnalysisType(analysisTypes[nextIndex]);
}

function renderAnalysis(filteredBookings) {
  const typeLabel = displayAnalysisType(activeAnalysisType);
  const breakdown = getCategoryBreakdown(filteredBookings, activeAnalysisType);

  elements.analysisTitle.textContent = typeLabel;
  elements.detailTitle.textContent = `${typeLabel}-Details`;
  renderAnalysisModeButtons();

  renderLineChart({
    container: elements.expenseDonut,
    emptyState: elements.expenseEmptyState,
    data: getMonthlyDashboardData(filteredBookings),
  });

  renderAnalysisList(breakdown, activeAnalysisType);

  if (!breakdown.length) {
    activeDetail = null;
  } else if (!activeDetail || activeDetail.type !== activeAnalysisType || !breakdown.some((item) => item.category === activeDetail.category)) {
    activeDetail = {
      type: activeAnalysisType,
      category: breakdown[0].category,
    };
  }

  renderCategoryDetail();
}

function renderAnalysisList(data, type) {
  elements.expenseLegend.innerHTML = "";
  elements.expenseLegend.classList.toggle("hidden", false);

  if (!data.length) {
    const empty = document.createElement("p");
    empty.className = "detail-list-empty";
    empty.textContent = getAnalysisEmptyText(type);
    elements.expenseLegend.append(empty);
    return;
  }

  data.forEach((item) => {
    const row = document.createElement("button");
    const label = document.createElement("span");
    const value = document.createElement("span");

    row.className = "donut-legend-item dashboard-category-row";
    row.type = "button";
    row.addEventListener("click", () => openCategoryDetail(type, item.category));
    label.className = "legend-label";
    label.textContent = item.category;
    value.className = "legend-value";
    value.textContent = type === "expense" ? formatCurrency(-item.total) : formatCurrency(item.total);
    value.classList.add(getDetailAmountClass(type, type === "expense" ? -item.total : item.total));
    row.append(label, value);
    elements.expenseLegend.append(row);
  });
}

function getVisibleDateRangeLabel() {
  const from = getDateFilterValue(elements.filters.from);
  const to = getDateFilterValue(elements.filters.to);

  if (from && to) return `${formatDateForDisplay(from)} – ${formatDateForDisplay(to)}`;
  if (from) return `ab ${formatDateForDisplay(from)}`;
  if (to) return `bis ${formatDateForDisplay(to)}`;
  return "Alle Zeiträume";
}

function getDetailBookings(type, category) {
  if (type === "expense") {
    return getFilteredBookings()
      .filter((booking) => (booking.type === "expense" || booking.type === "adjustment") && booking.category === category)
      .sort((first, second) => second.date.localeCompare(first.date));
  }

  return getFilteredBookings()
    .filter((booking) => booking.type === type && booking.category === category)
    .sort((first, second) => second.date.localeCompare(first.date));
}

function renderCategoryDetail() {
  const typeLabel = displayAnalysisType(activeAnalysisType);
  const hasActiveDetail = Boolean(activeDetail);
  const isMobileDashboard = window.matchMedia("(max-width: 768px)").matches;

  elements.detailCard.classList.toggle("mobile-open", hasActiveDetail);
  elements.mobileDetailBackdrop.classList.toggle("visible", hasActiveDetail);

  if (hasActiveDetail && isMobileDashboard) {
    elements.detailCard.setAttribute("role", "dialog");
    elements.detailCard.setAttribute("aria-modal", "true");
  } else {
    elements.detailCard.removeAttribute("role");
    elements.detailCard.removeAttribute("aria-modal");
  }

  if (!activeDetail) {
    const emptyText = getAnalysisEmptyText(activeAnalysisType);
    elements.detailSubtitle.textContent = emptyText;
    elements.detailPlaceholder.classList.remove("hidden");
    elements.detailPlaceholder.textContent = emptyText;
    elements.detailContent.classList.add("hidden");
    elements.detailExpenseOnly.forEach((element) => element.classList.add("hidden"));
    elements.detailTotalLabel.textContent = "Gesamtsumme";
    elements.detailTableBody.innerHTML = "";
    return;
  }

  const { type, category } = activeDetail;
  const detailBookings = getDetailBookings(type, category);
  const grossExpenses = detailBookings
    .filter((booking) => booking.type === "expense")
    .reduce((sum, booking) => sum + getPositiveAmount(booking), 0);
  const adjustments = detailBookings
    .filter((booking) => booking.type === "adjustment")
    .reduce((sum, booking) => sum + getPositiveAmount(booking), 0);
  const total =
    type === "expense"
      ? Math.max(0, grossExpenses - adjustments)
      : detailBookings.reduce((sum, booking) => sum + getPositiveAmount(booking), 0);

  elements.detailSubtitle.textContent = `${typeLabel} · ${category} · ${getVisibleDateRangeLabel()}`;
  elements.detailPlaceholder.classList.add("hidden");
  elements.detailContent.classList.remove("hidden");
  elements.detailExpenseOnly.forEach((element) => element.classList.toggle("hidden", type !== "expense"));
  elements.detailTotalLabel.textContent = type === "expense" ? "Netto-Ausgaben" : "Gesamtsumme";
  elements.detailGrossExpenses.textContent = formatCurrency(-grossExpenses);
  elements.detailGrossExpenses.className = "amount-expense";
  elements.detailAdjustments.textContent = formatCurrency(adjustments);
  elements.detailAdjustments.className = "amount-income";
  elements.detailTotal.textContent = type === "expense" ? formatCurrency(-total) : formatCurrency(total);
  elements.detailTotal.className = type === "expense" ? "amount-expense" : "amount-income";
  elements.detailCount.textContent = String(detailBookings.length);
  createBookingTableRows(elements.detailTableBody, detailBookings, {
    source: "detail",
    compact: true,
  });
}

function openCategoryDetail(type, category) {
  activeDetail = { type, category };
  renderCategoryDetail();

  if (window.matchMedia("(max-width: 768px)").matches) {
    window.requestAnimationFrame(() => elements.mobileDetailClose.focus());
  }
}

function closeMobileCategoryDetail() {
  activeDetail = null;
  renderCategoryDetail();
}

function renderEntryPreview() {
  const todaysBookings = getTodaysBookings();
  const todayTotal = calculateTotals(todaysBookings).balance;
  const balanceClass = todayTotal > 0 ? "today-balance-positive" : todayTotal < 0 ? "today-balance-negative" : "today-balance-neutral";

  elements.todayPreview.textContent = formatSignedCurrency(todayTotal);
  elements.todayPreview.className = balanceClass;
  elements.entryCount.textContent = String(todaysBookings.length);
}

function render() {
  categories = mergeCategories(categories);
  renderCategoryOptions(elements.category.value);
  const filteredBookings = getFilteredBookings();
  renderMetrics(filteredBookings);
  renderAnalysis(filteredBookings);
  renderEntryPreview();
}

async function deleteBooking(id) {
  try {
    await withTimeout(deleteTransaction(id), AUTH_ACTION_TIMEOUT_MS, "Buchung löschen");
  } catch (error) {
    setDataActionMessage(error.message || "Buchung konnte nicht gelöscht werden.", true);
    return;
  }

  render();
}

function switchTab(tabName) {
  if (tabName !== "dashboard" && activeDetail) {
    closeMobileCategoryDetail();
  }

  elements.tabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.tab === tabName);
  });

  Object.entries(elements.panels).forEach(([name, panel]) => {
    panel.classList.toggle("active", name === tabName);
  });
}

elements.tabs.forEach((tab) => {
  tab.addEventListener("click", () => switchTab(tab.dataset.tab));
});

elements.authShell.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;
  const retryButton = event.target.closest("[data-auth-retry]");

  if (retryButton) {
    void retryAuthInitialization();
    return;
  }

  const viewButton = event.target.closest("[data-auth-view]");
  if (!viewButton) return;
  setAuthView(viewButton.dataset.authView);
});

elements.openProfileDialog.addEventListener("click", openProfileModal);
elements.profileForm.addEventListener("submit", updateUserProfile);
elements.cancelProfile.addEventListener("click", closeProfileModal);
elements.logoutButton.addEventListener("click", signOutUser);
elements.form.addEventListener("submit", handleSubmit);
elements.form.querySelectorAll('input[name="type"]').forEach((input) => {
  input.addEventListener("change", () => updateCategoryControlForType(input.value));
});
elements.openCategoryDialog.addEventListener("click", openCategoryDialog);
elements.categoryForm.addEventListener("submit", handleCategorySubmit);
elements.cancelCategory.addEventListener("click", closeCategoryDialog);
elements.dataActionToggle.addEventListener("click", toggleDataActionMenu);
elements.dataActionMenu.addEventListener("click", (event) => {
  if (event.target.closest(".data-action-button")) {
    closeDataActionMenu();
  }
});
elements.exportBackup.addEventListener("click", exportBackup);
elements.importBackup.addEventListener("click", () => elements.backupFileInput.click());
elements.backupFileInput.addEventListener("change", () => {
  const [file] = elements.backupFileInput.files;
  if (file) importBackupFile(file);
});
elements.exportCsv.addEventListener("click", exportCsv);
elements.importCsv.addEventListener("click", () => elements.csvFileInput.click());
elements.csvFileInput.addEventListener("change", () => {
  const [file] = elements.csvFileInput.files;
  if (file) importCsvFile(file);
});
elements.csvImportForm.addEventListener("submit", importCsvBookings);
elements.cancelCsvImport.addEventListener("click", closeCsvImportDialog);
elements.csvImportDialog.addEventListener("close", () => {
  if (!elements.csvImportDialog.open) {
    pendingCsvImport = null;
  }
});
elements.downloadReport.addEventListener("click", downloadPdfReport);

elements.analysisModeButtons.forEach((button) => {
  button.addEventListener("click", (event) => setAnalysisType(event.currentTarget.dataset.analysisType));
});
elements.analysisPrev.addEventListener("click", () => stepAnalysisType(-1));
elements.analysisNext.addEventListener("click", () => stepAnalysisType(1));
elements.analysisCarousel.addEventListener("touchstart", (event) => {
  analysisSwipeStartX = event.changedTouches[0]?.clientX ?? null;
});
elements.analysisCarousel.addEventListener("touchend", (event) => {
  if (analysisSwipeStartX === null) return;

  const endX = event.changedTouches[0]?.clientX ?? analysisSwipeStartX;
  const deltaX = endX - analysisSwipeStartX;
  analysisSwipeStartX = null;

  if (Math.abs(deltaX) < 36) return;
  stepAnalysisType(deltaX < 0 ? 1 : -1);
});

[elements.filters.from, elements.filters.to].forEach((filter) => {
  filter.addEventListener("input", render);
});

elements.detailTableBody.addEventListener("click", (event) => {
  const deleteButton = event.target.closest(".delete-button");
  if (!deleteButton) return;
  deleteBooking(deleteButton.dataset.id);
});

elements.mobileDetailBackdrop.addEventListener("click", closeMobileCategoryDetail);
elements.mobileDetailClose.addEventListener("click", closeMobileCategoryDetail);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !elements.dataActionMenu.classList.contains("hidden")) {
    closeDataActionMenu();
    elements.dataActionToggle.focus();
    return;
  }

  if (event.key === "Escape" && activeDetail && window.matchMedia("(max-width: 768px)").matches) {
    closeMobileCategoryDetail();
  }
});

document.addEventListener("click", (event) => {
  if (elements.dataActionMenu.classList.contains("hidden")) return;
  if (elements.dataActions.contains(event.target)) return;
  closeDataActionMenu();
});

function showStartupFallback(error) {
  console.error("App startup failed:", error);
  elements.appShell.classList.add("hidden");
  elements.authShell.classList.remove("hidden");
  elements.authShell.innerHTML = `
    <div class="auth-card">
      <p class="eyebrow">Finance Tracker</p>
      <h1>App konnte nicht geladen werden.</h1>
      <p class="auth-message error">Bitte Seite neu laden.</p>
    </div>
  `;
}

function handleGlobalStartupError(error) {
  const authIsEmpty = !elements.authShell.textContent.trim();
  const appIsHidden = elements.appShell.classList.contains("hidden");

  console.error("Unhandled app error:", error);

  if (authIsEmpty && appIsHidden) {
    showStartupFallback(error);
  }
}

async function initializeApp() {
  try {
    console.log(`Finance Tracker version: ${APP_VERSION}`);
    console.log("app: init start");
    setDateInputValue(elements.date, todayIsoDate());
    setDateInputValue(elements.filters.from, firstDayOfCurrentMonthIsoDate());
    setDateInputValue(elements.filters.to, todayIsoDate());
    updateCategoryControlForType();
    initDatePickers();
    saveCategories();
    render();

    authStatus = AUTH_STATES.INITIALIZING;
    authView = "loggedOut";
    renderAuthScreen();

    if (await initSupabase()) {
      await checkAuthSession();
    } else {
      console.log("auth: supabase init failed, login screen remains visible");
    }
  } catch (error) {
    showStartupFallback(error);
  }
}

window.addEventListener("error", (event) => {
  handleGlobalStartupError(event.error || event.message);
});

window.addEventListener("unhandledrejection", (event) => {
  handleGlobalStartupError(event.reason);
});

initializeApp();
