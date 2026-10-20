const $ = id => document.getElementById(id);
const KEY = 'dompet-mochi-v1';
let data = [];
try { data = JSON.parse(localStorage.getItem(KEY)) || []; } catch(e) { data = []; }

const rp = n => (n < 0 ? '-Rp' : 'Rp') + Math.abs(n).toLocaleString('id-ID');
const today = () => new Date().toISOString().slice(0,10);
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch(e) {} };
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toast(msg){ const t=$('toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),1800); }

function balances(){
  const b = {};
  data.forEach(t => { b[t.wallet] = (b[t.wallet]||0) + (t.type==='in' ? t.amount : -t.amount); });
  return b;
}

function render(){
  const tin = data.filter(t=>t.type==='in').reduce((a,t)=>a+t.amount,0);
  const tout = data.filter(t=>t.type==='out').reduce((a,t)=>a+t.amount,0);
  $('sIn').textContent = rp(tin); $('sOut').textContent = rp(tout); $('sLeft').textContent = rp(tin-tout);

  const b = balances();
  const names = Object.keys(b);
  $('wallets').innerHTML = names.length
    ? names.map(n => `<span class="chip ${b[n]<0?'neg':''}">${esc(n)}: ${rp(b[n])}</span>`).join('')
    : '<div class="empty">Belum ada dompet. Tambah pemasukan dulu ya 🍡</div>';

  const cur = $('outSrc').value;
  $('outSrc').innerHTML = names.length
    ? names.map(n=>`<option ${n===cur?'selected':''}>${esc(n)}</option>`).join('')
    : '<option value="">(belum ada pemasukan)</option>';
  updateHint();

  const sorted = [...data].sort((a,b)=> b.date.localeCompare(a.date) || b.id-a.id);
  $('history').innerHTML = sorted.length ? sorted.map(t => `
    <div class="item">
      <div class="ic">${t.type==='in' ? '🐷' : (t.cat||'🐙').split(' ')[0]}</div>
      <div class="tx"><b>${esc(t.type==='in' ? (t.note || 'Pemasukan') : t.use)}</b>
        <span>${esc(t.date)} · ${esc(t.wallet)}${t.type==='out' ? ' · '+esc(t.cat.replace(/^\S+\s/,'')) : ''}</span></div>
      <div class="amt ${t.type==='in'?'plus':'minus'}">${t.type==='in'?'+':'-'}${rp(t.amount)}</div>
      <button class="del" data-id="${t.id}" aria-label="Hapus transaksi" title="Hapus">✖️</button>
    </div>`).join('') : '<div class="empty">Belum ada transaksi. Dompetmu masih tidur 😴</div>';
}

function updateHint(){
  const b = balances()[$('outSrc').value] || 0;
  $('outHint').textContent = 'Sisa di dompet ini: ' + rp(b);
}
$('outSrc').addEventListener('change', updateHint);

$('formIn').addEventListener('submit', e => {
  e.preventDefault();
  data.push({id:Date.now(), type:'in', wallet:$('inSrc').value, amount:+$('inAmt').value, note:$('inNote').value.trim(), date:$('inDate').value});
  save(); render(); e.target.reset(); $('inDate').value = today(); toast('Pemasukan tersimpan! 🎉');
});

$('formOut').addEventListener('submit', e => {
  e.preventDefault();
  const w = $('outSrc').value, amt = +$('outAmt').value;
  if(!w){ toast('Tambah pemasukan dulu ya'); return; }
  if(amt > (balances()[w]||0) && !confirm('Uang di ' + w + ' tidak cukup. Tetap simpan?')) return;
  data.push({id:Date.now(), type:'out', wallet:w, amount:amt, use:$('outUse').value.trim(), cat:$('outCat').value, date:$('outDate').value});
  save(); render(); $('outAmt').value=''; $('outUse').value=''; $('outDate').value = today(); toast('Pengeluaran tercatat 💸');
});

$('history').addEventListener('click', e => {
  const btn = e.target.closest('.del'); if(!btn) return;
  data = data.filter(t => t.id !== +btn.dataset.id); save(); render(); toast('Transaksi dihapus');
});

$('btnClear').addEventListener('click', () => {
  if(data.length && confirm('Hapus semua data? Ini tidak bisa dibatalkan.')){ data=[]; save(); render(); }
});

$('btnXlsx').addEventListener('click', () => {
  if(!data.length){ toast('Belum ada data untuk diunduh'); return; }
  if(typeof XLSX === 'undefined'){ toast('Library Excel belum termuat. Cek internet kamu.'); return; }
  const sorted = [...data].sort((a,b)=>a.date.localeCompare(b.date) || a.id-b.id);
  let run = 0;
  const rows = sorted.map(t => {
    run += t.type==='in' ? t.amount : -t.amount;
    return {
      'Tanggal': t.date,
      'Jenis': t.type==='in' ? 'Pemasukan' : 'Pengeluaran',
      'Dompet / Sumber': t.wallet,
      'Kategori': t.type==='out' ? t.cat.replace(/^\S+\s/,'') : '-',
      'Keterangan (dipakai untuk apa)': t.type==='in' ? (t.note||'-') : t.use,
      'Pemasukan': t.type==='in' ? t.amount : 0,
      'Pengeluaran': t.type==='out' ? t.amount : 0,
      'Saldo Berjalan': run
    };
  });
  const tin = sorted.filter(t=>t.type==='in').reduce((a,t)=>a+t.amount,0);
  const tout = sorted.filter(t=>t.type==='out').reduce((a,t)=>a+t.amount,0);
  const b = balances();
  const sum = [['Ringkasan Dompet Mochi'],[],['Total Pemasukan',tin],['Total Pengeluaran',tout],['Sisa Uang',tin-tout],[],['Sisa per Dompet']]
    .concat(Object.keys(b).map(n=>[n,b[n]]));
  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.json_to_sheet(rows);
  ws1['!cols'] = [{wch:12},{wch:13},{wch:18},{wch:15},{wch:32},{wch:14},{wch:14},{wch:16}];
  const ws2 = XLSX.utils.aoa_to_sheet(sum);
  ws2['!cols'] = [{wch:26},{wch:16}];
  XLSX.utils.book_append_sheet(wb, ws1, 'Transaksi');
  XLSX.utils.book_append_sheet(wb, ws2, 'Ringkasan');
  XLSX.writeFile(wb, 'dompet-mochi-' + today() + '.xlsx');
  toast('Excel berhasil diunduh 📊');
});

$('inDate').value = today(); $('outDate').value = today();
render();
