import zipfile
import xml.etree.ElementTree as ET

def inspect_xlsx(filepath):
    with zipfile.ZipFile(filepath, 'r') as z:
        shared_strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            ss_content = z.read('xl/sharedStrings.xml')
            ss_root = ET.fromstring(ss_content)
            for si in ss_root.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si'):
                parts = []
                for t in si.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t'):
                    parts.append(t.text or "")
                for r in si.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}r'):
                    t_part = r.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')
                    if t_part is not None:
                        parts.append(t_part.text or "")
                shared_strings.append("".join(parts))

        wb_content = z.read('xl/workbook.xml')
        wb_root = ET.fromstring(wb_content)
        sheets = []
        for sheet in wb_root.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}sheets'):
            name = sheet.get('name')
            r_id = sheet.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
            sheets.append({'name': name, 'id': r_id})

        print(f"Sheet Names: {[s['name'] for s in sheets]}")

        rels_content = z.read('xl/_rels/workbook.xml.rels')
        rels_root = ET.fromstring(rels_content)
        rel_map = {rel.get('Id'): rel.get('Target') for rel in rels_root.findall('{http://schemas.openxmlformats.org/package/2006/relationships}Relationship')}

        main_sheet_rel_path = rel_map[sheets[0]['id']]
        main_sheet_path = main_sheet_rel_path[1:] if main_sheet_rel_path.startswith('/') else f"xl/{main_sheet_rel_path}"
        sheet_content = z.read(main_sheet_path)
        sheet_root = ET.fromstring(sheet_content)
        
        rows_to_check = sheet_root.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row')
        
        def get_row_data(row):
            data = {}
            for c in row.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
                r_attr = c.get('r')
                col_ref = ''.join(filter(str.isalpha, r_attr))
                v_node = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
                t = c.get('t')
                val = ""
                if v_node is not None:
                    if t == 's':
                        val = shared_strings[int(v_node.text)]
                    else:
                        val = v_node.text
                data[col_ref] = val
            return data

        # Look for headers. Headers usually have several non-empty cells.
        # Let's print rows 5 to 15 to find where the actual table starts.
        print("\nSampling Rows (8-15) to find headers:")
        for row in rows_to_check[7:15]:
            idx = row.get('r')
            data = get_row_data(row)
            if data:
                print(f"Row {idx}: {data}")

inspect_xlsx('BSCS-Curriculum.xlsx')
