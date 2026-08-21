const { execSync } = require('child_process');
try {
  const output = execSync('npm view @prisma/adapter-mssql versions --json').toString();
  const versions = JSON.parse(output);
  console.log("Oldest versions:", versions.slice(0, 15));
} catch (err) {
  console.error("Error:", err.message);
}
