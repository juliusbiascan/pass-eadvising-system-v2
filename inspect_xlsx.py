import zipfile
import xml.etree.ElementTree as ET
import os

def inspect_xlsx(filepath):
    with zipfile.ZipFile(filepath, 'r') as z:
        # Get shared strings
        shared_strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            ss_content = z.read('xl/sharedStrings.xml')
            ss_root = ET.fromstring(ss_content)
            for si in ss_root.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si'):
                t = si.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')
                if t is not None:
                    shared_strings.append(t.text)
                else:
                    # Handle r (rich text)
                    text_parts = []
                    for r in si.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}r'):
                        t_part = r.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')
                        if t_part is not None:
                            text_parts.append(t_part.text)
                    shared_strings.append("".join(text_parts) if text_parts else "")

        # Get sheet names and paths
        wb_content = z.read('xl/workbook.xml')
        wb_root = ET.fromstring(wb_content)
        sheets = []
        for sheet in wb_root.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}sheets'):
            name = sheet.get('name')
            r_id = sheet.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
            sheets.append({'name': name, 'id': r_id})

        print(f"Sheet Names: {[s['name'] for s in sheets]}")

        # Map r_id to filename
        rels_content = z.read('xl/_rels/workbook.xml.rels')
        rels_root = ET.fromstring(rels_content)
        rel_map = {}
        for rel in rels_root.findall('{http://schemas.openxmlformats.org/package/2006/relationships}Relationship'):
            rel_map[rel.get('Id')] = rel.get('Target')

        # Use the first sheet as the "main" sheet
        main_sheet_rel_path = rel_map[sheets[0]['id']]
        if main_sheet_rel_path.startswith('/'):
            main_sheet_path = main_sheet_rel_path[1:]
        else:
            main_sheet_path = f"xl/{main_sheet_rel_path}"

        sheet_content = z.read(main_sheet_path)
        sheet_root = ET.fromstring(sheet_content)
        
        rows = []
        for row in sheet_root.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row')[:6]:
            row_data = []
            # We need to account for empty cells or ensure columns align if possible
            # For simplicity, we'll just get values in order
            for c in row.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
                v = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
                t = c.get('t')
                val = ""
                if v is not None:
                    if t == 's':
                        val = shared_strings[int(v.text)]
                    else:
                        val = v.text
                row_data.append(str(val) if val is not None else "")
            rows.append(row_data)

        if rows:
            print("\nInferred Column Headers (First Row):")
            print(rows[0])
            print("\nFirst 5 Rows (including headers):")
            for r in rows[:5]:
                print(r)

inspect_xlsx('BSCS-Curriculum.xlsx')
