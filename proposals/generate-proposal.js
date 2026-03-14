/**
 * TM Energy — Proposal Generator Engine
 * 
 * Usage: node generate-proposal.js --config proposal-config.json
 * Or: import { generateProposal } from './generate-proposal.js'
 * 
 * Takes project data and generates a complete HTML proposal from template.
 */

const fs = require('fs');
const path = require('path');

// ── SOLAR CALCULATION ENGINE ──
const SOLAR = {
  panelModel: 'LONGi Hi-MO X6 LR5-72HGD',
  panelWattage: 580,
  panelArea: 2.58,        // m² per panel (2.278 × 1.134)
  panelWidth: 1.134,      // m
  panelHeight: 2.278,     // m
  peakSunHours: 4.2,      // Koh Phangan average
  performanceRatio: 0.82,
  peaRate: 6.0,            // ฿/kWh
  ppaRate: 4.5,            // ฿/kWh
  epcCostPerWp: 29,       // ฿/Wp
  batteryCostPerKwh: 14000, // ฿/kWh (LUNA2000)
  degradation: 0.004,     // 0.4%/year
  co2Factor: 0.5,         // kg CO2 per kWh
};

function calculateSystem(config) {
  const { buildings, projectType } = config;
  
  let totalPanels = 0;
  let totalKwp = 0;
  const buildingDetails = [];

  for (const bld of buildings) {
    let panels = bld.panels;
    if (!panels && bld.roofWidth && bld.roofLength) {
      // Auto-calculate panels from roof dimensions
      const usableArea = bld.roofWidth * bld.roofLength * (bld.coverageRatio || 0.85);
      panels = Math.floor(usableArea / SOLAR.panelArea);
    }
    
    const kwp = (panels * SOLAR.panelWattage) / 1000;
    const annualProduction = kwp * SOLAR.peakSunHours * 365 * SOLAR.performanceRatio;
    const monthlyProduction = annualProduction / 12;
    const annualSavings = annualProduction * SOLAR.peaRate;
    
    totalPanels += panels;
    totalKwp += kwp;
    
    buildingDetails.push({
      name: bld.name,
      dimensions: bld.dimensions || `${bld.roofWidth} × ${bld.roofLength}m`,
      panels,
      kwp: Math.round(kwp * 10) / 10,
      annualProduction: Math.round(annualProduction),
      monthlyProduction: Math.round(monthlyProduction),
      annualSavings: Math.round(annualSavings),
      layout: bld.layout || 'auto',
      mppt: bld.mppt || 'auto'
    });
  }

  const totalAnnualProduction = totalKwp * SOLAR.peakSunHours * 365 * SOLAR.performanceRatio;
  const totalAnnualSavings = totalAnnualProduction * SOLAR.peaRate;
  const epcCost = totalKwp * 1000 * SOLAR.epcCostPerWp;
  const paybackYears = Math.round((epcCost / totalAnnualSavings) * 10) / 10;
  const co2Saved = Math.round(totalAnnualProduction * SOLAR.co2Factor / 1000 * 10) / 10;
  
  // Inverter selection
  let inverter;
  if (totalKwp <= 10) inverter = { model: 'SUN2000-10KTL-M2', power: '10kW', mpptt: 2 };
  else if (totalKwp <= 15) inverter = { model: 'SUN2000-15KTL-M5', power: '15kW', mppt: 2 };
  else if (totalKwp <= 25) inverter = { model: 'SUN2000-25KTL-M5', power: '25kW', mppt: 4 };
  else if (totalKwp <= 50) inverter = { model: 'SUN2000-50KTL-M3', power: '50kW', mppt: 4 };
  else inverter = { model: 'SUN2000-100KTL-M2', power: '100kW', mppt: 6 };
  
  // Battery options
  const batterySmall = { model: 'LUNA2000-10kWh', kwh: 10, cost: 10 * SOLAR.batteryCostPerKwh };
  const batteryMedium = { model: 'LUNA2000-20kWh', kwh: 20, cost: 20 * SOLAR.batteryCostPerKwh };
  const batteryLarge = { model: '2× LUNA2000-20kWh', kwh: 40, cost: 40 * SOLAR.batteryCostPerKwh };
  
  let battery = batterySmall;
  if (totalKwp > 50) battery = batteryLarge;
  else if (totalKwp > 25) battery = batteryMedium;
  
  // PPA monthly payment
  const ppaMonthly = Math.round(totalAnnualProduction / 12 * SOLAR.ppaRate);
  const ppaSavings = Math.round(totalAnnualProduction * (SOLAR.peaRate - SOLAR.ppaRate));

  return {
    totalPanels,
    totalKwp: Math.round(totalKwp * 10) / 10,
    totalAnnualProduction: Math.round(totalAnnualProduction),
    totalAnnualSavings: Math.round(totalAnnualSavings),
    epcCost: Math.round(epcCost),
    epcWithBattery: Math.round(epcCost + battery.cost),
    paybackYears,
    paybackWithBattery: Math.round(((epcCost + battery.cost) / totalAnnualSavings) * 10) / 10,
    co2Saved,
    inverter,
    battery,
    ppaMonthly,
    ppaSavings,
    buildingDetails,
    tenYearSavings: Math.round(totalAnnualSavings * 10 * 0.96), // accounting for degradation
    twentyFiveYearSavings: Math.round(totalAnnualSavings * 25 * 0.92),
  };
}

// ── PROPOSAL REF GENERATOR ──
function generateRef() {
  const year = new Date().getFullYear();
  const seq = String(Math.floor(Math.random() * 900) + 100);
  return `TM-${year}-${seq}`;
}

// ── MAIN ──
if (require.main === module) {
  const configPath = process.argv[2] || 'proposal-config.json';
  
  if (!fs.existsSync(configPath)) {
    // Generate example config
    const example = {
      ref: 'TM-2026-005',
      clientName: 'Example Resort',
      location: 'Koh Phangan, Surat Thani',
      projectType: 'commercial',
      validDays: 30,
      buildings: [
        { name: 'Main Building', roofWidth: 20, roofLength: 12, roofType: 'Metal Sheet' },
        { name: 'Restaurant', roofWidth: 15, roofLength: 8, roofType: 'Metal Sheet' }
      ],
      consumption: { monthly: 5000, unit: 'kWh' },
      images: { render: 'render.png', layout: 'layout.png' }
    };
    
    console.log('Example config:');
    console.log(JSON.stringify(example, null, 2));
    console.log('\nSave as proposal-config.json and run again.');
    process.exit(0);
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const system = calculateSystem(config);
  
  console.log('\n=== SOLAR SYSTEM CALCULATION ===');
  console.log(`Panels: ${system.totalPanels}`);
  console.log(`Capacity: ${system.totalKwp} kWp`);
  console.log(`Annual Production: ${system.totalAnnualProduction.toLocaleString()} kWh`);
  console.log(`Annual Savings: ฿${system.totalAnnualSavings.toLocaleString()}`);
  console.log(`EPC Cost: ฿${system.epcCost.toLocaleString()}`);
  console.log(`Payback: ${system.paybackYears} years`);
  console.log(`Inverter: ${system.inverter.model}`);
  console.log(`CO₂ Saved: ${system.co2Saved}t/year`);
  console.log('\nBuildings:');
  system.buildingDetails.forEach(b => {
    console.log(`  ${b.name}: ${b.panels} panels, ${b.kwp} kWp, ฿${b.annualSavings.toLocaleString()}/yr`);
  });
}

module.exports = { calculateSystem, generateRef, SOLAR };
