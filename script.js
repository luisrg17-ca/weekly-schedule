const STORAGE_KEY = "weeklyScheduleEntriesV1";

let entries = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
let currentMonday = getMonday(new Date());

const weekGrid = document.getElementById("weekGrid");
const weekLabel = document.getElementById("weekLabel");

const totalHours = document.getElementById("totalHours");
const totalShifts = document.getElementById("totalShifts");
const totalPersonal = document.getElementById("totalPersonal");

const agendaList = document.getElementById("agendaList");

const dialog = document.getElementById("entryDialog");
const form = document.getElementById("entryForm");

const modalTitle = document.getElementById("modalTitle");
const entryId = document.getElementById("entryId");
const entryType = document.getElementById("entryType");
const entryTitle = document.getElementById("entryTitle");
const entryDate = document.getElementById("entryDate");
const entryLocation = document.getElementById("entryLocation");
const startTime = document.getElementById("startTime");
const endTime = document.getElementById("endTime");
const notes = document.getElementById("notes");

const deleteBtn = document.getElementById("deleteBtn");


// ========================================
// WEEK NAVIGATION
// ========================================

document.getElementById("prevWeek").addEventListener("click", () => {
  currentMonday = addDays(currentMonday, -7);
  render();
});


document.getElementById("nextWeek").addEventListener("click", () => {
  currentMonday = addDays(currentMonday, 7);
  render();
});


document.getElementById("todayBtn").addEventListener("click", () => {
  currentMonday = getMonday(new Date());
  render();
});


// ========================================
// ADD EVENT
// ========================================

document.getElementById("addBtn").addEventListener("click", () => {
  openNewEntry();
});


// ========================================
// CLOSE MODAL
// ========================================

document.getElementById("closeBtn").addEventListener("click", () => {
  dialog.close();
});


document.getElementById("cancelBtn").addEventListener("click", () => {
  dialog.close();
});


// ========================================
// DELETE EVENT
// ========================================

deleteBtn.addEventListener("click", () => {

  if (!entryId.value) {
    return;
  }

  const confirmed = confirm(
    "Are you sure you want to delete this event?"
  );

  if (!confirmed) {
    return;
  }

  entries = entries.filter(
    item => item.id !== entryId.value
  );

  saveEntries();

  dialog.close();

  render();
});


// ========================================
// SAVE / EDIT EVENT
// ========================================

form.addEventListener("submit", event => {

  event.preventDefault();

  if (endTime.value <= startTime.value) {

    alert(
      "End time must be later than start time."
    );

    return;
  }

  const item = {

    id:
      entryId.value ||
      createId(),

    type:
      entryType.value,

    title:
      entryTitle.value.trim(),

    date:
      entryDate.value,

    start:
      startTime.value,

    end:
      endTime.value,

    location:
      entryLocation.value.trim(),

    notes:
      notes.value.trim()

  };


  const existingIndex =
    entries.findIndex(
      entry => entry.id === item.id
    );


  if (existingIndex >= 0) {

    entries[existingIndex] = item;

  } else {

    entries.push(item);

  }


  saveEntries();

  dialog.close();

  render();

});


// ========================================
// MAIN RENDER
// ========================================

function render() {

  renderWeek();

  renderStats();

  renderAgenda();

}


// ========================================
// WEEK VIEW
// ========================================

function renderWeek() {

  weekGrid.innerHTML = "";

  const weekEnd =
    addDays(currentMonday, 6);


  weekLabel.textContent =
    `${formatDate(
      currentMonday,
      {
        day: "numeric",
        month: "short"
      }
    )} – ${formatDate(
      weekEnd,
      {
        day: "numeric",
        month: "short",
        year: "numeric"
      }
    )}`;


  for (let i = 0; i < 7; i++) {

    const dayDate =
      addDays(currentMonday, i);

    const key =
      dateKey(dayDate);


    const day =
      document.createElement("div");


    day.className =
      "day" +
      (
        key === dateKey(new Date())
          ? " today"
          : ""
      );


    // DAY HEADER

    const dayHead =
      document.createElement("div");

    dayHead.className =
      "day-head";


    dayHead.innerHTML = `

      <span class="day-name">
        ${formatDate(
          dayDate,
          {
            weekday: "short"
          }
        )}
      </span>

      <span class="day-number">
        ${dayDate.getDate()}
      </span>

    `;


    day.appendChild(dayHead);


    // EVENTS FOR THIS DAY

    const dailyEntries =
      entries
        .filter(
          item =>
            item.date === key
        )
        .sort(
          (a, b) =>
            a.start.localeCompare(
              b.start
            )
        );


    if (dailyEntries.length === 0) {

      const empty =
        document.createElement("div");

      empty.className =
        "no-entry";

      empty.textContent =
        "No events";

      day.appendChild(empty);

    }


    dailyEntries.forEach(item => {

      const eventButton =
        document.createElement("button");


      eventButton.className =
        "entry" +
        (
          item.type === "personal"
            ? " personal"
            : ""
        );


      eventButton.innerHTML = `

        <span class="entry-time">
          ${formatTime(item.start)}
          –
          ${formatTime(item.end)}
        </span>

        <span class="entry-title">
          ${escapeHtml(item.title)}
        </span>

      `;


      eventButton.addEventListener(
        "click",
        () => openEditEntry(item)
      );


      day.appendChild(
        eventButton
      );

    });


    // DOUBLE CLICK EMPTY DAY

    day.addEventListener(
      "dblclick",
      event => {

        if (
          !event.target.closest(".entry")
        ) {

          openNewEntry(key);

        }

      }
    );


    weekGrid.appendChild(day);

  }

}


// ========================================
// WEEKLY TOTALS
// ========================================

function renderStats() {

  const weekStart =
    dateKey(currentMonday);

  const weekEnd =
    dateKey(
      addDays(
        currentMonday,
        6
      )
    );


  const weeklyEntries =
    entries.filter(
      item =>
        item.date >= weekStart &&
        item.date <= weekEnd
    );


  const workEntries =
    weeklyEntries.filter(
      item =>
        item.type === "work"
    );


  const personalEntries =
    weeklyEntries.filter(
      item =>
        item.type === "personal"
    );


  const hours =
    workEntries.reduce(
      (total, item) => {

        return (
          total +
          calculateHours(
            item.start,
            item.end
          )
        );

      },
      0
    );


  totalHours.textContent =
    `${formatHours(hours)} h`;


  totalShifts.textContent =
    workEntries.length;


  totalPersonal.textContent =
    personalEntries.length;

}


// ========================================
// UPCOMING AGENDA
// ========================================

function renderAgenda() {

  agendaList.innerHTML = "";


  const today =
    dateKey(new Date());


  const upcoming =
    [...entries]

      .filter(
        item =>
          item.date >= today
      )

      .sort(
        (a, b) => {

          const valueA =
            `${a.date}${a.start}`;

          const valueB =
            `${b.date}${b.start}`;

          return valueA.localeCompare(
            valueB
          );

        }
      )

      .slice(0, 10);


  if (upcoming.length === 0) {

    agendaList.innerHTML = `

      <div class="empty-agenda">

        You don't have any upcoming events.

      </div>

    `;

    return;

  }


  upcoming.forEach(item => {

    const row =
      document.createElement("div");


    row.className =
      "agenda-row";


    row.innerHTML = `

      <div class="agenda-date">

        ${prettyDate(item.date)}

      </div>


      <div class="agenda-main">

        <strong>
          ${escapeHtml(item.title)}
        </strong>

        <span>

          ${formatTime(item.start)}
          –
          ${formatTime(item.end)}

          ${
            item.location
              ? " · " +
                escapeHtml(
                  item.location
                )
              : ""
          }

        </span>

      </div>


      <span
        class="
          badge
          ${
            item.type === "personal"
              ? "personal"
              : ""
          }
        "
      >

        ${
          item.type === "work"
            ? "Work"
            : "Personal"
        }

      </span>

    `;


    row.addEventListener(
      "click",
      () => openEditEntry(item)
    );


    agendaList.appendChild(row);

  });

}


// ========================================
// CREATE NEW EVENT
// ========================================

function openNewEntry(
  selectedDate = null
) {

  form.reset();


  entryId.value = "";


  modalTitle.textContent =
    "New Event";


  deleteBtn.classList.add(
    "hidden"
  );


  entryType.value =
    "work";


  entryDate.value =
    selectedDate ||
    dateKey(new Date());


  startTime.value =
    "09:00";


  endTime.value =
    "17:00";


  dialog.showModal();

}


// ========================================
// EDIT EVENT
// ========================================

function openEditEntry(item) {

  modalTitle.textContent =
    "Edit Event";


  entryId.value =
    item.id;


  entryType.value =
    item.type;


  entryTitle.value =
    item.title;


  entryDate.value =
    item.date;


  entryLocation.value =
    item.location || "";


  startTime.value =
    item.start;


  endTime.value =
    item.end;


  notes.value =
    item.notes || "";


  deleteBtn.classList.remove(
    "hidden"
  );


  dialog.showModal();

}


// ========================================
// LOCAL STORAGE
// ========================================

function saveEntries() {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(entries)
  );

}


// ========================================
// TIME CALCULATIONS
// ========================================

function calculateHours(
  start,
  end
) {

  const [
    startHour,
    startMinute
  ] =
    start
      .split(":")
      .map(Number);


  const [
    endHour,
    endMinute
  ] =
    end
      .split(":")
      .map(Number);


  const startMinutes =
    startHour * 60 +
    startMinute;


  const endMinutes =
    endHour * 60 +
    endMinute;


  return (
    endMinutes -
    startMinutes
  ) / 60;

}


function formatHours(hours) {

  if (
    Number.isInteger(hours)
  ) {

    return hours;

  }


  return hours.toFixed(1);

}


// ========================================
// DATE HELPERS
// ========================================

function getMonday(date) {

  const current =
    new Date(date);


  current.setHours(
    12,
    0,
    0,
    0
  );


  const day =
    current.getDay();


  const difference =
    day === 0
      ? -6
      : 1 - day;


  current.setDate(
    current.getDate() +
    difference
  );


  return current;

}


function addDays(
  date,
  days
) {

  const newDate =
    new Date(date);


  newDate.setDate(
    newDate.getDate() +
    days
  );


  return newDate;

}


function dateKey(date) {

  const year =
    date.getFullYear();


  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );


  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );


  return (
    `${year}-${month}-${day}`
  );

}


// ========================================
// DATE DISPLAY
// ========================================

function formatDate(
  date,
  options
) {

  return new Intl.DateTimeFormat(
    "en-CA",
    options
  ).format(date);

}


function prettyDate(value) {

  const [
    year,
    month,
    day
  ] =
    value
      .split("-")
      .map(Number);


  const date =
    new Date(
      year,
      month - 1,
      day,
      12
    );


  return new Intl.DateTimeFormat(
    "en-CA",
    {
      weekday: "short",
      day: "numeric",
      month: "short"
    }
  ).format(date);

}


// ========================================
// TIME DISPLAY
// ========================================

function formatTime(value) {

  if (!value) {
    return "";
  }


  const [
    hour,
    minute
  ] =
    value
      .split(":")
      .map(Number);


  const date =
    new Date();


  date.setHours(
    hour,
    minute,
    0,
    0
  );


  return new Intl.DateTimeFormat(
    "en-CA",
    {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    }
  ).format(date);

}


// ========================================
// UNIQUE ID
// ========================================

function createId() {

  if (
    window.crypto &&
    crypto.randomUUID
  ) {

    return crypto.randomUUID();

  }


  return (
    Date.now().toString() +
    Math.random()
      .toString(16)
      .slice(2)
  );

}


// ========================================
// SECURITY
// ========================================

function escapeHtml(text) {

  return String(text)

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );

}


// ========================================
// START APP
// ========================================

render();
