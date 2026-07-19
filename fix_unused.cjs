const { Project } = require("ts-morph");

const project = new Project({ tsConfigFilePath: "./tsconfig.json" });

let didChanges = false;
let passes = 0;

while (passes < 5) {
  passes++;
  let fixedAny = false;
  const diagnostics = project.getPreEmitDiagnostics();
  
  for (const diag of diagnostics) {
      if (diag.getCode() === 6133) {
          let startNode = diag.getNode();
          if (!startNode) {
              const file = diag.getSourceFile();
              const start = diag.getStart();
              if (file && start !== undefined) {
                  startNode = file.getDescendantAtPos(start);
              }
          }
          if (!startNode) continue;
          
          let node = startNode;
          const name = node.getText().replace(/['"]/g, '');
          let parent = node.getParent();
          
          // sometimes the node is an Identifier inside something
          if (!parent) continue;
          
          const kind = parent.getKindName();
          console.log(`Found unused: ${name} (kind: ${kind}) in ${diag.getSourceFile().getFilePath()}`);
          
          try {
              if (kind === "ImportSpecifier") {
                  parent.remove();
                  fixedAny = true;
              } else if (kind === "ImportClause") {
                  const importDecl = parent.getParent();
                  if (importDecl && importDecl.getKindName() === "ImportDeclaration") {
                      importDecl.remove();
                      fixedAny = true;
                  }
              } else if (kind === "Parameter") {
                  node.replaceWithText("_" + name);
                  fixedAny = true;
              } else if (kind === "VariableDeclaration") {
                  const varList = parent.getParent();
                  parent.remove();
                  if (varList && varList.getDeclarations && varList.getDeclarations().length === 0) {
                      const stmt = varList.getParent();
                      if (stmt) stmt.remove();
                  }
                  fixedAny = true;
              } else if (kind === "BindingElement") {
                  parent.remove();
                  fixedAny = true;
              } else if (kind === "FunctionDeclaration") {
                  parent.remove();
                  fixedAny = true;
              } else if (kind === "NamespaceImport") {
                  parent.getParent().getParent().remove();
                  fixedAny = true;
              }
          } catch(e) {
              console.log("Error fixing node: " + e.message);
          }
      }
  }
  
  if (fixedAny) {
      didChanges = true;
      project.saveSync();
  } else {
      break;
  }
}

if (!didChanges) {
    console.log("No fixes applied.");
} else {
    console.log("Fixes applied successfully.");
}
