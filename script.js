const students = [
  { id: 1, name: "Aditya", tenth: 84.33, twelfth: 91.33, cgpa: 8.37, branch: "EE" },
  { id: 2, name: "Rahul", tenth: 78, twelfth: 82, cgpa: 7.82, branch: "CSE" },
  { id: 3, name: "Priya", tenth: 91, twelfth: 89, cgpa: 8.91, branch: "IT" },
  { id: 4, name: "Amit", tenth: 62, twelfth: 71, cgpa: 7.12, branch: "EE" },
  { id: 5, name: "Sneha", tenth: 76, twelfth: 79, cgpa: 7.65, branch: "E&I" },
  { id: 6, name: "Rohan", tenth: 88, twelfth: 93, cgpa: 9.01, branch: "CSE" }
];

let placements = [
  {
    id: 1, company: "Deloitte", tenth: 65, twelfth: 65, cgpa: 7.5,
    branches: ["All"], batch: "2027",
    extras: ["Additional details"]
  },
  {
    id: 2, company: "TCS", tenth: 60, twelfth: 60, cgpa: 7.0,
    branches: ["All"], batch: "2027",
    extras: []
  }
];

let applications = students.slice(0, 5).map((s, i) => ({
  ...s,
  company: i % 2 ? "TCS" : "Deloitte",
  status: i < 2 ? "Verified" : "Not Verified"
}));

const $ = id => document.getElementById(id);

function toast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");
  setTimeout(() => $("toast").classList.remove("show"), 2200);
}

function showSection(id) {
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  $(id).classList.add("active");
  document.querySelector(`[data-section="${id}"]`)?.classList.add("active");
  if (id === "criteria") renderRegistration();
  if (id === "applications") renderApplications();
}

document.querySelectorAll(".nav-btn").forEach(btn =>
  btn.addEventListener("click", () => showSection(btn.dataset.section))
);

$("backCreate").addEventListener("click", () => showSection("create"));

$("addExtra").addEventListener("click", () => {
  const input = $("extraField");
  if (!input.value.trim()) return;
  const tag = document.createElement("span");
  tag.className = "tag";
  tag.textContent = input.value.trim();
  $("extraList").appendChild(tag);
  input.value = "";
});

function selectedBranches() {
  return [...$("branches").selectedOptions].map(o => o.value);
}

$("createPlacement").addEventListener("click", () => {
  const company = $("companyName").value.trim();
  if (!company) return toast("Please enter a company name.");

  const extras = [...document.querySelectorAll("#extraList .tag")].map(x => x.textContent);
  placements.push({
    id: Date.now(),
    company,
    tenth: Number($("tenthCriteria").value) || 0,
    twelfth: Number($("twelfthCriteria").value) || 0,
    cgpa: Number($("cgpaCriteria").value) || 0,
    branches: selectedBranches(),
    batch: $("batch").value,
    extras
  });

  renderPlacements();
  populateCompanyFilter();
  toast(`${company} placement link created.`);
  $("companyName").value = "";
});

function renderPlacements() {
  $("placementList").innerHTML = placements.map(p => `
    <div class="card placement-card">
      <div class="company">
        <h2>${p.company}</h2>
        <button class="secondary" onclick="openVerification(${p.id})">On Click →</button>
      </div>
      <div class="criteria">
        <span>10th ≥ ${p.tenth}%</span>
        <span>12th ≥ ${p.twelfth}%</span>
        <span>CGPA ≥ ${p.cgpa}</span>
        <span>Batch ${p.batch}</span>
        <span>${p.branches.join(", ")}</span>
      </div>
    </div>
  `).join("");
}

function openVerification(id) {
  $("companyFilter").value = id;
  showSection("criteria");
}

function populateCompanyFilter() {
  $("companyFilter").innerHTML = placements.map(p =>
    `<option value="${p.id}">${p.company}</option>`
  ).join("");
}
window.openVerification = openVerification;

function getCurrentPlacement() {
  return placements.find(p => p.id == $("companyFilter").value) || placements[0];
}

function renderRegistration() {
  const p = getCurrentPlacement();
  if (!p) return;

  const min10 = $("filter10").value === "" ? p.tenth : Number($("filter10").value);
  const min12 = $("filter12").value === "" ? p.twelfth : Number($("filter12").value);
  const minCgpa = $("filterCgpa").value === "" ? p.cgpa : Number($("filterCgpa").value);
  const branch = $("filterBranch").value;

  const eligible = students.filter(s =>
    s.tenth >= min10 &&
    s.twelfth >= min12 &&
    s.cgpa >= minCgpa &&
    (branch === "All" || s.branch === branch) &&
    (p.branches.includes("All") || p.branches.includes(s.branch))
  );

  $("eligibleCount").textContent = `${eligible.length} student(s)`;
  $("studentBody").innerHTML = eligible.map(s => {
    const app = applications.find(a => a.id === s.id && a.company === p.company);
    const status = app?.status || "Pending";
    return `
      <tr class="${status !== "Verified" ? "row-unverified" : ""}">
        <td><input class="student-check" type="checkbox" value="${s.id}" /></td>
        <td><strong>${s.name}</strong></td>
        <td>${s.tenth}%</td><td>${s.twelfth}%</td><td>${s.cgpa}</td><td>${s.branch}</td>
        <td><span class="status ${status === "Verified" ? "verified" : "pending"}">${status}</span></td>
      </tr>
    `;
  }).join("") || `<tr><td colspan="7">No students match the selected criteria.</td></tr>`;

  $("selectAll").checked = false;
}

["companyFilter","filter10","filter12","filterCgpa","filterBranch"].forEach(id =>
  $(id).addEventListener("input", renderRegistration)
);

$("selectAll").addEventListener("change", e => {
  document.querySelectorAll(".student-check").forEach(c => c.checked = e.target.checked);
});

$("verifySelected").addEventListener("click", () => {
  const p = getCurrentPlacement();
  const selected = [...document.querySelectorAll(".student-check:checked")].map(c => Number(c.value));
  if (!selected.length) return toast("Select at least one student.");

  selected.forEach(id => {
    const student = students.find(s => s.id === id);
    const existing = applications.find(a => a.id === id && a.company === p.company);
    if (existing) existing.status = "Verified";
    else applications.push({...student, company: p.company, status: "Verified"});
  });

  renderRegistration();
  toast(`${selected.length} student(s) verified.`);
});

function renderApplications() {
  $("applicationBody").innerHTML = applications.map((a, index) => `
    <tr class="${a.status !== "Verified" ? "row-unverified" : ""}">
      <td><strong>${a.name}</strong></td>
      <td>${a.company}</td>
      <td>${a.branch}</td>
      <td>${a.cgpa}</td>
      <td>
        <span class="status ${a.status === "Verified" ? "verified" : "pending"}">${a.status}</span>
      </td>
      <td>
        ${a.status === "Verified"
          ? "✓ Completed"
          : `<button class="secondary" onclick="verifyApplication(${index})">Verify</button>`}
      </td>
    </tr>
  `).join("");
}

function verifyApplication(index) {
  applications[index].status = "Verified";
  renderApplications();
  toast("Application verified.");
}
window.verifyApplication = verifyApplication;

$("verifyAll").addEventListener("click", () => {
  applications.forEach(a => a.status = "Verified");
  renderApplications();
  toast("All applications verified.");
});

renderPlacements();
populateCompanyFilter();
renderRegistration();
