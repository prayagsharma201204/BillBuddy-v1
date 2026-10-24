'use strict';

const STORAGE_KEY = 'paisatrack.transactions.v1';
const palette = ['#168467','#8b79d8','#f0a45d','#e16c75','#4e9fca','#d5bd53','#7c9a79','#a8799d','#8c9baa','#d38b66'];
const categoryIcons = {Food:'🍜',Transport:'🚌',Shopping:'🛍️',Bills:'🧾',Health:'💊',Education:'📚',Entertainment:'🎬',Salary:'💼',Freelance:'💻',Other:'✦'};
const $ = (id) => document.getElementById(id);
const els = {
  dialog:$('transactionDialog'), form:$('transactionForm'), id:$('transactionId'), title:$('titleInput'), amount:$('amountInput'), date:$('dateInput'), category:$('categoryInput'), note:$('noteInput'),
  month:$('monthFilter'), search:$('searchInput'), typeFilter:$('typeFilter'), categoryFilter:$('categoryFilter'), rows:$('transactionRows'), tableEmpty:$('tableEmpty'), recent:$('recentList'), toast:$('toast')
};
let transactions = loadTransactions();
let toastTimer;

function loadTransactions(){
  try { const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); return Array.isArray(data) ? data.filter(isValidTransaction) : []; }
  catch { return []; }
}
function isValidTransaction(t){ return t && typeof t.id === 'string' && typeof t.title === 'string' && Number.isFinite(Number(t.amount)) && Number(t.amount) > 0 && ['income','expense'].includes(t.type) && typeof t.date === 'string'; }
function persist(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions)); }
function localISODate(date = new Date()){ const d = new Date(date.getTime() - date.getTimezoneOffset()*60000); return d.toISOString().slice(0,10); }
function money(value){ return new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(Number(value)||0); }
function monthKey(date){ return String(date || '').slice(0,7); }
function formatDate(date){ if(!date) return '—'; return new Date(`${date}T00:00:00`).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}); }
function escapeHTML(value){ return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function selectedMonth(){ return els.month.value || localISODate().slice(0,7); }
function monthTransactions(){ return transactions.filter(t => monthKey(t.date) === selectedMonth()); }
function getTotals(items){ return items.reduce((totals,t) => { totals[t.type] += Number(t.amount); return totals; },{income:0,expense:0}); }
function showToast(message){ els.toast.textContent = message; els.toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(()=>els.toast.classList.remove('show'),2600); }
function openDialog(transaction){
  els.form.reset(); els.id.value = transaction?.id || ''; els.title.value = transaction?.title || ''; els.amount.value = transaction?.amount ?? ''; els.date.value = transaction?.date || localISODate(); els.category.value = transaction?.category || 'Food'; els.note.value = transaction?.note || '';
  const type = transaction?.type || 'expense'; const radio = els.form.querySelector(`input[name="type"][value="${type}"]`); if(radio) radio.checked = true;
  $('dialogTitle').textContent = transaction ? 'Edit transaction' : 'Add transaction'; $('saveTransactionBtn').textContent = transaction ? 'Save changes' : 'Save transaction'; els.dialog.showModal(); setTimeout(()=>els.title.focus(),50);
}
function closeDialog(){ els.dialog.close(); }
function renderSummary(){
  const totals = getTotals(monthTransactions()); const balance = totals.income - totals.expense; const rate = totals.income > 0 ? Math.max(0,Math.min(100,((totals.income-totals.expense)/totals.income)*100)) : 0;
  $('balanceAmount').textContent = money(balance); $('incomeAmount').textContent = money(totals.income); $('expenseAmount').textContent = money(totals.expense); $('savingsRate').textContent = `${Math.round(rate)}%`; $('savingsProgress').style.width = `${rate}%`;
  $('todayLabel').textContent = new Date().toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
}
function renderCategoryFilter(){
  const old = els.categoryFilter.value; const categories = [...new Set(transactions.map(t=>t.category).filter(Boolean))].sort();
  els.categoryFilter.innerHTML = '<option value="all">All categories</option>' + categories.map(c=>`<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join('');
  if(categories.includes(old)) els.categoryFilter.value = old;
}
function renderDonut(){
  const expenses = monthTransactions().filter(t=>t.type==='expense'); const sums = {};
  expenses.forEach(t=>{ const c=t.category||'Other'; sums[c]=(sums[c]||0)+Number(t.amount); });
  const sorted = Object.entries(sums).sort((a,b)=>b[1]-a[1]); const total = sorted.reduce((sum,item)=>sum+item[1],0);
  $('donutTotal').textContent = total >= 100000 ? `₹${(total/100000).toFixed(1)}L` : total >= 1000 ? `₹${(total/1000).toFixed(1)}k` : money(total).replace('.00','');
  $('categoryCount').textContent = `${sorted.length} categor${sorted.length===1?'y':'ies'}`;
  if(!total){ $('donutChart').style.background='conic-gradient(#edf1f4 0 100%)'; $('categoryLegend').innerHTML='<div class="empty-state small-empty">Add expenses to see your breakdown.</div>'; return; }
  let cursor=0; const stops=sorted.map(([cat,amount],i)=>{const start=cursor;cursor+=amount/total*100;return `${palette[i%palette.length]} ${start}% ${cursor}%`;});
  $('donutChart').style.background=`conic-gradient(${stops.join(',')})`;
  $('categoryLegend').innerHTML=sorted.slice(0,6).map(([cat,amount],i)=>`<div class="legend-row"><span class="legend-dot" style="background:${palette[i%palette.length]}"></span><span title="${escapeHTML(cat)}">${escapeHTML(cat)}</span><strong>${Math.round(amount/total*100)}%</strong></div>`).join('');
}
function renderRecent(){
  const items=[...transactions].sort((a,b)=>b.date.localeCompare(a.date)||b.createdAt-a.createdAt).slice(0,4);
  if(!items.length){els.recent.innerHTML='<div class="empty-state">No transactions yet.<br />Add your first transaction to get started.</div>';return;}
  els.recent.innerHTML=items.map(t=>`<div class="recent-item"><div class="transaction-icon">${categoryIcons[t.category]||'✦'}</div><div class="recent-details"><strong>${escapeHTML(t.title)}</strong><small>${escapeHTML(t.category||'Other')} · ${formatDate(t.date)}</small></div><div class="recent-amount ${t.type==='income'?'positive':'negative'}">${t.type==='income'?'+':'−'}${money(t.amount)}</div></div>`).join('');
}
function filteredTransactions(){
  const q=els.search.value.trim().toLowerCase(); const type=els.typeFilter.value; const category=els.categoryFilter.value;
  return [...transactions].filter(t=>monthKey(t.date)===selectedMonth()).filter(t=>type==='all'||t.type===type).filter(t=>category==='all'||t.category===category).filter(t=>!q||[t.title,t.category,t.note,t.date].some(v=>String(v||'').toLowerCase().includes(q))).sort((a,b)=>b.date.localeCompare(a.date)||b.createdAt-a.createdAt);
}
function renderTable(){
  const items=filteredTransactions(); els.rows.innerHTML=items.map(t=>`<tr><td><div class="transaction-name"><div class="transaction-icon">${categoryIcons[t.category]||'✦'}</div><div><strong title="${escapeHTML(t.title)}">${escapeHTML(t.title)}</strong>${t.note?`<small title="${escapeHTML(t.note)}">${escapeHTML(t.note)}</small>`:''}</div></div></td><td><span class="category-pill">${escapeHTML(t.category||'Other')}</span></td><td>${formatDate(t.date)}</td><td><span class="type-pill ${t.type}">${t.type==='income'?'Income':'Expense'}</span></td><td class="amount-cell ${t.type==='income'?'positive':'negative'}">${t.type==='income'?'+':'−'}${money(t.amount)}</td><td><div class="action-buttons"><button class="icon-btn" data-action="edit" data-id="${t.id}" aria-label="Edit ${escapeHTML(t.title)}" title="Edit">✎</button><button class="icon-btn" data-action="delete" data-id="${t.id}" aria-label="Delete ${escapeHTML(t.title)}" title="Delete">×</button></div></td></tr>`).join('');
  els.tableEmpty.style.display=items.length?'none':'block'; $('rowCount').textContent=`Showing ${items.length} transaction${items.length===1?'':'s'}`;
}
function render(){ renderSummary();renderCategoryFilter();renderDonut();renderRecent();renderTable(); }
function exportCSV(){
  const items=filteredTransactions(); if(!items.length){showToast('There are no transactions to export for this view.');return;}
  const headers=['Title','Type','Category','Amount (INR)','Date','Note']; const quote=v=>`"${String(v??'').replace(/"/g,'""')}"`;
  const csv=[headers,...items.map(t=>[t.title,t.type,t.category,t.amount,t.date,t.note])].map(row=>row.map(quote).join(',')).join('\r\n');
  const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`paisatrack-${selectedMonth()}.csv`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);showToast('CSV report exported successfully.');
}

$('openAddBtn').addEventListener('click',()=>openDialog()); $('closeDialogBtn').addEventListener('click',closeDialog); $('cancelDialogBtn').addEventListener('click',closeDialog);
els.dialog.addEventListener('click',e=>{if(e.target===els.dialog)closeDialog();});
els.form.addEventListener('submit',e=>{
  e.preventDefault(); const amount=Number(els.amount.value); if(!Number.isFinite(amount)||amount<=0){showToast('Please enter an amount greater than zero.');return;}
  const existingId=els.id.value; const type=els.form.querySelector('input[name="type"]:checked').value; const existing=transactions.find(t=>t.id===existingId);
  const item={id:existingId||`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,title:els.title.value.trim(),amount:Math.round(amount*100)/100,type,date:els.date.value,category:els.category.value,note:els.note.value.trim(),createdAt:existing?.createdAt||Date.now()};
  if(!item.title||!item.date){showToast('Please complete the required fields.');return;}
  if(existingId) transactions=transactions.map(t=>t.id===existingId?item:t); else transactions.push(item);
  persist();closeDialog();render();showToast(existingId?'Transaction updated.':'Transaction added successfully.');
});
[els.month,els.search,els.typeFilter,els.categoryFilter].forEach(el=>el.addEventListener(el===els.month?'change':'input',render));
els.rows.addEventListener('click',e=>{const button=e.target.closest('button[data-action]');if(!button)return;const t=transactions.find(item=>item.id===button.dataset.id);if(!t)return;if(button.dataset.action==='edit')openDialog(t);if(button.dataset.action==='delete'){if(confirm(`Delete “${t.title}”? This cannot be undone.`)){transactions=transactions.filter(item=>item.id!==t.id);persist();render();showToast('Transaction deleted.');}}});
$('exportBtn').addEventListener('click',exportCSV);
$('clearAllBtn').addEventListener('click',()=>{if(!transactions.length){showToast('There is no saved data to clear.');return;}if(confirm('Delete all transactions saved in this browser? This cannot be undone.')){transactions=[];persist();render();showToast('All transaction data cleared.');}});
els.month.value=localISODate().slice(0,7);render();
