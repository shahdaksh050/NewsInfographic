import json
import os
from datetime import datetime, timedelta
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import CellIsRule

def get_30day_topics():
    # Load base 50 topics from fixtures/topics_50.json
    base_json = os.path.join(os.path.dirname(__file__), 'fixtures', 'topics_50.json')
    with open(base_json, 'r', encoding='utf-8') as f:
        data = json.load(f)
    base_articles = data['articles'][:50]

    # Additional 100 curated, high-yield, officially sourced UPSC topics (Days 11 to 30)
    extra_topics = [
        # DAY 11
        {
            "day": 11, "slot": 1, "gs": "GS1", "cat": "Art & Culture",
            "title": "Chhatrapati Shivaji Maharaj's Maratha Military Forts & UNESCO World Heritage",
            "desc": "Showcasing guerilla warfare geography across the Sahyadri ranges, 12 forts including Raigad and Shivneri reflect advanced hill-fortification and naval defense strategies.",
            "src": "ASI / Ministry of Culture / GS1"
        },
        {
            "day": 11, "slot": 2, "gs": "GS2", "cat": "Polity & Constitution",
            "title": "Delimitation Commission and Article 82: Population vs Representation Debate",
            "desc": "Delimitation redraws parliamentary constituency boundaries based on the latest census. Freezing seats until the post-2026 census addresses federal balance between growing and family-planning states.",
            "src": "Election Commission of India / Law Ministry / GS2"
        },
        {
            "day": 11, "slot": 3, "gs": "GS3", "cat": "Economy & Industry",
            "title": "PM-MITRA Mega Textile Parks: Integrated World-Class Supply Chains",
            "desc": "Setting up 7 plug-and-play textile mega parks with world-class logistics to boost FDI, scale value-addition from farm to fashion, and rival global manufacturing hubs.",
            "src": "Ministry of Textiles / PIB / GS3"
        },
        {
            "day": 11, "slot": 4, "gs": "GS3", "cat": "Environment & Ecology",
            "title": "Project Great Indian Bustard: Supreme Court Right to Clean Climate Landmark",
            "desc": "In MK Ranjitsinh v. Union of India, the Supreme Court recognized the constitutional right to be free from adverse climate impacts while balancing renewable energy lines with GIB protection.",
            "src": "Supreme Court of India / MoEFCC / GS3"
        },
        {
            "day": 11, "slot": 5, "gs": "GS4", "cat": "Ethics & Technology",
            "title": "Ethical Dilemmas in Automated Law Enforcement and Facial Recognition",
            "desc": "Balancing algorithmic predictive policing against privacy, false-positive biases on marginalized groups, and the lack of algorithmic accountability under administrative law.",
            "src": "DoPT / NITI Aayog Case Study / GS4"
        },

        # DAY 12
        {
            "day": 12, "slot": 1, "gs": "GS1", "cat": "Ancient History",
            "title": "Dholavira Water Management: Ancient Harappan Hydraulic Engineering",
            "desc": "Excavations in the Rann of Kutch reveal a sophisticated cascade of stepped reservoirs, bunds, and storm-water drains, proving arid-zone urban resilience in 2500 BCE.",
            "src": "Archaeological Survey of India / UNESCO / GS1"
        },
        {
            "day": 12, "slot": 2, "gs": "GS2", "cat": "Governance & Justice",
            "title": "Bharatiya Nyaya Sanhita (BNS): Reforming Colonial Criminal Jurisprudence",
            "desc": "Replacing the 1860 Indian Penal Code, BNS introduces community service punishments, precise terrorism definitions, electronic evidence admissibility, and gender-neutral cruelty provisions.",
            "src": "Ministry of Home Affairs / Official Gazette / GS2"
        },
        {
            "day": 12, "slot": 3, "gs": "GS3", "cat": "Science & Industry",
            "title": "India Semiconductor Mission: Silicon Fabs and ATMP Packaging in Dholera",
            "desc": "With ₹76,000 crore incentive framework, ISM anchors domestic semiconductor manufacturing, OSAT testing, and chip design to eliminate critical supply chain vulnerabilities.",
            "src": "MeitY / PIB Press Release / GS3"
        },
        {
            "day": 12, "slot": 4, "gs": "GS3", "cat": "Science & Oceans",
            "title": "Samudrayaan & Deep Ocean Mission: Matsya 6000 Submersible Exploration",
            "desc": "Indigenous crewed submersible Matsya 6000 explores 6,000-meter deep seabed for polymetallic nodules, cobalt crusts, and benthic biodiversity, advancing India's Blue Economy.",
            "src": "Ministry of Earth Sciences / NIOT / GS3"
        },
        {
            "day": 12, "slot": 5, "gs": "GS2", "cat": "International Relations",
            "title": "India-Middle East-Europe Economic Corridor (IMEEC): Maritime-Rail Pivot",
            "desc": "Launched at the G20 New Delhi Summit, IMEEC integrates ship-to-rail transit networks connecting India, UAE, Saudi Arabia, Jordan, Israel, and Europe as a sustainable trade artery.",
            "src": "Ministry of External Affairs / G20 Secretariat / GS2"
        },

        # DAY 13
        {
            "day": 13, "slot": 1, "gs": "GS1", "cat": "Modern History",
            "title": "Birsa Munda and the Ulgulan: Tribal Resistance and Land Autonomy",
            "desc": "Birsa Munda's 1899-1900 rebellion against British colonial exploitation and the Thikadars led to the Chotanagpur Tenancy Act 1908, safeguarding Adivasi land rights.",
            "src": "Ministry of Tribal Affairs / National Archives / GS1"
        },
        {
            "day": 13, "slot": 2, "gs": "GS2", "cat": "Governance & Digital Rights",
            "title": "Digital Personal Data Protection (DPDP) Act 2023: Privacy Architecture",
            "desc": "Enshrining the Puttaswamy privacy doctrine, the Act establishes Data Fiduciaries, Data Protection Board, consent requirements, and heavy penalties for unauthorized data breaches.",
            "src": "MeitY / Ministry of Law / GS2"
        },
        {
            "day": 13, "slot": 3, "gs": "GS3", "cat": "Energy & Climate",
            "title": "National Green Hydrogen Mission: SIGHT Programme and Electrolyser Manufacturing",
            "desc": "Aiming for 5 MMT annual green hydrogen production by 2030, the SIGHT scheme provides financial incentives to localize electrolyser fabrication and decarbonize refineries and fertilizer units.",
            "src": "MNRE / PIB / GS3"
        },
        {
            "day": 13, "slot": 4, "gs": "GS3", "cat": "Wildlife & Biodiversity",
            "title": "Cheetah Reintroduction in Kuno National Park: Inter-Continental Translocation",
            "desc": "The world's first inter-continental large-carnivore translocation from Namibia and South Africa aims to restore India's degraded savannah and open-forest grassland ecosystems.",
            "src": "National Tiger Conservation Authority / MoEFCC / GS3"
        },
        {
            "day": 13, "slot": 5, "gs": "GS4", "cat": "Ethics & Corporate Governance",
            "title": "Whistleblower Protection and Corporate Ethics: Lessons from Regulatory Scrutiny",
            "desc": "Examining statutory protections under the Whistle Blowers Protection Act and SEBI LODR regulations to shield internal whistleblowers exposing systemic accounting irregularities.",
            "src": "Law Commission / CVC / GS4"
        },

        # DAY 14
        {
            "day": 14, "slot": 1, "gs": "GS1", "cat": "Medieval Culture",
            "title": "Bhakti Movement and Sant Kabir: Syncretic Socio-Religious Reformation",
            "desc": "Rejecting ritualism and caste hierarchies through vernacular dohas, Sant Kabir pioneered nirguna bhakti, inspiring egalitarian social unity across medieval India.",
            "src": "Ministry of Culture / Sahitya Akademi / GS1"
        },
        {
            "day": 14, "slot": 2, "gs": "GS2", "cat": "Constitution & Judiciary",
            "title": "Supreme Court Constitution Bench Verdict on Article 370 Abrogation",
            "desc": "Upholding the constitutional validity of CO 272 and 273, the 5-judge bench reaffirmed asymmetric federalism boundaries while directing restoration of statehood and assembly elections.",
            "src": "Supreme Court Records / GS2"
        },
        {
            "day": 14, "slot": 3, "gs": "GS3", "cat": "Infrastructure & Logistics",
            "title": "PM Gati Shakti National Master Plan: Integrated Multimodal Planning",
            "desc": "A GIS-based digital platform breaking departmental silos across 16 ministries, synchronizing road, rail, air, and water connectivity projects to slash logistics costs from 14% to 8% of GDP.",
            "src": "DPIIT / Ministry of Commerce / GS3"
        },
        {
            "day": 14, "slot": 4, "gs": "GS3", "cat": "Environment & Coastal Ecology",
            "title": "MISHTI Scheme: Mangrove Conservation for Shoreline Climate Resilience",
            "desc": "Mangrove Initiative for Shoreline Habitats and Tangible Incomes coordinates CAMPA and MGNREGS funds to plant mangroves across 540 sq km of coastline, blunting storm surges.",
            "src": "MoEFCC / PIB / GS3"
        },
        {
            "day": 14, "slot": 5, "gs": "GS3", "cat": "National Security & Diplomacy",
            "title": "Operation Kaveri: Humanitarian Evacuation from Civil Conflict Zones",
            "desc": "Coordinating Indian Navy stealth frigates and IAF C-130J transport aircraft, India successfully evacuated over 3,800 citizens and foreign nationals from crisis-hit Sudan.",
            "src": "Ministry of External Affairs / Indian Navy / GS3"
        },

        # DAY 15
        {
            "day": 15, "slot": 1, "gs": "GS1", "cat": "Art & Architecture",
            "title": "Temple Architecture Styles: Nagara, Dravida, and Vesara Evolution",
            "desc": "From the curved shikhara and cruciform ground plan of Nagara to the pyramidal vimana and majestic gopurams of Dravida, architectural canons reflected regional sacred geometry.",
            "src": "Archaeological Survey of India / GS1"
        },
        {
            "day": 15, "slot": 2, "gs": "GS2", "cat": "Federalism & Water Governance",
            "title": "Inter-State River Water Disputes: Article 262 and Tribunal Stalemates",
            "desc": "Examining the Inter-State River Water Disputes Act 1956 and Cauvery/Krishna disputes, highlighting the necessity of a single permanent tribunal with institutional data monitoring.",
            "src": "Ministry of Jal Shakti / Law Commission / GS2"
        },
        {
            "day": 15, "slot": 3, "gs": "GS3", "cat": "Financial Technology",
            "title": "UPI Global Linkages: Internationalization of India's Digital Public Infrastructure",
            "desc": "Linking NPCI's UPI with Singapore's PayNow, UAE's Jaywan, and France's Lyra enables real-time cross-border remittances, lowering fees and dedollarizing bilateral micro-payments.",
            "src": "Reserve Bank of India / NPCI / GS3"
        },
        {
            "day": 15, "slot": 4, "gs": "GS3", "cat": "Science & Space",
            "title": "Aditya-L1 Solar Mission: Heliophysics Research at Lagrange Point L1",
            "desc": "Stationed 1.5 million km from Earth in a halo orbit around L1, Aditya-L1 continuously tracks coronal mass ejections, solar flares, and space weather without eclipse disruptions.",
            "src": "ISRO / Department of Space / GS3"
        },
        {
            "day": 15, "slot": 5, "gs": "GS4", "cat": "Ethics & Administration",
            "title": "Compassion in Civil Administration: District Collector Grievance Redressal",
            "desc": "Case study analyzing how administrative empathy transformed grievance redressal in aspirational districts through door-step pensions and disability certification drives.",
            "src": "DARPG / Mission Karmayogi / GS4"
        },

        # DAY 16
        {
            "day": 16, "slot": 1, "gs": "GS1", "cat": "Physical Geography",
            "title": "Indian Monsoon Dynamics: El Niño, La Niña, and the Indian Ocean Dipole",
            "desc": "Analyzing teleconnections between equatorial Pacific sea-surface temperatures and summer monsoons, and how positive IOD events buffer India against El Niño rain deficits.",
            "src": "India Meteorological Department / MoES / GS1"
        },
        {
            "day": 16, "slot": 2, "gs": "GS2", "cat": "Electoral Reforms",
            "title": "Supreme Court Struck Down Electoral Bonds: Landmark Transparency Verdict",
            "desc": "A unanimous 5-judge bench held anonymous electoral bonds unconstitutional under Article 19(1)(a), establishing voters' fundamental right to information regarding political donor funding.",
            "src": "Supreme Court Records / ADR / GS2"
        },
        {
            "day": 16, "slot": 3, "gs": "GS3", "cat": "Economy & Manufacturing",
            "title": "Production Linked Incentive (PLI) Schemes: Driving Scale Across 14 Sectors",
            "desc": "Targeting electronics, pharma, green mobility, and specialty steel, PLI schemes tie budgetary outlays of ₹1.97 lakh crore to incremental domestic sales, creating global export leaders.",
            "src": "NITI Aayog / DPIIT / GS3"
        },
        {
            "day": 16, "slot": 4, "gs": "GS3", "cat": "Environment & Island Development",
            "title": "Great Nicobar Island Infrastructure Project: Strategic vs Ecological Balance",
            "desc": "The ₹72,000 crore holistic development of Galathea Bay involves a transshipment port, airstrip, and power plant, requiring compensatory afforestation and tribal Shompen safeguards.",
            "src": "NITI Aayog / MoEFCC / GS3"
        },
        {
            "day": 16, "slot": 5, "gs": "GS2", "cat": "International Relations",
            "title": "Voice of Global South Summit: Championing Inclusivity in Multilateral Fora",
            "desc": "Convening over 120 developing nations, India amplified Global South priorities on climate finance, debt restructuring, food security, and inclusion of the African Union into G20.",
            "src": "Ministry of External Affairs / GS2"
        },

        # DAY 17
        {
            "day": 17, "slot": 1, "gs": "GS1", "cat": "Modern History",
            "title": "Deccan Riots of 1875: Moneylender Exploitation and Agricultural Debt",
            "desc": "Triggered by oppressive colonial Ryotwari land revenue and usurious moneylender debt, peasant uprisings in Pune and Ahmednagar led to the Deccan Agriculturists' Relief Act 1879.",
            "src": "National Archives of India / GS1"
        },
        {
            "day": 17, "slot": 2, "gs": "GS2", "cat": "Constitutional Reforms",
            "title": "Simultaneous Elections: Kovind Committee Recommendations on One Nation One Poll",
            "desc": "Proposing synchronization of Lok Sabha and State Legislative Assemblies followed by local body elections within 100 days, analyzing implications on federalism and constitutional amendments.",
            "src": "High-Level Committee on Simultaneous Elections / GS2"
        },
        {
            "day": 17, "slot": 3, "gs": "GS3", "cat": "Banking & Economy",
            "title": "Insolvency and Bankruptcy Code (IBC) 2016: Resolving Stressed Assets",
            "desc": "Shifting control from debtor-in-possession to creditor-in-control, the IBC resolved over ₹3.4 lakh crore in bad debt, establishing the NCLT and maximizing corporate enterprise value.",
            "src": "Insolvency and Bankruptcy Board of India / GS3"
        },
        {
            "day": 17, "slot": 4, "gs": "GS3", "cat": "Pollution & Environment",
            "title": "National Clean Air Programme (NCAP): Multi-City Air Quality Targets",
            "desc": "Covering 131 non-attainment cities, NCAP mandates 40% reduction in PM10 and PM2.5 concentrations by 2026 through vehicular transition, mechanized sweeping, and industrial monitors.",
            "src": "Central Pollution Control Board / MoEFCC / GS3"
        },
        {
            "day": 17, "slot": 5, "gs": "GS3", "cat": "Defense & Self-Reliance",
            "title": "INS Vikrant: Indigenous Aircraft Carrier Commissioning and Naval Power",
            "desc": "Built with 76% indigenous content by Cochin Shipyard, the 45,000-tonne carrier features ski-jump STOBAR operations, anchoring carrier battle group dominance in the Indian Ocean.",
            "src": "Indian Navy / Ministry of Defence / GS3"
        },

        # DAY 18
        {
            "day": 18, "slot": 1, "gs": "GS1", "cat": "Heritage & Geography",
            "title": "Traditional Rainwater Harvesting: Baolis, Johads, and Zing Systems",
            "desc": "From Gujarat's stepwells and Rajasthan's earthen johads to Ladakh's glacial-melt zings, traditional indigenous water systems embody community-led climate adaptation.",
            "src": "Ministry of Jal Shakti / INTACH / GS1"
        },
        {
            "day": 18, "slot": 2, "gs": "GS2", "cat": "Judiciary & Governance",
            "title": "Tribunalisation of Justice: Judicial Independence and Article 323A/B",
            "desc": "Examining L. Chandra Kumar and Madras Bar Association rulings, affirming that tribunals cannot bypass High Court judicial review and must maintain executive independence.",
            "src": "Supreme Court Records / Law Ministry / GS2"
        },
        {
            "day": 18, "slot": 3, "gs": "GS3", "cat": "Agriculture & Technology",
            "title": "Agri-Stack & Digital Public Infrastructure for Indian Farmers",
            "desc": "Creating a foundational digital registry of farmers, geo-referenced land parcels, and crop-sown data to automate targeted crop insurance, credit disbursement, and MSP procurement.",
            "src": "Ministry of Agriculture / PIB / GS3"
        },
        {
            "day": 18, "slot": 4, "gs": "GS3", "cat": "Science & Space",
            "title": "Gaganyaan Programme: India's Indigenous Human Spaceflight Capability",
            "desc": "Carrying a 3-member crew to a 400 km low-Earth orbit for 3 days, Gaganyaan qualifies India's human-rated LVM3 launch vehicle, environmental life support, and crew escape systems.",
            "src": "ISRO / Department of Space / GS3"
        },
        {
            "day": 18, "slot": 5, "gs": "GS4", "cat": "Administrative Ethics",
            "title": "Nolan Principles of Public Life: Selflessness and Integrity in Public Service",
            "desc": "Evaluating how the 7 Nolan principles—selflessness, integrity, objectivity, accountability, openness, honesty, and leadership—govern public officials facing corrupt executive pressures.",
            "src": "Second Administrative Reforms Commission / DoPT / GS4"
        },

        # DAY 19
        {
            "day": 19, "slot": 1, "gs": "GS1", "cat": "Freedom Movement",
            "title": "Women in Indian Freedom Struggle: Matangini Hazra and Aruna Asaf Ali",
            "desc": "Highlighting the fearless leadership of 73-year-old Matangini Hazra during Quit India in Tamluk and Aruna Asaf Ali hoisting the Tricolour at Gowalia Tank Maidan.",
            "src": "National Archives of India / Ministry of Culture / GS1"
        },
        {
            "day": 19, "slot": 2, "gs": "GS2", "cat": "Federalism & Polity",
            "title": "Governor's Discretionary Powers under Article 200 and Bill Assent Deadlocks",
            "desc": "The Supreme Court clarified that Governors cannot sit indefinitely on bills passed by elected state legislatures, reiterating constitutional conventions in Punjab and Tamil Nadu cases.",
            "src": "Supreme Court Records / Law Ministry / GS2"
        },
        {
            "day": 19, "slot": 3, "gs": "GS3", "cat": "Monetary Policy & FinTech",
            "title": "Central Bank Digital Currency (e-Rupee): Retail and Wholesale Pilots",
            "desc": "The RBI's digital sovereign rupee operates without commercial bank intermediary risk, slashing currency printing costs, enabling programmable subsidies, and cross-border settlement.",
            "src": "Reserve Bank of India Bulletin / GS3"
        },
        {
            "day": 19, "slot": 4, "gs": "GS3", "cat": "Ecology & Water Rivers",
            "title": "Namami Gange Mission: Aviral and Nirmal Dhara River Rejuvenation",
            "desc": "Integrating 400+ sewage treatment plants, industrial effluent monitoring, ghat beautification, and river dolphin conservation across the 2,525 km Ganga basin.",
            "src": "National Mission for Clean Ganga / Jal Shakti / GS3"
        },
        {
            "day": 19, "slot": 5, "gs": "GS2", "cat": "International Trade",
            "title": "India-EFTA Trade & Economic Partnership: $100 Billion Investment Commitment",
            "desc": "Signing with Switzerland, Norway, Iceland, and Liechtenstein, India secured a binding $100B investment over 15 years in exchange for tariff concessions on non-agricultural machinery.",
            "src": "Ministry of Commerce and Industry / GS2"
        },

        # DAY 20
        {
            "day": 20, "slot": 1, "gs": "GS1", "cat": "Physical Geography",
            "title": "Western Ghats: Biodiversity Hotspot, Endemism, and Ecological Fragility",
            "desc": "Older than the Himalayas, the Sahyadri range influences Indian monsoon weather and shelters over 5,000 flowering plant species, requiring Kasturirangan report conservation zones.",
            "src": "Botanical Survey of India / MoEFCC / GS1"
        },
        {
            "day": 20, "slot": 2, "gs": "GS2", "cat": "Social Welfare & Poverty",
            "title": "NITI Aayog National Multidimensional Poverty Index: Dramatic Poverty Decline",
            "desc": "Analyzing multidimensional deprivations across health, education, and living standards, India lifted 24.8 crore people out of multidimensional poverty in 9 years.",
            "src": "NITI Aayog / UNDP India / GS2"
        },
        {
            "day": 20, "slot": 3, "gs": "GS3", "cat": "Deep Science & Tech",
            "title": "National Quantum Mission: Quantum Computing and Secure Communications",
            "desc": "With ₹6,003 crore funding, NQM develops 50-1000 qubit quantum computers, satellite-based quantum key distribution (QKD), and ultrasensitive quantum magnetometers.",
            "src": "Department of Science and Technology / PIB / GS3"
        },
        {
            "day": 20, "slot": 4, "gs": "GS3", "cat": "Renewable Energy",
            "title": "India's 500 GW Non-Fossil Energy Target by 2030: The Green Energy Transition",
            "desc": "Rapidly scaling solar parks, ultra-mega wind corridors, and green energy open-access rules to fulfill COP26 Panchamrit pledges and decarbonize heavy industry.",
            "src": "Central Electricity Authority / MNRE / GS3"
        },
        {
            "day": 20, "slot": 5, "gs": "GS4", "cat": "Development Ethics",
            "title": "Development vs Displacement: Ethical Matrix in Tribal Rehabilitation",
            "desc": "Examining ethical obligations under PESA and FRA 2006 to ensure free, prior, and informed consent for Adivasi communities displaced by mega-irrigation and coal mining projects.",
            "src": "Ministry of Tribal Affairs / Ethics Case Study / GS4"
        },

        # DAY 21
        {
            "day": 21, "slot": 1, "gs": "GS1", "cat": "Culture & Linguistics",
            "title": "Classical Languages of India: Antiquity Criteria and Cultural Heritage",
            "desc": "With the inclusion of Marathi, Pali, Prakrit, Assamese, and Bengali alongside Sanskrit and Tamil, classical status honors high antiquity and distinct literary traditions.",
            "src": "Ministry of Culture / Sahitya Akademi / GS1"
        },
        {
            "day": 21, "slot": 2, "gs": "GS2", "cat": "Gender & Parliament",
            "title": "Nari Shakti Vandan Adhiniyam: 106th Constitutional Amendment Act",
            "desc": "Mandating 33% reservation for women in Lok Sabha and State Legislative Assemblies for 15 years, operationalized post-census delimitation to bridge gender political representation gaps.",
            "src": "Ministry of Law and Justice / Gazette / GS2"
        },
        {
            "day": 21, "slot": 3, "gs": "GS3", "cat": "Agriculture & Welfare",
            "title": "PM KISAN Direct Benefit Transfer: Liquidity Support for Smallholders",
            "desc": "Transferring ₹6,000 annually in three equal tranches directly to 11+ crore farmers' Aadhaar-linked accounts, PM KISAN provides timely liquidity for seeds, fertilizers, and inputs.",
            "src": "Ministry of Agriculture / PIB / GS3"
        },
        {
            "day": 21, "slot": 4, "gs": "GS3", "cat": "Environment & Ecology",
            "title": "National Mission on Biodiversity and Human Well-Being",
            "desc": "Integrating biodiversity science with public health, agricultural resilience, and rural bio-economies to conserve agro-biodiversity and combat zoonotic disease spillovers.",
            "src": "National Biodiversity Authority / MoEFCC / GS3"
        },
        {
            "day": 21, "slot": 5, "gs": "GS3", "cat": "Defense & Indigenous Industry",
            "title": "Project 75I: Advanced Air-Independent Propulsion (AIP) Submarines",
            "desc": "Equipping diesel-electric submarines with fuel-cell Air-Independent Propulsion extends submerged endurance from days to weeks, countering naval threats across the Malacca Strait.",
            "src": "Indian Navy / Ministry of Defence / GS3"
        },

        # DAY 22
        {
            "day": 22, "slot": 1, "gs": "GS1", "cat": "Ancient Epigraphy",
            "title": "Ashokan Edicts: Moral Governance, Dhamma, and Ancient Inscriptions",
            "desc": "Carved on rock faces and polished monolithic pillars in Prakrit, Greek, and Aramaic, Ashoka's edicts renounced aggressive warfare in favor of non-violence and public welfare.",
            "src": "Archaeological Survey of India / GS1"
        },
        {
            "day": 22, "slot": 2, "gs": "GS2", "cat": "Social Justice & Education",
            "title": "Right to Education (RTE) Act: Section 12(1)(c) and EWS Mandates",
            "desc": "Mandating 25% quota for disadvantaged children in private non-minority schools, examining fee-reimbursement delays and learning outcome disparities across states.",
            "src": "Ministry of Education / NCPCR / GS2"
        },
        {
            "day": 22, "slot": 3, "gs": "GS3", "cat": "Telecom & Digital Tech",
            "title": "Bharat 6G Vision: Terahertz Waves and Indigenous Telecom Patents",
            "desc": "Setting up the Bharat 6G Alliance, India aims to shape international 6G standards, terahertz wireless, and intelligent network architecture, avoiding foreign tech dependencies.",
            "src": "Department of Telecommunications / PIB / GS3"
        },
        {
            "day": 22, "slot": 4, "gs": "GS3", "cat": "Wetlands & Ecology",
            "title": "Ramsar Wetlands of India: Expansion to 85+ Sites of International Importance",
            "desc": "Conserving fragile hydrological sponges from Tamil Nadu's bird sanctuaries to Ladakh's high-altitude Tso Kar, Ramsar designation enforces eco-sensitive buffer protections.",
            "src": "MoEFCC / Ramsar Convention Secretariat / GS3"
        },
        {
            "day": 22, "slot": 5, "gs": "GS2", "cat": "International Relations",
            "title": "Shanghai Cooperation Organisation (SCO): Strategic Autonomy in Eurasia",
            "desc": "Balancing counter-terrorism cooperation under RATS with regional connectivity and security dialogue, maintaining independent diplomatic equilibrium across Eurasian powers.",
            "src": "Ministry of External Affairs / SCO / GS2"
        },

        # DAY 23
        {
            "day": 23, "slot": 1, "gs": "GS1", "cat": "Medieval Sculpture",
            "title": "Chola Bronzes: Nataraja Cosmic Dance and Cire-Perdue Casting",
            "desc": "The lost-wax casting technique under the Chola dynasty produced the iconic Nataraja, symbolizing the cosmic cycle of creation (srishti) and dissolution (samhara).",
            "src": "National Museum / Tamil Nadu Archaeology / GS1"
        },
        {
            "day": 23, "slot": 2, "gs": "GS2", "cat": "Anti-Corruption & Governance",
            "title": "Central Vigilance Commission (CVC): Anti-Corruption Architecture",
            "desc": "Created on the Santhanam Committee recommendations, the CVC exercises statutory superintendence over the CBI for corruption probes involving central government servants.",
            "src": "Central Vigilance Commission / DoPT / GS2"
        },
        {
            "day": 23, "slot": 3, "gs": "GS3", "cat": "Logistics & Trade",
            "title": "National Logistics Policy (NLP) & Unified Logistics Interface Platform",
            "desc": "Integrating 30+ logistics systems across customs, railways, and ports, ULIP provides real-time container tracking, eliminating paper clearance bottlenecks and demurrage.",
            "src": "DPIIT / Ministry of Commerce / GS3"
        },
        {
            "day": 23, "slot": 4, "gs": "GS3", "cat": "Disaster Management",
            "title": "Glacial Lake Outburst Floods (GLOF) Early Warning Systems in the Himalayas",
            "desc": "Deploying automated weather stations and lake-level sensors at South Lhonak and vulnerable moraine-dammed lakes to alert downstream hydropower dams and valley settlements.",
            "src": "National Disaster Management Authority / NDMA / GS3"
        },
        {
            "day": 23, "slot": 5, "gs": "GS4", "cat": "Corporate & Financial Ethics",
            "title": "Conflict of Interest in Regulatory Watchdogs: SEBI and RBI Guidelines",
            "desc": "Case study analyzing how statutory disclosure, recusal protocols, and blind trusts prevent personal pecuniary interests from compromising securities market oversight.",
            "src": "Securities and Exchange Board of India / GS4"
        },

        # DAY 24
        {
            "day": 24, "slot": 1, "gs": "GS1", "cat": "Traditional Craft",
            "title": "Geographical Indications (GI) Registry: Protecting Indigenous Artisanship",
            "desc": "From Kashmir Pashmina and Pochampally Ikat to Darjeeling Tea, GI tags safeguard intellectual property, preserve artisan livelihoods, and prevent substandard counterfeit exports.",
            "src": "DPIIT / GI Registry Chennai / GS1"
        },
        {
            "day": 24, "slot": 2, "gs": "GS2", "cat": "Human Rights & Institutions",
            "title": "National Human Rights Commission (NHRC) and Paris Principles Compliance",
            "desc": "Evaluating NHRC powers under the Protection of Human Rights Act 1993, prison reform visits, custodial death investigations, and international accreditation criteria.",
            "src": "National Human Rights Commission / MHA / GS2"
        },
        {
            "day": 24, "slot": 3, "gs": "GS3", "cat": "Artificial Intelligence",
            "title": "IndiaAI Mission: Sovereign GPU Infrastructure and Foundational Models",
            "desc": "Investing ₹10,372 crore to build a public computing grid of 10,000+ GPUs, train multi-lingual foundational models, and finance AI startups targeting healthcare and agriculture.",
            "src": "MeitY / IndiaAI Programme / GS3"
        },
        {
            "day": 24, "slot": 4, "gs": "GS3", "cat": "Wildlife Conservation",
            "title": "Project Tiger at 50: Management Effectiveness Evaluation (MEE) of Reserves",
            "desc": "Marking 50 years of Project Tiger, scientific camera-trapping census recorded 3,682+ tigers (75% of global wild tigers), highlighting critical interstate corridor protection.",
            "src": "National Tiger Conservation Authority / WII / GS3"
        },
        {
            "day": 24, "slot": 5, "gs": "GS2", "cat": "Geopolitics & Indo-Pacific",
            "title": "The Quad: Indo-Pacific Maritime Domain Awareness (IPMDA) Initiative",
            "desc": "India, US, Japan, and Australia collaborate using commercial satellite data to track illegal fishing, maritime militia movements, and dark vessels across the Indian and Pacific Oceans.",
            "src": "Ministry of External Affairs / Quad Joint Statement / GS2"
        },

        # DAY 25
        {
            "day": 25, "slot": 1, "gs": "GS1", "cat": "Social Reform",
            "title": "Jyotirao & Savitribai Phule: Pioneer of Anti-Caste and Girls' Education",
            "desc": "Establishing India's first school for girls in Bhide Wada Pune in 1848 and founding the Satyashodhak Samaj, the Phules dismantled Brahmanical hegemony and championed widow remarriage.",
            "src": "Ministry of Social Justice / National Archives / GS1"
        },
        {
            "day": 25, "slot": 2, "gs": "GS2", "cat": "Electoral & Parliamentary Law",
            "title": "Anti-Defection Law: Tenth Schedule Interpretation and Speaker Neutrality",
            "desc": "Examining Kihoto Hollohan and recent Maharashtra legislative verdicts on whether presiding officers must resolve disqualification petitions expeditiously and objectively.",
            "src": "Supreme Court Records / Lok Sabha Secretariat / GS2"
        },
        {
            "day": 25, "slot": 3, "gs": "GS3", "cat": "Mining & Strategic Minerals",
            "title": "National Critical Minerals Mission: Lithium, Cobalt, and Rare Earth Security",
            "desc": "Auctions of offshore and critical mineral blocks in J&K, Chhattisgarh, and Karnataka aim to secure raw materials for EV batteries, aerospace, and solar panels.",
            "src": "Ministry of Mines / Geological Survey of India / GS3"
        },
        {
            "day": 25, "slot": 4, "gs": "GS3", "cat": "Waste Management & Environment",
            "title": "Plastic Waste Management Rules: Extended Producer Responsibility (EPR)",
            "desc": "Banning single-use plastics and enforcing digital EPR certificates on brand owners and packaging importers to finance formal recycling and eliminate multi-layered plastic waste.",
            "src": "MoEFCC / Central Pollution Control Board / GS3"
        },
        {
            "day": 25, "slot": 5, "gs": "GS4", "cat": "Administrative Ethics",
            "title": "Public Duty vs Official Secrecy: Ethical Dilemmas Under the OSA 1923",
            "desc": "Case study analyzing how civil servants balance classified information restrictions under the colonial Official Secrets Act against moral duty to expose public health risks.",
            "src": "Second ARC / Law Commission / GS4"
        },

        # DAY 26
        {
            "day": 26, "slot": 1, "gs": "GS1", "cat": "Post-Independence Consolidation",
            "title": "National Unity Day: Sardar Patel and the Integration of 565 Princely States",
            "desc": "Employing statesmanship, Privy Purses, and resolute firmness in Junagadh and Hyderabad, Sardar Patel and VP Menon unified sovereign India into a single constitutional republic.",
            "src": "Ministry of Home Affairs / National Archives / GS1"
        },
        {
            "day": 26, "slot": 2, "gs": "GS2", "cat": "Civil Services Reforms",
            "title": "Mission Karmayogi: Competency-Driven Civil Services Capacity Building",
            "desc": "Transitioning civil services from rules-based to roles-based performance, the iGOT Karmayogi digital platform delivers continuous online training in integrity and citizen-centric governance.",
            "src": "DoPT / Capacity Building Commission / GS2"
        },
        {
            "day": 26, "slot": 3, "gs": "GS3", "cat": "Green Finance",
            "title": "Sovereign Green Bonds: Mobilizing Domestic Capital for Decarbonization",
            "desc": "The Ministry of Finance issues rupee-denominated sovereign green bonds (SGrBs), using greenium yields to fund grid-scale solar, transmission lines, and metro rail networks.",
            "src": "Ministry of Finance / Reserve Bank of India / GS3"
        },
        {
            "day": 26, "slot": 4, "gs": "GS3", "cat": "Riverine Ecology",
            "title": "Project Dolphin: Conserving Gangetic and Indus River Dolphins",
            "desc": "Protecting endangered blind freshwater dolphins as apex river health indicators through acoustic monitoring, anti-poaching patrols, and sustainable non-destructive fishing nets.",
            "src": "MoEFCC / Wildlife Institute of India / GS3"
        },
        {
            "day": 26, "slot": 5, "gs": "GS3", "cat": "Cybersecurity & National Defense",
            "title": "Cybersecurity Threat Vectors: CERT-In Directives and Critical Infrastructure",
            "desc": "Mandating 6-hour incident reporting, CERT-In bolsters national cyber-defense across power grids, financial switches, and telecom nodes against advanced persistent threat (APT) groups.",
            "src": "MeitY / CERT-In Annual Report / GS3"
        },

        # DAY 27
        {
            "day": 27, "slot": 1, "gs": "GS1", "cat": "Post-Independence History",
            "title": "Linguistic Reorganisation of States: Fazal Ali Commission of 1953",
            "desc": "Following Potti Sreeramulu's hunger strike, the States Reorganisation Act 1956 harmonized linguistic aspirations with administrative unity, cementing democratic federalism.",
            "src": "Ministry of Home Affairs / National Archives / GS1"
        },
        {
            "day": 27, "slot": 2, "gs": "GS2", "cat": "Grassroots Democracy",
            "title": "Social Audit Under MGNREGA: Institutionalizing Citizen Oversight",
            "desc": "Empowering Gram Sabhas to independently scrutinize muster rolls, work completion certificates, and wage disbursals, eliminating ghost beneficiaries and contractor collusion.",
            "src": "Ministry of Rural Development / CAG / GS2"
        },
        {
            "day": 27, "slot": 3, "gs": "GS3", "cat": "Blue Economy & Fisheries",
            "title": "Pradhan Mantri Matsya Sampada Yojana: Modernizing India's Marine Fisheries",
            "desc": "With ₹20,050 crore outlay, PMMSY finances deep-sea fishing vessels, biofloc ponds, cold chain logistics, and sea-cage farming, transforming India into the #2 aquaculture producer.",
            "src": "Department of Fisheries / PIB / GS3"
        },
        {
            "day": 27, "slot": 4, "gs": "GS3", "cat": "Climate Action & Citizen Movement",
            "title": "Mission LiFE (Lifestyle for Environment): Sustainable Living Framework",
            "desc": "Championed at COP26, Mission LiFE mobilizes 1 billion people toward individual behavioral nudges—energy conservation, circular waste, and chemical-free diets—to curb carbon footprints.",
            "src": "NITI Aayog / MoEFCC / GS3"
        },
        {
            "day": 27, "slot": 5, "gs": "GS2", "cat": "Foreign Policy",
            "title": "India-Africa Forum Summit: Historic Induction of African Union into G20",
            "desc": "Spearheaded by India at the New Delhi G20 Summit, the African Union's permanent membership anchors Global South representation across international economic rulemaking.",
            "src": "Ministry of External Affairs / GS2"
        },

        # DAY 28
        {
            "day": 28, "slot": 1, "gs": "GS1", "cat": "Modern Social Reform",
            "title": "Raja Ram Mohan Roy and the Bengal Renaissance: Abolition of Sati 1829",
            "desc": "Fusing Upanishadic monotheism with Western rationalism, Ram Mohan Roy founded the Brahmo Samaj, championing free press, women's property rights, and the Sati Regulation XVII.",
            "src": "Ministry of Culture / National Archives / GS1"
        },
        {
            "day": 28, "slot": 2, "gs": "GS2", "cat": "Transparency & Governance",
            "title": "RTI Act and Section 8 Exemptions: Judicial Discourse on Public Interest",
            "desc": "Examining judicial thresholds where the public interest in disclosure outweighs privacy or state secrecy exemptions, safeguarding citizens' right to inspect government decisions.",
            "src": "Central Information Commission / SC / GS2"
        },
        {
            "day": 28, "slot": 3, "gs": "GS3", "cat": "Railways & Logistics",
            "title": "Dedicated Freight Corridors (DFCs): Slashing Heavy Rail Transit Times",
            "desc": "Eastern and Western DFCs segregate heavy freight trains from passenger lines, enabling 100 km/h double-stack container trains and slashing logistics transit time by 50%.",
            "src": "Ministry of Railways / DFCCIL / GS3"
        },
        {
            "day": 28, "slot": 4, "gs": "GS3", "cat": "Solar Diplomacy",
            "title": "International Solar Alliance (ISA): One Sun, One World, One Grid",
            "desc": "Headquartered in Gurugram with 120+ member nations, ISA unlocks concessional solar finance and envisions cross-border transmission grids sharing clean solar power across time zones.",
            "src": "International Solar Alliance / MNRE / GS3"
        },
        {
            "day": 28, "slot": 5, "gs": "GS4", "cat": "Moral Courage",
            "title": "Moral Courage and Integrity: Resisting Unethical Executive Orders",
            "desc": "Case study analyzing civil servants who exercised constitutional conscience and moral courage to uphold procurement guidelines and reject illegal patronage directives.",
            "src": "Ethics in Governance / DoPT / GS4"
        },

        # DAY 29
        {
            "day": 29, "slot": 1, "gs": "GS1", "cat": "Freedom Movement",
            "title": "Netaji Subhas Chandra Bose and the Azad Hind Fauj: Military Diplomacy",
            "desc": "Forming the Provisional Government of Azad Hind in Singapore in 1943, Netaji mobilized the INA, Rani of Jhansi Regiment, and international diplomacy to challenge British colonial rule.",
            "src": "National Archives of India / Ministry of Culture / GS1"
        },
        {
            "day": 29, "slot": 2, "gs": "GS2", "cat": "Health & Social Justice",
            "title": "National Medical Commission (NMC): Reforming Healthcare Education Standards",
            "desc": "Replacing the Medical Council of India, the NMC enforces the National Exit Test (NExT), standardized fee regulations, and accreditation to bridge rural specialist doctor deficits.",
            "src": "Ministry of Health and Family Welfare / NMC / GS2"
        },
        {
            "day": 29, "slot": 3, "gs": "GS3", "cat": "Agrarian Insurance",
            "title": "PM Fasal Bima Yojana: Drone and Satellite Crop Loss Verification",
            "desc": "Integrating YES-TECH yield estimation and WINDS weather stations, PMFBY replaced manual crop cutting experiments with satellite remote-sensing for transparent claim payouts.",
            "src": "Ministry of Agriculture / PIB / GS3"
        },
        {
            "day": 29, "slot": 4, "gs": "GS3", "cat": "Polar Science & Climate",
            "title": "Indian Antarctic and Arctic Programme: Maitri, Bharati, and Himadri",
            "desc": "Enacting the Indian Antarctic Act 2022, India conducts glaciology and deep ice-core drilling in polar stations to study past climatic fluctuations and sea-level rise.",
            "src": "National Centre for Polar and Ocean Research / MoES / GS3"
        },
        {
            "day": 29, "slot": 5, "gs": "GS2", "cat": "Defense Diplomacy",
            "title": "India-US Critical & Emerging Technology (iCET) Partnership",
            "desc": "Fostering strategic co-production in jet engines (GE F414), semiconductor supply chains, quantum research, and AI defense applications under the bilateral iCET framework.",
            "src": "Ministry of External Affairs / GS2"
        },

        # DAY 30
        {
            "day": 30, "slot": 1, "gs": "GS1", "cat": "Constitutional History",
            "title": "Constituent Assembly Debates: Dr. B.R. Ambedkar and the Living Constitution",
            "desc": "Deliberating over 2 years 11 months and 18 days, the Assembly reconciled diverse views on fundamental rights, directive principles, and federal autonomy into a living document.",
            "src": "Parliament of India / Law Ministry / GS1"
        },
        {
            "day": 30, "slot": 2, "gs": "GS2", "cat": "Governance Metrics",
            "title": "Good Governance Index (GGI): Benchmarking State and District Performance",
            "desc": "Assessing states across 10 sectors including agriculture, commerce, public infrastructure, and judiciary to foster competitive and cooperative federalism in service delivery.",
            "src": "DARPG / Ministry of Personnel / GS2"
        },
        {
            "day": 30, "slot": 3, "gs": "GS3", "cat": "Demography & Skill Development",
            "title": "Harnessing India's Demographic Dividend: Skill India and Future of Work",
            "desc": "With a median age of 28, India coordinates the National Skill Development Corporation (NSDC) and PMKVY 4.0 to upskill youth in Industry 4.0, green tech, and healthcare.",
            "src": "Ministry of Skill Development / NITI Aayog / GS3"
        },
        {
            "day": 30, "slot": 4, "gs": "GS3", "cat": "Climate Commitments",
            "title": "India's Long-Term Low-Emission Strategy: Net Zero Target by 2070",
            "desc": "Submitted to UNFCCC, India's LT-LEDS outlines strategic pathways for deep electrification, industrial hydrogen adoption, carbon capture, and forest carbon sink expansion.",
            "src": "MoEFCC / UNFCCC / GS3"
        },
        {
            "day": 30, "slot": 5, "gs": "GS4", "cat": "Crisis Leadership Ethics",
            "title": "Ethical Leadership in Disaster Management: 2004 Tsunami to Modern Preparedness",
            "desc": "Case study analyzing how ethical accountability and community mobilization led to the Disaster Management Act 2005, NDMA creation, and zero-casualty cyclone evacuations.",
            "src": "National Disaster Management Authority / GS4"
        }
    ]

    all_articles = []
    start_date = datetime(2026, 10, 6)
    slot_hours = {1: 8, 2: 11, 3: 14, 4: 17, 5: 20}

    # Days 1 to 10 from base_articles
    for i, art in enumerate(base_articles, 1):
        day_num = ((i - 1) // 5) + 1
        slot_num = ((i - 1) % 5) + 1
        cur_dt = start_date + timedelta(days=day_num - 1)
        cur_dt = cur_dt.replace(hour=slot_hours[slot_num], minute=0, second=0)
        art["published_at"] = cur_dt.isoformat() + "+05:30"
        all_articles.append(art)

    # Days 11 to 30 from extra_topics
    for item in extra_topics:
        day_num = item["day"]
        slot_num = item["slot"]
        cur_dt = start_date + timedelta(days=day_num - 1)
        cur_dt = cur_dt.replace(hour=slot_hours[slot_num], minute=0, second=0)
        
        slug = item["title"].lower()
        slug = "".join(c if c.isalnum() or c == ' ' else '' for c in slug)
        slug = "-".join(slug.split()[:5])
        
        all_articles.append({
            "id": f"day{day_num:02d}-post{slot_num}-{slug}",
            "title": item["title"],
            "description": item["desc"],
            "url": f"https://upscbrief.internal/day{day_num:02d}/post{slot_num}",
            "source": item["src"],
            "published_at": cur_dt.isoformat() + "+05:30",
            "category": item["cat"]
        })

    return all_articles

def build_30day_excel():
    articles = get_30day_topics()
    total_articles = len(articles)
    print(f"Total curated articles compiled: {total_articles} (30 days x 5 posts/day)")

    # Save to fixtures/topics_30days.json
    out_json = os.path.join(os.path.dirname(__file__), 'fixtures', 'topics_30days.json')
    with open(out_json, 'w', encoding='utf-8') as f:
        json.dump({"articles": articles}, f, indent=2, ensure_ascii=False)
    print(f"Saved 30-day dataset to {out_json}")

    wb = Workbook()
    FONT_FAMILY = "Segoe UI"
    BURGUNDY_TITLE = "881337"   # Rose 900
    NAVY_HEADER = "1E293B"      # Slate 800
    LIGHT_ZEBRA = "F8FAFC"      # Slate 50
    CARD_BORDER = "CBD5E1"      # Slate 300
    HEADER_BORDER = "64748B"    # Slate 500

    thin_border = Border(
        left=Side(style='thin', color=CARD_BORDER),
        right=Side(style='thin', color=CARD_BORDER),
        top=Side(style='thin', color=CARD_BORDER),
        bottom=Side(style='thin', color=CARD_BORDER)
    )

    header_border = Border(
        left=Side(style='thin', color=HEADER_BORDER),
        right=Side(style='thin', color=HEADER_BORDER),
        top=Side(style='medium', color="0F172A"),
        bottom=Side(style='medium', color="0F172A")
    )

    # -------------------------------------------------------------
    # SHEET 1: 30-Day Content Calendar
    # -------------------------------------------------------------
    ws1 = wb.active
    ws1.title = "30-Day Content Calendar"
    ws1.views.sheetView[0].showGridLines = True

    ws1.merge_cells("A1:M1")
    title_cell = ws1["A1"]
    title_cell.value = "UPSC CURRENT AFFAIRS INFOGRAPHIC — 30-DAY MASTER EDITORIAL CALENDAR (150 POSTS)"
    title_cell.font = Font(name=FONT_FAMILY, size=14, bold=True, color="FFFFFF")
    title_cell.fill = PatternFill(start_color=BURGUNDY_TITLE, end_color=BURGUNDY_TITLE, fill_type="solid")
    title_cell.alignment = Alignment(horizontal="center", vertical="center")
    ws1.row_dimensions[1].height = 36

    ws1.merge_cells("A2:M2")
    sub_cell = ws1["A2"]
    sub_cell.value = "Campaign Cadence: 5 Daily High-Yield Drops (08:00, 11:00, 14:00, 17:00, 20:00 IST) | UPSC GS1-GS4 Syllabus Aligned"
    sub_cell.font = Font(name=FONT_FAMILY, size=10, italic=True, color="E2E8F0")
    sub_cell.fill = PatternFill(start_color=NAVY_HEADER, end_color=NAVY_HEADER, fill_type="solid")
    sub_cell.alignment = Alignment(horizontal="center", vertical="center")
    ws1.row_dimensions[2].height = 24

    headers = [
        ("Item #", 8, "center"),
        ("Day", 10, "center"),
        ("Post Slot", 12, "center"),
        ("Publish Date", 13, "center"),
        ("Slot Time (IST)", 15, "center"),
        ("GS Paper", 11, "center"),
        ("Category", 22, "center"),
        ("Infographic Headline / Topic", 45, "left"),
        ("Core Narrative & Prelims/Mains Context", 65, "left"),
        ("Primary Source & Reference", 32, "left"),
        ("Content ID", 34, "center"),
        ("Status", 14, "center"),
        ("Post Link / Asset URL", 25, "center")
    ]

    ws1.row_dimensions[3].height = 30
    for col_idx, (header_text, width, align) in enumerate(headers, 1):
        cell = ws1.cell(row=3, column=col_idx, value=header_text)
        cell.font = Font(name=FONT_FAMILY, size=10, bold=True, color="FFFFFF")
        cell.fill = PatternFill(start_color=NAVY_HEADER, end_color=NAVY_HEADER, fill_type="solid")
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = header_border
        col_letter = get_column_letter(col_idx)
        ws1.column_dimensions[col_letter].width = width

    start_row = 4
    for i, article in enumerate(articles, 1):
        row_num = start_row + i - 1
        ws1.row_dimensions[row_num].height = 52
        day_num = ((i - 1) // 5) + 1
        slot_num = ((i - 1) % 5) + 1

        dt_str = article.get("published_at", "")
        try:
            dt = datetime.fromisoformat(dt_str)
            date_display = dt.strftime("%Y-%m-%d")
            time_display = dt.strftime("%I:%M %p")
        except Exception:
            date_display = "2026-10-06"
            time_display = "08:00 AM"

        source_val = article.get("source", "")
        gs_paper = "GS3"
        for gs in ["GS1", "GS2", "GS3", "GS4"]:
            if gs in source_val:
                gs_paper = gs
                break

        is_even_day = (day_num % 2 == 0)
        row_fill = PatternFill(
            start_color=LIGHT_ZEBRA if is_even_day else "FFFFFF",
            end_color=LIGHT_ZEBRA if is_even_day else "FFFFFF",
            fill_type="solid"
        )

        row_values = [
            i,
            f"Day {day_num:02d}",
            f"Post {slot_num} of 5",
            date_display,
            time_display,
            gs_paper,
            article.get("category", ""),
            article.get("title", ""),
            article.get("description", ""),
            article.get("source", ""),
            article.get("id", ""),
            "Planned",
            ""
        ]

        for col_idx, val in enumerate(row_values, 1):
            cell = ws1.cell(row=row_num, column=col_idx, value=val)
            align_type = headers[col_idx - 1][2]
            cell.font = Font(name=FONT_FAMILY, size=10, bold=(col_idx == 8))
            cell.fill = row_fill
            cell.border = thin_border
            cell.alignment = Alignment(
                horizontal=align_type,
                vertical="center",
                wrap_text=(col_idx in [8, 9, 10])
            )

            if col_idx == 1:
                cell.font = Font(name=FONT_FAMILY, size=9, bold=True, color="64748B")
            elif col_idx == 2:
                cell.font = Font(name=FONT_FAMILY, size=9, bold=True, color="1E293B")
            elif col_idx == 6:
                paper_color_map = {
                    "GS1": "9A3412",
                    "GS2": "1E40AF",
                    "GS3": "065F46",
                    "GS4": "6B21A8"
                }
                cell.font = Font(name=FONT_FAMILY, size=10, bold=True, color=paper_color_map.get(gs_paper, "1E3A8A"))
            elif col_idx == 12:
                cell.font = Font(name=FONT_FAMILY, size=10, bold=True, color="047857")

    dv = DataValidation(type="list", formula1='"Planned,In Progress,Ready,Published"', allow_blank=False)
    ws1.add_data_validation(dv)
    dv.add(f"L4:L{start_row + total_articles - 1}")

    cf_range = f"L4:L{start_row + total_articles - 1}"
    green_fill = PatternFill(bgColor="D1FAE5", fill_type="solid")
    green_font = Font(name=FONT_FAMILY, color="065F46", bold=True)
    blue_fill = PatternFill(bgColor="DBEAFE", fill_type="solid")
    blue_font = Font(name=FONT_FAMILY, color="1E40AF", bold=True)
    amber_fill = PatternFill(bgColor="FEF3C7", fill_type="solid")
    amber_font = Font(name=FONT_FAMILY, color="92400E", bold=True)
    slate_fill = PatternFill(bgColor="F1F5F9", fill_type="solid")
    slate_font = Font(name=FONT_FAMILY, color="475569", bold=True)

    ws1.conditional_formatting.add(cf_range, CellIsRule(operator='equal', formula=['"Published"'], fill=green_fill, font=green_font))
    ws1.conditional_formatting.add(cf_range, CellIsRule(operator='equal', formula=['"Ready"'], fill=blue_fill, font=blue_font))
    ws1.conditional_formatting.add(cf_range, CellIsRule(operator='equal', formula=['"In Progress"'], fill=amber_fill, font=amber_font))
    ws1.conditional_formatting.add(cf_range, CellIsRule(operator='equal', formula=['"Planned"'], fill=slate_fill, font=slate_font))

    ws1.freeze_panes = "A4"
    ws1.auto_filter.ref = f"A3:M{start_row + total_articles - 1}"

    # -------------------------------------------------------------
    # SHEET 2: Daily Schedule Matrix (30 Days x 5 Slots)
    # -------------------------------------------------------------
    ws2 = wb.create_sheet(title="Daily Schedule Matrix")
    ws2.views.sheetView[0].showGridLines = True

    ws2.merge_cells("A1:G1")
    s2_title = ws2["A1"]
    s2_title.value = "30-DAY MASTER SCHEDULE MATRIX (5 HIGH-IMPACT DROPS / DAY = 150 POSTS)"
    s2_title.font = Font(name=FONT_FAMILY, size=13, bold=True, color="FFFFFF")
    s2_title.fill = PatternFill(start_color=NAVY_HEADER, end_color=NAVY_HEADER, fill_type="solid")
    s2_title.alignment = Alignment(horizontal="center", vertical="center")
    ws2.row_dimensions[1].height = 36

    matrix_headers = [
        ("Day", 10),
        ("Date", 13),
        ("Slot 1 (08:00 AM)\nMorning Heritage / History", 36),
        ("Slot 2 (11:00 AM)\nMidday Governance & Polity", 36),
        ("Slot 3 (02:00 PM)\nAfternoon Economy & Industry", 36),
        ("Slot 4 (05:00 PM)\nEvening Environment & Sci-Tech", 36),
        ("Slot 5 (08:00 PM)\nPrime-Time Security / IR / Ethics", 36),
    ]

    ws2.row_dimensions[2].height = 34
    for col_idx, (m_head, m_width) in enumerate(matrix_headers, 1):
        cell = ws2.cell(row=2, column=col_idx, value=m_head)
        cell.font = Font(name=FONT_FAMILY, size=10, bold=True, color="FFFFFF")
        cell.fill = PatternFill(start_color=BURGUNDY_TITLE, end_color=BURGUNDY_TITLE, fill_type="solid")
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = header_border
        col_letter = get_column_letter(col_idx)
        ws2.column_dimensions[col_letter].width = m_width

    for d in range(1, 31):
        r = 2 + d
        ws2.row_dimensions[r].height = 62
        day_articles = articles[(d - 1) * 5 : d * 5]

        try:
            d_date = datetime.fromisoformat(day_articles[0].get("published_at", "")).strftime("%Y-%m-%d")
        except Exception:
            d_date = f"Day {d}"

        c_day = ws2.cell(row=r, column=1, value=f"Day {d:02d}")
        c_day.font = Font(name=FONT_FAMILY, size=11, bold=True, color="1E293B")
        c_day.alignment = Alignment(horizontal="center", vertical="center")
        c_day.border = thin_border

        c_date = ws2.cell(row=r, column=2, value=d_date)
        c_date.font = Font(name=FONT_FAMILY, size=10, bold=True, color="64748B")
        c_date.alignment = Alignment(horizontal="center", vertical="center")
        c_date.border = thin_border

        for slot_idx, art in enumerate(day_articles, 1):
            cell_col = 2 + slot_idx
            src = art.get("source", "")
            paper = "GS3"
            for gs in ["GS1", "GS2", "GS3", "GS4"]:
                if gs in src:
                    paper = gs
                    break
            cell_val = f"[{paper}] {art.get('title')}\n• {art.get('category')}"
            c_slot = ws2.cell(row=r, column=cell_col, value=cell_val)
            c_slot.font = Font(name=FONT_FAMILY, size=9)
            c_slot.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)
            c_slot.border = thin_border
            if d % 2 == 0:
                c_slot.fill = PatternFill(start_color=LIGHT_ZEBRA, end_color=LIGHT_ZEBRA, fill_type="solid")

    ws2.freeze_panes = "A3"

    # -------------------------------------------------------------
    # SHEET 3: Executive Summary & Analytics
    # -------------------------------------------------------------
    ws3 = wb.create_sheet(title="Executive Summary & Analytics")
    ws3.views.sheetView[0].showGridLines = True

    ws3.merge_cells("A1:G1")
    s3_title = ws3["A1"]
    s3_title.value = "30-DAY CAMPAIGN METRICS, GS SYLLABUS DISTRIBUTION & AUTOMATION GUIDE"
    s3_title.font = Font(name=FONT_FAMILY, size=13, bold=True, color="FFFFFF")
    s3_title.fill = PatternFill(start_color=NAVY_HEADER, end_color=NAVY_HEADER, fill_type="solid")
    s3_title.alignment = Alignment(horizontal="center", vertical="center")
    ws3.row_dimensions[1].height = 36

    # Section 1: KPI Summary Table (Columns A-C)
    ws3.merge_cells("A3:C3")
    kpi_hdr = ws3["A3"]
    kpi_hdr.value = "CAMPAIGN KEY PERFORMANCE PARAMETERS"
    kpi_hdr.font = Font(name=FONT_FAMILY, size=10, bold=True, color="FFFFFF")
    kpi_hdr.fill = PatternFill(start_color=BURGUNDY_TITLE, end_color=BURGUNDY_TITLE, fill_type="solid")
    kpi_hdr.alignment = Alignment(horizontal="center", vertical="center")
    ws3.row_dimensions[3].height = 24

    kpis = [
        ("Total Scheduled Infographics", f"=COUNTA('30-Day Content Calendar'!$A$4:$A${start_row + total_articles - 1})", "Posts"),
        ("Campaign Horizon (Days)", 30, "Days"),
        ("Posting Velocity (Posts/Day)", "=B4/B5", "Posts/Day"),
        ("Status: Planned", f"=COUNTIF('30-Day Content Calendar'!$L$4:$L${start_row + total_articles - 1}, \"Planned\")", "Posts"),
        ("Status: In Progress", f"=COUNTIF('30-Day Content Calendar'!$L$4:$L${start_row + total_articles - 1}, \"In Progress\")", "Posts"),
        ("Status: Ready to Post", f"=COUNTIF('30-Day Content Calendar'!$L$4:$L${start_row + total_articles - 1}, \"Ready\")", "Posts"),
        ("Status: Published", f"=COUNTIF('30-Day Content Calendar'!$L$4:$L${start_row + total_articles - 1}, \"Published\")", "Posts"),
    ]

    for idx, (label, formula_or_val, unit) in enumerate(kpis, 4):
        ws3.row_dimensions[idx].height = 22
        c_lbl = ws3.cell(row=idx, column=1, value=label)
        c_lbl.font = Font(name=FONT_FAMILY, size=10, bold=True)
        c_lbl.border = thin_border

        c_val = ws3.cell(row=idx, column=2, value=formula_or_val)
        c_val.font = Font(name=FONT_FAMILY, size=10, bold=True, color="1E3A8A")
        c_val.alignment = Alignment(horizontal="center", vertical="center")
        c_val.border = thin_border

        c_unit = ws3.cell(row=idx, column=3, value=unit)
        c_unit.font = Font(name=FONT_FAMILY, size=9, italic=True)
        c_unit.alignment = Alignment(horizontal="center", vertical="center")
        c_unit.border = thin_border

    # Section 2: GS Paper Distribution (Columns E-G)
    ws3.merge_cells("E3:G3")
    gs_hdr = ws3["E3"]
    gs_hdr.value = "UPSC SYLLABUS DISTRIBUTION (GS1 TO GS4)"
    gs_hdr.font = Font(name=FONT_FAMILY, size=10, bold=True, color="FFFFFF")
    gs_hdr.fill = PatternFill(start_color=BURGUNDY_TITLE, end_color=BURGUNDY_TITLE, fill_type="solid")
    gs_hdr.alignment = Alignment(horizontal="center", vertical="center")

    last_r = start_row + total_articles - 1
    gs_rows = [
        ("GS1: History, Heritage, Society & Geography", f"=COUNTIF('30-Day Content Calendar'!$F$4:$F${last_r}, \"GS1\")"),
        ("GS2: Polity, Governance, Constitution & IR", f"=COUNTIF('30-Day Content Calendar'!$F$4:$F${last_r}, \"GS2\")"),
        ("GS3: Economy, Sci-Tech, Environment & Security", f"=COUNTIF('30-Day Content Calendar'!$F$4:$F${last_r}, \"GS3\")"),
        ("GS4: Ethics, Integrity, Aptitude & Case Studies", f"=COUNTIF('30-Day Content Calendar'!$F$4:$F${last_r}, \"GS4\")"),
        ("Total Verified Syllabus Coverage", "=SUM(F4:F7)")
    ]

    for idx, (label, form) in enumerate(gs_rows, 4):
        c_l = ws3.cell(row=idx, column=5, value=label)
        c_l.font = Font(name=FONT_FAMILY, size=10, bold=(idx == 8))
        c_l.border = thin_border

        c_v = ws3.cell(row=idx, column=6, value=form)
        c_v.font = Font(name=FONT_FAMILY, size=10, bold=True, color="1E3A8A")
        c_v.alignment = Alignment(horizontal="center", vertical="center")
        c_v.border = thin_border

        if idx < 8:
            c_pct = ws3.cell(row=idx, column=7, value=f"=F{idx}/$F$8")
            c_pct.number_format = "0.0%"
        else:
            c_pct = ws3.cell(row=idx, column=7, value="=SUM(G4:G7)")
            c_pct.number_format = "0.0%"
        c_pct.font = Font(name=FONT_FAMILY, size=10, bold=(idx == 8))
        c_pct.alignment = Alignment(horizontal="center", vertical="center")
        c_pct.border = thin_border

    # Section 3: Developer / Operator Execution Guide
    ws3.merge_cells("A13:G13")
    guide_hdr = ws3["A13"]
    guide_hdr.value = "DEVELOPER / OPERATOR AUTOMATION & EXECUTION GUIDE"
    guide_hdr.font = Font(name=FONT_FAMILY, size=10, bold=True, color="FFFFFF")
    guide_hdr.fill = PatternFill(start_color=NAVY_HEADER, end_color=NAVY_HEADER, fill_type="solid")
    guide_hdr.alignment = Alignment(horizontal="center", vertical="center")
    ws3.row_dimensions[13].height = 24

    guide_rows = [
        ("Step 1: Preview Layouts & Captions (Offline)", "node src/cli.js --source fixture --file fixtures/topics_30days.json --limit 5 --no-ai", "Instant 5-second verification of Day 1 (Posts 1-5)"),
        ("Step 2: Generate Full Day 1 Batch (AI Visuals)", "node src/cli.js --source fixture --file fixtures/topics_30days.json --limit 5", "Builds the complete Day 1 (Posts 1-5) 1080x1350 cards with actual AI artwork"),
        ("Step 3: Generate 30-Day Master Campaign", "node src/cli.js --source fixture --file fixtures/topics_30days.json --limit 150", "Generates all 150 high-yield infographic cards"),
        ("Step 4: Interactive Review & Approvals", "npm run cli", "Option 5: Inspect generated output manifests, reviews, and captions"),
        ("Step 5: Instagram Direct Publish", "Uses drafts from output/<timestamp>/ for feed scheduling", "Ready-to-upload high-resolution 1080x1350 PNGs")
    ]

    ws3.cell(row=14, column=1, value="Operational Step").font = Font(name=FONT_FAMILY, size=10, bold=True)
    ws3.cell(row=14, column=2, value="Execution Command / Action").font = Font(name=FONT_FAMILY, size=10, bold=True)
    ws3.cell(row=14, column=4, value="Description / Expected Result").font = Font(name=FONT_FAMILY, size=10, bold=True)
    for col in range(1, 8):
        c = ws3.cell(row=14, column=col)
        c.fill = PatternFill(start_color="E2E8F0", end_color="E2E8F0", fill_type="solid")
        c.border = thin_border
    ws3.row_dimensions[14].height = 22

    for idx, (st, cmd, desc) in enumerate(guide_rows, 15):
        ws3.row_dimensions[idx].height = 22
        c_st = ws3.cell(row=idx, column=1, value=st)
        c_st.font = Font(name=FONT_FAMILY, size=9, bold=True)
        c_st.border = thin_border

        ws3.merge_cells(start_row=idx, start_column=2, end_row=idx, end_column=3)
        c_cmd = ws3.cell(row=idx, column=2, value=cmd)
        c_cmd.font = Font(name="Consolas", size=9, color="0F172A")
        c_cmd.border = thin_border

        ws3.merge_cells(start_row=idx, start_column=4, end_row=idx, end_column=7)
        c_desc = ws3.cell(row=idx, column=4, value=desc)
        c_desc.font = Font(name=FONT_FAMILY, size=9)
        c_desc.border = thin_border

    ws3.column_dimensions["A"].width = 30
    ws3.column_dimensions["B"].width = 18
    ws3.column_dimensions["C"].width = 14
    ws3.column_dimensions["D"].width = 6
    ws3.column_dimensions["E"].width = 44
    ws3.column_dimensions["F"].width = 14
    ws3.column_dimensions["G"].width = 14

    out_file1 = os.path.join(os.path.dirname(__file__), 'UPSC_NewsInfographics_30Day_Calendar.xlsx')
    out_file2 = os.path.join(os.path.dirname(__file__), 'fixtures', 'UPSC_NewsInfographics_30Day_Calendar.xlsx')
    wb.save(out_file1)
    wb.save(out_file2)
    print(f"Successfully generated 30-Day Excel calendar at:\n  - {out_file1}\n  - {out_file2}")

if __name__ == "__main__":
    build_30day_excel()
