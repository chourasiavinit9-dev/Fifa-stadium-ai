import re

with open("ts_errors.txt", "r") as f:
    errors = f.readlines()

# group errors by file
edits_by_file = {}
for err in errors:
    match = re.search(r'^(.*?)\((\d+),(\d+)\): error TS6133: \'(.*?)\'', err)
    if not match: continue
    filepath = match.group(1).strip()
    line_num = int(match.group(2)) - 1
    col_num = int(match.group(3)) - 1
    name = match.group(4)
    
    if filepath not in edits_by_file:
        edits_by_file[filepath] = []
    edits_by_file[filepath].append({
        'line': line_num,
        'col': col_num,
        'name': name
    })

for filepath, edits in edits_by_file.items():
    with open(filepath, "r") as f:
        lines = f.read().splitlines()
    
    # Sort edits by line descending, then column descending, to avoid shifting issues
    edits.sort(key=lambda x: (x['line'], x['col']), reverse=True)
    
    for edit in edits:
        l = edit['line']
        c = edit['col']
        name = edit['name']
        
        line = lines[l]
        
        # Check if it's an import statement
        if line.strip().startswith("import "):
            if name == "React":
                if "import React," in line:
                    lines[l] = line.replace("import React,", "import")
                elif "import React from" in line:
                    lines[l] = ""
            else:
                # Remove the name from the import list
                # It might be `Name, ` or ` Name,` or `Name`
                # Let's replace the name at the exact column
                # Actually, removing the whole word at the column is safer:
                left = line[:c]
                right = line[c + len(name):]
                
                # Now clean up commas
                new_line = left + right
                new_line = new_line.replace("{ ,", "{")
                new_line = new_line.replace(", ,", ",")
                new_line = new_line.replace(", }", " }")
                
                if "{  }" in new_line or "{}" in new_line or "{ }" in new_line:
                    lines[l] = ""
                else:
                    lines[l] = new_line
        else:
            # Check if it's a variable declaration
            if line.strip().startswith("const " + name) or line.strip().startswith("let " + name) or line.strip().startswith("var " + name):
                lines[l] = ""
            else:
                # Must be a parameter, replace with _name at the exact location
                left = line[:c]
                right = line[c + len(name):]
                lines[l] = left + "_" + name + right
                
    with open(filepath, "w") as f:
        f.write("\n".join(lines) + "\n")

print("Fixed accurately with python script.")
