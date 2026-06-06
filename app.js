const STORAGE_KEY = "finance-tracker-mvp-bookings";
const CATEGORY_STORAGE_KEY = "finance-tracker-mvp-categories";
const defaultCategories = ["Auto", "Essen", "Kleidung", "Gehalt", "Wohnung", "Freizeit", "Business", "Sonstiges"];

const currencyFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

const elements = {
  tabs: document.querySelectorAll(".tab-button"),
  panels: {
    entry: document.querySelector("#entry-panel"),
    dashboard: document.querySelector("#dashboard-panel"),
  },
  form: document.querySelector("#booking-form"),
  amount: document.querySelector("#amount"),
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
  message: document.querySelector("#form-message"),
  todayPreview: document.querySelector("#today-preview"),
  entryCount: document.querySelector("#entry-count"),
  filters: {
    from: document.querySelector("#filter-from"),
    to: document.querySelector("#filter-to"),
  },
  totalIncome: document.querySelector("#total-income"),
  totalExpenses: document.querySelector("#total-expenses"),
  totalBalance: document.querySelector("#total-balance"),
  expenseDonut: document.querySelector("#expense-donut"),
  expenseLegend: document.querySelector("#expense-legend"),
  expenseEmptyState: document.querySelector("#expense-empty-state"),
  detailSubtitle: document.querySelector("#expense-detail-subtitle"),
  detailPlaceholder: document.querySelector("#expense-detail-placeholder"),
  detailContent: document.querySelector("#expense-detail-content"),
  detailTotal: document.querySelector("#detail-total"),
  detailCount: document.querySelector("#detail-count"),
  detailTableBody: document.querySelector("#detail-bookings-table"),
};

let bookings = loadBookings();
let categories = loadCategories();
let activeDatePicker = null;
let activeDetail = null;
const chartColors = ["#7f8f8b", "#b9a77d", "#9ba8bf", "#d0a19a", "#8faf9b", "#c3b5cf", "#a9a094", "#94abb1"];

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

function loadCategories() {
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
  populateSelect(elements.category, categories, { value: "", label: "Kategorie wählen" });

  if (selectedCategory) {
    elements.category.value = selectedCategory;
  }
}

function getSelectedType() {
  return new FormData(elements.form).get("type");
}

function signedAmount(amount, type) {
  const absoluteAmount = Math.abs(Number(amount));
  return type === "expense" ? -absoluteAmount : absoluteAmount;
}

function displayType(type) {
  return type === "income" ? "Einnahme" : "Ausgabe";
}

function formatDate(dateValue) {
  return formatDateForDisplay(dateValue);
}

function formatCurrency(value) {
  return currencyFormatter.format(value);
}

function formatSignedCurrency(value) {
  if (value > 0) return `+${formatCurrency(value)}`;
  return formatCurrency(value);
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
  elements.amount.focus();
}

function validateBooking(amount, category, date, visibleDate = "") {
  if (!amount || Number(amount) <= 0) {
    return "Bitte gib einen gültigen Betrag ein.";
  }

  if (!category || !categories.includes(category)) {
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

function handleCategorySubmit(event) {
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

  categories.push(categoryName);
  categories.sort((first, second) => first.localeCompare(second, "de"));
  saveCategories();
  renderCategoryOptions(categoryName);
  closeCategoryDialog();
  setMessage("Kategorie hinzugefügt.");
  render();
}

function handleSubmit(event) {
  event.preventDefault();

  const type = getSelectedType();
  const amount = elements.amount.value;
  const category = elements.category.value;
  const description = elements.description.value.trim();
  const visibleDate = elements.date.value;
  const date = formatDateForStorage(elements.date.value);
  const validationError = validateBooking(amount, category, date, visibleDate);

  if (validationError) {
    setMessage(validationError, true);
    return;
  }

  bookings.unshift({
    id: crypto.randomUUID(),
    amount: signedAmount(amount, type),
    type,
    category,
    description,
    date,
    createdAt: new Date().toISOString(),
  });

  saveBookings();
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
  return filteredBookings.reduce(
    (totals, booking) => {
      if (booking.amount >= 0) {
        totals.income += booking.amount;
      } else {
        totals.expenses += Math.abs(booking.amount);
      }

      totals.balance += booking.amount;
      return totals;
    },
    { income: 0, expenses: 0, balance: 0 }
  );
}

function renderMetrics(filteredBookings) {
  const totals = calculateTotals(filteredBookings);
  elements.totalIncome.textContent = formatCurrency(totals.income);
  elements.totalExpenses.textContent = formatCurrency(totals.expenses);
  elements.totalBalance.textContent = formatCurrency(totals.balance);
  elements.totalBalance.className = totals.balance < 0 ? "amount-expense" : "amount-income";
}

function createBookingTableRows(tableBody, visibleBookings, options = {}) {
  tableBody.innerHTML = "";

  visibleBookings.forEach((booking) => {
    const row = document.createElement("tr");
    const amountClass = booking.amount < 0 ? "amount-expense" : "amount-income";
    const dateCell = document.createElement("td");
    const descriptionCell = document.createElement("td");
    const amountCell = document.createElement("td");
    const actionCell = document.createElement("td");
    const deleteButton = document.createElement("button");

    dateCell.textContent = formatDate(booking.date);
    descriptionCell.textContent = booking.description || "-";
    amountCell.className = `align-right ${amountClass}`;
    amountCell.textContent = formatCurrency(booking.amount);
    deleteButton.className = "delete-button";
    deleteButton.type = "button";
    deleteButton.dataset.id = booking.id;
    deleteButton.dataset.source = options.source || "";
    deleteButton.textContent = "Löschen";
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
  const totalsByCategory = new Map();

  filteredBookings
    .filter((booking) => booking.type === type)
    .forEach((booking) => {
      const amount = type === "expense" ? Math.abs(booking.amount) : booking.amount;
      totalsByCategory.set(booking.category, (totalsByCategory.get(booking.category) || 0) + amount);
    });

  return [...totalsByCategory.entries()]
    .map(([category, total], index) => ({
      category,
      total,
      color: chartColors[index % chartColors.length],
    }))
    .filter((item) => item.total > 0)
    .sort((first, second) => second.total - first.total);
}

function renderDonutChart({ container, legend, emptyState, data, type, emptyText }) {
  container.innerHTML = "";
  legend.innerHTML = "";
  emptyState.textContent = emptyText;

  const total = data.reduce((sum, item) => sum + item.total, 0);
  const hasData = total > 0;

  emptyState.classList.toggle("visible", !hasData);
  container.classList.toggle("hidden", !hasData);
  legend.classList.toggle("hidden", !hasData);

  if (!hasData) return;

  const svgNamespace = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNamespace, "svg");
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  svg.setAttribute("viewBox", "0 0 180 180");
  svg.setAttribute("class", "donut-svg");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "Ausgaben nach Kategorie");

  const backgroundCircle = document.createElementNS(svgNamespace, "circle");
  backgroundCircle.setAttribute("cx", "90");
  backgroundCircle.setAttribute("cy", "90");
  backgroundCircle.setAttribute("r", String(radius));
  backgroundCircle.setAttribute("class", "donut-background");
  svg.append(backgroundCircle);

  data.forEach((item) => {
    const segmentLength = (item.total / total) * circumference;
    const segment = document.createElementNS(svgNamespace, "circle");

    segment.setAttribute("cx", "90");
    segment.setAttribute("cy", "90");
    segment.setAttribute("r", String(radius));
    segment.setAttribute("class", "donut-segment");
    segment.setAttribute("stroke", item.color);
    segment.setAttribute("stroke-dasharray", `${segmentLength} ${circumference - segmentLength}`);
    segment.setAttribute("stroke-dashoffset", String(-offset));
    segment.setAttribute("transform", "rotate(-90 90 90)");
    segment.setAttribute("tabindex", "0");
    segment.setAttribute("role", "button");
    segment.setAttribute("aria-label", `${item.category}: ${formatCurrency(item.total)}`);
    segment.addEventListener("click", () => openCategoryDetail(type, item.category));
    segment.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openCategoryDetail(type, item.category);
      }
    });

    svg.append(segment);
    offset += segmentLength;
  });

  const center = document.createElement("div");
  const centerLabel = document.createElement("span");
  const centerValue = document.createElement("strong");
  center.className = "donut-center";
  centerLabel.textContent = "Summe";
  centerValue.textContent = formatCurrency(total);
  center.append(centerLabel, centerValue);

  container.append(svg, center);

  data.forEach((item) => {
    const legendButton = document.createElement("button");
    const swatch = document.createElement("span");
    const label = document.createElement("span");
    const value = document.createElement("span");

    legendButton.className = "donut-legend-item";
    legendButton.type = "button";
    legendButton.addEventListener("click", () => openCategoryDetail(type, item.category));
    swatch.className = "legend-swatch";
    swatch.style.background = item.color;
    label.className = "legend-label";
    label.textContent = item.category;
    value.className = "legend-value";
    value.textContent = formatCurrency(item.total);
    legendButton.append(swatch, label, value);
    legend.append(legendButton);
  });
}

function renderExpenseAnalysis(filteredBookings) {
  const expenseBreakdown = getCategoryBreakdown(filteredBookings, "expense");

  renderDonutChart({
    container: elements.expenseDonut,
    legend: elements.expenseLegend,
    emptyState: elements.expenseEmptyState,
    data: expenseBreakdown,
    type: "expense",
    emptyText: "Keine Ausgaben im gewählten Zeitraum.",
  });

  if (activeDetail && !expenseBreakdown.some((item) => item.category === activeDetail.category)) {
    activeDetail = null;
  }

  renderCategoryDetail();
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
  return getFilteredBookings()
    .filter((booking) => booking.type === type && booking.category === category)
    .sort((first, second) => second.date.localeCompare(first.date));
}

function renderCategoryDetail() {
  if (!activeDetail) {
    elements.detailSubtitle.textContent = "Wähle eine Kategorie im Diagramm aus, um die einzelnen Buchungen zu sehen.";
    elements.detailPlaceholder.classList.remove("hidden");
    elements.detailContent.classList.add("hidden");
    elements.detailTableBody.innerHTML = "";
    return;
  }

  const { category } = activeDetail;
  const detailBookings = getDetailBookings("expense", category);
  const total = detailBookings.reduce((sum, booking) => sum + Math.abs(booking.amount), 0);

  elements.detailSubtitle.textContent = `Ausgaben · ${category} · ${getVisibleDateRangeLabel()}`;
  elements.detailPlaceholder.classList.add("hidden");
  elements.detailContent.classList.remove("hidden");
  elements.detailTotal.textContent = formatCurrency(-total);
  elements.detailTotal.className = "amount-expense";
  elements.detailCount.textContent = String(detailBookings.length);
  createBookingTableRows(elements.detailTableBody, detailBookings, { source: "detail", compact: true });
}

function openCategoryDetail(type, category) {
  if (type !== "expense") return;
  activeDetail = { type: "expense", category };
  renderCategoryDetail();
}

function renderEntryPreview() {
  const todaysBookings = getTodaysBookings();
  const todayTotal = todaysBookings.reduce((sum, booking) => sum + booking.amount, 0);
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
  renderExpenseAnalysis(filteredBookings);
  renderEntryPreview();
}

function deleteBooking(id) {
  bookings = bookings.filter((booking) => booking.id !== id);
  saveBookings();
  render();
}

function switchTab(tabName) {
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

elements.form.addEventListener("submit", handleSubmit);
elements.openCategoryDialog.addEventListener("click", openCategoryDialog);
elements.categoryForm.addEventListener("submit", handleCategorySubmit);
elements.cancelCategory.addEventListener("click", closeCategoryDialog);

[elements.filters.from, elements.filters.to].forEach((filter) => {
  filter.addEventListener("input", render);
});

elements.detailTableBody.addEventListener("click", (event) => {
  const deleteButton = event.target.closest(".delete-button");
  if (!deleteButton) return;
  deleteBooking(deleteButton.dataset.id);
});

setDateInputValue(elements.date, todayIsoDate());
setDateInputValue(elements.filters.from, firstDayOfCurrentMonthIsoDate());
setDateInputValue(elements.filters.to, todayIsoDate());
initDatePickers();
saveCategories();
render();
