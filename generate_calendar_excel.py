import json
import os
from datetime import datetime
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import CellIsRule

def build_excel_calendar():
    # 1. Load 50 topics
    json_path = os.path.join(os.path.dirname(__file__), 'fixtures', 'topics_50.json')
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    articles = data['articles']
    total_articles = len(articles)
    print(f"Loaded {total_articles} articles from {json_path}")

    wb = Workbook()
    
    FONT_FAMILY = "Segoe UI"
    
    # Premium Color Palette
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
    # SHEET 1: 10-Day Content Calendar
    # -------------------------------------------------------------
    ws1 = wb.active
    ws1.title = "10-Day Content Calendar"
    ws1.views.sheetView[0].showGridLines = True
    
    # Title Block
    ws1.merge_cells("A1:M1")
    title_cell = ws1["A1"]
    title_cell.value = "UPSC CURRENT AFFAIRS INFOGRAPHIC — 10-DAY EDITORIAL CONTENT CALENDAR (50 POSTS)"
    title_cell.font = Font(name=FONT_FAMILY, size=14, bold=True, color="FFFFFF")
    title_cell.fill = PatternFill(start_color=BURGUNDY_TITLE, end_color=BURGUNDY_TITLE, fill_type="solid")
    title_cell.alignment = Alignment(horizontal="center", vertical="center")
    ws1.row_dimensions[1].height = 36
    
    ws1.merge_cells("A2:M2")
    subtitle_cell = ws1["A2"]
    subtitle_cell.value = "Campaign Cadence: 5 Daily Drops (08:00, 11:00, 14:00, 17:00, 20:00 IST) | UPSC GS1-GS4 High-Yield Focus"
    subtitle_cell.font = Font(name=FONT_FAMILY, size=10, italic=True, color="E2E8F0")
    subtitle_cell.fill = PatternFill(start_color=NAVY_HEADER, end_color=NAVY_HEADER, fill_type="solid")
    subtitle_cell.alignment = Alignment(horizontal="center", vertical="center")
    ws1.row_dimensions[2].height = 24
    
    # Column Headers
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

    # Parse and fill data rows
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
            
            # Special highlighting
            if col_idx == 1:
                cell.font = Font(name=FONT_FAMILY, size=9, bold=True, color="64748B")
            elif col_idx == 2:
                cell.font = Font(name=FONT_FAMILY, size=9, bold=True, color="1E293B")
            elif col_idx == 6:
                # GS Paper badge colors
                paper_color_map = {
                    "GS1": "9A3412", # amber-800
                    "GS2": "1E40AF", # blue-800
                    "GS3": "065F46", # emerald-800
                    "GS4": "6B21A8"  # purple-800
                }
                cell.font = Font(name=FONT_FAMILY, size=10, bold=True, color=paper_color_map.get(gs_paper, "1E3A8A"))
            elif col_idx == 12:
                cell.font = Font(name=FONT_FAMILY, size=10, bold=True, color="047857")

    # Add Dropdown Data Validation for Status Column (L4:L53)
    dv = DataValidation(type="list", formula1='"Planned,In Progress,Ready,Published"', allow_blank=False)
    dv.error ='Your entry is not in the list'
    dv.errorTitle = 'Invalid Status'
    dv.prompt = 'Select status from dropdown'
    dv.promptTitle = 'Post Status'
    ws1.add_data_validation(dv)
    dv.add(f"L4:L{start_row + total_articles - 1}")

    # Add Conditional Formatting for Status
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

    # Freeze header rows & add auto-filter
    ws1.freeze_panes = "A4"
    ws1.auto_filter.ref = f"A3:M{start_row + total_articles - 1}"

    # -------------------------------------------------------------
    # SHEET 2: Daily Schedule Matrix (Bird's Eye 10-Day Grid)
    # -------------------------------------------------------------
    ws2 = wb.create_sheet(title="Daily Schedule Matrix")
    ws2.views.sheetView[0].showGridLines = True
    
    ws2.merge_cells("A1:G1")
    s2_title = ws2["A1"]
    s2_title.value = "10-DAY POSTING MATRIX AT A GLANCE (5 HIGH-IMPACT DROPS / DAY)"
    s2_title.font = Font(name=FONT_FAMILY, size=13, bold=True, color="FFFFFF")
    s2_title.fill = PatternFill(start_color=NAVY_HEADER, end_color=NAVY_HEADER, fill_type="solid")
    s2_title.alignment = Alignment(horizontal="center", vertical="center")
    ws2.row_dimensions[1].height = 36
    
    matrix_headers = [
        ("Day", 10),
        ("Date", 13),
        ("Slot 1 (08:00 AM)\nMorning Heritage / Anchor", 36),
        ("Slot 2 (11:00 AM)\nMidday Governance & Polity", 36),
        ("Slot 3 (02:00 PM)\nAfternoon Economy & Tech", 36),
        ("Slot 4 (05:00 PM)\nEvening Environment / Sci", 36),
        ("Slot 5 (08:00 PM)\nPrime-Time Defense / Case Study", 36),
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

    for d in range(1, 11):
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
    # SHEET 3: Executive Summary & Analytics (Excel Formulas!)
    # -------------------------------------------------------------
    ws3 = wb.create_sheet(title="Executive Summary & Analytics")
    ws3.views.sheetView[0].showGridLines = True
    
    ws3.merge_cells("A1:G1")
    s3_title = ws3["A1"]
    s3_title.value = "CAMPAIGN METRICS, GS PAPER DISTRIBUTION & AUTOMATION GUIDE"
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
        ("Total Scheduled Infographics", "=COUNTA('10-Day Content Calendar'!$A$4:$A$53)", "Posts"),
        ("Campaign Horizon (Days)", 10, "Days"),
        ("Posting Velocity (Posts/Day)", "=B4/B5", "Posts/Day"),
        ("Status: Planned", "=COUNTIF('10-Day Content Calendar'!$L$4:$L$53, \"Planned\")", "Posts"),
        ("Status: In Progress", "=COUNTIF('10-Day Content Calendar'!$L$4:$L$53, \"In Progress\")", "Posts"),
        ("Status: Ready to Post", "=COUNTIF('10-Day Content Calendar'!$L$4:$L$53, \"Ready\")", "Posts"),
        ("Status: Published", "=COUNTIF('10-Day Content Calendar'!$L$4:$L$53, \"Published\")", "Posts"),
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
    
    gs_rows = [
        ("GS1: History, Heritage, Society & Geography", "=COUNTIF('10-Day Content Calendar'!$F$4:$F$53, \"GS1\")"),
        ("GS2: Polity, Governance, Constitution & IR", "=COUNTIF('10-Day Content Calendar'!$F$4:$F$53, \"GS2\")"),
        ("GS3: Economy, Sci-Tech, Environment & Security", "=COUNTIF('10-Day Content Calendar'!$F$4:$F$53, \"GS3\")"),
        ("GS4: Ethics, Integrity, Aptitude & Case Studies", "=COUNTIF('10-Day Content Calendar'!$F$4:$F$53, \"GS4\")"),
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
        ("Step 1: Test 1 Topic Generation", "node src/cli.js --source fixture --file fixtures/topics_50.json --limit 1", "Generates card with actual image for Post 1"),
        ("Step 2: Generate Full Day 1 Batch (5 Posts)", "node src/cli.js --source fixture --file fixtures/topics_50.json --limit 5", "Builds the complete Day 1 (Posts 1-5) 1080x1350 cards"),
        ("Step 3: Verification & Test Suite", "npm test", "Runs all 14 automated tests to ensure zero flaws"),
        ("Step 4: Interactive Review Menu", "npm run cli", "Option 5: Inspect generated output manifests and captions"),
        ("Step 5: Instagram Direct Publish", "Uses drafts from output/<timestamp>/ for feed scheduling", "Ready-to-upload high-resolution 1080x1350 PNG + captions")
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

    # Save to root and fixtures directory
    out_file1 = os.path.join(os.path.dirname(__file__), 'UPSC_NewsInfographics_10Day_Calendar.xlsx')
    out_file2 = os.path.join(os.path.dirname(__file__), 'fixtures', 'UPSC_NewsInfographics_10Day_Calendar.xlsx')
    wb.save(out_file1)
    wb.save(out_file2)
    print(f"Successfully generated Excel calendar at:\n  - {out_file1}\n  - {out_file2}")

if __name__ == "__main__":
    build_excel_calendar()
