/* A constant-power, AC-side learning model. No storage or export. */
(() => {
  function balance(pv, load, hours) {
    if (![pv, load, hours].every(Number.isFinite) || pv < 0 || load < 0 || hours <= 0 || pv > 1000 || load > 1000 || hours > 24) return null;
    const direct = Math.min(pv, load) * hours;
    return { solar: pv * hours, demand: load * hours, direct, imported: Math.max(load-pv,0)*hours, curtailed: Math.max(pv-load,0)*hours };
  }
  if (typeof module !== 'undefined') module.exports = { balance };
  if (typeof document === 'undefined') return;
  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('energy-controls');
    if (!form) return;
    const output = document.getElementById('energy-results');
    const fields = ['pv','load','hours'].map(id=>document.getElementById('energy-'+id));
    const tr = (en,he,th) => ({en,he,th})[document.body.dataset.lang] || en;
    function render() {
      const result = balance(...fields.map(el=>el.value.trim()===''?NaN:Number(el.value)));
      if (!result) {
        output.textContent=tr('Enter power between 0–1,000 kW and duration above 0 and up to 24 hours.','הזינו הספק בין 0 ל־1,000 קילוואט ומשך גדול מאפס ועד 24 שעות.','ใส่กำลัง 0–1,000 kW และระยะเวลามากกว่า 0 ถึง 24 ชั่วโมง');
        return;
      }
      const format = n=>new Intl.NumberFormat(document.body.dataset.lang,{maximumFractionDigits:2}).format(n);
      const kwh = tr('kWh','קוט״ש','kWh');
      const items = [
        ['direct',tr('Solar used directly','סולאר שנצרך ישירות','โซลาร์ที่ใช้โดยตรง')],
        ['imported',tr('Imported from the grid','יבוא מהרשת','นำเข้าจากกริด')],
        ['curtailed',tr('Curtailed potential','פוטנציאל שמוגבל','พลังงานศักยภาพที่ถูกจำกัด')]
      ];
      const max = Math.max(result.solar,result.demand,1);
      output.innerHTML=items.map(([key,title])=>`<div class="energy-result energy-${key}"><span>${title}</span><strong>${format(result[key])} ${kwh}</strong><div class="energy-bar" aria-hidden="true"><i style="width:${100*result[key]/max}%"></i></div></div>`).join('')+`<p class="energy-equation">${tr('Load = direct solar + grid import','העומס = סולאר ישיר + יבוא מהרשת','โหลด = โซลาร์โดยตรง + ไฟนำเข้าจากกริด')}: <bdi>${format(result.demand)} = ${format(result.direct)} + ${format(result.imported)} ${kwh}</bdi><br>${tr('Solar potential = direct solar + curtailment','הפוטנציאל הסולארי = סולאר ישיר + הגבלה','พลังงานโซลาร์ศักยภาพ = ใช้โดยตรง + ถูกจำกัด')}: <bdi>${format(result.solar)} = ${format(result.direct)} + ${format(result.curtailed)} ${kwh}</bdi></p>`;
    }
    form.addEventListener('input',render);
    form.addEventListener('submit',e=>e.preventDefault());
    document.addEventListener('academy:lang',render);
    render();
  });
})();
