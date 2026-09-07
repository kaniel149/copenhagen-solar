# Technical training research — Bustan Energy Academy

Access date for every source: **2026-09-07**. Research and curriculum are original educational synthesis. The two audiences are installers and service/commissioning/O&M technicians after the shared foundation. Quizzes do not authorize electrical, structural, roof-access or emergency-response work; supervised assessment and applicable professional permissions remain separate.

## Decisions that affect authoring

- Teach issued-design execution and evidence, not a universal wiring recipe. The specific model, battery/BMS generation, firmware, connector family, grid mode, utility approval and local engineering review determine implementation.
- Representative worked-system documentation: Victron MultiPlus-II **230V**, Lithium **NG 25.6V** family and approved NG BMS, SmartSolar **150/60–250/70** manual, Victron EV Charging Station. These are teaching examples, not a declaration that an assembled combination is approved for a Thai project. No unverified PEA listing or universal RCD type is asserted.
- PEA's regulatory index was updated **30 June 2026**. Its 2569 citizen-solar notice, 2025 equipment-change guidance and separate EV interconnection requirements have different scopes. A project-specific review is necessary.
- EIT's official Q4 2025 catalog includes a **2568/2025 PV and battery-energy-storage installation standard**, ISBN **978-616-396-123-5**, alongside the 2022 rooftop standard. A catalog proves publication, not the clauses, legal adoption or applicability of every provision. Do not present 2022 rooftop alone as the newest complete reference.
- IEC public pages establish document scope and edition, not permission to reproduce standards or invent test limits. In particular, the IEC 62548-1 scope does not encompass an entire battery/AC/load installation.
- US OSHA and DOE material is comparative good-practice reference, **not Thai law**. Do not transfer OSHA height thresholds, NEC rapid-shutdown rules, FEMA flood levels or US structural codes into Thailand as legal requirements.
- Manufacturer safety instructions may discuss qualified live diagnostics. Academy exercises use drawings, isolated training equipment and supplied readings. Unsafe, water-damaged or unexplained-fault circuits are never energized to discover whether they work. Energized commissioning, where legitimate and necessary, is separately planned and supervised by authorized personnel with the applicable manufacturer procedure.

## Verified source register

### tech-pea-regulatory — PEA interconnection regulatory index

- Publisher: Provincial Electricity Authority, Thailand.
- URL: https://www.pea.co.th/business-partner/regulation
- Visible date: last updated 30 June 2569 / 2026; linked equipment-modification guidance updated 2 May 2568 / 2025; EV requirements titled 2563 / 2020.
- Verified claim: the official index separates interconnection, network-operation, equipment-change and EV documents, and lists a 2026 citizen-solar notice.
- Topics: issued drawings, equipment substitutions, approved settings, handover and recommissioning.
- Limitation: index and linked-document existence verified; not a substitute for reading the specific approval and relevant Thai-language rule. The 2026 notice PDF is image-based; no technical threshold is inferred from it.

### tech-eit-catalog — EIT standards catalog

- Publisher: Engineering Institute of Thailand under H.M. the King's Patronage.
- URL: https://eit.or.th/showcase/EIT/issue4_68/files/basic-html/page90.html
- Visible version/date: Engineering Journal year 78, issue 4, October–December 2568 / 2025, page 90.
- Verified claim: catalog lists electrical workplace safety, lightning protection, 2022 rooftop PV and a 2025 PV-plus-battery installation standard (ISBN above).
- Topics: local reference hierarchy, escalation to electrical/structural specialists.
- Limitation: bibliographic evidence only; clause text, legally applicable edition and project interpretation require the proper standard and responsible Thai professional.

### tech-iec-array — IEC 62548-1 array-design scope

- Publisher: IEC.
- URL: https://webstore.iec.ch/en/publication/64171
- Visible version/date: IEC 62548-1:2023, edition 1.0, 2023-12-07; page also points to 2023+AMD1:2025 consolidated version.
- Verified claim: array-design scope covers DC wiring, protection, switching and earthing; excludes storage devices, loads and their distribution network.
- Topics: DC design handoff, protective-device schedule, array boundaries.
- Limitation: public scope only; no numerical design/test requirement is claimed from the abstract.

### tech-iec-commission — IEC 62446-1 commissioning/documentation scope

- Publisher: IEC.
- URL: https://webstore.iec.ch/en/publication/63726
- Visible version/date: IEC 62446-1:2016+AMD1:2018 CSV, edition 1.1, 2018-08-10.
- Verified claim: scope includes customer documentation, commissioning tests and inspection for grid-connected PV.
- Topics: test plan, baseline, inspection evidence, handover.
- Limitation: public scope; actual tests and acceptance limits require the applicable full standard and product instructions.

### tech-iec-maintenance — IEC 62446-2 maintenance scope

- Publisher: IEC.
- URL: https://webstore.iec.ch/en/publication/27382
- Visible version/date: IEC 62446-2:2020.
- Verified claim: distinguishes preventive, corrective and performance-related maintenance for grid-connected PV.
- Topics: O&M work orders, fault closure, planned inspections.
- Limitation: scope page; not a universal cleaning schedule or maintenance interval.

### tech-iec-monitoring — IEC 61724-1 monitoring scope

- Publisher: IEC.
- URL: https://webstore.iec.ch/en/publication/70170
- Visible version/date: IEC 61724-1:2021 RLV, edition 2.0, 2021-07-21.
- Verified claim: addresses monitoring terminology, equipment, methods and monitoring classes; the 2021 update revises irradiance/soiling coverage and introduces bifacial monitoring.
- Topics: data quality, comparable baselines, performance interpretation.
- Limitation: public scope; no claim that a simple portal or this curriculum meets a monitoring class.

### tech-doe-install — Installation and commissioning lifecycle guidance

- Publisher: US Department of Energy, Federal Energy Management Program.
- URL: https://www.energy.gov/cmei/femp/life-cycle-photovoltaic-systems-install-and-commission-photovoltaic-system
- Visible date: lifecycle navigation dated May 20, 2026; page itself has no separate revision identifier.
- Verified claim: roof compatibility/condition, weather exposure, critical fasteners, cable management and advance commissioning planning are connected project considerations.
- Topics: roof survey, mounting QA, construction hold points and closeout.
- Limitation: US federal-agency guidance contains US codes and climate examples. Academy uses decision principles only; local structural/waterproofing design and exact hardware manuals govern the installation.

### tech-doe-om — Operate and maintain an existing PV system

- Publisher: US Department of Energy, FEMP.
- URL: https://www.energy.gov/cmei/femp/life-cycle-photovoltaic-systems-operate-and-maintain-existing-photovoltaic-system
- Visible date: lifecycle collection includes May 20, 2026; undated revision on this page.
- Verified claim: planned O&M and preparation/recovery around severe weather belong to lifecycle operation.
- Topics: inspection planning, weather response, records and corrective follow-through.
- Limitation: US guidance; no universal island inspection frequency or warranty promise.

### tech-nrel-om — PV and energy-storage O&M best practices

- Publisher: NREL, Sandia, SunSpec Alliance and SuNLaMP PV O&M working group; current official host National Laboratory of the Rockies.
- URL: https://docs.nlr.gov/docs/fy19osti/73822.pdf
- Visible version/date: third edition, NREL/TP-7A40-73822, December 2018.
- Verified claim: the report treats environmental/site dependencies, O&M plans, record management, preventive/corrective work, storage safety and monitoring as related but distinct functions.
- Topics: service workflow, repair evidence, asset history, qualified-provider boundaries.
- Limitation: historic best-practice report, not 2026 tariff/safety law or current device instructions. Original nrel.gov PDF returned 502; the DOE-linked nlr.gov official copy opened successfully.

### tech-staubli-mc4 — MC4 assembly instruction MA728

- Publisher: Stäubli Electrical Connectors.
- URL: https://www.staubli.com/content/dam/ecs/technical-documentation/assembly-instructions/RE/PV_MA728-en.pdf
- Visible version/date: **04.2026, index b**, MA728, specific PV-KST4/...-UR and PV-KBT4/...-UR connector families.
- Verified claim: specified cable/tools and assembly checks matter; damaged parts are replaced; manufacturer forbids cross-mating its connectors with other manufacturers and disconnecting under load. Routing must avoid standing water and sustained mechanical stress.
- Topics: connector identity, receiving QA, isolated bench assembly, cable support, safe fault escalation.
- Limitation: applies to listed Stäubli product families. Do not copy its strip lengths, torque or tools to a different connector, including another MC4-named family. No energized connector exercise.

### tech-longi-library — Current LONGi installation/maintenance library

- Publisher: LONGi Solar, European official site.
- URL: https://wf-eu.longi.com/support-and-resources/installation-instructions
- Visible versions: installation V2 and V3; maintenance V2 and V3. V2 installation URL identifies V2.0 202508; V3 URL identifies V3.1 202511.
- Verified claim: installation and maintenance manuals are separate documents, with multiple revisions and product applicability to check.
- Topics: document control, receiving QA, model-specific mounting and environmental criteria.
- Limitation: V3 installation PDF exceeded browser size limit; V2 PDF initially opened but follow-up reads timed out. No unverified latest clamp spacing/coastal clearance is taught. Require the exact current module manual before real work.

### tech-longi-maintenance — PV module O&M manual

- Publisher: LONGi Solar Technology Co., Ltd.
- URL: https://eu-files.longi.com/api/public/dl/tfxfIagP/EN/31_Maintenance_Manual_EN_V3.0.pdf?inline=true
- Visible version/date: V3.0 in official filename; no publication date confirmed in inspected introduction.
- Verified claim: manual explicitly covers inspection, cleaning, obstruction management, normal problem handling and retaining O&M records.
- Topics: documented module care and inspection scope.
- Limitation: exact water/chemical limits were not extracted; follow-up fetch timed out. Do not invent universal pressure, detergent or cleaning frequency. Original old V15 search mentions coastal corrosion but its PDF exceeded tool size limit; no numeric coastal setback is adopted.

### tech-victron-install — MultiPlus-II 230V installation

- Publisher: Victron Energy.
- URL: https://www.victronenergy.com/media/pg/MultiPlus-II_230V/en/installation.html
- Visible version/date: live manual, publication date blank; accessed 2026-09-07 (copyright 2026 is not a publication date).
- Verified claim: installation is for qualified electrical personnel; location/ventilation, AC/DC disconnection, model-specific battery cables/fuses, continuous protective grounding and operational neutral relay behavior are addressed.
- Topics: equipment room, physical interfaces, battery cable review, backup-mode protection.
- Limitation: **230V family only**. Neutral/RCD examples depend on this transformered product and configuration; do not apply to every hybrid inverter. No claim of Thai interconnection approval.

### tech-victron-config — MultiPlus-II 230V configuration

- Publisher: Victron Energy.
- URL: https://www.victronenergy.com/media/pg/MultiPlus-II_230V/en/configuration.html
- Visible version/date: live manual, undated.
- Verified claim: configuration includes product settings and specific configuration tools; settings are part of commissioning documentation.
- Topics: approved configuration baseline, firmware/configuration change control.
- Limitation: no generic settings file, grid code, charge setpoint or commissioning authorization is supplied.

### tech-victron-dc — Wiring Unlimited, DC wiring

- Publisher: Victron Energy; author Margreet Leeftink.
- URL: https://www.victronenergy.com/media/pg/The_Wiring_Unlimited_book/en/dc-wiring.html
- Visible version/date: live online book, undated.
- Verified claim: fuse selection requires voltage/current and interrupt-rating considerations; lithium fault current, connection resistance and torque can matter independently of normal load current.
- Topics: protection schedule, voltage-drop case arithmetic, terminations, shunt placement.
- Limitation: product-oriented guidance, not Thai ampacity code; reference tables and simplified sizing rules are not adopted as universal cable design.

### tech-victron-bms — Lithium NG system design/BMS guide

- Publisher: Victron Energy.
- URL: https://www.victronenergy.com/media/pg/Lithium_NG_battery_25,6_V/en/system-design-and-bms-selection-guide.html
- Visible version/date: live Lithium NG 25.6V manual, undated.
- Verified claim: BMS signals distinguish low-cell/load inhibition from charge inhibition due to high-cell/temperature conditions; battery data travel through specified BMS links.
- Topics: compatible battery/BMS generation, charge/discharge permissions, safe diagnosis.
- Limitation: NG family and specified BMS models only; no bypass, universal cell threshold or instructions to recover a damaged battery.

### tech-victron-battery — Lithium NG installation

- Publisher: Victron Energy.
- URL: https://www.victronenergy.com/media/pg/Lithium_NG_battery_25,6_V/en/installation.html
- Visible version/date: live manual, undated.
- Verified claim: battery installation includes mounting, cable/fuse selection, BMS connection, charger settings and commissioning; mixing constraints depend on series/parallel arrangement.
- Topics: receiving/handling, compatibility evidence, controlled battery handover.
- Limitation: exact arrangement/part numbers govern; never infer that arbitrary lithium modules can be mixed because voltage labels match.

### tech-victron-mppt — SmartSolar fault diagnosis

- Publisher: Victron Energy.
- URL: https://www.victronenergy.com/media/pg/Manual_SmartSolar_MPPT_150-60_up_to_250-70/en/troubleshooting.html
- Visible version/date: live manual for 150/60–250/70 range, undated.
- Verified claim: low yield or absent charging can arise from configuration/external control, PV availability, cable losses, battery state or temperature, not only equipment failure; dangerous measurements require qualified technicians.
- Topics: symptom separation, supplied-log analysis, evidence before replacement.
- Limitation: manual covers specified models. Academy does not reproduce its live measurement procedures or assume every fault is safe to reset.

### tech-victron-vrm — VRM alarms and monitoring

- Publisher: Victron Energy.
- URL: https://www.victronenergy.com/media/pg/VRM_Portal_manual/en/alarms-and-monitoring.html
- Visible version/date: live manual, undated.
- Verified claim: communication monitoring and device alarms are separate; user alarm thresholds/hysteresis and notification delivery can be configured/tested.
- Topics: stale versus zero data, alarm ownership, signal/noise, notification tests.
- Limitation: portal behavior is product-specific; notification delivery is not guaranteed emergency protection. Exercise thresholds are fictional operational examples.

### tech-victron-ev — EV Charging Station installation

- Publisher: Victron Energy.
- URL: https://www.victronenergy.com/media/pg/EV_Charging_Station/en/installation.html
- Visible version/date: live manual, undated.
- Verified claim: installer qualification, mounting conditions and dedicated equipment installation precautions are explicit.
- Topics: EV branch/load interface, parking environment, commissioning ownership.
- Limitation: representative EVCS only; charger DC-leakage detection and upstream RCD/MCB requirements must come from exact equipment documentation and applicable local design.

### tech-osha-falls — Solar work at height

- Publisher: US Occupational Safety and Health Administration.
- URL: https://www.osha.gov/green-jobs/solar/falls
- Visible date: undated public guidance; retrieved current page text through web search; direct-open intermittently failed.
- Verified claim: roof edges/skylights, shrinking access space as modules are placed, and carrying modules on ladders create hazards; lifting and fall-protection planning are important.
- Topics: access/lift plan, roof sequencing, stopping when conditions change.
- Limitation: US good-practice comparison, not Thai law; no US height threshold is taught as a Thai rule.

## Curriculum map — post-foundation, nine lessons each

Every lesson will include four substantial sections, an original island-property worked example, a different exercise and model answer, a checklist, five application questions and source IDs. English, Hebrew and Thai will carry the same decisions and numbers. Timings are learning estimates, not field job estimates.

| Lesson | Installer competency and evidence | Main sources |
|---|---|---|
| I1 | Verify issued design, access plan, scope/authorization and safe mobilisation; produce a hold-point register. | pea-regulatory, eit-catalog, doe-install, osha-falls |
| I2 | Read roof/structure evidence; separate strength, anchors, waterproofing and access; identify unresolved loading information. | doe-install, longi-library, eit-catalog |
| I3 | Receive traceable parts and assess salt/humidity/UV exposure; quarantine mismatches; create environmental QA evidence. | longi-library, staubli-mc4, doe-install |
| I4 | Follow the approved string plan, routes and correct connector process; use isolated mockups and invented voltage-drop arithmetic. | iec-array, staubli-mc4, victron-dc |
| I5 | Reconcile DC/AC protection, bonding, earthing and surge schedules with the design; distinguish equipment-specific neutral behavior. | iec-array, victron-install, victron-dc, eit-catalog |
| I6 | Prepare inverter/battery location, mechanical support, compatible interfaces and BMS handover. | victron-install, victron-battery, victron-bms |
| I7 | Coordinate backup circuits, EV branch capacity, cable routes and site load priorities without improvised transfer arrangements. | victron-install, victron-ev, pea-regulatory |
| I8 | Complete de-energized pre-commissioning inspection, record nonconformances and hand over traceable as-built evidence. | iec-commission, doe-install, nrel-om |
| I9 | Supervised installation capstone integrating roof, delivered equipment, wiring evidence, change control and handover. | I1–I8 references, original scenario |

| Lesson | Service/commissioning/O&M competency and evidence | Main sources |
|---|---|---|
| S1 | Triage the call, identify urgent exclusions, preserve logs and write a safe diagnosis plan. | nrel-om, victron-mppt, victron-install |
| S2 | Build a commissioning acceptance matrix and establish measurement quality from supplied data. | iec-commission, iec-monitoring, doe-install |
| S3 | Separate array, MPPT, inverter, grid and load causes; use a bounded evidence tree. | victron-mppt, victron-config, iec-monitoring |
| S4 | Diagnose BMS permission, battery capacity and backup-load issues without bypassing protection. | victron-bms, victron-battery, victron-install |
| S5 | Distinguish missing/stale data from zero generation; set accountable alerts and comparable baselines. | victron-vrm, iec-monitoring, nrel-om |
| S6 | Plan condition-based maintenance, module care and weather recovery; retain before/after evidence. | iec-maintenance, doe-om, longi-maintenance |
| S7 | Investigate EV/site-load interaction and backup limitations; prove the symptom before replacing hardware. | victron-ev, victron-install, victron-vrm |
| S8 | Control replacements, firmware/configuration, warranty evidence and proportionate recommissioning. | pea-regulatory, victron-config, iec-commission, nrel-om |
| S9 | Supervised multi-fault service capstone: contain danger, diagnose from logs, route repair, verify and teach back. | S1–S8 references, original scenario |

## Assessment boundary

Installer evidence is an accepted construction package and observed safe workmanship on approved isolated training tasks. Service evidence is a reproducible diagnosis, documented repair scope, verified acceptance and customer handback. Both capstones require a human assessor; dangerous omissions cannot be offset by a high multiple-choice score. Academy lesson pass score is 80% (4/5), separate from practical qualification.

## Authoring and validation outcome

Completed `academy/curriculum/technical.json`: two distinct post-foundation tracks, nine lessons each; 72 teaching sections with 144 multilingual paragraphs; 18 original worked cases and separate learner exercises; 90 unique practical questions with four translated options and explanations; two supervised role capstones. All 21 registered primary sources are used, and every section/lesson reference resolves. Access date remains 2026-09-07.

Validation checked JSON parsing, schema cardinalities, all English/Hebrew/Thai translation values, cross-script contamination, unique questions, answer bounds and balanced correct-answer positions (23/23/22/22). Teaching length excluding quiz is 516–597 English words per lesson. Hebrew conveys the same concepts more compactly (346–440 whitespace words); Thai was assessed as continuous-language prose rather than English-style word counts. No source text was copied as teaching paragraphs; worked property cases and numerical assumptions are invented and labeled.

The curriculum uses exact-model reference boundaries, never generalizes manufacturer settings or US OSHA thresholds to Thailand, preserves protection, and separates knowledge checks from human practical assessment and actual authority to energize. Current tariffs are not taught or assumed. Public IEC/EIT material is used only within the available scope/catalog evidence.

## Final source-link GET verification (2026-09-07)

- `tech-nrel-om`: switched the user-facing PDF URL from `www.nlr.gov` to the current official document host, https://docs.nlr.gov/docs/fy19osti/73822.pdf . A direct GET returned 200, Content-Type application/pdf and a valid PDF signature. The official publication record confirms report NREL/TP-7A40-73822, third edition (2018), DOI 10.2172/1489002. Its durable DOE/OSTI bibliographic fallback https://www.osti.gov/biblio/1489002 also returned GET 200. The old www host was inconsistent across requests (403/404/timeout), so it is no longer the curriculum link.
- `tech-longi-maintenance`: retained the exact PDF link currently published on LONGi’s official installation/maintenance library: https://eu-files.longi.com/api/public/dl/tfxfIagP/EN/31_Maintenance_Manual_EN_V3.0.pdf?inline=true . Direct GET returned 200, Content-Type application/pdf and a valid PDF signature. The no-query variant also returned GET 200; the web extraction tool timed out, which does not establish a missing document. The official library still labels and links it as Maintenance Manual V3. Treat HEAD-only failures as inconclusive and retry GET when checking these document hosts.
