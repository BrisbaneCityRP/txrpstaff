const sessions = ["Session 1", "Session 2", "Session 3", "Session 4", "Session 5", "Session 6", "Session 7"];
const authSalt = "txrp-portal-v1";
const ownerAccount = { id: "owner-wildhog", role: "owner", username: "Wildhog1lgt", passwordHash: "be4f4f57b574e72f8ca8015f84ec9afb1bc8d8f31fc9519ec0c8d68d7b7ecf55" };

const defaultState = {
  accounts: [ownerAccount],
  messages: [],
  applications: [],
  banAppeals: [],
  requests: [],
  roster: sessions.map((name) => ({
    name,
    closed: false,
    staff: [],
    supervisors: [],
    active: false,
    statuses: {}
  }))
};

let state = loadState();
let currentUser = null;
let applicationStep = 0;
let applicationDeadline = 0;
let applicationInterval = null;
const questionLabels = {
  age: "How old are you",
  roblox: "Whats your Roblox username",
  discord: "Whats your discord username",
  spag: "How would you personally rate your SPaG",
  professional: "How good are you at being professional",
  active: "How Active are you?",
  attitude: "Rate your attitude",
  frp: "What is FRP? Give an example",
  rdm: "What is RDM? Give an Example",
  vdm: "What is VDM? Give an Example",
  nlr: "What is NLR? Give an Example",
  ta: "What is TA? Give an Example",
  ltap: "What is LTAP? Give an example",
  rtap: "What is RTAP? Give an Example",
  gtad: "What is GTAD? Give an example",
  scenario1: "You witness an off-duty mod use commands. What do you do?",
  scenario2: "You get RDM'ed while on duty. What do you do?",
  scenario3: "People are accusing you of incorrectly punishing them what do you do?",
  scenario4: "You see heaps of people breaking rules while your off duty what do you do?",
  scenario5: "You see a HR abusing their commands what do you do?",
  scenario6: "You respond to a call, and everyone is dead around you what do you do?",
  scenario7: "Someone is Impersonating Staff what do you do?",
  statement: "Personal Statement",
  experience: "Experience",
  extra: "Anything we should know."
};

const els = {
  pages: document.querySelectorAll(".page"),
  navButtons: document.querySelectorAll(".nav-link"),
  tabButtons: document.querySelectorAll("[data-tab]"),
  loginForm: document.querySelector("#loginForm"),
  loginRole: document.querySelector("#loginRole"),
  loginUsername: document.querySelector("#loginUsername"),
  loginPassword: document.querySelector("#loginPassword"),
  loginStatus: document.querySelector("#loginStatus"),
  portal: document.querySelector("#portal"),
  portalTitle: document.querySelector("#portalTitle"),
  logoutButton: document.querySelector("#logoutButton"),
  ownerTools: document.querySelector("#ownerTools"),
  managementTools: document.querySelector("#managementTools"),
  staffTools: document.querySelector("#staffTools"),
  createAccountForm: document.querySelector("#createAccountForm"),
  deleteAccountForm: document.querySelector("#deleteAccountForm"),
  deleteAccountId: document.querySelector("#deleteAccountId"),
  newAccountRole: document.querySelector("#newAccountRole"),
  newAccountUsername: document.querySelector("#newAccountUsername"),
  newAccountPassword: document.querySelector("#newAccountPassword"),
  rosterEditor: document.querySelector("#rosterEditor"),
  saveRosterButton: document.querySelector("#saveRosterButton"),
  resetRosterButton: document.querySelector("#resetRosterButton"),
  rosterView: document.querySelector("#rosterView"),
  messageForm: document.querySelector("#messageForm"),
  messageRecipient: document.querySelector("#messageRecipient"),
  messageBody: document.querySelector("#messageBody"),
  inboxList: document.querySelector("#inboxList"),
  requestsPanel: document.querySelector("#requestsPanel"),
  requestsList: document.querySelector("#requestsList"),
  reviewPanel: document.querySelector("#reviewPanel"),
  reviewList: document.querySelector("#reviewList"),
  unavailableButton: document.querySelector("#unavailableButton"),
  startSessionButton: document.querySelector("#startSessionButton"),
  signInButton: document.querySelector("#signInButton"),
  signOutButton: document.querySelector("#signOutButton"),
  endSessionButton: document.querySelector("#endSessionButton"),
  overtimeForm: document.querySelector("#overtimeForm"),
  overtimeReason: document.querySelector("#overtimeReason"),
  overtimeIn: document.querySelector("#overtimeIn"),
  overtimeOut: document.querySelector("#overtimeOut"),
  openApplicationButton: document.querySelector("#openApplicationButton"),
  startApplicationButton: document.querySelector("#startApplicationButton"),
  applicationLanding: document.querySelector("#applicationLanding"),
  applicationIntro: document.querySelector("#applicationIntro"),
  applicationExpired: document.querySelector("#applicationExpired"),
  applicationFormWrap: document.querySelector("#applicationFormWrap"),
  applicationForm: document.querySelector("#applicationForm"),
  applicationTimer: document.querySelector("#applicationTimer"),
  prevApplicationStep: document.querySelector("#prevApplicationStep"),
  nextApplicationStep: document.querySelector("#nextApplicationStep"),
  submitApplicationButton: document.querySelector("#submitApplicationButton")
  ,
  startAppealButton: document.querySelector("#startAppealButton"),
  banAppealStart: document.querySelector("#banAppealStart"),
  banAppealForm: document.querySelector("#banAppealForm"),
  banEvidence: document.querySelector("#banEvidence"),
  banEvidencePick: document.querySelector("#banEvidencePick"),
  banEvidenceNames: document.querySelector("#banEvidenceNames")
};

seedSelectOptions();
bindEvents();
renderPortal();

function bindEvents() {
  els.tabButtons.forEach((button) => {
    button.addEventListener("click", () => showTab(button.dataset.tab));
  });

  els.loginForm.addEventListener("submit", handleLogin);
  els.logoutButton.addEventListener("click", logout);
  els.createAccountForm.addEventListener("submit", createAccount);
  els.deleteAccountForm.addEventListener("submit", deleteAccount);
  els.saveRosterButton.addEventListener("click", saveRosterFromEditor);
  els.resetRosterButton.addEventListener("click", resetRoster);
  els.messageForm.addEventListener("submit", sendMessage);
  els.unavailableButton.addEventListener("click", markUnavailable);
  els.startSessionButton.addEventListener("click", startSession);
  els.signInButton.addEventListener("click", signInShift);
  els.signOutButton.addEventListener("click", signOutShift);
  els.endSessionButton.addEventListener("click", endSession);
  els.overtimeForm.addEventListener("submit", submitOvertime);
  els.openApplicationButton.addEventListener("click", () => swapApplicationPanel("intro"));
  els.startApplicationButton.addEventListener("click", startApplication);
  els.prevApplicationStep.addEventListener("click", () => moveApplicationStep(-1));
  els.nextApplicationStep.addEventListener("click", () => moveApplicationStep(1));
  els.applicationForm.addEventListener("submit", submitApplication);
  els.startAppealButton.addEventListener("click", startAppeal);
  els.banEvidencePick.addEventListener("click", () => els.banEvidence.click());
  els.banEvidence.addEventListener("change", updateAppealFileNames);
  els.banAppealForm.addEventListener("submit", submitBanAppeal);
}

function showTab(tabName) {
  els.pages.forEach((page) => page.classList.toggle("active", page.id === tabName));
  els.navButtons.forEach((button) => button.classList.toggle("active", button.dataset.tab === tabName));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function handleLogin(event) {
  event.preventDefault();
  const role = els.loginRole.value;
  const username = els.loginUsername.value.trim();
  const password = els.loginPassword.value;
  const attemptedHash = await hashPassword(role, username, password);
  const account = state.accounts.find((item) =>
    item.role === role &&
    item.username.toLowerCase() === username.toLowerCase() &&
    (item.passwordHash === attemptedHash || item.password === password)
  );

  if (!account) {
    els.loginStatus.textContent = "Invalid login details.";
    return;
  }

  currentUser = account;
  els.loginStatus.textContent = "";
  els.loginForm.reset();
  renderPortal();
  els.portal.scrollIntoView({ behavior: "smooth", block: "start" });
}

function logout() {
  currentUser = null;
  renderPortal();
}

function renderPortal() {
  if (!currentUser) {
    els.portal.classList.add("hidden");
    return;
  }

  els.portal.classList.remove("hidden");
  els.portalTitle.textContent = `${titleCase(currentUser.role)} Portal - ${currentUser.username}`;
  els.ownerTools.classList.toggle("hidden", currentUser.role !== "owner");
  els.managementTools.classList.toggle("hidden", currentUser.role !== "management" && currentUser.role !== "owner");
  els.staffTools.classList.toggle("hidden", currentUser.role !== "staff");
  const canReview = currentUser.role === "owner" || currentUser.role === "management";
  const isStaff = currentUser.role === "staff";
  els.requestsPanel.classList.toggle("hidden", !canReview);
  els.reviewPanel.classList.toggle("hidden", !canReview);

  renderRecipients();
  renderRosterEditor();
  renderRosterView();
  renderInbox();
  renderRequests();
  renderReviews();
  updateShiftButtons();
  renderDeleteAccountOptions();
}

async function createAccount(event) {
  event.preventDefault();
  const role = els.newAccountRole.value;
  const username = els.newAccountUsername.value.trim();
  const password = els.newAccountPassword.value.trim();
  if (!username || !password) return;

  const existing = state.accounts.find((account) => account.username.toLowerCase() === username.toLowerCase());
  if (existing) {
    alert("That username already exists.");
    return;
  }

  const passwordHash = await hashPassword(role, username, password);
  state.accounts.push({ id: makeId(), role, username, passwordHash });
  saveState();
  els.createAccountForm.reset();
  alert("Login created");
  renderPortal();
}

function deleteAccount(event) {
  event.preventDefault();
  const targetId = els.deleteAccountId.value;
  if (!targetId) return;
  if (targetId === ownerAccount.id) return alert("Primary owner account cannot be deleted.");
  state.accounts = state.accounts.filter((account) => account.id !== targetId);
  state.roster.forEach((session) => {
    session.staff = session.staff.filter((id) => id !== targetId);
    session.supervisors = session.supervisors.filter((id) => id !== targetId);
    delete session.statuses[targetId];
  });
  state.messages = state.messages.filter((msg) => msg.from !== targetId && msg.to !== targetId);
  saveState();
  renderPortal();
}

function renderDeleteAccountOptions() {
  if (!els.deleteAccountId) return;
  const options = state.accounts
    .filter((account) => account.id !== currentUser.id)
    .map((account) => `<option value="${account.id}">${escapeHtml(account.username)} (${titleCase(account.role)})</option>`)
    .join("");
  els.deleteAccountId.innerHTML = options || `<option value="">No deletable accounts</option>`;
}

function renderRosterEditor() {
  if (!currentUser || (currentUser.role !== "management" && currentUser.role !== "owner")) return;
  const assignable = state.accounts.filter((account) => ["owner", "management", "staff"].includes(account.role));

  els.rosterEditor.innerHTML = state.roster.map((session, index) => `
    <article class="session-card ${session.closed ? "closed" : ""}">
      <h4>${session.name}</h4>
      <label class="closed-inline"><span>Closed</span><input type="checkbox" data-roster-closed="${index}" ${session.closed ? "checked" : ""}></label>
      <label>
        Select staff to be rostered on
        <details class="check-menu">
          <summary>${session.staff.length ? `${session.staff.length} selected` : "Select staff"}</summary>
          <div class="check-list">
            ${assignable.map((account) => checkboxFor(`staff-${index}`, account, session.staff.includes(account.id))).join("")}
          </div>
        </details>
      </label>
      <label>
        Select a supervisor to be rosetered on
        <details class="check-menu">
          <summary>${session.supervisors.length ? `${session.supervisors.length} selected` : "Select supervisors"}</summary>
          <div class="check-list">
            ${assignable.map((account) => checkboxFor(`sup-${index}`, account, session.supervisors.includes(account.id))).join("")}
          </div>
        </details>
      </label>
      <button class="button primary" type="button" data-session-update="${index}">Update</button>
    </article>
  `).join("");

  document.querySelectorAll("[data-session-update]").forEach((button) => {
    button.addEventListener("click", () => updateSingleSession(Number(button.dataset.sessionUpdate)));
  });
}

function saveRosterFromEditor() {
  state.roster = state.roster.map((session, index) => {
    const staffChecks = document.querySelectorAll(`[data-roster-staff-check="${index}"]:checked`);
    const supervisorsChecks = document.querySelectorAll(`[data-roster-supervisor-check="${index}"]:checked`);
    const closedInput = document.querySelector(`[data-roster-closed="${index}"]`);
    return {
      ...session,
      closed: closedInput.checked,
      staff: [...staffChecks].map((el) => el.value).slice(0, 5),
      supervisors: [...supervisorsChecks].map((el) => el.value).slice(0, 3)
    };
  });
  saveState();
  renderPortal();
}

function updateSingleSession(index) {
  const session = state.roster[index];
  if (!session) return;
  const staffChecks = document.querySelectorAll(`[data-roster-staff-check="${index}"]:checked`);
  const supervisorsChecks = document.querySelectorAll(`[data-roster-supervisor-check="${index}"]:checked`);
  const closedInput = document.querySelector(`[data-roster-closed="${index}"]`);
  session.closed = closedInput.checked;
  session.staff = [...staffChecks].map((el) => el.value).slice(0, 5);
  session.supervisors = [...supervisorsChecks].map((el) => el.value).slice(0, 3);
  saveState();
  renderPortal();
}

function resetRoster() {
  state.roster = sessions.map((name) => ({
    name,
    closed: false,
    staff: [],
    supervisors: [],
    active: false,
    statuses: {}
  }));
  saveState();
  renderPortal();
}

function renderRosterView() {
  els.rosterView.innerHTML = state.roster.map((session) => {
    if (session.closed) {
      return `<article class="session-card closed"><h4>${session.name}</h4><p>Closed</p></article>`;
    }

    const staff = session.staff.map((id) => personPill(id, session.statuses[id])).join("") || "<p class=\"form-note\">No staff assigned.</p>";
    const supervisors = session.supervisors.map((id) => personPill(id, session.statuses[id], true)).join("") || "<p class=\"form-note\">No supervisors assigned.</p>";
    return `
      <article class="session-card">
        <h4>${session.name}${session.active ? " - Active" : ""}</h4>
        <strong>Staff</strong>
        <div class="assignment-list">${staff}</div>
        <strong>Supervisors</strong>
        <div class="assignment-list">${supervisors}</div>
      </article>
    `;
  }).join("");
}

function renderRecipients() {
  const canBroadcast = currentUser.role === "owner" || currentUser.role === "management";
  const options = [];
  if (canBroadcast) {
    options.push(`<option value="all-staff">All Staff</option>`);
    options.push(`<option value="all-management">All Management</option>`);
  }
  state.accounts
    .filter((account) => account.id !== currentUser.id)
    .forEach((account) => options.push(`<option value="${account.id}">${account.username} (${titleCase(account.role)})</option>`));
  els.messageRecipient.innerHTML = options.join("");
}

function sendMessage(event) {
  event.preventDefault();
  const recipient = els.messageRecipient.value;
  const body = els.messageBody.value.trim();
  if (!body) return;

  const recipients = expandRecipients(recipient);
  recipients.forEach((to) => {
    state.messages.push({
      id: makeId(),
      from: currentUser.id,
      to,
      body,
      createdAt: new Date().toLocaleString()
    });
  });
  saveState();
  els.messageForm.reset();
  renderPortal();
}

function renderInbox() {
  const visibleMessages = state.messages.filter((message) => message.to === currentUser.id || message.from === currentUser.id);
  els.inboxList.innerHTML = visibleMessages.length
    ? visibleMessages.slice().reverse().map((message) => `
      <article class="list-item">
        <h4>${accountName(message.from)} to ${accountName(message.to)}</h4>
        <p>${escapeHtml(message.body)}</p>
        <p class="form-note">${message.createdAt}</p>
      </article>
    `).join("")
    : `<p class="form-note">No messages yet.</p>`;
}

function renderRequests() {
  if (currentUser.role === "staff") return;
  const items = state.requests.slice().reverse();
  els.requestsList.innerHTML = items.length
    ? items.map((request) => `
      <article class="list-item">
        <h4>${escapeHtml(request.type)} - ${accountName(request.from)}</h4>
        <p>${escapeHtml(request.body)}</p>
        <p class="form-note">${request.createdAt}</p>
      </article>
    `).join("")
    : `<p class="form-note">No shift changes, overtime logs, or staff requests yet.</p>`;
}

function renderReviews() {
  if (currentUser.role === "staff") return;
  const applications = state.applications.slice().reverse().map((application) => `
    <article class="list-item">
      <h4>Staff Application - ${escapeHtml(application.answers.roblox || "Unknown")}</h4>
      <p><strong>Status:</strong> ${escapeHtml(application.status)}</p>
      <p><strong>Discord:</strong> ${escapeHtml(application.answers.discord || "Unknown")}</p>
      <p><strong>Age:</strong> ${escapeHtml(application.answers.age || "Unknown")}</p>
      <details>
        <summary>View full application</summary>
        ${Object.entries(questionLabels).map(([key, label]) => `<p><strong>${escapeHtml(label)}:</strong> ${escapeHtml(application.answers[key] || "No answer provided.")}</p>`).join("")}
      </details>
      <div class="review-actions">
        <button class="button primary" type="button" data-application-action="accepted" data-application-id="${application.id}">Accept</button>
        <button class="button secondary" type="button" data-application-action="declined" data-application-id="${application.id}">Decline</button>
      </div>
    </article>
  `);
  const appeals = state.banAppeals.map((appeal) => `<article class="list-item"><h4>Ban Appeal</h4><p>${escapeHtml(appeal.body)}</p></article>`);
  els.reviewList.innerHTML = applications.length || appeals.length
    ? [...applications, ...appeals].join("")
    : `<p class="form-note">No applications or ban appeals yet.</p>`;

  document.querySelectorAll("[data-application-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      const applicationIndex = state.applications.findIndex((item) => item.id === button.dataset.applicationId);
      const application = state.applications[applicationIndex];
      if (!application) return;
      const action = button.dataset.applicationAction;
      application.status = action;
      if (action === "declined") {
        state.applications.splice(applicationIndex, 1);
      }
      if (button.dataset.applicationAction === "accepted") {
        alert("You have accepted this users application. Please Role this user inside the server.");
        state.applications.splice(applicationIndex, 1);
        window.open("https://discord.gg/mEXZPnjm5D", "_blank", "noopener");
      }
      saveState();
      renderPortal();
      els.reviewPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function markUnavailable() {
  const session = findMySession();
  state.requests.push({
    id: makeId(),
    type: "Shift Change Request",
    from: currentUser.id,
    body: `${currentUser.username} marked unavailable for ${session ? session.name : "their shift"}.`,
    createdAt: new Date().toLocaleString()
  });
  saveState();
  renderPortal();
}

function startSession() {
  const session = findMySession();
  if (!session) return alert("You are not assigned to a session.");
  session.active = true;
  [...session.staff, ...session.supervisors].forEach((id) => {
    session.statuses[id] = "red";
  });
  saveState();
  renderPortal();
}

function signInShift() {
  const session = findMySession();
  if (!session) return alert("You are not assigned to a session.");
  session.statuses[currentUser.id] = "green";
  saveState();
  renderPortal();
}

function signOutShift() {
  const session = findMySession();
  if (!session) return;
  session.statuses[currentUser.id] = "yellow";
  saveState();
  renderPortal();
}

function endSession() {
  const session = findMySession();
  if (!session) return;
  [...session.staff, ...session.supervisors].forEach((id) => {
    if (session.statuses[id] !== "green") {
      session.statuses[id] = "red";
      state.messages.push({
        id: makeId(),
        from: currentUser.id,
        to: id,
        body: `You missed ${session.name}. Please contact management if this is incorrect.`,
        createdAt: new Date().toLocaleString()
      });
    }
  });
  session.active = false;
  saveState();
  renderPortal();
}

function submitOvertime(event) {
  event.preventDefault();
  state.requests.push({
    id: makeId(),
    type: "Overtime Log",
    from: currentUser.id,
    body: `Reason: ${els.overtimeReason.value}. Time in: ${els.overtimeIn.value}. Time out: ${els.overtimeOut.value}.`,
    createdAt: new Date().toLocaleString()
  });
  saveState();
  els.overtimeForm.reset();
  renderPortal();
}

function updateShiftButtons() {
  if (!currentUser || currentUser.role !== "staff") return;
  const session = findMySession();
  const status = session?.statuses[currentUser.id];
  els.signInButton.classList.toggle("hidden", status === "green");
  els.signOutButton.classList.toggle("hidden", status !== "green");
}

function swapApplicationPanel(panel) {
  els.applicationLanding.classList.toggle("hidden", panel !== "landing");
  els.applicationIntro.classList.toggle("hidden", panel !== "intro");
  els.applicationExpired.classList.toggle("hidden", panel !== "expired");
  els.applicationFormWrap.classList.toggle("hidden", panel !== "form");
}

function startApplication() {
  applicationStep = 0;
  applicationDeadline = Date.now() + 60 * 60 * 1000;
  els.applicationForm.reset();
  renderApplicationStep();
  swapApplicationPanel("form");
  clearInterval(applicationInterval);
  applicationInterval = setInterval(updateApplicationTimer, 1000);
  updateApplicationTimer();
}

function updateApplicationTimer() {
  const remaining = Math.max(0, applicationDeadline - Date.now());
  const minutes = String(Math.floor(remaining / 60000)).padStart(2, "0");
  const seconds = String(Math.floor((remaining % 60000) / 1000)).padStart(2, "0");
  els.applicationTimer.textContent = `${minutes}:${seconds}`;
  if (remaining <= 0) {
    clearInterval(applicationInterval);
    swapApplicationPanel("expired");
  }
}

function moveApplicationStep(direction) {
  if (direction > 0 && !validateCurrentStep()) return;
  applicationStep = Math.max(0, Math.min(4, applicationStep + direction));
  renderApplicationStep();
}

function renderApplicationStep() {
  document.querySelectorAll(".application-step").forEach((step) => {
    step.classList.toggle("active", Number(step.dataset.step) === applicationStep);
  });
  els.prevApplicationStep.classList.toggle("hidden", applicationStep === 0);
  els.nextApplicationStep.classList.toggle("hidden", applicationStep === 4);
  els.submitApplicationButton.classList.toggle("hidden", applicationStep !== 4);
}

function validateCurrentStep() {
  const fields = document.querySelectorAll(`.application-step[data-step="${applicationStep}"] input, .application-step[data-step="${applicationStep}"] select, .application-step[data-step="${applicationStep}"] textarea`);
  return [...fields].every((field) => field.reportValidity());
}

function submitApplication(event) {
  event.preventDefault();
  if (Date.now() > applicationDeadline) {
    swapApplicationPanel("expired");
    return;
  }
  if (!validateCurrentStep()) return;
  const data = new FormData(els.applicationForm);
  const answers = {};
  data.forEach((value, key) => {
    answers[key] = value;
  });
  state.applications.push({
    id: makeId(),
    status: "pending",
    answers,
    createdAt: new Date().toLocaleString()
  });
  saveState();
  clearInterval(applicationInterval);
  swapApplicationPanel("landing");
  alert("Application submitted.");
  renderPortal();
}

function submitBanAppeal(event) {
  event.preventDefault();
  const data = new FormData(els.banAppealForm);
  const evidenceInput = document.querySelector("#banEvidence");
  const evidenceFiles = evidenceInput?.files ? [...evidenceInput.files].map((file) => file.name) : [];
  state.banAppeals.push({
    id: makeId(),
    body: `Roblox: ${data.get("robloxName")} | Discord: ${data.get("discordName")} | Ban Reason: ${data.get("banReason")} | Appeal: ${data.get("appealReason")} | Evidence: ${evidenceFiles.join(", ") || "None"}`,
    createdAt: new Date().toLocaleString()
  });
  saveState();
  els.banAppealForm.reset();
  alert("Ban appeal submitted.");
}

function startAppeal() {
  els.banAppealStart.classList.add("hidden");
  els.banAppealForm.classList.remove("hidden");
  els.banAppealForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function updateAppealFileNames() {
  const names = [...els.banEvidence.files].map((file) => file.name);
  els.banEvidenceNames.textContent = names.length ? names.join(", ") : "No files selected.";
}

function seedSelectOptions() {
  document.querySelectorAll(".application-step select").forEach((select) => {
    select.innerHTML = `<option value="">Select rating</option>` + Array.from({ length: 10 }, (_, index) => {
      const value = index + 1;
      return `<option value="${value}">${value}</option>`;
    }).join("");
  });
}

function checkboxFor(kind, account, selected) {
  const dataAttr = kind.startsWith("staff-") ? `data-roster-staff-check="${kind.split("-")[1]}"` : `data-roster-supervisor-check="${kind.split("-")[1]}"`;
  return `<label class="check-row"><input type="checkbox" ${dataAttr} value="${account.id}" ${selected ? "checked" : ""}> ${escapeHtml(account.username)} (${titleCase(account.role)})</label>`;
}

async function hashPassword(role, username, password) {
  const value = `${authSalt}:${role}:${username.toLowerCase()}:${password}`;
  const encoded = new TextEncoder().encode(value);
  const buffer = await crypto.subtle.digest("SHA-256", encoded);
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function findMySession() {
  if (!currentUser) return null;
  return state.roster.find((session) => session.staff.includes(currentUser.id) || session.supervisors.includes(currentUser.id));
}

function personPill(id, status, supervisor = false) {
  const account = state.accounts.find((item) => item.id === id);
  if (!account) return "";
  return `<span class="person-pill ${status || ""} ${supervisor ? "supervisor-pill" : ""}">${escapeHtml(account.username)}</span>`;
}

function optionFor(account, selected) {
  return `<option value="${account.id}" ${selected ? "selected" : ""}>${escapeHtml(account.username)} (${titleCase(account.role)})</option>`;
}

function selectedValues(select) {
  return [...select.selectedOptions].map((option) => option.value);
}

function expandRecipients(value) {
  if (value === "all-staff") return state.accounts.filter((account) => account.role === "staff").map((account) => account.id);
  if (value === "all-management") return state.accounts.filter((account) => account.role === "management").map((account) => account.id);
  return [value];
}

function accountName(id) {
  return state.accounts.find((account) => account.id === id)?.username || "System";
}

function titleCase(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function makeId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem("txrpPortal"));
    if (!saved) return structuredClone(defaultState);
    const merged = { ...structuredClone(defaultState), ...saved };
    if (!merged.accounts.some((account) => account.id === ownerAccount.id)) {
      merged.accounts.unshift(ownerAccount);
    }
    return merged;
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem("txrpPortal", JSON.stringify(state));
}
