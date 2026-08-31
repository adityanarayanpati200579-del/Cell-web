const STORAGE_KEY="placement_portal_integrated_v3";

const initialData={
  role:"coordinator",
  placements:[
    {id:"p1",company:"Deloitte",batch:"2027",tenth:65,twelfth:65,cgpa:7.5,branches:["All"],extras:["No active backlogs"]},
    {id:"p2",company:"TCS",batch:"2027",tenth:60,twelfth:60,cgpa:7,branches:["All"],extras:[]}
  ],
  applications:[]
};

let data=loadData();
let selectedStudentCompany=null;

function loadData(){
  try{
    const saved=JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved||structuredClone(initialData);
  }catch(e){return structuredClone(initialData)}
}
function saveData(){localStorage.setItem(STORAGE_KEY,JSON.stringify(data))}
const $=id=>document.getElementById(id);

function toast(message){
  $("toast").textContent=message;
  $("toast").classList.add("show");
  clearTimeout(window.toastTimer);
  window.toastTimer=setTimeout(()=>$("toast").classList.remove("show"),2300);
}

function showSection(id){
  document.querySelectorAll(".section").forEach(s=>s.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active"));
  const section=$(id);
  if(section)section.classList.add("active");
  const btn=document.querySelector(`[data-section="${id}"]`);
  if(btn)btn.classList.add("active");
  closeMobileMenu();

  if(id==="dashboard")renderDashboard();
  if(id==="create")renderPlacements();
  if(id==="registration"){populateCompanyFilter();renderRegistration()}
  if(id==="applications")renderApplications();
  if(id==="student")renderStudentView();
}
window.showSection=showSection;

document.querySelectorAll(".nav-btn").forEach(btn=>{
  btn.addEventListener("click",()=>showSection(btn.dataset.section));
});

function applyRole(){
  const coordinator=data.role==="coordinator";
  document.querySelectorAll(".coordinator-only").forEach(el=>el.style.display=coordinator?"":"none");
  document.querySelectorAll(".student-only").forEach(el=>el.style.display=coordinator?"none":"");
  $("switchRole").textContent=coordinator?"Switch to Student View":"Switch to Coordinator View";
  $("roleEyebrow").textContent=coordinator?"Coordinator View":"Student View";
  $("dashboardTitle").textContent=coordinator?"Placement Management Dashboard":"Student Placement Dashboard";
  $("dashboardText").textContent=coordinator
    ?"Create companies, add unlimited test students, and verify applications."
    :"View company opportunities and submit test student applications.";
  $("rolePill").textContent=coordinator?"COORDINATOR":"STUDENT";
}

$("switchRole").addEventListener("click",()=>{
  data.role=data.role==="coordinator"?"student":"coordinator";
  saveData();
  applyRole();
  showSection(data.role==="coordinator"?"dashboard":"student");
  toast(`Switched to ${data.role==="coordinator"?"Coordinator":"Student"} View`);
});

$("mobileMenu").addEventListener("click",()=>{
  $("mainNav").classList.add("open");
  $("navBackdrop").classList.add("open");
});
$("closeMenu").addEventListener("click",closeMobileMenu);
$("navBackdrop").addEventListener("click",closeMobileMenu);
function closeMobileMenu(){
  $("mainNav").classList.remove("open");
  $("navBackdrop").classList.remove("open");
}

function renderDashboard(){
  $("statCompanies").textContent=data.placements.length;
  $("statStudents").textContent=uniqueStudents().length;
  $("statApplications").textContent=data.applications.length;
  $("statVerified").textContent=data.applications.filter(a=>a.status==="Verified").length;
}

function uniqueStudents(){
  const map=new Map();
  data.applications.forEach(a=>map.set(a.email,a));
  return [...map.values()];
}

function selectedBranches(){
  const values=[...$("branches").selectedOptions].map(o=>o.value);
  return values.includes("All")||values.length===0?["All"]:values;
}

$("addExtra").addEventListener("click",()=>{
  const value=$("extraField").value.trim();
  if(!value)return toast("Enter an additional criterion first.");
  const tag=document.createElement("span");
  tag.className="tag";
  tag.textContent=value;
  $("extraList").appendChild(tag);
  $("extraField").value="";
});

$("extraField").addEventListener("keydown",e=>{
  if(e.key==="Enter"){e.preventDefault();$("addExtra").click()}
});

$("createPlacement").addEventListener("click",()=>{
  const company=$("companyName").value.trim();
  if(!company)return toast("Enter a company name.");

  const placement={
    id:"p_"+Date.now(),
    company,
    batch:$("batch").value,
    tenth:Number($("cg10").value)||0,
    twelfth:Number($("cg12").value)||0,
    cgpa:Number($("cgpa").value)||0,
    branches:selectedBranches(),
    extras:[...document.querySelectorAll("#extraList .tag")].map(x=>x.textContent)
  };
  // normalize accidental syntax-safe object values
  placement.tenth=Number($("cg10").value)||0;
  placement.twelfth=Number($("cg12").value)||0;
  placement.cgpa=Number($("cgpa").value)||0;

  data.placements.push(placement);
  saveData();
  renderPlacements();
  populateCompanyFilter();
  renderStudentView();
  renderDashboard();

  ["companyName"].forEach(id=>$(id).value="");
  $("cg10").value=0;$("cg12").value=0;$("cgpa").value=0;
  $("extraList").innerHTML="";
  toast(`${company} created and added to Student View.`);
});

function criteriaHTML(p){
  return `<span>10th ≥ ${p.tenth}%</span>
  <span>12th ≥ ${p.twelfth}%</span>
  <span>CGPA ≥ ${p.cgpa}</span>
  <span>Batch: ${escapeHTML(p.batch)}</span>
  <span>Branch: ${p.branches.map(escapeHTML).join(", ")}</span>
  ${p.extras.map(x=>`<span>${escapeHTML(x)}</span>`).join("")}`;
}

function renderPlacements(){
  $("placementList").innerHTML=data.placements.length?data.placements.map(p=>`
    <div class="card placement-card">
      <div class="company-line">
        <div>
          <h2>${escapeHTML(p.company)}</h2>
          <span class="muted">${applicationCount(p.company)} application(s)</span>
        </div>
        <button class="secondary" onclick="openRegistration('${p.id}')">Open Verification →</button>
      </div>
      <div class="criteria">${criteriaHTML(p)}</div>
    </div>
  `).join(""):`<div class="card empty">No companies created yet.</div>`;
}

function applicationCount(company){return data.applications.filter(a=>a.company===company).length}

window.openRegistration=id=>{
  $("companyFilter").value=id;
  showSection("registration");
};

function populateCompanyFilter(){
  $("companyFilter").innerHTML=data.placements.length
    ?data.placements.map(p=>`<option value="${p.id}">${escapeHTML(p.company)}</option>`).join("")
    :`<option value="">No companies</option>`;
}

function getCurrentPlacement(){
  return data.placements.find(p=>p.id===$("companyFilter").value)||data.placements[0];
}

function eligibleForCompany(a,p){
  return !!p &&
    a.tenth>=p.tenth &&
    a.twelfth>=p.twelfth &&
    a.cgpa>=p.cgpa &&
    (p.batch==="All"||a.batch===p.batch) &&
    (p.branches.includes("All")||p.branches.includes(a.branch));
}

function renderRegistration(){
  const p=getCurrentPlacement();
  if(!p){
    $("studentBody").innerHTML=`<tr><td colspan="9" class="empty">Create a company first.</td></tr>`;
    $("eligibleCount").textContent="";
    return;
  }
  const search=$("searchStudent").value.toLowerCase().trim();
  const filterStatus=$("filterStatus").value;

  const rows=data.applications.filter(a=>{
    if(a.company!==p.company)return false;
    if(search&&!(`${a.name} ${a.email}`.toLowerCase().includes(search)))return false;
    if(filterStatus!=="All"&&a.status!==filterStatus)return false;
    return true;
  });

  const eligible=rows.filter(a=>eligibleForCompany(a,p));
  $("eligibleCount").textContent=`${eligible.length} eligible application(s) shown`;

  $("studentBody").innerHTML=eligible.length?eligible.map(a=>`
    <tr class="${a.status!=="Verified"?"row-unverified":""}">
      <td><input class="student-check" type="checkbox" value="${a.id}"></td>
      <td><strong>${escapeHTML(a.name)}</strong></td>
      <td>${escapeHTML(a.email)}</td>
      <td>${a.tenth}%</td><td>${a.twelfth}%</td><td>${a.cgpa}</td>
      <td>${escapeHTML(a.branch)}</td><td>${escapeHTML(a.batch)}</td>
      <td><span class="status ${statusClass(a.status)}">${a.status}</span></td>
    </tr>
  `).join(""):`<tr><td colspan="9" class="empty">No eligible applications found.</td></tr>`;
  $("selectAll").checked=false;
}

["companyFilter","searchStudent","filterStatus"].forEach(id=>{
  $(id).addEventListener("input",renderRegistration);
  $(id).addEventListener("change",renderRegistration);
});
$("selectAll").addEventListener("change",e=>{
  document.querySelectorAll(".student-check").forEach(c=>c.checked=e.target.checked);
});

function selectedApplicationIds(){return [...document.querySelectorAll(".student-check:checked")].map(c=>c.value)}
function changeSelectedStatus(status){
  const ids=selectedApplicationIds();
  if(!ids.length)return toast("Select at least one application.");
  data.applications.forEach(a=>{if(ids.includes(a.id))a.status=status});
  saveData();renderRegistration();renderApplications();renderDashboard();
  toast(`${ids.length} application(s) marked ${status}.`);
}
$("verifySelected").addEventListener("click",()=>changeSelectedStatus("Verified"));
$("rejectSelected").addEventListener("click",()=>changeSelectedStatus("Rejected"));

function renderApplications(){
  $("applicationCount").textContent=`${data.applications.length} total application(s)`;
  $("applicationBody").innerHTML=data.applications.length?data.applications.map((a,i)=>`
    <tr class="${a.status!=="Verified"?"row-unverified":""}">
      <td><strong>${escapeHTML(a.name)}</strong><br><small>${escapeHTML(a.email)}</small></td>
      <td>${escapeHTML(a.company)}</td><td>${a.branch}</td><td>${a.batch}</td><td>${a.cgpa}</td>
      <td><span class="status ${statusClass(a.status)}">${a.status}</span></td>
      <td>${a.status==="Verified"
        ?`<button class="secondary" onclick="setApplicationStatus(${i},'Pending')">Undo</button>`
        :`<button class="secondary" onclick="setApplicationStatus(${i},'Verified')">Verify</button>`}</td>
    </tr>
  `).join(""):`<tr><td colspan="7" class="empty">No applications yet.</td></tr>`;
}
window.setApplicationStatus=(index,status)=>{
  data.applications[index].status=status;saveData();renderApplications();renderDashboard();renderRegistration();
  toast(`Application marked ${status}.`);
};
$("verifyAll").addEventListener("click",()=>{
  let count=0;
  data.applications.forEach(a=>{if(a.status!=="Verified"){a.status="Verified";count++}});
  saveData();renderApplications();renderDashboard();renderRegistration();
  toast(count?`${count} pending application(s) verified.`:"No pending applications.");
});

function renderStudentView(){
  $("studentCompanies").innerHTML=data.placements.length?data.placements.map(p=>`
    <div class="card student-company">
      <h2>${escapeHTML(p.company)}</h2>
      <p class="muted">Batch ${escapeHTML(p.batch)} • ${applicationCount(p.company)} application(s)</p>
      <div class="criteria">${criteriaHTML(p)}</div>
      <button class="primary apply-btn" onclick="openStudentForm('${p.id}')">Add Student / Apply</button>
    </div>
  `).join(""):`<div class="card empty">No placement opportunities created yet.</div>`;
  renderStudentApplications();
}

window.openStudentForm=id=>{
  selectedStudentCompany=data.placements.find(p=>p.id===id);
  if(!selectedStudentCompany)return;
  $("studentFormArea").classList.remove("hidden");
  $("studentFormCompany").textContent=selectedStudentCompany.company;
  $("studentCriteriaSummary").textContent=`Eligibility: 10th ≥ ${selectedStudentCompany.tenth}%, 12th ≥ ${selectedStudentCompany.twelfth}%, CGPA ≥ ${selectedStudentCompany.cgpa}, Batch ${selectedStudentCompany.batch}.`;
  $("studentBatch").value=selectedStudentCompany.batch==="All"?"2027":selectedStudentCompany.batch;
  updateLiveEligibility();
  $("studentFormArea").scrollIntoView({behavior:"smooth",block:"start"});
};

$("closeStudentForm").addEventListener("click",()=>{
  $("studentFormArea").classList.add("hidden");selectedStudentCompany=null;
});

["student10","student12","studentCgpa","studentBranch","studentBatch"].forEach(id=>{
  $(id).addEventListener("input",updateLiveEligibility);
  $(id).addEventListener("change",updateLiveEligibility);
});

function currentStudentRecord(){
  return {
    tenth:Number($("student10").value)||0,
    twelfth:Number($("student12").value)||0,
    cgpa:Number($("studentCgpa").value)||0,
    branch:$("studentBranch").value,
    batch:$("studentBatch").value
  };
}
function updateLiveEligibility(){
  if(!selectedStudentCompany)return;
  const ok=eligibleForCompany(currentStudentRecord(),selectedStudentCompany);
  $("liveEligibility").className=`eligibility-box ${ok?"good":"bad"}`;
  $("liveEligibility").textContent=ok
    ?"✓ This student satisfies the company's eligibility criteria."
    :"⚠ This student does not satisfy all criteria. The application can still be submitted because this is TEST MODE.";
}

$("submitStudent").addEventListener("click",()=>{
  if(!selectedStudentCompany)return toast("Select a company first.");
  const name=$("studentName").value.trim(),email=$("studentEmail").value.trim();
  if(!name||!email)return toast("Name and email are required.");
  const a=currentStudentRecord();
  if(!a.tenth||!a.twelfth||!a.cgpa)return toast("Enter 10th, 12th and CGPA.");

  data.applications.push({
    id:"a_"+Date.now()+"_"+Math.random().toString(36).slice(2,8),
    name,email,phone:$("studentPhone").value.trim(),company:selectedStudentCompany.company,
    ...a,eligible:eligibleForCompany(a,selectedStudentCompany),status:"Pending",createdAt:new Date().toISOString()
  });
  saveData();
  const company=selectedStudentCompany.company;
  clearStudentForm();
  renderStudentView();renderDashboard();renderApplications();renderRegistration();
  toast(`${name} added to ${company}.`);
});

function clearStudentForm(){
  ["studentName","studentEmail","studentPhone","student10","student12","studentCgpa"].forEach(id=>$(id).value="");
  $("studentBranch").value="EE";
  $("studentBatch").value=selectedStudentCompany?.batch==="All"?"2027":(selectedStudentCompany?.batch||"2027");
  updateLiveEligibility();
}

function renderStudentApplications(){
  const rows=data.applications.slice().reverse();
  $("studentApplicationCount").textContent=rows.length;
  $("studentApplicationsBody").innerHTML=rows.length?rows.map(a=>`
    <tr>
      <td><strong>${escapeHTML(a.name)}</strong><br><small>${escapeHTML(a.email)}</small></td>
      <td>${escapeHTML(a.company)}</td><td>${a.branch}</td><td>${a.batch}</td><td>${a.cgpa}</td>
      <td><span class="status ${statusClass(a.status)}">${a.status}</span></td>
    </tr>
  `).join(""):`<tr><td colspan="6" class="empty">No test applications added yet.</td></tr>`;
}

$("clearTestData").addEventListener("click",()=>{
  if(!confirm("Clear all companies and student applications?"))return;
  data={role:data.role,placements:[],applications:[]};
  saveData();populateCompanyFilter();renderPlacements();renderStudentView();renderRegistration();renderApplications();renderDashboard();
  toast("All test data cleared.");
});

function statusClass(status){return status==="Verified"?"verified":status==="Rejected"?"rejected":"pending"}
function escapeHTML(value){return String(value).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}

applyRole();
populateCompanyFilter();
renderDashboard();
renderPlacements();
renderRegistration();
renderApplications();
renderStudentView();
